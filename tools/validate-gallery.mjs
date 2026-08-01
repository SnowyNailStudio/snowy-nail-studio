#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const gallery = await readJson(path.join(docs, 'data/gallery.json'));
const translations = await readJson(path.join(docs, 'data/translations.json'));
const html = await fs.readFile(path.join(docs, 'gallery.html'), 'utf8');

const approvedStyles = [
  'french', 'cat-eye', 'chrome', 'ombre', 'floral',
  'rhinestone', 'marble', 'hand-painted', 'glitter'
];
const approved = new Set(approvedStyles);
const ids = new Set();
const featuredOrders = new Set();
for (const item of gallery.items || []) {
  if (!item.id || ids.has(item.id)) throw new Error(`Missing or duplicate id: ${item.id}`);
  ids.add(item.id);
  for (const style of item.style || []) {
    if (!approved.has(style)) throw new Error(`${item.id}: unapproved style ${style}`);
  }
  if (item.featured) {
    const order = item['featured-order'];
    if (!Number.isInteger(order) || order < 1) throw new Error(`${item.id}: featured-order must be a positive integer`);
    if (featuredOrders.has(order)) throw new Error(`${item.id}: duplicate featured-order ${order}`);
    featuredOrders.add(order);
  }
  for (const key of ['src', 'thumb']) {
    const target = path.join(docs, item[key]);
    await fs.access(target).catch(() => { throw new Error(`${item.id}: missing ${key} ${item[key]}`); });
  }
}
if (featuredOrders.size > 4) throw new Error('At most four gallery items may be featured');

const buttons = [...html.matchAll(/data-group="style"\s+data-value="([^"]+)"/g)].map(match => match[1]);
if (JSON.stringify(buttons) !== JSON.stringify(approvedStyles)) {
  throw new Error(`Style buttons do not match approvedStyles: ${buttons.join(', ')}`);
}
for (const lang of ['en', 'zh']) {
  for (const style of approvedStyles) {
    const key = `filter_${style}`;
    if (!translations[lang]?.gallery?.[key]) throw new Error(`Missing ${lang}.${key}`);
  }
}
if (JSON.stringify(gallery).toLowerCase().includes('shellac')) throw new Error('shellac is not allowed');
console.log(`Gallery validation passed: ${gallery.items.length} items, ${buttons.length} style filters.`);
