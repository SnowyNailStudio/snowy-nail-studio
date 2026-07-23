/**
 * gallery.js — Gallery grid, filtering, lightbox + swipe
 * Depends on: i18n.js, main.js (escapeHtml / escapeAttr)
 */
'use strict';
let _galleryAll    = [];   // all items from gallery.json
let _filtered      = [];   // after filter applied
let _displayCount  = 12;   // how many are currently shown
let _activeFilters = {};   // { group: value }
let _lbIndex       = 0;    // current lightbox item index
let _touchStartX   = 0;
/* ─── Data loading ─────────────────────────────────────────── */
async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
    <div class="loading-spinner"></div>
    <p data-i18n="common.loading">Loading…</p>
  </div>`;
  try {
    const res = await fetch('data/gallery.json');
    if (!res.ok) throw new Error('gallery.json not found');
    const data = await res.json();
    _galleryAll = data.items || [];
  } catch (err) {
    grid.innerHTML = `<div class="error-state" style="grid-column:1/-1">
      <p data-i18n="common.error">Content could not be loaded.</p>
    </div>`;
    return;
  }
  _filtered = [..._galleryAll];
  _renderGrid();
  _initFilters();
}
/* ─── Featured strip (home page) ──────────────────────────── */
async function loadFeaturedStrip(targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  try {
    const res = await fetch('data/gallery.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const featured = (data.items || []).filter(i => i.featured).slice(0, 4);
    wrap.innerHTML = featured.map((item, i) => _buildCard(item, i, featured)).join('');
    wrap.querySelectorAll('.gallery-item').forEach((card, i) => {
      card.addEventListener('click', () => window.location.href = 'gallery.html');
    });
  } catch {
    wrap.innerHTML = '';
  }
}
/* ─── Rendering ────────────────────────────────────────────── */
function _renderGrid() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const visible = _filtered.slice(0, _displayCount);
  if (visible.length === 0) {
    const msg = I18N.t('gallery.no_results', 'No designs found for this filter.');
    const countEl = document.getElementById('gallery-count');
    if (countEl) countEl.textContent = '';
    grid.innerHTML = `<div class="gallery-empty" style="grid-column:1/-1">
      <div class="gallery-empty-icon">🔍</div>
      <p>${escapeHtml(msg)}</p>
    </div>`;
    return;
  }
  grid.innerHTML = visible.map((item, i) => _buildCard(item, i, visible)).join('');
  // Update count line
  const countEl = document.getElementById('gallery-count');
  if (countEl) {
    const lang    = I18N.getLang();
    const showing = visible.length;
    const total   = _filtered.length;
    countEl.textContent = lang === 'zh'
      ? `显示 ${showing} / ${total} 个作品`
      : `Showing ${showing} of ${total} designs`;
  }
  // Attach click → lightbox
  grid.querySelectorAll('.gallery-item').forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(i));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });
  // Load more button visibility
  const btn = document.getElementById('load-more-btn');
  if (btn) btn.style.display = _filtered.length > _displayCount ? 'inline-flex' : 'none';
}
function _buildCard(item, idx, list) {
  const lang = I18N.getLang();
  const alt  = lang === 'zh' ? (item.altZh || item.altEn || '') : (item.altEn || '');
  const featuredLabel = I18N.t('common.featured', 'Featured');
  const badge = item.featured
    ? `<span class="badge-featured">${escapeHtml(featuredLabel)}</span>`
    : '';
  if (item.mockColor || !item.src) {
    const color = item.mockColor || 'pink';
    return `<div class="gallery-item mock-${color}"
         role="button" tabindex="0"
         aria-label="${escapeAttr(alt)}">
      ${badge}
      <span class="mock-label">${escapeHtml(alt)}</span>
    </div>`;
  }
  return `<div class="gallery-item"
       role="button" tabindex="0"
       aria-label="${escapeAttr(alt)}">
    ${badge}
    <img src="${escapeAttr(item.thumb || item.src)}"
         alt="${escapeAttr(alt)}"
         loading="lazy"
         onerror="this.closest('.gallery-item').classList.add('mock-pink');this.remove()">
  </div>`;
}
/* ─── Filters ──────────────────────────────────────────────── */
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
        // Remove "all" active state
        const allBtn = document.querySelector('.filter-btn[data-value="all"]');
        if (allBtn) allBtn.classList.remove('active');
        if (_activeFilters[group] === value) {
          // Toggle off
          delete _activeFilters[group];
          btn.classList.remove('active');
        } else {
          // Deactivate others in same group
          document.querySelectorAll(`.filter-btn[data-group="${CSS.escape(group)}"]`)
            .forEach(b => b.classList.remove('active'));
          _activeFilters[group] = value;
          btn.classList.add('active');
        }
        // If no filters remain, re-activate "all"
        if (Object.keys(_activeFilters).length === 0) {
          const allBtn2 = document.querySelector('.filter-btn[data-value="all"]');
          if (allBtn2) allBtn2.classList.add('active');
        }
      }
      _applyFilters();
    });
  });
  // Default: "All" active
  const allBtn = document.querySelector('.filter-btn[data-value="all"]');
  if (allBtn) allBtn.classList.add('active');
}
function _applyFilters() {
  _displayCount = 12;
  _filtered = _galleryAll.filter(item => {
    for (const [group, value] of Object.entries(_activeFilters)) {
      switch (group) {
        case 'service':
          if (item.service !== value) return false;
          break;
        case 'style':
          if (!item.style || !item.style.includes(value)) return false;
          break;
        case 'colour':
          if (!item.colour || !item.colour.includes(value)) return false;
          break;
        case 'shape':
          if (item.shape !== value) return false;
          break;
        case 'length':
          if (item.length !== value) return false;
          break;
        case 'finish':
          if (item.finish !== value) return false;
          break;
        case 'special':
          if (value === 'featured' && !item.featured) return false;
          break;
      }
    }
    return true;
  });
  // Sort newest first if that special filter is active
  if (_activeFilters['special'] === 'newest') {
    _filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  _renderGrid();
}
/* ─── Lightbox ─────────────────────────────────────────────── */
function openLightbox(index) {
  _lbIndex = index;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
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
  if (!item) return;
  const wrap = document.getElementById('lightbox-img-wrap');
  if (!wrap) return;
  const lang = I18N.getLang();
  const alt  = lang === 'zh' ? (item.altZh || item.altEn || '') : (item.altEn || '');
  if (item.mockColor || !item.src) {
    const color = item.mockColor || 'pink';
    wrap.innerHTML = `<div class="mock-${color}" style="width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;color:rgba(0,0,0,.35);padding:16px;text-align:center;">
      ${escapeHtml(alt)}
    </div>`;
  } else {
    wrap.innerHTML = `<img src="${escapeAttr(item.src)}"
      alt="${escapeAttr(alt)}" loading="lazy"
      onerror="this.closest('#lightbox-img-wrap').classList.add('mock-pink')">`;
  }
}
function _initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  document.getElementById('lightbox-close')
    ?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')
    ?.addEventListener('click', () => {
      _lbIndex = (_lbIndex - 1 + _filtered.length) % _filtered.length;
      _renderLightboxItem();
    });
  document.getElementById('lightbox-next')
    ?.addEventListener('click', () => {
      _lbIndex = (_lbIndex + 1) % _filtered.length;
      _renderLightboxItem();
    });
  // Close on backdrop click
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  // Keyboard
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
    if (e.key === 'ArrowLeft')  { _lbIndex = (_lbIndex - 1 + _filtered.length) % _filtered.length; _renderLightboxItem(); }
    if (e.key === 'ArrowRight') { _lbIndex = (_lbIndex + 1) % _filtered.length; _renderLightboxItem(); }
  });
  // Swipe
  lb.addEventListener('touchstart', e => { _touchStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) { _lbIndex = (_lbIndex + 1) % _filtered.length; }
    else        { _lbIndex = (_lbIndex - 1 + _filtered.length) % _filtered.length; }
    _renderLightboxItem();
  }, { passive: true });
}
function _initLoadMore() {
  const btn = document.getElementById('load-more-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    _displayCount += 12;
    _renderGrid();
    btn.blur();
  });
}
/* ─── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Full gallery page
  if (document.getElementById('gallery-grid')) {
    loadGallery();
    _initLightbox();
    _initLoadMore();
  }
  // Featured strip on home page
  if (document.getElementById('featured-strip')) {
    loadFeaturedStrip('featured-strip');
  }
  // Re-render alt text on language change
  document.addEventListener('langchange', () => {
    if (_galleryAll.length > 0) _renderGrid();
  });
});
