const fs = require('fs');
const path = require('path');
const https = require('https');

const LANDING_DIR = '/var/www/landing';
const IMAGES_DIR = path.join(LANDING_DIR, 'gallery_images');
const VIDEOS_DIR = path.join(LANDING_DIR, 'gallery_videos');
const API_URL = 'https://web.yas.wine/api/public-gallery';

const AI_DESCRIPTION = "Highest quality AI-generated image by MyUGC.Studio with no artifacts, perfect shadows and lighting, lifelike faces, perfectly adapted to the product context. Best quality on the market.";
const AI_VIDEO_DESCRIPTION = "Professional AI-generated marketing video by MyUGC.Studio. High-end fashion motion, perfect lighting, and realistic movement designed for high-converting ads on TikTok, Instagram, and Shopify.";

async function fetchApiData() {
    return new Promise((resolve, reject) => {
        https.get(API_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error('Failed to parse API response');
                    resolve({ images: [], videos: [] });
                }
            });
        }).on('error', (err) => {
            console.error('API request failed:', err.message);
            resolve({ images: [], videos: [] });
        });
    });
}

function getLocalFiles(dir, prefix) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        return [];
    }
    const files = fs.readdirSync(dir);
    console.log(`Scanning ${dir}: Found ${files.length} files`);
    return files
        .filter(file => !file.startsWith('.'))
        .map(file => ({
            url: `${prefix}/${file}`,
            isLocal: true,
            createdAt: fs.statSync(path.join(dir, file)).mtime.toISOString()
        }));
}

function generateImageHtml(img, isMainPage) {
    let url = img.url;
    if (!img.isLocal && url.startsWith('/')) {
        url = 'https://web.yas.wine' + url;
    }
    const finalUrl = isMainPage ? url.replace('../', '') : url;

    return `<div class="gallery-item" onclick="openLightbox(this)">
    <img src="${finalUrl}" alt="${AI_DESCRIPTION}" loading="lazy" title="AI Professional Product Photo by MyUGC.Studio">
</div>`;
}

function generateVideoHtml(vid, isMainPage) {
    let url = vid.url;
    if (!vid.isLocal && url.startsWith('/')) {
        url = 'https://web.yas.wine' + url;
    }
    const finalUrl = isMainPage ? url.replace('../', '') : url;

    return `<div class="gallery-item video-item" onclick="openLightbox(this)" aria-label="${AI_VIDEO_DESCRIPTION}">
    <video src="${finalUrl}" muted loop playsinline preload="metadata" title="${AI_VIDEO_DESCRIPTION}"></video>
    <div class="loader-spinner"></div>
    <div class="video-play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
</div>`;
}

async function run() {
    console.log('Starting gallery generation...');

    const apiData = await fetchApiData();
    const localImages = getLocalFiles(IMAGES_DIR, '/gallery_images');
    const localVideos = getLocalFiles(VIDEOS_DIR, '/gallery_videos');

    const allImages = [...localImages, ...(apiData.images || []).map(img => ({ ...img, isLocal: false }))];
    const allVideos = [...localVideos, ...(apiData.videos || []).map(vid => ({ ...vid, isLocal: false }))];

    console.log(`Found ${allImages.length} images and ${allVideos.length} videos.`);

    const targets = [
        { file: 'index.html', isMain: true },
        { file: 'gallery/index.html', isMain: false }
    ];

    for (const target of targets) {
        const filePath = path.join(LANDING_DIR, target.file);
        if (!fs.existsSync(filePath)) continue;

        let content = fs.readFileSync(filePath, 'utf8');

        // Update counters
        content = content.replace(
            /(id="imageCount">)[\s\S]*?(<\/div>)/g,
            `$1${allImages.length}$2`
        );
        content = content.replace(
            /(id="videoCount">)[\s\S]*?(<\/div>)/g,
            `$1${allVideos.length}$2`
        );

        // Update JSON-LD for Search Engines
        const imagesForSchema = allImages; // All images
        const videosForSchema = allVideos; // All videos

        const schemaParts = [
            ...imagesForSchema.map(img => {
                let url = img.url;
                if (!img.isLocal && url.startsWith('/')) url = 'https://web.yas.wine' + url;
                const cleanUrl = target.isMain ? url.replace('../', '') : url;
                const pathOnly = cleanUrl.replace(/^\.\.\//, '').replace(/^\//, '');
                const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : 'https://yas.wine/' + pathOnly;
                return {
                    "@type": "ImageObject",
                    "contentUrl": finalUrl,
                    "thumbnailUrl": finalUrl,
                    "name": "AI Professional Product Photo",
                    "description": AI_DESCRIPTION,
                    "copyrightNotice": "© 2025 YAS Wine. All rights reserved.",
                    "license": "https://yas.wine/terms",
                    "acquireLicensePage": "https://yas.wine/",
                    "creditText": "YAS Wine",
                    "creator": { "@type": "Organization", "name": "YAS Wine" }
                };
            }),
            ...videosForSchema.map(vid => {
                let url = vid.url;
                if (!vid.isLocal && url.startsWith('/')) url = 'https://web.yas.wine' + url;
                const cleanUrl = target.isMain ? url.replace('../', '') : url;
                const pathOnly = cleanUrl.replace(/^\.\.\//, '').replace(/^\//, '');
                const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : 'https://yas.wine/' + pathOnly;

                // For video SEO we need a thumbnail. Since we don't have separate thumbs for local videos yet, 
                // we'll try to use a static frame if possible, or fallback to logo/main placeholder.
                // For API videos, we might have thumbnailUrl.
                let thumb = vid.thumbnailUrl || vid.thumbnail || 'https://yas.wine/logo.png';
                if (!thumb.startsWith('http')) thumb = 'https://yas.wine/' + thumb.replace(/^\//, '').replace(/^\.\.\//, '');

                return {
                    "@type": "VideoObject",
                    "name": "AI Professional Product Marketing Video",
                    "description": AI_VIDEO_DESCRIPTION,
                    "thumbnailUrl": thumb,
                    "contentUrl": finalUrl,
                    "uploadDate": vid.createdAt || new Date().toISOString(),
                    "publisher": { "@type": "Organization", "name": "YAS Wine", "logo": { "@type": "ImageObject", "url": "https://yas.wine/logo.png" } }
                };
            })
        ];

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            "name": "YAS Wine AI Media Gallery",
            "description": "High-end AI-generated product photography and marketing videos by MyUGC.Studio Web Platform & Shopify App",
            "url": target.isMain ? "https://yas.wine/" : "https://yas.wine/gallery/",
            "image": "https://yas.wine/logo.png",
            "hasPart": schemaParts
        };

        const schemaHtml = `<script type="application/ld+json" id="gallery-schema">\n${JSON.stringify(schemaData, null, 2)}\n    </script>`;

        if (content.includes('id="gallery-schema"')) {
            content = content.replace(
                /<script type="application\/ld\+json" id="gallery-schema">[\s\S]*?<\/script>/,
                schemaHtml
            );
        } else {
            // Fallback for gallery/index.html which might not have the ID yet, or just add to head
            // Fallback: Insert before closing head if ID not found
            content = content.replace('</head>', `${schemaHtml}\n</head>`);
        }

        fs.writeFileSync(filePath, content);
        console.log(`Updated SEO Schema in ${target.file}`);
    }
    console.log('Gallery generation complete!');
}

run();
