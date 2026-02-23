import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TARGET_DIRECTORIES = [
  path.join(ROOT, "blog"),
  path.join(ROOT, "gallery_images"),
  path.join(ROOT, "assets", "generated", "pairings"),
  path.join(ROOT, "assets", "generated", "dishes"),
  path.join(ROOT, "assets", "generated", "routes"),
];

const QUALITY = 78;
const WEBP_QUALITY = 72;
const MAX_WIDTH = 1400;

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function optimizeOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return;

  const stats = await fs.stat(filePath);
  if (stats.size < 120 * 1024 || filePath.includes(".bak")) return;

  const base = filePath.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  const webpPath = `${base}.webp`;
  const tmpPath = `${filePath}.tmp`;

  const buffer = await fs.readFile(filePath);
  let pipeline = sharp(buffer, { failOn: "none" });
  const md = await pipeline.metadata();
  if ((md.width || 0) > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  if (ext === ".png") {
    await pipeline.png({ quality: QUALITY, palette: true }).toFile(tmpPath);
  } else if (ext === ".webp") {
    await pipeline.webp({ quality: WEBP_QUALITY }).toFile(tmpPath);
  } else {
    await pipeline.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true }).toFile(tmpPath);
  }

  await fs.rename(tmpPath, filePath);

  const needWebp = ext !== ".webp" || !(await exists(webpPath));
  if (needWebp) {
    let wp = sharp(await fs.readFile(filePath), { failOn: "none" });
    const md2 = await wp.metadata();
    if ((md2.width || 0) > MAX_WIDTH) {
      wp = wp.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }
    await wp.webp({ quality: WEBP_QUALITY }).toFile(webpPath);
  }
}

async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (["node_modules",".git",".venv","backups"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function optimizeImages() {
  for (const dir of TARGET_DIRECTORIES) {
    const files = await walk(dir);
    console.log(`Optimizing images in ${dir} (${files.length} files)...`);
    for (const filePath of files) {
      try {
        await optimizeOne(filePath);
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err?.message || err);
      }
    }
  }
}

optimizeImages();
