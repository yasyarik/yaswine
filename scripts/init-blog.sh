#!/usr/bin/env bash
set -euo pipefail

DOMAIN=""
BRAND=""
TOPIC=""
SPEED="26"
SUBSCRIBE_EMAIL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --brand) BRAND="${2:-}"; shift 2 ;;
    --topic) TOPIC="${2:-}"; shift 2 ;;
    --speed) SPEED="${2:-}"; shift 2 ;;
    --subscribe-email) SUBSCRIBE_EMAIL="${2:-}"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$BRAND" || -z "$TOPIC" ]]; then
  echo "Usage: bash scripts/init-blog.sh --domain <domain> --brand \"<Brand Name>\" --topic \"<Niche>\" [--speed 26] [--subscribe-email info@domain]"
  exit 1
fi

if [[ -z "$SUBSCRIBE_EMAIL" ]]; then
  SUBSCRIBE_EMAIL="info@${DOMAIN}"
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

bash scripts/bootstrap-template.sh --domain "$DOMAIN" --brand "$BRAND"

SLUG=$(echo "$BRAND" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/--*/-/g; s/^-//; s/-$//')
[[ -z "$SLUG" ]] && SLUG="site"
LOGO_FILE="logo-${SLUG}.png"
HERO_FILE="hero-${SLUG}.png"

TOPIC_LC=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]')
if echo "$TOPIC_LC" | grep -Eq 'wine|vino|vin'; then
  BG0="#12070c"; BG1="#2a0d16"; BG2="#4f1424"; ACCENT="#b63a5a"; ACCENT_HOVER="#962f49";
  RAD1="rgba(144,22,56,.45)"; RAD2="rgba(188,88,116,.28)"; RAD3="rgba(92,16,37,.42)";
else
  BG0="#0a0514"; BG1="#1a0a2e"; BG2="#2d1b4e"; ACCENT="#8b5cf6"; ACCENT_HOVER="#7c3aed";
  RAD1="rgba(139, 92, 246, 0.40)"; RAD2="rgba(168, 85, 247, 0.30)"; RAD3="rgba(217, 70, 239, 0.30)";
fi

export INIT_DOMAIN="$DOMAIN"
export INIT_BRAND="$BRAND"
export INIT_TOPIC="$TOPIC"
export INIT_SPEED="$SPEED"
export INIT_SUBSCRIBE_EMAIL="$SUBSCRIBE_EMAIL"
export INIT_LOGO_FILE="$LOGO_FILE"
export INIT_HERO_FILE="$HERO_FILE"
export INIT_BG0="$BG0"
export INIT_BG1="$BG1"
export INIT_BG2="$BG2"
export INIT_ACCENT="$ACCENT"
export INIT_ACCENT_HOVER="$ACCENT_HOVER"
export INIT_RAD1="$RAD1"
export INIT_RAD2="$RAD2"
export INIT_RAD3="$RAD3"

python3 - <<'PY'
import base64, json, os, re, urllib.request
from pathlib import Path

root = Path('.').resolve()
key = (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') or '').strip()
model = (os.environ.get('GEMINI_IMAGE_MODEL') or 'gemini-2.5-flash-image').strip()

brand = os.environ['INIT_BRAND']
topic = os.environ['INIT_TOPIC']
logo_file = os.environ['INIT_LOGO_FILE']
hero_file = os.environ['INIT_HERO_FILE']

def gen(prompt: str) -> bytes:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = {
      "contents": [{"role": "user", "parts": [{"text": prompt}]}],
      "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'content-type':'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    for part in data.get('candidates',[{}])[0].get('content',{}).get('parts',[]):
        inline = part.get('inlineData') or part.get('inline_data')
        if inline and inline.get('data'):
            return base64.b64decode(inline['data'])
    raise RuntimeError('No image in Gemini response')

if key:
    try:
        logo = gen(f"Minimal clean transparent-friendly logo icon for brand {brand}. No text. Niche: {topic}. No watermark.")
        (root / logo_file).write_bytes(logo)
        print('[ok] logo generated')
    except Exception as e:
        print('[warn] logo generation failed:', e)

    try:
        hero = gen(f"Cinematic 16:9 hero banner for blog about {topic}. No text, no watermark, editorial quality.")
        (root / hero_file).write_bytes(hero)
        print('[ok] hero generated')
    except Exception as e:
        print('[warn] hero generation failed:', e)

if not (root / logo_file).exists() and (root / 'logo.png').exists():
    (root / logo_file).write_bytes((root / 'logo.png').read_bytes())
if not (root / hero_file).exists() and (root / 'hero_ai.jpg').exists():
    (root / hero_file).write_bytes((root / 'hero_ai.jpg').read_bytes())

# Canonical asset names used across existing templates.
if (root / logo_file).exists():
    (root / 'logo.png').write_bytes((root / logo_file).read_bytes())
if (root / hero_file).exists():
    (root / 'hero_ai.jpg').write_bytes((root / hero_file).read_bytes())

home_shell = root / 'universal_blog_shell.html'
blog_shell = root / 'universal_blog_index.html'
if not home_shell.exists():
    raise SystemExit('Missing universal_blog_shell.html in project root')
if not blog_shell.exists():
    raise SystemExit('Missing universal_blog_index.html in project root')

# Home page
(root / 'index.html').write_text(home_shell.read_text(), encoding='utf-8')

# Blog listing pages (per locale)
for rel in ['blog/index.html','ru/blog/index.html','es/blog/index.html','de/blog/index.html','fr/blog/index.html']:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(blog_shell.read_text(), encoding='utf-8')

repl = {
    '__BRAND__': os.environ['INIT_BRAND'],
    '__DOMAIN__': os.environ['INIT_DOMAIN'],
    '__LOGO_FILE__': os.environ['INIT_LOGO_FILE'],
    '__HERO_FILE__': os.environ['INIT_HERO_FILE'],
    '__BG0__': os.environ['INIT_BG0'],
    '__BG1__': os.environ['INIT_BG1'],
    '__BG2__': os.environ['INIT_BG2'],
    '__ACCENT__': os.environ['INIT_ACCENT'],
    '__ACCENT_HOVER__': os.environ['INIT_ACCENT_HOVER'],
    '__RAD1__': os.environ['INIT_RAD1'],
    '__RAD2__': os.environ['INIT_RAD2'],
    '__RAD3__': os.environ['INIT_RAD3'],
    '__ANIM_SPEED__': os.environ['INIT_SPEED'],
    '__HERO_TITLE__': f"{os.environ['INIT_BRAND']}: practical insights about {os.environ['INIT_TOPIC']}",
    '__HERO_SUBTITLE__': f"Actionable guides and frameworks for {os.environ['INIT_TOPIC']}.",
    '__SUBSCRIBE_EMAIL__': os.environ['INIT_SUBSCRIBE_EMAIL'],
}

for p in root.rglob('*.html'):
    s = p.read_text(errors='ignore')
    for k,v in repl.items():
        s = s.replace(k, v)
    s = s.replace('web.myugc.studio', os.environ['INIT_DOMAIN'])
    s = s.replace('myugc.studio', os.environ['INIT_DOMAIN'])
    p.write_text(s, encoding='utf-8')

def write_policy_pages() -> None:
    domain = os.environ['INIT_DOMAIN']
    brand = os.environ['INIT_BRAND']
    bg0 = os.environ['INIT_BG0']
    bg1 = os.environ['INIT_BG1']
    bg2 = os.environ['INIT_BG2']
    accent = os.environ['INIT_ACCENT']
    accent_hover = os.environ['INIT_ACCENT_HOVER']
    logo = 'logo.png'

    base_css = f"""
:root{{--bg-dark:{bg0};--bg-gradient:linear-gradient(135deg,{bg0} 0%,{bg1} 50%,{bg2} 100%);--accent:{accent};--accent-hover:{accent_hover};--glass-bg:rgba(255,255,255,.035);--glass-border:rgba(255,255,255,.12);--text:#f4edf0;--dim:#cfbec5;}}
*{{box-sizing:border-box;margin:0;padding:0;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}}
body{{background:var(--bg-dark);color:var(--text);overflow-x:hidden;line-height:1.7}}
.fixed-bg{{position:fixed;inset:0;z-index:-1;background:var(--bg-gradient)}}
.container{{max-width:980px;margin:0 auto;padding:0 24px}}
nav{{padding:22px 0;position:sticky;top:0;z-index:20;background:rgba(0,0,0,.0)}}
nav .row{{display:flex;align-items:center;justify-content:space-between;gap:16px}}
nav a{{color:var(--dim);text-decoration:none;font-weight:700;font-size:14px}}
nav a:hover{{color:#fff}}
.logo-img{{height:60px;width:auto;object-fit:contain}}
.card{{margin:20px auto 42px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:22px;padding:26px}}
h1{{font-size:34px;line-height:1.1;margin-bottom:10px}}
p{{color:var(--dim);margin:10px 0}}
footer{{border-top:1px solid var(--glass-border);padding:34px 0;text-align:center;color:var(--dim);font-size:14px;margin-top:28px}}
.btn{{display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:10px;font-weight:800;text-decoration:none;transition:.2s;background:var(--accent);color:#fff}}
.btn:hover{{background:var(--accent-hover)}}
"""

    def page(title: str, body_html: str) -> str:
        return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title} | {brand}</title>
<meta name="robots" content="index,follow" />
<link rel="icon" type="image/png" href="/{logo}" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<style>{base_css}</style>
</head>
<body>
<div class="fixed-bg"></div>
<nav><div class="container row"><a href="/"><img class="logo-img" src="/{logo}" alt="{brand} logo" /></a><div style="display:flex;gap:16px"><a href="/">Home</a><a href="/blog/">Blog</a></div></div></nav>
<main class="container"><div class="card"><h1>{title}</h1>{body_html}</div></main>
<footer><p>© 2026 {brand}. All rights reserved.</p><div style="margin-top:12px"><a href="/policy/terms/">Terms</a> | <a href="/policy/privacy/">Privacy</a> | <a href="/policy/refund/">Refund</a></div></footer>
</body></html>"""

    pages = {
        root / 'policy' / 'privacy' / 'index.html': page(
            'Privacy Policy',
            f"<p>This policy applies to <b>{domain}</b>.</p>"
            "<p>We collect only the information you submit via forms (name, email, message) to respond and improve the site experience. We do not sell personal data.</p>"
            f"<p>If you have questions, contact <a class=\"btn\" href=\"mailto:info@{domain}\">info@{domain}</a>.</p>",
        ),
        root / 'policy' / 'terms' / 'index.html': page(
            'Terms of Service',
            f"<p>By using <b>{domain}</b>, you agree to these terms.</p>"
            "<p>Content is provided for informational purposes. We may update the site at any time. Your use is at your own risk.</p>"
            f"<p>Contact: <a class=\"btn\" href=\"mailto:info@{domain}\">info@{domain}</a>.</p>",
        ),
        root / 'policy' / 'refund' / 'index.html': page(
            'Refund Policy',
            "<p>This site is a content blog. Unless you purchased a separate product/service from us, there is nothing to refund.</p>"
            f"<p>For billing questions, email <a class=\"btn\" href=\"mailto:info@{domain}\">info@{domain}</a>.</p>",
        ),
    }
    for p, html in pages.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(html, encoding='utf-8')

write_policy_pages()

def patch_blog_template_palette(path: Path) -> None:
    if not path.exists():
        return
    bg0 = os.environ['INIT_BG0']
    bg1 = os.environ['INIT_BG1']
    bg2 = os.environ['INIT_BG2']
    accent = os.environ['INIT_ACCENT']
    accent_hover = os.environ['INIT_ACCENT_HOVER']
    rad1 = os.environ['INIT_RAD1']
    rad2 = os.environ['INIT_RAD2']
    def hex_to_rgb(h: str):
        h = h.lstrip('#')
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    ar, ag, ab = hex_to_rgb(accent)

    s = path.read_text(errors='ignore')
    # 1) Update :root palette vars for the blog post template (legacy variable names).
    s = re.sub(r'--bg-dark:\s*#[0-9a-fA-F]{3,8}\s*;', f'--bg-dark: {bg0};', s)
    s = re.sub(r'--bg-gradient:\s*linear-gradient\([^;]+\);', f'--bg-gradient: linear-gradient(135deg, {bg0} 0%, {bg1} 50%, {bg2} 100%);', s)
    s = re.sub(r'--accent-green:\s*#[0-9a-fA-F]{3,8}\s*;', f'--accent-green: {accent};', s)
    s = re.sub(r'--accent-hover:\s*#[0-9a-fA-F]{3,8}\s*;', f'--accent-hover: {accent_hover};', s)

    # 1b) Replace hardcoded legacy palette tokens that appear throughout the template CSS.
    for old, new in {
        '#0a0514': bg0,
        '#1a0a2e': bg1,
        '#2d1b4e': bg2,
        '#8b5cf6': accent,
        '#7c3aed': accent_hover,
    }.items():
        s = s.replace(old, new).replace(old.upper(), new)

    # Replace legacy purple rgba() colors but preserve alpha.
    s = re.sub(r'rgba\(\s*139\s*,\s*92\s*,\s*246\s*,\s*([0-9.]+)\s*\)', rf'rgba({ar}, {ag}, {ab}, \1)', s)
    s = re.sub(r'rgba\(\s*168\s*,\s*85\s*,\s*247\s*,\s*([0-9.]+)\s*\)', rf'rgba({ar}, {ag}, {ab}, \1)', s)
    s = re.sub(r'rgba\(\s*217\s*,\s*70\s*,\s*239\s*,\s*([0-9.]+)\s*\)', rf'rgba({ar}, {ag}, {ab}, \1)', s)

    # 2) Update the animated radial accents (keeps original structure, only replaces colors).
    s = re.sub(r'radial-gradient\(circle at 15% 25%,\s*rgba\([^\)]*\)\s*0%,\s*transparent\s*35%\)',
               f'radial-gradient(circle at 15% 25%, {rad1} 0%, transparent 35%)', s)
    s = re.sub(r'radial-gradient\(circle at 85% 15%,\s*rgba\([^\)]*\)\s*0%,\s*transparent\s*35%\)',
               f'radial-gradient(circle at 85% 15%, {rad2} 0%, transparent 35%)', s)

    # 3) Ensure the template uses the canonical logo/hero names (these are overwritten above).
    s = s.replace('href="../logo.png"', 'href="../logo.png"')
    s = s.replace('href="/logo.png"', 'href="/logo.png"')

    path.write_text(s, encoding='utf-8')

patch_blog_template_palette(root / 'blog' / 'template.html')

print('[ok] html placeholders applied')
PY

if command -v convert >/dev/null 2>&1 && [ -f "$LOGO_FILE" ]; then
  # Make background transparent using the top-left pixel as "background" reference.
  BG_HEX="$(convert "$LOGO_FILE" -format '%[hex:p{0,0}]' info: 2>/dev/null | head -n1 | cut -c1-6 || true)"
  if [ -n "$BG_HEX" ]; then
    convert "$LOGO_FILE" -alpha set -fuzz 18% -transparent "#$BG_HEX" "$LOGO_FILE" || true
    cp -f "$LOGO_FILE" "logo.png" || true
  fi
fi

echo "Init completed: $DOMAIN ($BRAND)"
