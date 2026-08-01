/**
 * gallery.js — Static gallery data, filtering, lightbox + swipe
 * Depends on: i18n.js, main.js (escapeHtml / escapeAttr)
 */
'use strict';

const DEFAULT_APPROVED_STYLES = [
  'french', 'cat-eye', 'chrome', 'ombre', 'floral',
  'rhinestone', 'marble', 'hand-painted', 'glitter'
];

let _galleryConfig = null;
let _galleryAll = [];
let _filtered = [];
const GALLERY_PAGE_SIZE = 12;
let _currentPage = 1;
let _activeFilters = {};
let _lbIndex = 0;
let _touchStartX = 0;
let _galleryLoadPromise = null;

/* ─── Config + data loading ───────────────────────────────── */
function _defaultConfig() {
  return {
    approvedStyles: DEFAULT_APPROVED_STYLES,
    localeFields: { en: 'altEn', zh: 'altZh' },
    filterAliases: { service: { manicure: ['manicure', 'extensions'] } },
    defaults: { finish: 'gel', featured: false, style: [], colour: [], season: [] },
    sources: [{
      id: 'local-json',
      enabled: true,
      url: 'data/gallery.json',
      itemsPath: 'items',
      assetBaseUrl: '',
      credentials: 'same-origin',
      timeoutMs: 8000,
      headers: {},
      fieldMap: {}
    }]
  };
}

async function _loadConfig() {
  if (_galleryConfig) return _galleryConfig;
  _galleryConfig = _defaultConfig();
  return _galleryConfig;
}

function _getByPath(value, path) {
  if (!path) return value;
  return String(path).split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, value);
}

function _toStringArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(v => String(v).trim()).filter(Boolean))];
  }
  if (typeof value === 'string' && value.trim()) {
    return [...new Set(value.split(',').map(v => v.trim()).filter(Boolean))];
  }
  return [];
}

function _toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function _resolveAssetUrl(path, baseUrl) {
  if (!path) return '';
  const value = String(path);
  if (/^(?:https?:|data:|blob:)/i.test(value) || value.startsWith('/')) return value;
  if (!baseUrl) return value;
  return `${String(baseUrl).replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}

function _normalizeItem(raw, source, config, index) {
  const map = source.fieldMap || {};
  const read = key => {
    const mappedPath = map[key];
    const mappedValue = mappedPath ? _getByPath(raw, mappedPath) : undefined;
    return mappedValue !== undefined ? mappedValue : raw[key];
  };
  const defaults = config.defaults || {};
  const approved = new Set(config.approvedStyles || DEFAULT_APPROVED_STYLES);
  const style = _toStringArray(read('style')).filter(tag => approved.has(tag));
  const id = String(read('id') || `${source.id || 'gallery'}-${index + 1}`);

  return {
    id,
    src: _resolveAssetUrl(read('src'), source.assetBaseUrl),
    thumb: _resolveAssetUrl(read('thumb') || read('src'), source.assetBaseUrl),
    altEn: String(read('altEn') || _getByPath(raw, 'translations.en.alt') || ''),
    altZh: String(read('altZh') || _getByPath(raw, 'translations.zh.alt') || read('altEn') || ''),
    style,
    colour: _toStringArray(read('colour') ?? defaults.colour),
    shape: String(read('shape') || ''),
    length: String(read('length') || ''),
    finish: String(read('finish') || defaults.finish || ''),
    service: String(read('service') || ''),
    featured: _toBoolean(read('featured'), Boolean(defaults.featured)),
    featuredOrder: Number(read('featured-order')) || Number.POSITIVE_INFINITY,
    date: String(read('date') || ''),
    season: _toStringArray(read('season') ?? defaults.season),
    mockColor: String(read('mockColor') || ''),
    sourceId: source.id || ''
  };
}

async function _fetchJsonSource(source) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    Number(source.timeoutMs) || 8000
  );
  try {
    const response = await fetch(source.url, {
      method: 'GET',
      credentials: source.credentials || 'same-origin',
      headers: source.headers || {},
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${source.id || source.url}: HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function _loadGalleryData() {
  if (_galleryLoadPromise) return _galleryLoadPromise;
  _galleryLoadPromise = (async () => {
    const config = await _loadConfig();
    const enabledSources = (config.sources || []).filter(source => source.enabled !== false && source.url);
    let lastError = null;

    for (const source of enabledSources) {
      try {
        const payload = await _fetchJsonSource(source);
        const rawItems = Array.isArray(payload)
          ? payload
          : _getByPath(payload, source.itemsPath || 'items');
        if (!Array.isArray(rawItems)) {
          throw new Error(`${source.id || source.url}: items path is not an array`);
        }
        return rawItems.map((item, index) => _normalizeItem(item, source, config, index));
      } catch (error) {
        lastError = error;
        console.warn('[gallery] Data source failed; trying the next source:', error);
      }
    }
    throw lastError || new Error('No enabled gallery data source');
  })();

  try {
    return await _galleryLoadPromise;
  } catch (error) {
    _galleryLoadPromise = null;
    throw error;
  }
}

async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
    <div class="loading-spinner"></div>
    <p data-i18n="common.loading">Loading…</p>
  </div>`;

  try {
    _galleryAll = await _loadGalleryData();
  } catch (error) {
    console.error('[gallery] Unable to load gallery:', error);
    grid.innerHTML = `<div class="error-state" style="grid-column:1/-1">
      <p data-i18n="common.error">Content could not be loaded.</p>
    </div>`;
    return;
  }

  _filtered = _sortDefault([..._galleryAll]);
  _renderGrid();
  _initFilters();
}

/* ─── Featured strip (home page) ──────────────────────────── */
async function loadFeaturedStrip(targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  try {
    const items = await _loadGalleryData();
    const featured = items
      .filter(item => item.featured)
      .sort((a, b) => a.featuredOrder - b.featuredOrder)
      .slice(0, 4);
    wrap.innerHTML = featured.map(item => _buildCard(item)).join('');
    wrap.querySelectorAll('.gallery-item').forEach(card => {
      card.addEventListener('click', () => { window.location.href = 'gallery.html'; });
    });
  } catch (error) {
    console.warn('[gallery] Featured strip unavailable:', error);
    wrap.innerHTML = '';
  }
}

/* ─── Rendering ───────────────────────────────────────────── */
function _itemAlt(item) {
  const lang = I18N.getLang();
  const field = (_galleryConfig?.localeFields || {})[lang] || (lang === 'zh' ? 'altZh' : 'altEn');
  return item[field] || item.altEn || item.altZh || '';
}

function _formatCount(showing, total) {
  const lang = I18N.getLang();
  const fallback = lang === 'zh'
    ? '显示 {showing} / {total} 个作品'
    : 'Showing {showing} of {total} designs';
  return I18N.t('gallery.showing_count', fallback)
    .replace('{showing}', String(showing))
    .replace('{total}', String(total));
}

function _imageFilename(item) {
  return String(item.src || '').split('/').pop() || '';
}

function _sortDefault(items) {
  return items.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.featured && b.featured) return a.featuredOrder - b.featuredOrder;
    return _imageFilename(b).localeCompare(_imageFilename(a), undefined, { numeric: true });
  });
}

function _renderPagination(totalPages) {
  const pagination = document.getElementById('gallery-pagination');
  if (!pagination) return;
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  const fallback = I18N.getLang() === 'zh' ? '第 {page} 页' : 'Page {page}';
  pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const label = I18N.t('gallery.page_label', fallback).replace('{page}', String(page));
    return `<button class="gallery-page-btn${page === _currentPage ? ' active' : ''}"
      type="button" data-page="${page}" aria-label="${escapeAttr(label)}"
      ${page === _currentPage ? 'aria-current="page"' : ''}>${page}</button>`;
  }).join('');
  pagination.querySelectorAll('.gallery-page-btn').forEach(button => {
    button.addEventListener('click', () => {
      _currentPage = Number(button.dataset.page);
      _renderGrid();
      const grid = document.getElementById('gallery-grid');
      if (grid) {
        const top = grid.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

function _renderGrid() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const totalPages = Math.max(1, Math.ceil(_filtered.length / GALLERY_PAGE_SIZE));
  if (_currentPage > totalPages) _currentPage = totalPages;
  const startIndex = (_currentPage - 1) * GALLERY_PAGE_SIZE;
  const visible = _filtered.slice(startIndex, startIndex + GALLERY_PAGE_SIZE);

  if (visible.length === 0) {
    const msg = I18N.t('gallery.no_results', 'No designs found for this filter.');
    const countEl = document.getElementById('gallery-count');
    if (countEl) countEl.textContent = '';
    _renderPagination(0);
    grid.innerHTML = `<div class="gallery-empty" style="grid-column:1/-1">
      <div class="gallery-empty-icon">🔍</div>
      <p>${escapeHtml(msg)}</p>
    </div>`;
    return;
  }

  grid.innerHTML = visible.map(item => _buildCard(item)).join('');
  const countEl = document.getElementById('gallery-count');
  if (countEl) countEl.textContent = _formatCount(visible.length, _filtered.length);

  grid.querySelectorAll('.gallery-item').forEach((card, index) => {
    card.addEventListener('click', () => openLightbox(startIndex + index));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(startIndex + index);
      }
    });
  });

  _renderPagination(totalPages);
}

function _buildCard(item) {
  const alt = _itemAlt(item);
  const featuredLabel = I18N.t('common.featured', 'Featured');
  const badge = item.featured
    ? `<span class="badge-featured">${escapeHtml(featuredLabel)}</span>`
    : '';

  if (item.mockColor || !item.src) {
    const color = item.mockColor || 'pink';
    return `<div class="gallery-item mock-${escapeAttr(color)}"
         role="button" tabindex="0" aria-label="${escapeAttr(alt)}">
      ${badge}<span class="mock-label">${escapeHtml(alt)}</span>
    </div>`;
  }

  return `<div class="gallery-item" role="button" tabindex="0"
       aria-label="${escapeAttr(alt)}" data-gallery-id="${escapeAttr(item.id)}">
    ${badge}
    <img src="${escapeAttr(item.thumb || item.src)}"
         alt="${escapeAttr(alt)}" loading="lazy" decoding="async"
         onerror="this.closest('.gallery-item').classList.add('mock-pink');this.remove()">
  </div>`;
}

/* ─── Filters ─────────────────────────────────────────────── */
function _initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-group');
      const value = btn.getAttribute('data-value');
      if (value === 'all') {
        _activeFilters = {};
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        document.querySelector('.filter-btn[data-value="all"]')?.classList.remove('active');
        if (_activeFilters[group] === value) {
          delete _activeFilters[group];
          btn.classList.remove('active');
        } else {
          document.querySelectorAll(`.filter-btn[data-group="${CSS.escape(group)}"]`)
            .forEach(b => b.classList.remove('active'));
          _activeFilters[group] = value;
          btn.classList.add('active');
        }
        if (Object.keys(_activeFilters).length === 0) {
          document.querySelector('.filter-btn[data-value="all"]')?.classList.add('active');
        }
      }
      _applyFilters();
    });
  });
  document.querySelector('.filter-btn[data-value="all"]')?.classList.add('active');
}

function _matchesScalarFilter(item, group, value) {
  const aliases = _galleryConfig?.filterAliases?.[group]?.[value];
  if (Array.isArray(aliases) && aliases.length) return aliases.includes(item[group]);
  return item[group] === value;
}

function _applyFilters() {
  _currentPage = 1;
  _filtered = _galleryAll.filter(item => {
    for (const [group, value] of Object.entries(_activeFilters)) {
      switch (group) {
        case 'service':
        case 'shape':
        case 'length':
        case 'finish':
          if (!_matchesScalarFilter(item, group, value)) return false;
          break;
        case 'style':
          if (!item.style.includes(value)) return false;
          break;
        case 'colour':
          if (!item.colour.includes(value)) return false;
          break;
        case 'special':
          if (value === 'featured' && !item.featured) return false;
          break;
      }
    }
    return true;
  });

  if (_activeFilters.special === 'newest') {
    _filtered.sort((a, b) => b.date.localeCompare(a.date));
  } else {
    _sortDefault(_filtered);
  }
  _renderGrid();
}

/* ─── Lightbox ────────────────────────────────────────────── */
function openLightbox(index) {
  _lbIndex = index;
  const lb = document.getElementById('lightbox');
  if (!lb || !_filtered.length) return;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  _renderLightboxItem();
  lb.focus();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  document.body.style.overflow = '';
}

function _renderLightboxItem() {
  const item = _filtered[_lbIndex];
  const wrap = document.getElementById('lightbox-img-wrap');
  if (!item || !wrap) return;
  const alt = _itemAlt(item);

  if (item.mockColor || !item.src) {
    const color = item.mockColor || 'pink';
    wrap.innerHTML = `<div class="mock-${escapeAttr(color)}" style="width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;font-size:14px;
      color:rgba(0,0,0,.35);padding:16px;text-align:center;">${escapeHtml(alt)}</div>`;
  } else {
    wrap.innerHTML = `<img src="${escapeAttr(item.src)}" alt="${escapeAttr(alt)}"
      loading="eager" decoding="async"
      onerror="this.closest('#lightbox-img-wrap').classList.add('mock-pink')">`;
  }
}

function _moveLightbox(delta) {
  if (!_filtered.length) return;
  _lbIndex = (_lbIndex + delta + _filtered.length) % _filtered.length;
  _renderLightboxItem();
}

function _initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', () => _moveLightbox(-1));
  document.getElementById('lightbox-next')?.addEventListener('click', () => _moveLightbox(1));
  lb.addEventListener('click', event => { if (event.target === lb) closeLightbox(); });
  document.addEventListener('keydown', event => {
    if (!lb.classList.contains('open')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); }
    if (event.key === 'ArrowLeft') _moveLightbox(-1);
    if (event.key === 'ArrowRight') _moveLightbox(1);
  });
  lb.addEventListener('touchstart', event => {
    _touchStartX = event.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', event => {
    const dx = event.changedTouches[0].clientX - _touchStartX;
    if (Math.abs(dx) >= 50) _moveLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ─── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gallery-grid')) {
    loadGallery();
    _initLightbox();
  }
  if (document.getElementById('featured-strip')) loadFeaturedStrip('featured-strip');
  document.addEventListener('langchange', () => {
    if (_galleryAll.length > 0) _renderGrid();
  });
});
