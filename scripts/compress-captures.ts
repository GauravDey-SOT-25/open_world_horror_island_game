/** Convert a screenshot-runner output directory to compact JPEGs and update its report paths. */
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { argv } from './lib/browser';

const a = argv();
const input = resolve(a.get('in', 'artifacts/critique/round-03/captures'));
const quality = Number(a.get('quality', '92'));
const removePng = a.has('remove-png');
const images = readdirSync(input).filter((name) => name.toLowerCase().endsWith('.png'));
for (const name of images) {
  await sharp(join(input, name)).jpeg({ quality, mozjpeg: true }).toFile(join(input, name.replace(/\.png$/i, '.jpg')));
}

const reportPath = join(input, 'report.json');
if (existsSync(reportPath)) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as { results?: { file?: string }[] };
  for (const result of report.results ?? []) if (result.file) result.file = result.file.replace(/\.png$/i, '.jpg');
  writeFileSync(reportPath, JSON.stringify(report, null, 1));
}
if (removePng) for (const name of images) unlinkSync(join(input, name));
console.log(`converted ${images.length} screenshots to JPEG q${quality}${removePng ? ' and removed PNGs' : ''}`);
