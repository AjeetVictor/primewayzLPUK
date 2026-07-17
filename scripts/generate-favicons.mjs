/**
 * Generate favicon.ico and PNG icon set from the existing Primewayz PW mark.
 * Run: node scripts/generate-favicons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const sourcePath = path.join(publicDir, 'favicon.png');

const pngSizes = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
];

const icoSizes = [16, 32, 48];

function createIco(pngImages) {
  const count = pngImages.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (const png of pngImages) {
    const size = png.size;
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      bytes: png.buffer.length,
      offset,
      buffer: png.buffer,
    });
    offset += png.buffer.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const directory = Buffer.alloc(count * 16);
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const start = i * 16;
    directory.writeUInt8(entry.width, start);
    directory.writeUInt8(entry.height, start + 1);
    directory.writeUInt8(0, start + 2);
    directory.writeUInt8(0, start + 3);
    directory.writeUInt16LE(1, start + 4);
    directory.writeUInt16LE(32, start + 6);
    directory.writeUInt32LE(entry.bytes, start + 8);
    directory.writeUInt32LE(entry.offset, start + 12);
  }

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.buffer)]);
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing favicon source: ${sourcePath}`);
  }

  for (const item of pngSizes) {
    const out = path.join(publicDir, item.file);
    await sharp(sourcePath)
      .resize(item.size, item.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(out);
    console.log(`Wrote ${item.file}`);
  }

  const icoPngs = [];
  for (const size of icoSizes) {
    const buffer = await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toBuffer();
    icoPngs.push({ size, buffer });
  }

  const icoBuffer = createIco(icoPngs);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Wrote favicon.ico');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
