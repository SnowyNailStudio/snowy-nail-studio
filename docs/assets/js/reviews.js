/**
 * reviews.js — Review card rendering (text + image/XHS screenshot)
 * Depends on: i18n.js, main.js (escapeHtml / escapeAttr)
 */
'use strict';
let _reviewsData = [];

function _compareReviewsById(a, b) {
  const getNumericId = (review) => {
    const match = String(review?.id || '').match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  };
  return getNumericId(a) - getNumericId(b);
}

/* ─── Load ─────────────────────────────────────────────────── */
async function loadReviews(targetId, featuredOnly) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
    <div class="loading-spinner"></div>
  </div>`;
  try {
    const res = await fetch('data/reviews.json');
    if (!res.ok) throw new Error('reviews.json not found');
    const data = await res.json();
    _reviewsData = data.items || [];
  } catch {
    container.innerHTML = `<div class="error-state" style="grid-column:1/-1">
      <p data-i18n="common.error">Content could not be loaded.</p>
    </div>`;
    return;
  }
  const items = (featuredOnly
    ? _reviewsData.filter(r => r.featured)
    : _reviewsData)
    .slice()
    .sort(_compareReviewsById);
  _renderReviews(container, items);
}
/* ─── Render ───────────────────────────────────────────────── */
function _renderReviews(container, items) {
  if (!items.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--clr-text-muted);padding:2rem;">No reviews yet.</p>';
    return;
  }
  container.innerHTML = items.map(_buildReviewCard).join('');
}
function _buildReviewCard(review) {
  return review.type === 'image'
    ? _buildImageCard(review)
    : _buildTextCard(review);
}
/* ── Text review ── */
function _buildTextCard(review) {
  const lang   = I18N.getLang();
  const quote  = lang === 'zh'
    ? (review.quoteZh || review.quoteEn || '')
    : (review.quoteEn || review.quoteZh || '');
  const stars  = '★'.repeat(Math.min(5, Math.max(1, review.rating || 5)));
  const initial = (review.displayName || 'C')[0].toUpperCase();
  const source  = review.source || '小红书';
  return `<div class="review-card review-card--text">
    <div class="review-stars" aria-label="${review.rating || 5} stars">${escapeHtml(stars)}</div>
    <p class="review-quote">${escapeHtml(quote)}</p>
    <div class="review-meta">
      <div class="review-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
      <div>
        <div class="review-name">${escapeHtml(review.displayName || 'Client')}</div>
        <div class="review-source">${escapeHtml(source)}</div>
      </div>
    </div>
  </div>`;
}
/* ── Image/screenshot review ── */
function _buildImageCard(review) {
  const lang   = I18N.getLang();
  const quoteZh = review.quoteZh || '';
  const quoteEn = review.quoteEn || '';
  const orientation = review.orientation === 'portrait' ? 'portrait' : 'landscape';
  const tlabel  = lang === 'zh'
    ? I18N.t('about.screenshot_translation_label', '翻译：')
    : 'Translation:';
  const initial = (review.displayName || 'C')[0].toUpperCase();
  const source  = review.source || '小红书';
  const screenshotHTML = review.image
    ? `<img src="${escapeAttr(review.image)}" alt="Customer review screenshot" loading="lazy"
           data-fallback-quote="${escapeAttr(quoteZh)}"
           onerror="window.snowyReviewFallback(this)">`
    : _buildMockXHS(quoteZh);
  const zhBlock = quoteZh
    ? `<p class="review-original-zh">"${escapeHtml(quoteZh)}"</p>` : '';
  return `<div class="review-card review-card--image review-card--image-${orientation}">
    <div class="review-screenshot">${screenshotHTML}</div>
    <div class="review-translation">
      ${zhBlock}
      <div class="review-translation-label">${escapeHtml(tlabel)}</div>
      <p class="review-translation-en">"${escapeHtml(quoteEn)}"</p>
      <div class="review-meta" style="margin-top:12px">
        <div class="review-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
        <div>
          <div class="review-name">${escapeHtml(review.displayName || 'Client')}</div>
          <div class="review-source">${escapeHtml(source)}</div>
        </div>
      </div>
    </div>
  </div>`;
}
/* ── Mock XHS conversation ── */
function _buildMockXHS(quoteZh) {
  const msg1 = escapeHtml(quoteZh || '太好看了！做得超级细致，环境也很舒适！');
  const msg2 = escapeHtml('谢谢你的支持！❤️');
  const msg3 = escapeHtml('工作室环境很干净，下次还来！');
  return `<div class="xhs-mock">
    <div class="xhs-header">
      <span>小红书私信</span>
      <div class="xhs-header-dot"></div>
    </div>
    <div class="xhs-msg">
      <div class="xhs-ava"></div>
      <div class="xhs-bubble">${msg1}</div>
    </div>
    <div class="xhs-msg xhs-msg-r">
      <div class="xhs-bubble">${msg2}</div>
      <div class="xhs-ava xhs-ava-r"></div>
    </div>
    <div class="xhs-msg">
      <div class="xhs-ava"></div>
      <div class="xhs-bubble">${msg3}</div>
    </div>
  </div>`;
}
/* ─── Image review fallback (global so inline onerror can reach it) ─── */
window.snowyReviewFallback = function (img) {
  const quote = img.getAttribute('data-fallback-quote') || '';
  const mock  = document.createElement('div');
  mock.innerHTML = _buildMockXHS(quote);
  if (mock.firstElementChild) img.replaceWith(mock.firstElementChild);
};
/* ─── Services / promotions loader ────────────────────────── */
async function loadServices(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  try {
    const res = await fetch('data/promotions.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const lang = I18N.getLang();
    const services = data.services || [];
    grid.innerHTML = services.map(svc => {
      const name = lang === 'zh' ? (svc.nameZh || svc.nameEn) : (svc.nameEn || '');
      const desc = lang === 'zh' ? (svc.descZh || svc.descEn) : (svc.descEn || '');
      return `<div class="service-card">
        <div class="service-icon">${escapeHtml(svc.icon || '💅')}</div>
        <h3 class="service-name">${escapeHtml(name)}</h3>
        <p class="service-desc">${escapeHtml(desc)}</p>
      </div>`;
    }).join('');
  } catch {
    if (grid) grid.innerHTML = '';
  }
}
async function loadPromotions(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  try {
    const res = await fetch('data/promotions.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const lang   = I18N.getLang();
    const promos = (data.active || []).filter(p => p.active);
    if (!promos.length) {
      const msg = I18N.t('services.no_promos', 'No active promotions at this time.');
      wrap.innerHTML = `<p style="color:var(--clr-text-muted);font-size:15px;">${escapeHtml(msg)}</p>`;
      return;
    }
    wrap.innerHTML = promos.map(promo => {
      const title = lang === 'zh' ? (promo.titleZh || promo.titleEn) : (promo.titleEn || '');
      const desc  = lang === 'zh' ? (promo.descriptionZh || promo.descriptionEn) : (promo.descriptionEn || '');
      const lblEn = I18N.t('services.view_en', 'English');
      const lblZh = I18N.t('services.view_zh', '中文');
      const enPanelId = `pp-en-${promo.id}`;
      const zhPanelId = `pp-zh-${promo.id}`;
      const enImg = promo.imageEn
        ? `<img src="${escapeAttr(promo.imageEn)}" alt="${escapeAttr(title)} - English" loading="lazy"
               onerror="this.closest('.promo-poster-img').innerHTML='<div class=\\'promo-poster-mock\\'>${escapeAttr(I18N.t('common.mock_note'))}</div>'">`
        : `<div class="promo-poster-mock">${escapeHtml(I18N.t('common.mock_note', 'Replace with real image'))}</div>`;
      const zhImg = promo.imageZh
        ? `<img src="${escapeAttr(promo.imageZh)}" alt="${escapeAttr(title)} - 中文" loading="lazy"
               onerror="this.closest('.promo-poster-img').innerHTML='<div class=\\'promo-poster-mock\\'>${escapeAttr(I18N.t('common.mock_note'))}</div>'">`
        : `<div class="promo-poster-mock">${escapeHtml(I18N.t('common.mock_note', 'Replace with real image'))}</div>`;
      const validUntil = promo.validUntil
        ? (lang === 'zh' ? `有效期至：${promo.validUntil}` : `Valid until: ${promo.validUntil}`)
        : '';
      return `<div class="promo-card">
        <h3 class="promo-card-title">${escapeHtml(title)}</h3>
        <p class="promo-card-desc">${escapeHtml(desc)}</p>
        <div class="promo-lang-toggle">
          <button class="promo-lang-btn active" data-lang="en"
                  onclick="handlePromoLang(this,'en')">${escapeHtml(lblEn)}</button>
          <button class="promo-lang-btn" data-lang="zh"
                  onclick="handlePromoLang(this,'zh')">${escapeHtml(lblZh)}</button>
        </div>
        <div class="promo-poster-img" data-promo-panel="en" id="${escapeAttr(enPanelId)}">${enImg}</div>
        <div class="promo-poster-img" data-promo-panel="zh" id="${escapeAttr(zhPanelId)}" style="display:none;">${zhImg}</div>
        ${validUntil ? `<p class="promo-valid">${escapeHtml(validUntil)}</p>` : ''}
      </div>`;
    }).join('');
  } catch {
    wrap.innerHTML = '';
  }
}
function handlePromoLang(btn, lang) {
  const card = btn.closest('.promo-card');
  if (!card) return;
  card.querySelectorAll('.promo-lang-btn').forEach(b => b.classList.remove('active'));
  card.querySelectorAll('[data-promo-panel]').forEach(p => {
    p.style.display = p.getAttribute('data-promo-panel') === lang ? '' : 'none';
  });
  btn.classList.add('active');
}
/* ─── FAQ loader ───────────────────────────────────────────── */
async function loadFAQ(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = `<div class="loading-state">
    <div class="loading-spinner"></div>
    <p data-i18n="contact.faq_loading">Loading FAQ…</p>
  </div>`;
  try {
    const res = await fetch('data/faq.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    _renderFAQ(wrap, data.categories || []);
  } catch {
    wrap.innerHTML = `<div class="error-state"><p data-i18n="common.error">Content could not be loaded.</p></div>`;
  }
}
function _renderFAQ(wrap, categories) {
  const lang = I18N.getLang();
  if (!categories.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = categories.map(cat => {
    const title = lang === 'zh' ? (cat.titleZh || cat.titleEn) : (cat.titleEn || '');
    const items = (cat.items || []).map(item => {
      const q = lang === 'zh' ? (item.questionZh || item.questionEn) : (item.questionEn || '');
      const a = lang === 'zh' ? (item.answerZh   || item.answerEn)   : (item.answerEn   || '');
      return `<div class="faq-item" id="${escapeAttr(item.id)}">
        <button class="faq-question" aria-expanded="false">
          <span>${escapeHtml(q)}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        </button>
        <div class="faq-answer" role="region">
          <div class="faq-answer-inner">${escapeHtml(a)}</div>
        </div>
      </div>`;
    }).join('');
    return `<div class="faq-category">
      <h3 class="faq-category-title">${escapeHtml(title)}</h3>
      <div class="faq-list">${items}</div>
    </div>`;
  }).join('');
  // Re-init accordion (main.js function)
  if (typeof initFAQAccordion === 'function') initFAQAccordion();
}
/* ─── Site contacts loader ────────────────────────────────── */
async function loadSiteContacts(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  try {
    const res = await fetch('data/site.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const lang     = I18N.getLang();
    const contacts = (data.contacts || []).filter(c => c.enabled !== false);
    if (!contacts.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = contacts.map(c => {
      const label = lang === 'zh' ? (c.labelZh || c.labelEn) : (c.labelEn || '');
      const value = lang === 'zh' ? (c.valueZh || c.valueEn) : (c.valueEn || '');
      const icon  = escapeHtml(c.icon || '');
      if (c.url) {
        return `<a href="${escapeAttr(c.url)}" class="contact-method" aria-label="${escapeAttr(label)}">
          <div class="contact-icon" aria-hidden="true">${icon}</div>
          <div class="contact-info">
            <span class="contact-label">${escapeHtml(label)}</span>
            <span class="contact-value">${escapeHtml(value)}</span>
          </div>
        </a>`;
      }
      return `<div class="contact-method" style="cursor:default;">
        <div class="contact-icon" aria-hidden="true">${icon}</div>
        <div class="contact-info">
          <span class="contact-label">${escapeHtml(label)}</span>
          <span class="contact-value" style="font-size:13px;color:var(--clr-text-muted);">${escapeHtml(value)}</span>
        </div>
      </div>`;
    }).join('');
  } catch {
    wrap.innerHTML = '';
  }
}
/* ─── Business hours summary ───────────────────────────────── */
async function loadBusinessHours(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  try {
    const res = await fetch('data/site.json');
    if (!res.ok) throw new Error('site.json not found');
    const data = await res.json();
    const hours = (data.business && data.business.hours) || { openHour: '09:00', closeHour: '22:00', days: {} };
    const days = hours.days || {};
    const lang = I18N.getLang();
    const sameAll = ['mon','tue','wed','thu','fri','sat','sun'].every(d => days[d] && days[d].open === hours.openHour && days[d].close === hours.closeHour);
    function fmt(hm) {
      const [h, m] = (hm || '').split(':').map(Number);
      if (isNaN(h)) return hm;
      if (lang === 'zh') return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const am = h < 12;
      const h12 = ((h + 11) % 12) + 1;
      return `${h12}${m ? ':' + String(m).padStart(2,'0') : ''} ${am ? 'AM' : 'PM'}`;
    }
    if (sameAll) {
      const rangeLabel = lang === 'zh' ? '周一–周日' : 'Mon–Sun';
      wrap.innerHTML = `<div class="business-hours">
        <h4>${escapeHtml(I18N.t('contact.hours_heading', 'Business Hours'))}</h4>
        <div class="business-hours-line">${escapeHtml(rangeLabel)}: ${escapeHtml(fmt(hours.openHour))} – ${escapeHtml(fmt(hours.closeHour))}</div>
      </div>`;
      return;
    }
    // Fallback: render each day
    const dayNamesEn = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
    const dayNamesZh = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六', sun: '周日' };
    const names = lang === 'zh' ? dayNamesZh : dayNamesEn;
    const lines = [];
    ['mon','tue','wed','thu','fri','sat','sun'].forEach(d => {
      const dd = days[d];
      if (dd && dd.open && dd.close) {
        lines.push(`<div class="business-hours-line">${escapeHtml(names[d])}: ${escapeHtml(fmt(dd.open))} – ${escapeHtml(fmt(dd.close))}</div>`);
      }
    });
    wrap.innerHTML = `<div class="business-hours"><h4>${escapeHtml(I18N.t('contact.hours_heading', 'Business Hours'))}</h4>${lines.join('\n')}</div>`;
  } catch (e) {
    wrap.innerHTML = '';
  }
}
/* ─── Aftercare loader ─────────────────────────────────────── */
async function loadAftercare(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = `<div class="loading-state">
    <div class="loading-spinner"></div>
    <p data-i18n="aftercare.loading">Loading aftercare guide…</p>
  </div>`;
  try {
    const res = await fetch('data/aftercare.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    _renderAftercare(wrap, data.sections || []);
  } catch {
    wrap.innerHTML = `<div class="error-state"><p data-i18n="common.error">Content could not be loaded.</p></div>`;
  }
}
function _renderAftercare(wrap, sections) {
  const lang = I18N.getLang();
  if (!sections.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="aftercare-sections">
    ${sections.map(sec => {
      const title = lang === 'zh' ? (sec.titleZh || sec.titleEn) : (sec.titleEn || '');
      const items = (sec.items || []).map(item => {
        const text = lang === 'zh' ? (item.textZh || item.textEn) : (item.textEn || '');
        return `<div class="aftercare-item">
          <span class="aftercare-dot" aria-hidden="true">✦</span>
          <span>${escapeHtml(text)}</span>
        </div>`;
      }).join('');
      return `<div class="aftercare-card reveal">
        <div class="aftercare-card-header">
          <div class="aftercare-card-icon" aria-hidden="true">${escapeHtml(sec.icon || '💅')}</div>
          <h3 class="aftercare-card-title">${escapeHtml(title)}</h3>
        </div>
        <div class="aftercare-items">${items}</div>
      </div>`;
    }).join('')}
  </div>`;
  // Trigger scroll reveal for newly injected elements
  if (typeof initScrollReveal === 'function') initScrollReveal();
}
/* ─── Re-render on language change ────────────────────────── */
document.addEventListener('langchange', () => {
  if (document.getElementById('faq-container'))
    loadFAQ('faq-container');
  if (document.getElementById('aftercare-container'))
    loadAftercare('aftercare-container');
  if (document.getElementById('services-grid'))
    loadServices('services-grid');
  if (document.getElementById('promos-container'))
    loadPromotions('promos-container');
  if (document.getElementById('home-promos-container'))
    loadPromotions('home-promos-container');
  if (document.getElementById('contact-methods-container'))
    loadSiteContacts('contact-methods-container');
  if (document.getElementById('business-hours-container'))
    loadBusinessHours('business-hours-container');
  if (document.getElementById('availability-preview') || document.getElementById('availability-grid')) {
    if (typeof loadAvailability === 'function') {
      if (document.getElementById('availability-preview')) loadAvailability('availability-preview');
      if (document.getElementById('availability-grid')) loadAvailability('availability-grid', { days: 60 });
    }
  }
  if (document.getElementById('reviews-grid'))
    loadReviews('reviews-grid', false);
  if (document.getElementById('home-reviews'))
    loadReviews('home-reviews', true);
});
