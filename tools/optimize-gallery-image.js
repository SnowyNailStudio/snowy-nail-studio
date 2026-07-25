#!/usr/bin/env node
/**
 * optimize-gallery-image.js — Resize and convert gallery photos to webp.
 * Usage: node tools/optimize-gallery-image.js <input> <output.webp>
 *
 * Requires: npm install (sharp in devDependencies)
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const MAX_WIDTH  = 800;
const MAX_HEIGHT = 1067;
const QUALITY    = 82;
const TARGET_KB  = 200;

async function main() {
  const [input, output] = process.argv.slice(2);

  if (!input || !output) {
    console.error('Usage: node tools/optimize-gallery-image.js <input> <output.webp>');
    process.exit(1);
  }

  if (!fs.existsSync(input)) {
    console.error(`Input not found: ${input}`);
    process.exit(1);
  }

  if (!output.endsWith('.webp')) {
    console.error('Output must be a .webp file');
    process.exit(1);
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp is not installed. Run: npm install');
    process.exit(1);
  }

  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const meta = await sharp(input).metadata();
  const needsResize =
    (meta.width && meta.width > MAX_WIDTH) ||
    (meta.height && meta.height > MAX_HEIGHT);

  let pipeline = sharp(input);
  if (needsResize) {
    pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  await pipeline.webp({ quality: QUALITY }).toFile(output);

  const stat = fs.statSync(output);
  const outMeta = await sharp(output).metadata();
  const sizeKB = Math.round(stat.size / 1024);

  console.log(`Optimized: ${output}`);
  console.log(`  Dimensions: ${outMeta.width}×${outMeta.height}`);
  console.log(`  Size: ${sizeKB} KB${sizeKB > TARGET_KB ? ` (target < ${TARGET_KB} KB — consider re-exporting at lower quality)` : ''}`);

  if (sizeKB > TARGET_KB * 1.5) {
    process.exit(2);
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
