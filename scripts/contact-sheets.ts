/** Build one labeled 5-condition contact sheet per island location from `pnpm shots` captures. */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { argv } from './lib/browser';

const a = argv();
const input = resolve(a.get('in', 'artifacts/critique/round-03/captures'));
const output = resolve(a.get('out', 'artifacts/critique/round-03'));
const spots = a.get('spots', 'beach,jungle,waterfall,village,cliffs,lighthouse').split(',');
const conditions = a.get('conditions', 'sunrise,noon,sunset,night,rain').split(',');
const tileWidth = Number(a.get('width', '384'));
const tileHeight = Math.round(tileWidth * 9 / 16);
const labelHeight = 30;
mkdirSync(output, { recursive: true });

for (const spot of spots) {
  const tiles: Buffer[] = [];
  for (const condition of conditions) {
    const path = join(input, `${spot}_${condition}.jpg`);
    const label = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#101512"/><text x="14" y="21" fill="#f1eadb" font-size="15" font-family="Arial,sans-serif" letter-spacing="1">${condition.toUpperCase()}</text></svg>`);
    const image = await sharp(path).resize(tileWidth, tileHeight, { fit: 'cover' }).jpeg({ quality: 83 }).toBuffer();
    tiles.push(await sharp({ create: { width: tileWidth, height: tileHeight + labelHeight, channels: 3, background: '#101512' } })
      .composite([{ input: image, top: 0, left: 0 }, { input: label, top: tileHeight, left: 0 }]).jpeg({ quality: 86 }).toBuffer());
  }
  await sharp({ create: { width: tileWidth * conditions.length, height: tileHeight + labelHeight, channels: 3, background: '#101512' } })
    .composite(tiles.map((input, i) => ({ input, top: 0, left: tileWidth * i })))
    .jpeg({ quality: 88, mozjpeg: true }).toFile(join(output, `contact-${spot}.jpg`));
}
console.log(`wrote ${spots.length} sheets -> ${output}`);
