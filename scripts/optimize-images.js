import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const TARGET_DIRECTORIES = ['../', '../gallery_images'];
const QUALITY = 80;
const MAX_WIDTH = 1600;

async function optimizeImages() {
    for (const dir of TARGET_DIRECTORIES) {
        try {
            const files = await fs.readdir(dir);
            console.log(`Optimizing images in ${dir}...`);

            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                    const filePath = path.join(dir, file);
                    const stats = await fs.stat(filePath);

                    // Skip if already small enough or if it's a backup/temp file
                    if (stats.size < 200 * 1024 || file.includes('.bak')) continue;

                    console.log(`Processing ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

                    const buffer = await fs.readFile(filePath);
                    let pipeline = sharp(buffer);

                    const metadata = await pipeline.metadata();
                    if (metadata.width > MAX_WIDTH) {
                        pipeline = pipeline.resize(MAX_WIDTH);
                    }

                    if (ext === '.png') {
                        await pipeline.png({ quality: QUALITY, palette: true }).toFile(filePath + '.tmp');
                    } else {
                        await pipeline.jpeg({ quality: QUALITY, progressive: true }).toFile(filePath + '.tmp');
                    }

                    await fs.rename(filePath + '.tmp', filePath);
                    const newStats = await fs.stat(filePath);
                    console.log(`  Done: ${(newStats.size / 1024).toFixed(1)} KB`);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }
}

optimizeImages();
