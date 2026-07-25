#!/usr/bin/env node
/**
 * gallery-next-id.js — Suggest the next gallery item ID.
 * Usage: node tools/gallery-next-id.js [optional slug words]
 *
 * Example: node tools/gallery-next-id.js "blue cat eye rhinestone"
 * Output:  g015-blue-cat-eye-rhinestone
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'docs');

function readGallery() {
  const raw = fs.readFileSync(path.join(DOCS, 'data/gallery.json'), 'utf8');
  return JSON.parse(raw);
}

function extractNumbers(ids) {
  const nums = [];
  for (const id of ids) {
    const m = id.match(/^g(\d+)/i);
    if (m) nums.push(parseInt(m[1], 10));
  }
  return nums;
}

function toKebabSlug(words) {
  return words
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

function main() {
  const slugInput = process.argv.slice(2).join(' ');
  const gallery   = readGallery();
  const ids       = (gallery.items || []).map(i => i.id);
  const nums      = extractNumbers(ids);
  const nextNum   = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  const padded    = String(nextNum).padStart(3, '0');
  const slug      = slugInput ? toKebabSlug(slugInput) : '';
  const id        = slug ? `g${padded}-${slug}` : `g${padded}`;

  const imageDir = path.join(DOCS, 'assets/images/gallery');
  const existingImages = fs.existsSync(imageDir)
    ? fs.readdirSync(imageDir)
    : [];

  console.log(`Next ID:     ${id}`);
  console.log(`Numeric:     ${nextNum}`);
  console.log(`Existing:    ${ids.length} items in gallery.json`);
  console.log(`Images:      ${existingImages.length} files in assets/images/gallery/`);

  if (ids.includes(id)) {
    console.error(`Warning: ID "${id}" already exists in gallery.json`);
    process.exit(1);
  }

  const webpName = `${id}.webp`;
  if (existingImages.includes(webpName)) {
    console.error(`Warning: ${webpName} already exists on disk`);
    process.exit(1);
  }

  console.log(`Suggested output: docs/assets/images/gallery/${webpName}`);
}

main();
