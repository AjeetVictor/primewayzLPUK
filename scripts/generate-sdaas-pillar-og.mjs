import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('public/articles/sdaas');
const base = path.join(outDir, 'og-subscription-based-software-development');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#000A2D"/>
      <stop offset="100%" stop-color="#0B1F4A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="80" r="220" fill="#10B981" fill-opacity="0.12"/>
  <circle cx="180" cy="560" r="180" fill="#3B82F6" fill-opacity="0.12"/>
  <text x="72" y="110" fill="#6EE7B7" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="4">PILLAR GUIDE</text>
  <text x="72" y="210" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700">Subscription-Based</text>
  <text x="72" y="278" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700">Software Development</text>
  <text x="72" y="350" fill="#CBD5E1" font-family="Arial, Helvetica, sans-serif" font-size="30">Models, examples and how it works</text>
  <rect x="72" y="400" width="720" height="2" fill="#34D399" fill-opacity="0.5"/>
  <text x="72" y="460" fill="#E2E8F0" font-family="Arial, Helvetica, sans-serif" font-size="26">Two meanings: subscription software</text>
  <text x="72" y="500" fill="#E2E8F0" font-family="Arial, Helvetica, sans-serif" font-size="26">and monthly development capacity</text>
  <text x="72" y="570" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600">Primewayz UK</text>
</svg>`;

await fs.promises.mkdir(outDir, { recursive: true });
await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(`${base}.jpg`);
await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(`${base}.webp`);
const meta = await sharp(`${base}.jpg`).metadata();
console.log(`Created ${base}.jpg/webp (${meta.width}x${meta.height})`);
