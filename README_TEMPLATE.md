# Universal Blog Template (Factory-ready)

Simplified template for content sites.

## Structure
- Header: Home + Blog + Language switch.
- Home sections:
  - Hero
  - Top Categories
  - Featured Articles carousel
  - Latest Articles grid
  - About + Subscribe
- Keeps glassmorphism visual style.
- Theme variation via `theme.config.js`:
  - background colors
  - background animation type
  - animation speed

## Removed from template
- Menu points and pages: Localization, Apparel Placements, Gallery, Use Cases, Pricing.

## Quick start
1. `cp -a /var/www/landing-template /var/www/<new-site>`
2. `cd /var/www/<new-site>`
3. `bash scripts/bootstrap-template.sh --domain <domain> --brand "<Brand Name>"`

## Full init (with AI branding)
Use this to set niche/theme and generate logo + hero image with Gemini.

```bash
export GEMINI_API_KEY="<your_key>"
bash scripts/init-blog.sh \
  --domain yas.wine \
  --brand "YAS Wine" \
  --topic "wine trends and guides" \
  --animation wave \
  --speed 20
```

Optional envs:
- `GEMINI_TEXT_MODEL` (default: `gemini-2.5-flash`)
- `GEMINI_IMAGE_MODEL` (default: `gemini-2.5-flash-image`)

If Gemini fails or no key is set, script keeps existing `logo.png` and `hero_ai.jpg`.
