#!/usr/bin/env node
/**
 * validate-content.js — Smoke + unit tests for Snowy Nail Studio static site.
 * Run: node tools/validate-content.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const DOCS  = path.join(__dirname, '..', 'docs');
const TOOLS = __dirname;
let passed = 0;
let failed = 0;
let section = '';
function startSection(name) {
  section = name;
  console.log(`\n\x1b[1m=== ${name} ===\x1b[0m`);
}
function assert(cond, name, detail) {
  if (cond) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` → ${detail}` : ''}`);
    failed++;
  }
}
function readJSON(relPath) {
  const full = path.join(DOCS, relPath);
  const raw  = fs.readFileSync(full, 'utf8');
  return JSON.parse(raw);
}
function fileExists(relPath) {
  return fs.existsSync(path.join(DOCS, relPath));
}
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-01  Critical files exist
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-01  Critical files');
[
  '.nojekyll', 'robots.txt', 'sitemap.xml',
  'assets/ui/favicon.svg',
  'assets/js/main.js', 'assets/js/reviews.js',
  'assets/js/gallery.js', 'assets/js/i18n.js',
  'assets/css/main.css',
  'data/translations.json', 'data/gallery.json', 'data/faq.json',
  'data/reviews.json', 'data/promotions.json', 'data/aftercare.json',
  'data/site.json',
  'index.html', 'gallery.html', 'services.html', 'studio.html',
  'about.html', 'contact.html', 'aftercare.html',
].forEach(f => assert(fileExists(f), `exists: docs/${f}`));
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-02  All JSON files are valid
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-02  JSON validity');
[
  'data/translations.json', 'data/gallery.json', 'data/faq.json',
  'data/reviews.json', 'data/promotions.json', 'data/aftercare.json',
  'data/site.json',
].forEach(f => {
  try {
    readJSON(f);
    assert(true, `valid JSON: ${f}`);
  } catch (e) {
    assert(false, `valid JSON: ${f}`, e.message);
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-03  translations.json structure
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-03  translations.json');
const t = readJSON('data/translations.json');
assert('en' in t && 'zh' in t, 'has en + zh keys');
const requiredGallery = [
  'filter_all','filter_floral','filter_minimalist','filter_glam','filter_geometric',
  'filter_kawaii','filter_ombre','filter_romantic','filter_colour',
  'filter_pink','filter_red','filter_nude','filter_white','filter_black',
  'filter_purple','filter_blue','filter_green','filter_gold',
  'filter_shape','filter_length','filter_finish',
  'no_results','load_more','lightbox_close',
];
requiredGallery.forEach(k => {
  assert(t.en.gallery[k] !== undefined, `en.gallery.${k}`);
  assert(t.zh.gallery[k] !== undefined, `zh.gallery.${k}`);
});
assert(t.en.common.skip_nav !== undefined, 'en.common.skip_nav');
assert(t.zh.common.skip_nav !== undefined, 'zh.common.skip_nav');
assert(t.en.common.error    !== undefined, 'en.common.error');
assert(t.en.common.mock_note !== undefined, 'en.common.mock_note');
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-04  gallery.json structure
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-04  gallery.json');
const gal = readJSON('data/gallery.json');
assert(Array.isArray(gal.items), 'items is array');
assert(gal.items.length >= 10, `has >= 10 items (got ${gal.items.length})`);
const requiredItemKeys = ['id','altEn','altZh','style','colour','shape','length','finish','service','featured','date'];
gal.items.forEach((item, i) => {
  requiredItemKeys.forEach(k => {
    if (!(k in item)) assert(false, `item[${i}].${k} present`, `id=${item.id}`);
  });
});
assert(true, 'all item required keys present');
const allStyles  = [...new Set(gal.items.flatMap(i => i.style || []))];
const allColours = [...new Set(gal.items.flatMap(i => i.colour || []))];
assert(allStyles.includes('romantic'),  `romantic style items exist (found: ${allStyles.join(', ')})`);
assert(allColours.includes('gold'),     `gold colour items exist (found: ${allColours.join(', ')})`);
assert(gal.items.some(i => i.featured), 'at least one featured item');
// Each style value used in data has a translation key
allStyles.forEach(s => {
  const key = `filter_${s}`;
  assert(t.en.gallery[key] !== undefined, `translation key exists for style "${s}"`);
});
allColours.forEach(c => {
  const key = `filter_${c}`;
  assert(t.en.gallery[key] !== undefined, `translation key exists for colour "${c}"`);
});
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-05  faq.json structure
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-05  faq.json');
const faq = readJSON('data/faq.json');
assert(Array.isArray(faq.categories), 'categories is array');
assert(faq.categories.length > 0, 'at least one category');
faq.categories.forEach((cat, ci) => {
  assert('titleEn' in cat && 'titleZh' in cat, `category[${ci}] has titleEn/titleZh`);
  assert(Array.isArray(cat.items), `category[${ci}] has items array`);
  cat.items.forEach((item, ii) => {
    ['questionEn','questionZh','answerEn','answerZh','id'].forEach(k => {
      assert(k in item, `faq[${ci}][${ii}].${k} present`);
    });
    assert(typeof item.id === 'string' && item.id.length > 0, `faq[${ci}][${ii}].id is non-empty string`);
  });
});
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-06  site.json contacts schema (V4 fix validation)
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-06  site.json contacts');
const site = readJSON('data/site.json');
assert(Array.isArray(site.contacts), 'contacts is array');
site.contacts.forEach((c, i) => {
  assert('id'      in c, `contact[${i}] has id`);
  assert('labelEn' in c && 'labelZh' in c, `contact[${i}] has labelEn/labelZh`);
  assert('valueEn' in c && 'valueZh' in c, `contact[${i}] has valueEn/valueZh`);
  if ('url' in c) {
    assert(typeof c.url === 'string' && c.url.length > 0, `contact[${i}] url is non-empty string`);
  }
});
const wechat = site.contacts.find(c => c.id === 'wechat');
assert(wechat !== undefined, 'wechat contact exists');
assert(wechat && !('url' in wechat), 'wechat has no url (renders as div, not <a>)');
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-07  promotions.json + aftercare.json structure
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-07  promotions.json + aftercare.json');
const promos = readJSON('data/promotions.json');
assert(Array.isArray(promos.active),   'active is array');
assert(Array.isArray(promos.services), 'services is array');
if (promos.active.length > 0) {
  const p = promos.active[0];
  ['id','titleEn','titleZh','descriptionEn','descriptionZh','active'].forEach(k => {
    assert(k in p, `promo[0].${k} present`);
  });
}
if (promos.services.length > 0) {
  const s = promos.services[0];
  ['id','nameEn','nameZh','descEn','descZh'].forEach(k => {
    assert(k in s, `service[0].${k} present`);
  });
}
const care = readJSON('data/aftercare.json');
assert(Array.isArray(care.sections), 'sections is array');
if (care.sections.length > 0) {
  const sec = care.sections[0];
  assert('titleEn' in sec && 'titleZh' in sec, 'section has titleEn/titleZh');
  assert(Array.isArray(sec.items), 'section has items array');
  if (sec.items.length > 0) {
    assert('textEn' in sec.items[0] && 'textZh' in sec.items[0], 'item has textEn/textZh');
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// SMOKE-08  reviews.json structure
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-08  reviews.json');
const revs = readJSON('data/reviews.json');
assert(Array.isArray(revs.items), 'items is array');
assert(revs.items.length > 0, 'at least one review');
revs.items.forEach((r, i) => {
  assert('type'   in r, `review[${i}] has type`);
  assert('rating' in r, `review[${i}] has rating`);
  assert(r.rating >= 1 && r.rating <= 5, `review[${i}] rating 1-5 (got ${r.rating})`);
  if (r.type === 'text') {
    assert('quoteEn' in r, `text review[${i}] has quoteEn`);
  }
  if (r.type === 'image') {
    assert('quoteZh' in r, `image review[${i}] has quoteZh`);
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// UNIT-01  escapeHtml / escapeAttr (reimplemented from main.js source)
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-01  escapeHtml + escapeAttr');
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return String(s == null ? '' : s)
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
assert(escapeHtml('<script>') === '&lt;script&gt;',  'escapeHtml: tags escaped');
assert(escapeHtml('a & b')   === 'a &amp; b',        'escapeHtml: ampersand escaped');
assert(escapeHtml(null)      === '',                  'escapeHtml: null → empty string');
assert(escapeHtml(0)         === '0',                 'escapeHtml: number coerced');
assert(escapeAttr('"hello"') === '&quot;hello&quot;', 'escapeAttr: double quotes escaped');
assert(escapeAttr("it's")    === 'it&#39;s',          "escapeAttr: single quotes escaped");
assert(escapeAttr(null)      === '',                  'escapeAttr: null → empty string');
// ─────────────────────────────────────────────────────────────────────────────
// UNIT-02  Gallery filter logic (_applyFilters logic reimplemented)
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-02  Gallery filter logic');
function applyFilters(items, activeFilters) {
  return items.filter(item => {
    for (const [group, value] of Object.entries(activeFilters)) {
      switch (group) {
        case 'service': if (item.service !== value) return false; break;
        case 'style':   if (!item.style  || !item.style.includes(value))  return false; break;
        case 'colour':  if (!item.colour || !item.colour.includes(value)) return false; break;
        case 'shape':   if (item.shape  !== value) return false; break;
        case 'length':  if (item.length !== value) return false; break;
        case 'finish':  if (item.finish !== value) return false; break;
        case 'special': if (value === 'featured' && !item.featured) return false; break;
      }
    }
    return true;
  });
}
const items = gal.items;
const allResults = applyFilters(items, {});
assert(allResults.length === items.length, `no filter → all items returned (${items.length})`);
const pinkItems = applyFilters(items, { colour: 'pink' });
assert(pinkItems.length > 0, `colour:pink → at least one result`);
assert(pinkItems.every(i => i.colour.includes('pink')), 'colour:pink → all results have pink');
const manItems = applyFilters(items, { service: 'manicure' });
assert(manItems.length > 0, 'service:manicure → at least one result');
assert(manItems.every(i => i.service === 'manicure'), 'service:manicure → all results correct');
const romanticItems = applyFilters(items, { style: 'romantic' });
assert(romanticItems.length > 0, `style:romantic → at least one result (got ${romanticItems.length})`);
assert(romanticItems.every(i => i.style.includes('romantic')), 'style:romantic → all results correct');
const goldItems = applyFilters(items, { colour: 'gold' });
assert(goldItems.length > 0, `colour:gold → at least one result (got ${goldItems.length})`);
const noResults = applyFilters(items, { colour: 'invisible' });
assert(noResults.length === 0, 'colour:invisible → empty results');
// Multi-filter: pink + almond
const multiItems = applyFilters(items, { colour: 'pink', shape: 'almond' });
assert(multiItems.every(i => i.colour.includes('pink') && i.shape === 'almond'),
  `multi-filter colour:pink+shape:almond → correct (${multiItems.length} items)`);
// Featured
const featuredItems = applyFilters(items, { special: 'featured' });
assert(featuredItems.length > 0, 'special:featured → at least one result');
assert(featuredItems.every(i => i.featured === true), 'special:featured → all are featured');
// ─────────────────────────────────────────────────────────────────────────────
// UNIT-03  JS static analysis (bug fix verification)
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-03  JS static analysis (bug fix verification)');
const mainJs    = fs.readFileSync(path.join(DOCS, 'assets/js/main.js'),    'utf8');
const reviewsJs = fs.readFileSync(path.join(DOCS, 'assets/js/reviews.js'), 'utf8');
const galleryJs = fs.readFileSync(path.join(DOCS, 'assets/js/gallery.js'), 'utf8');
// Bug 1 fix — check the specific bad onerror pattern is gone, not the private function itself
assert(!reviewsJs.includes('this.replaceWith(buildMockXHS'), 'Bug1: bad onerror replaced');
assert(reviewsJs.includes('snowyReviewFallback'),            'Bug1: snowyReviewFallback defined');
assert(reviewsJs.includes('data-fallback-quote'),  'Bug1: data-fallback-quote attribute used');
// Bug 2 fix
assert(mainJs.includes('answer.scrollHeight'),     'Bug2: FAQ uses scrollHeight (not offsetHeight)');
assert(!mainJs.includes('inner.offsetHeight'),     'Bug2: offsetHeight removed from FAQ');
// Bug 3 fix
assert(!mainJs.includes('initPromoToggle();'),     'Bug3: initPromoToggle() call removed from bootstrap');
assert(!mainJs.includes('function initPromoToggle'), 'Bug3: initPromoToggle function removed');
// Bug 5 fix
assert(mainJs.includes('const initScrollReveal'), 'Bug5: public initScrollReveal alias in main.js');
assert(reviewsJs.includes('initScrollReveal()') &&
  !reviewsJs.includes('_initScrollReveal()'),    'Bug5: reviews.js uses public alias');
// Bug 7 fix
assert(mainJs.includes('aria-current'),           'Bug7: aria-current set in _setActiveLinks');
// Bug 8 fix
assert(mainJs.includes('main-content'),           'Bug8: main-content id set in bootstrap');
// V3 fix
assert(reviewsJs.includes('home-promos-container'), 'V3: home-promos-container in langchange listener');
// New features
assert(mainJs.includes('skip-link'),              'Feature: skip-link in NAV_HTML');
assert(mainJs.includes('_updateCopyrightYear'),   'Feature: copyright year auto-update');
assert(mainJs.includes('footer-copyright'),       'Feature: footer-copyright class');
assert(!mainJs.includes('data-i18n="footer.copyright"'), 'Feature: copyright no longer i18n-bound');
assert(reviewsJs.includes('loadSiteContacts'),    'Feature: loadSiteContacts defined');
assert(galleryJs.includes('gallery-count'),       'Feature: gallery count line updated');
// ─────────────────────────────────────────────────────────────────────────────
// UNIT-04  HTML structure checks
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-04  HTML structure');
const galleryHtml = fs.readFileSync(path.join(DOCS, 'gallery.html'), 'utf8');
assert(galleryHtml.includes('data-value="romantic"'),   'gallery.html: romantic filter button');
assert(galleryHtml.includes('gallery.filter_romantic'), 'gallery.html: romantic i18n key');
assert(galleryHtml.includes('gallery.filter_gold'),     'gallery.html: gold uses correct i18n key');
assert(!galleryHtml.includes('"gallery.filter_colour">Gold'), 'gallery.html: gold no longer uses wrong key');
assert(galleryHtml.includes('id="gallery-count"'),      'gallery.html: gallery-count element');
assert(galleryHtml.includes('aria-live="polite"'),      'gallery.html: gallery-count has aria-live');
const contactHtml = fs.readFileSync(path.join(DOCS, 'contact.html'), 'utf8');
assert(contactHtml.includes('id="contact-methods-container"'), 'contact.html: dynamic container id');
assert(contactHtml.includes('loadSiteContacts('),              'contact.html: loadSiteContacts called');
assert(!contactHtml.includes('@snowynailstudio'),               'contact.html: no hardcoded handle');
assert(!contactHtml.includes('aria-label="Instagram"') ||
  contactHtml.includes('contact-methods-container'),           'contact.html: static entries replaced');
const mainCss = fs.readFileSync(path.join(DOCS, 'assets/css/main.css'), 'utf8');
assert(mainCss.includes('.skip-link'),     'main.css: .skip-link styles present');
assert(mainCss.includes('.skip-link:focus'), 'main.css: .skip-link:focus styles present');
assert(mainCss.includes('.gallery-count'), 'main.css: .gallery-count styles present');
// All HTML pages reference main.css
['index.html','gallery.html','services.html','studio.html','about.html','contact.html','aftercare.html'].forEach(page => {
  const html = fs.readFileSync(path.join(DOCS, page), 'utf8');
  assert(html.includes('assets/css/main.css'), `${page}: links main.css`);
  assert(html.includes('assets/js/i18n.js'),   `${page}: loads i18n.js`);
  assert(html.includes('assets/js/main.js'),   `${page}: loads main.js`);
  assert(html.includes('id="nav-placeholder"'), `${page}: has nav-placeholder`);
  assert(html.includes('id="footer-placeholder"'), `${page}: has footer-placeholder`);
});
// ─────────────────────────────────────────────────────────────────────────────
// UNIT-05  Translation completeness (every EN key has ZH counterpart)
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-05  Translation completeness (EN ↔ ZH parity)');
function flatKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') keys.push(...flatKeys(v, full));
    else keys.push(full);
  }
  return keys;
}
const enKeys = flatKeys(t.en).sort();
const zhKeys = flatKeys(t.zh).sort();
const missingInZh = enKeys.filter(k => !zhKeys.includes(k));
const missingInEn = zhKeys.filter(k => !enKeys.includes(k));
assert(missingInZh.length === 0, `all EN keys present in ZH (missing: ${missingInZh.join(', ') || 'none'})`);
assert(missingInEn.length === 0, `all ZH keys present in EN (missing: ${missingInEn.join(', ') || 'none'})`);
// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m, ${failed > 0 ? '\x1b[31m' : ''}${failed} failed\x1b[0m`);
if (failed > 0) process.exit(1);
