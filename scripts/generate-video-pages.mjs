import fs from "node:fs";
import path from "node:path";

const SITE_ORIGIN = "https://myugc.studio";
const API_ORIGIN = "https://api.myugc.studio";
const WEB_ORIGIN = "https://web.myugc.studio";
const API_URL = `${API_ORIGIN}/api/public-gallery?v=${Date.now()}`;

const OUT_DIR = "/var/www/landing/watch";
const SITEMAP_PATH = "/var/www/landing/sitemap.xml";

function absAssetUrl(u) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/api/local-assets")) return WEB_ORIGIN + u;
  if (u.startsWith("/")) return API_ORIGIN + u;
  return u;
}

function escXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function safeText(s, fallback) {
  const t = (s ?? "").toString().trim();
  return t.length ? t : fallback;
}

function pageHtml({ id, videoUrl, title, description, thumbnailUrl }) {
  const canonical = `${SITE_ORIGIN}/watch/${encodeURIComponent(id)}.html`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description,
    thumbnailUrl: [thumbnailUrl],
    contentUrl: videoUrl,
    embedUrl: canonical,
    url: canonical,
    potentialAction: { "@type": "WatchAction", target: canonical },
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />

  <meta property="og:type" content="video.other" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${thumbnailUrl}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${thumbnailUrl}" />

  <style>
    :root { --bg:#0a0514; --glass:rgba(255,255,255,0.05); --border:rgba(255,255,255,0.12); --accent:#8b5cf6; --text:#ededed; --dim:#a1a1aa; }
    * { box-sizing:border-box; }
    body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:var(--bg); color:var(--text); }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
    .top { display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--text); }
    .brand img { width:34px; height:34px; border-radius:10px; }
    .brand span { font-weight:700; letter-spacing:0.2px; }
    .btn { padding:10px 14px; border-radius: 999px; border:1px solid var(--border); background:var(--glass); color:var(--text); text-decoration:none; font-weight:600; }
    .btn:hover { border-color: rgba(139,92,246,0.6); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
    h1 { margin:22px 0 10px; font-size: 28px; line-height: 1.2; }
    p { margin:0 0 18px; color: var(--dim); }
    .card { border:1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); border-radius: 18px; overflow:hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
    .video { width:100%; aspect-ratio: 16/9; background:#000; }
    .meta { padding: 14px 16px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; }
    .meta code { color: var(--dim); }
    .meta a { color: var(--accent); text-decoration:none; }
    .meta a:hover { text-decoration:underline; }
  </style>

  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a class="brand" href="${SITE_ORIGIN}/">
        <img src="${SITE_ORIGIN}/logo.png" alt="My UGC Studio" />
        <span>My UGC Studio</span>
      </a>
      <a class="btn" href="${SITE_ORIGIN}/gallery/">All videos</a>
    </div>

    <h1>${title}</h1>
    <p>${description}</p>

    <div class="card">
      <video class="video" controls preload="metadata" playsinline src="${videoUrl}"></video>
      <div class="meta">
        <code>Video ID: ${id}</code>
        <a href="${videoUrl}" rel="nofollow">Direct MP4</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function urlBlock({ pageUrl, videoUrl, title, description, thumbnailUrl }) {
  return `  <url>\n` +
    `    <loc>${escXml(pageUrl)}</loc>\n` +
    `    <changefreq>weekly</changefreq>\n` +
    `    <priority>0.6</priority>\n` +
    `    <video:video>\n` +
    `      <video:thumbnail_loc>${escXml(thumbnailUrl)}</video:thumbnail_loc>\n` +
    `      <video:title>${escXml(title)}</video:title>\n` +
    `      <video:description>${escXml(description)}</video:description>\n` +
    `      <video:content_loc>${escXml(videoUrl)}</video:content_loc>\n` +
    `    </video:video>\n` +
    `  </url>\n`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const res = await fetch(API_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  const data = await res.json();
  const videos = Array.isArray(data?.videos) ? data.videos : [];

  const thumbnailUrl = `${SITE_ORIGIN}/logo.png`;

  let written = 0;
  const sitemapEntries = [];

  for (const v of videos) {
    const id = safeText(v?.id, "");
    if (!id) continue;

    const rawUrl = safeText(v?.url, "");
    if (!rawUrl) continue;
    const videoUrl = absAssetUrl(rawUrl);

    const title = "AI Generated Product Video | My UGC Studio";
    const description = "AI-generated UGC product video. Watch and download the MP4.";

    const outPath = path.join(OUT_DIR, `${id}.html`);
    fs.writeFileSync(outPath, pageHtml({ id, videoUrl, title, description, thumbnailUrl }), "utf8");
    written += 1;

    sitemapEntries.push(urlBlock({
      pageUrl: `${SITE_ORIGIN}/watch/${encodeURIComponent(id)}.html`,
      videoUrl,
      title,
      description,
      thumbnailUrl,
    }));
  }

  const indexItems = videos
    .filter(v => v?.id)
    .map(v => `<li><a href="/watch/${encodeURIComponent(v.id)}.html">${v.id}</a></li>`)
    .join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), `<!doctype html><meta charset="utf-8"><title>Video Pages</title><h1>Video Pages</h1><ul>${indexItems}</ul>`, "utf8");

  let sitemap = fs.readFileSync(SITEMAP_PATH, "utf8");
  sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/myugc\.studio\/v\.html[^<]*<\/loc>[\s\S]*?<\/url>\s*/g, "\n");

  if (!sitemap.includes("</urlset>")) throw new Error("sitemap.xml missing </urlset>");
  sitemap = sitemap.replace("</urlset>", `\n${sitemapEntries.join("")}\n</urlset>`);

  fs.writeFileSync(SITEMAP_PATH, sitemap, "utf8");

  console.log(JSON.stringify({ videos: videos.length, pagesWritten: written, sitemapAdded: sitemapEntries.length }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
