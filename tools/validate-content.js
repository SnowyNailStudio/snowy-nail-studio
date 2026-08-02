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
  'assets/js/availability.js', 'assets/css/availability.css',
  'data/translations.json', 'data/gallery.json', 'data/faq.json',
  'data/reviews.json', 'data/promotions.json', 'data/aftercare.json',
  'data/site.json', 'data/availability.json',
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
  'data/site.json', 'data/availability.json',
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
  'filter_all','filter_french','filter_cat-eye','filter_chrome','filter_ombre',
  'filter_floral','filter_rhinestone','filter_marble','filter_hand-painted','filter_glitter','filter_colour',
  'filter_pink','filter_red','filter_nude','filter_white','filter_black',
  'filter_purple','filter_blue','filter_green','filter_gold',
  'filter_shape','filter_length','filter_finish',
  'no_results','lightbox_close','showing_count','page_label',
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
assert(gal.items.length === 33, `has exactly 33 items (got ${gal.items.length})`);
const requiredItemKeys = ['id','src','thumb','altEn','altZh','style','colour','shape','length','finish','service','featured','date'];
gal.items.forEach((item, i) => {
  requiredItemKeys.forEach(k => {
    if (!(k in item)) assert(false, `item[${i}].${k} present`, `id=${item.id}`);
  });
});
assert(true, 'all item required keys present');
const allStyles  = [...new Set(gal.items.flatMap(i => i.style || []))];
const allColours = [...new Set(gal.items.flatMap(i => i.colour || []))];
const approvedStyles = ['french','cat-eye','chrome','ombre','floral','rhinestone','marble','hand-painted','glitter'];
assert(allStyles.every(style => approvedStyles.includes(style)), `only approved styles are used (found: ${allStyles.join(', ')})`);
assert(gal.items.some(i => Array.isArray(i.style) && i.style.length === 0), 'empty style arrays are supported');
assert(gal.items.some(i => i.featured), 'at least one featured item');
const featuredGalleryItems = gal.items.filter(i => i.featured);
const featuredOrders = featuredGalleryItems.map(i => i['featured-order']);
assert(featuredGalleryItems.length <= 4, `at most four featured gallery items (got ${featuredGalleryItems.length})`);
assert(featuredOrders.every(Number.isInteger), 'all featured gallery items have an integer featured-order');
assert(new Set(featuredOrders).size === featuredOrders.length, 'featured-order values are unique');
// Each style value used in data has a translation key in both languages
allStyles.forEach(s => {
  const key = `filter_${s}`;
  assert(t.en.gallery[key] !== undefined, `en.gallery translation key exists for style "${s}"`);
  assert(t.zh.gallery[key] !== undefined, `zh.gallery translation key exists for style "${s}"`);
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
const xhs = site.contacts.find(c => c.id === 'xhs');
assert(xhs && xhs.url && xhs.url.startsWith('https://www.xiaohongshu.com/user/profile/'), 'xiaohongshu contact has profile URL');
assert(wechat !== undefined, 'wechat contact exists');
assert(wechat && !('url' in wechat), 'wechat has no url (renders as div, not <a>)');
// business.hours validation (optional but recommended)
assert(site.business && site.business.hours, 'site.business.hours exists');
if (site.business && site.business.hours && site.business.hours.days) {
  ['mon','tue','wed','thu','fri','sat','sun'].forEach(d => {
    const dd = site.business.hours.days[d];
    assert(dd && (typeof dd.open === 'string') && (typeof dd.close === 'string'), `business.hours.days.${d} has open/close`);
  });
}
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
// SMOKE-09  availability.json schema
// ─────────────────────────────────────────────────────────────────────────────
startSection('SMOKE-09  availability.json');
try {
  const avail = readJSON('data/availability.json');
  assert(typeof avail.timezone === 'string' && avail.timezone.length > 0, 'availability.timezone present');
  assert(Array.isArray(avail.busy), 'availability.busy is array');
  avail.busy.forEach((b, i) => {
    assert(typeof b.start === 'string' && typeof b.end === 'string', `busy[${i}].start/end strings`);
    const s = new Date(b.start);
    const e = new Date(b.end);
    assert(!isNaN(s.getTime()) && !isNaN(e.getTime()) && s < e, `busy[${i}] parseable and start < end`);
  });
} catch (e) {
  assert(false, 'valid JSON: data/availability.json', e.message);
}

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
        case 'service': if (value === 'manicure' ? !['manicure','extensions'].includes(item.service) : item.service !== value) return false; break;
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
assert(manItems.every(i => ['manicure','extensions'].includes(i.service)), 'service:manicure → manicure and extensions results correct');
const chromeItems = applyFilters(items, { style: 'chrome' });
assert(chromeItems.length > 0, `style:chrome → at least one result (got ${chromeItems.length})`);
assert(chromeItems.every(i => i.style.includes('chrome')), 'style:chrome → all results correct');
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
const defaultGalleryOrder = [...items].sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.featured && b.featured) return a['featured-order'] - b['featured-order'];
  const aName = a.src.split('/').pop();
  const bName = b.src.split('/').pop();
  return bName.localeCompare(aName, undefined, { numeric: true });
});
assert(defaultGalleryOrder.slice(0, 4).map(i => i.id).join(',') === 'g030,g027,g031,g009', 'default gallery starts with featured-order sequence');
assert(new Set(defaultGalleryOrder.map(i => i.id)).size === defaultGalleryOrder.length, 'default gallery ordering does not duplicate items');
assert(defaultGalleryOrder[4].src.includes('g033-'), 'non-featured gallery continues in descending filename order');
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
assert(galleryJs.includes('a.featuredOrder - b.featuredOrder'), 'Feature: homepage sorts by featured-order');
assert(galleryJs.includes('GALLERY_PAGE_SIZE'), 'Feature: numbered gallery pagination enabled');
assert(galleryJs.includes('window.scrollTo'), 'Feature: page changes return to gallery top');
// ─────────────────────────────────────────────────────────────────────────────
// UNIT-04  HTML structure checks
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-04  HTML structure');
const galleryHtml = fs.readFileSync(path.join(DOCS, 'gallery.html'), 'utf8');
assert(galleryHtml.includes('data-value="hand-painted"'),   'gallery.html: hand-painted filter button');
assert(galleryHtml.includes('gallery.filter_hand-painted'), 'gallery.html: hand-painted i18n key');
assert(galleryHtml.includes('gallery.filter_gold'),     'gallery.html: gold uses correct i18n key');
assert(!galleryHtml.includes('"gallery.filter_colour">Gold'), 'gallery.html: gold no longer uses wrong key');
assert(galleryHtml.includes('id="gallery-count"'),      'gallery.html: gallery-count element');
assert(galleryHtml.includes('aria-live="polite"'),      'gallery.html: gallery-count has aria-live');
assert(galleryHtml.includes('id="gallery-pagination"'), 'gallery.html: numbered pagination container');
assert(!galleryHtml.includes('id="load-more-btn"'),     'gallery.html: load-more button removed');
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
assert(mainCss.includes('.gallery-page-btn'), 'main.css: pagination button styles present');
assert(mainCss.includes('.lightbox-img-wrap img { object-fit: contain; }'), 'main.css: mobile lightbox preserves full image');
// All HTML pages reference main.css
['index.html','gallery.html','services.html','studio.html','availability.html','about.html','contact.html','aftercare.html'].forEach(page => {
  const html = fs.readFileSync(path.join(DOCS, page), 'utf8');
  assert(html.includes('assets/css/main.css'), `${page}: links main.css`);
  assert(html.includes('assets/js/i18n.js'),   `${page}: loads i18n.js`);
  assert(html.includes('assets/js/main.js'),   `${page}: loads main.js`);
  assert(html.includes('id="nav-placeholder"'), `${page}: has nav-placeholder`);
  assert(html.includes('id="footer-placeholder"'), `${page}: has footer-placeholder`);
  assert(/<title\s+data-i18n="meta\.[^"]+\.title"/.test(html), `${page}: localized document title`);
  assert(/<meta\s+name="description"[^>]+data-i18n-content="meta\.[^"]+\.description"/.test(html), `${page}: localized meta description`);
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
// UNIT-06  Every referenced key exists + JSON-backed bilingual fields are paired
// ─────────────────────────────────────────────────────────────────────────────
startSection('UNIT-06  Translation references + bilingual content');
const sourceFiles = [];
function collectSourceFiles(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full);
    else if (/\.(?:html|js)$/.test(entry.name)) sourceFiles.push(full);
  });
}
collectSourceFiles(DOCS);
const referencedKeys = new Set();
sourceFiles.forEach(file => {
  const source = fs.readFileSync(file, 'utf8');
  [
    /data-i18n(?:-placeholder|-title|-aria-label|-alt|-content)?=["']([^"']+)/g,
    /I18N\.t\(\s*["']([^"']+)/g,
  ].forEach(pattern => {
    let match;
    while ((match = pattern.exec(source))) referencedKeys.add(match[1]);
  });
});
const missingReferencedEn = [...referencedKeys].filter(key => !enKeys.includes(key));
const missingReferencedZh = [...referencedKeys].filter(key => !zhKeys.includes(key));
assert(missingReferencedEn.length === 0, `all referenced keys exist in EN (missing: ${missingReferencedEn.join(', ') || 'none'})`);
assert(missingReferencedZh.length === 0, `all referenced keys exist in ZH (missing: ${missingReferencedZh.join(', ') || 'none'})`);

const bilingualFiles = ['data/gallery.json', 'data/faq.json', 'data/reviews.json', 'data/promotions.json', 'data/aftercare.json', 'data/site.json'];
const bilingualGaps = [];
function findBilingualGaps(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findBilingualGaps(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.keys(value).forEach(key => {
    if (key.endsWith('En')) {
      const zhKey = `${key.slice(0, -2)}Zh`;
      if (!(zhKey in value) || value[zhKey] === '') bilingualGaps.push(`${location}.${key}/${zhKey}`);
    } else if (key.endsWith('Zh')) {
      const enKey = `${key.slice(0, -2)}En`;
      if (!(enKey in value) || value[enKey] === '') bilingualGaps.push(`${location}.${enKey}/${key}`);
    }
  });
  Object.entries(value).forEach(([key, child]) => findBilingualGaps(child, `${location}.${key}`));
}
bilingualFiles.forEach(file => findBilingualGaps(readJSON(file), file));
assert(bilingualGaps.length === 0, `all JSON-backed EN/ZH fields are paired and non-empty (gaps: ${bilingualGaps.join(', ') || 'none'})`);
// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m, ${failed > 0 ? '\x1b[31m' : ''}${failed} failed\x1b[0m`);
if (failed > 0) process.exit(1);
