import sharp from 'sharp';
import { resolve } from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('Usage: pnpm exec tsx scripts/create-social-preview.ts <source-image> [output-image]');

const output = resolve(process.argv[3] ?? 'docs/social-preview.jpg');
const width = 1200;
const height = 630;
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="shade-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#090a0b" stop-opacity="0.70"/>
      <stop offset="0.48" stop-color="#090a0b" stop-opacity="0.34"/>
      <stop offset="0.82" stop-color="#090a0b" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shade-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.62" stop-color="#08090a" stop-opacity="0"/>
      <stop offset="1" stop-color="#08090a" stop-opacity="0.52"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#shade-left)"/>
  <rect width="1200" height="630" fill="url(#shade-bottom)"/>
  <path d="M82 174v210" stroke="#e9d5b5" stroke-width="2" opacity="0.82"/>
  <text x="108" y="208" fill="#08090a" opacity="0.72" filter="url(#soft-shadow)" font-family="Georgia, 'Times New Roman', serif" font-size="76" letter-spacing="13">SALTWAKE</text>
  <text x="104" y="204" fill="#f1e7d5" font-family="Georgia, 'Times New Roman', serif" font-size="76" letter-spacing="13">SALTWAKE</text>
  <text x="109" y="257" fill="#d7b98f" font-family="Georgia, 'Times New Roman', serif" font-size="21" letter-spacing="7">THE KEEPER</text>
  <text x="104" y="336" fill="#f0e5d2" font-family="Arial, sans-serif" font-size="14" letter-spacing="3.5" opacity="0.92">THE ISLAND IS OPEN. THE LIGHTHOUSE IS WATCHING.</text>
</svg>`);

await sharp(resolve(input))
  .rotate()
  .resize(width, height, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 91, mozjpeg: true, chromaSubsampling: '4:2:0' })
  .toFile(output);

console.log(`${output} · ${width}×${height} Open Graph image`);
