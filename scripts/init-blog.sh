#!/usr/bin/env bash
set -euo pipefail

DOMAIN=""
BRAND=""
TOPIC=""
ANIMATION="drift"
SPEED="18"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --brand) BRAND="${2:-}"; shift 2 ;;
    --topic) TOPIC="${2:-}"; shift 2 ;;
    --animation) ANIMATION="${2:-}"; shift 2 ;;
    --speed) SPEED="${2:-}"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$BRAND" || -z "$TOPIC" ]]; then
  echo "Usage: bash scripts/init-blog.sh --domain <domain> --brand \"<Brand Name>\" --topic \"<Niche>\" [--animation drift|pulse|wave] [--speed 18]"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

bash scripts/bootstrap-template.sh --domain "$DOMAIN" --brand "$BRAND"

export INIT_DOMAIN="$DOMAIN"
export INIT_BRAND="$BRAND"
export INIT_TOPIC="$TOPIC"
export INIT_ANIMATION="$ANIMATION"
export INIT_SPEED="$SPEED"

python3 - <<"PY"
import base64
import json
import os
import pathlib
import urllib.request
import urllib.error

ROOT = pathlib.Path(".").resolve()
brand = os.environ["INIT_BRAND"].strip()
domain = os.environ["INIT_DOMAIN"].strip()
topic = os.environ["INIT_TOPIC"].strip()
anim = os.environ.get("INIT_ANIMATION", "drift").strip()
speed = int(os.environ.get("INIT_SPEED", "18"))

api_key = os.environ.get("GEMINI_API_KEY", "").strip()
text_model = os.environ.get("GEMINI_TEXT_MODEL", "gemini-2.5-flash")
image_model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")

hero_title = f"{brand}: practical insights about {topic}"
hero_subtitle = f"Actionable guides, case-based workflows, and SEO-focused content for {topic}."
about_text = f"{brand} is a focused publication about {topic}, built for operators who need practical playbooks."
categories = ["Guides", "Strategy", "Trends", "Tools"]
colors = {
    "bg0": "#0a0514",
    "bg1": "#1a0a2e",
    "bg2": "#2d1b4e",
    "accent": "#8b5cf6",
    "accent2": "#22d3ee",
}


def gemini_generate(parts, model):
    if not api_key:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {"contents": [{"role": "user", "parts": [{"text": p} for p in parts]}]}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        print(f"[warn] Gemini HTTPError ({model}): {e.code} {body[:280]}")
    except Exception as e:
        print(f"[warn] Gemini request failed ({model}): {e}")
    return None


def extract_text(resp):
    if not resp:
        return None
    try:
        cand = resp.get("candidates", [])[0]
        parts = cand.get("content", {}).get("parts", [])
        texts = [p.get("text", "") for p in parts if p.get("text")]
        return "\n".join(texts).strip() if texts else None
    except Exception:
        return None


def extract_image(resp):
    if not resp:
        return None, None
    try:
        cand = resp.get("candidates", [])[0]
        for p in cand.get("content", {}).get("parts", []):
            inline = p.get("inlineData") or p.get("inline_data")
            if inline and inline.get("data"):
                mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                return base64.b64decode(inline["data"]), mime
    except Exception:
        return None, None
    return None, None


# 1) Generate copy + palette + categories
copy_prompt = (
    "Return strict JSON only with fields: hero_title, hero_subtitle, about_text, top_categories (array of 4 short items), "
    "colors ({bg0,bg1,bg2,accent,accent2} hex). "
    "Context: brand= + brand + , niche= + topic + , domain= + domain + . "
    "Do not translate brand name. Keep concise and high-converting."
)
copy_resp = gemini_generate([copy_prompt], text_model)
copy_text = extract_text(copy_resp)
if copy_text:
    try:
        cleaned = copy_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            cleaned = cleaned.replace("json", "", 1).strip()
        parsed = json.loads(cleaned)
        hero_title = parsed.get("hero_title", hero_title)[:140]
        hero_subtitle = parsed.get("hero_subtitle", hero_subtitle)[:220]
        about_text = parsed.get("about_text", about_text)[:280]
        if isinstance(parsed.get("top_categories"), list) and parsed["top_categories"]:
            categories = [str(x)[:24] for x in parsed["top_categories"][:8]]
        if isinstance(parsed.get("colors"), dict):
            for k in ["bg0", "bg1", "bg2", "accent", "accent2"]:
                v = parsed["colors"].get(k)
                if isinstance(v, str) and v.startswith("#"):
                    colors[k] = v
    except Exception as e:
        print(f"[warn] Copy JSON parse failed: {e}")

# 2) Generate logo and hero via Gemini image model
logo_prompt = (
    f"Create a minimal modern logo icon for brand {brand} about {topic}. "
    "No text, no watermark, transparent or dark-friendly background, high contrast, geometric style."
)
hero_prompt = (
    f"Cinematic hero banner for website about {topic}, premium editorial look, no text, no watermark, "
    "strong focal depth, suitable for glassmorphism UI, dark palette with vibrant accent lighting."
)

logo_resp = gemini_generate([logo_prompt], image_model)
logo_bin, logo_mime = extract_image(logo_resp)
if logo_bin:
    out = ROOT / "logo.png"
    out.write_bytes(logo_bin)
    print("[ok] logo generated")
else:
    print("[warn] logo not generated, keeping existing logo.png")

hero_resp = gemini_generate([hero_prompt], image_model)
hero_bin, hero_mime = extract_image(hero_resp)
if hero_bin:
    out = ROOT / "hero_ai.jpg"
    out.write_bytes(hero_bin)
    print("[ok] hero image generated")
else:
    print("[warn] hero image not generated, keeping existing hero_ai.jpg")

# 3) Write theme config
cfg = {
    "siteName": brand,
    "heroTitle": hero_title,
    "heroSubtitle": hero_subtitle,
    "heroImage": "/hero_ai.jpg",
    "aboutText": about_text,
    "topCategories": categories,
    "animationType": anim if anim in {"drift", "pulse", "wave"} else "drift",
    "animationSpeedSec": max(8, min(60, speed)),
    "colors": colors,
}

js = "window.BLOG_THEME = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n"
(ROOT / "theme.config.js").write_text(js, encoding="utf-8")

print("[ok] theme.config.js updated")
print("[done] init complete")
PY

echo "Init completed for: $DOMAIN ($BRAND, topic: $TOPIC)"
