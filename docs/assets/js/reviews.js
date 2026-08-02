/**
 * reviews.js — Review card rendering (text + image/XHS screenshot)
 * Depends on: i18n.js, main.js (escapeHtml / escapeAttr)
 */
'use strict';
let _reviewsData = [];
const REVIEW_PAGE_SIZE = 6;
let _reviewPage = 1;

function _compareReviewsById(a, b) {
  const getNumericId = (review) => {
    const match = String(review?.id || '').match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  };
  return getNumericId(a) - getNumericId(b);
}

// Sort from left to right in the grid: lower review IDs appear first.

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
  _reviewPage = 1;
  _renderReviews(container, items, featuredOnly);
}
/* ─── Render ───────────────────────────────────────────────── */
function _renderReviews(container, items, featuredOnly) {
  if (!items.length) {
    container.innerHTML = `<p style="text-align:center;color:var(--clr-text-muted);padding:2rem;">${escapeHtml(I18N.t('about.no_reviews', 'No reviews yet.'))}</p>`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / REVIEW_PAGE_SIZE));
  _reviewPage = Math.min(Math.max(1, _reviewPage), totalPages);
  const startIndex = (_reviewPage - 1) * REVIEW_PAGE_SIZE;
  const pageItems = items.slice(startIndex, startIndex + REVIEW_PAGE_SIZE);
  const cardsHTML = pageItems.map(_buildReviewCard).join('');
  const paginationHTML = totalPages > 1
    ? `<div class="review-pagination" style="grid-column:1/-1">
        <button class="review-page-btn" type="button" data-review-page="${_reviewPage - 1}" ${_reviewPage === 1 ? 'disabled' : ''} aria-label="${escapeAttr(I18N.t('about.previous_page', 'Previous page'))}">←</button>
        ${Array.from({ length: totalPages }, (_, index) => {
            const pageNum = index + 1;
            return `<button class="review-page-btn${pageNum === _reviewPage ? ' active' : ''}" type="button" data-review-page="${pageNum}">${pageNum}</button>`;
          }).join('')}
        <button class="review-page-btn" type="button" data-review-page="${_reviewPage + 1}" ${_reviewPage === totalPages ? 'disabled' : ''} aria-label="${escapeAttr(I18N.t('about.next_page', 'Next page'))}">→</button>
      </div>`
    : '';

  container.innerHTML = `${cardsHTML}${paginationHTML}`;

  container.querySelectorAll('.review-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextPage = Number(btn.getAttribute('data-review-page'));
      if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > totalPages) return;
      _reviewPage = nextPage;
      _renderReviews(container, items, featuredOnly);
    });
  });
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
  const starsLabel = I18N.t('about.stars_label', '{rating} stars').replace('{rating}', String(review.rating || 5));
  const initial = (review.displayName || 'C')[0].toUpperCase();
  const source  = review.source || '小红书';
  return `<div class="review-card review-card--text">
    <div class="review-stars" aria-label="${escapeAttr(starsLabel)}">${escapeHtml(stars)}</div>
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
  const tlabel  = I18N.t('about.screenshot_translation_label', 'Translation:');
  const initial = (review.displayName || 'C')[0].toUpperCase();
  const source  = review.source || '小红书';
  const screenshotHTML = review.image
    ? `<img src="${escapeAttr(review.image)}" alt="${escapeAttr(I18N.t('about.customer_review_screenshot', 'Customer review screenshot'))}" loading="lazy"
           data-fallback-quote="${escapeAttr(quoteZh)}"
           onerror="window.snowyReviewFallback(this)">`
    : _buildMockXHS(quoteZh);
  const translatedQuote = lang === 'zh' ? quoteZh : quoteEn;
  const translationHTML = lang === 'zh'
    ? `<p class="review-translation-en">"${escapeHtml(translatedQuote)}"</p>`
    : `${quoteZh ? `<p class="review-original-zh">"${escapeHtml(quoteZh)}"</p>` : ''}
      <div class="review-translation-label">${escapeHtml(tlabel)}</div>
      <p class="review-translation-en">"${escapeHtml(translatedQuote)}"</p>`;
  return `<div class="review-card review-card--image review-card--image-${orientation}">
    <div class="review-screenshot">${screenshotHTML}</div>
    <div class="review-translation">
      ${translationHTML}
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

/* ─── Homepage pricing & seasonal special ────────────────── */
let _priceModalTrigger = null;
let _priceModalReady = false;

function _localized(item, key, lang) {
  return item[`${key}${lang === 'zh' ? 'Zh' : 'En'}`] || item[`${key}En`] || '';
}

function _promotionIsCurrent(promotion, now = new Date()) {
  if (!promotion.active) return false;
  const start = promotion.startDate ? new Date(`${promotion.startDate}T00:00:00`) : null;
  const end = promotion.endDate ? new Date(`${promotion.endDate}T23:59:59`) : null;
  return (!start || now >= start) && (!end || now <= end);
}

function _formatPromotionDate(dateString, lang) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-CA', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(date);
}

function _initPriceModal() {
  if (_priceModalReady) return;
  const modal = document.getElementById('price-modal');
  if (!modal) return;
  const dialog = modal.querySelector('.price-modal__dialog');
  const closeButtons = modal.querySelectorAll('[data-price-modal-close]');

  const closeModal = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (_priceModalTrigger) _priceModalTrigger.focus();
  };

  closeButtons.forEach(button => button.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  _priceModalReady = true;
}

function openPricePoster(button, src, lang) {
  const modal = document.getElementById('price-modal');
  if (!modal) return;
  _initPriceModal();
  const image = modal.querySelector('.price-modal__image');
  _priceModalTrigger = button;
  image.src = src;
  image.alt = lang === 'zh'
    ? 'Snowy 美甲工作室中文手部与脚部美甲活动价目表'
    : 'Snowy Nail Studio Chinese manicure and pedicure promotional price list';
  modal.hidden = false;
  document.body.classList.add('modal-open');
  modal.querySelector('.price-modal__close').focus();
}

function _renderPricingCard(pricing, lang) {
  const zh = lang === 'zh';
  const services = (pricing.services || []).map(service => `
    <div class="pricing-service">
      <div>
        <h4>${escapeHtml(_localized(service, 'name', lang))}</h4>
        <p>${escapeHtml(_localized(service, 'description', lang))}</p>
        ${_localized(service, 'note', lang) ? `<span class="pricing-service__note">✦ ${escapeHtml(_localized(service, 'note', lang))}</span>` : ''}
      </div>
      <strong>${escapeHtml(service.price)}</strong>
    </div>`).join('');
  const addons = (pricing.addons || []).map(addon => `
    <li><span>${escapeHtml(_localized(addon, 'name', lang))}</span><strong>${escapeHtml(addon.price)}</strong></li>`).join('');
  const poster = zh ? (pricing.posterZh || pricing.posterEn) : (pricing.posterEn || pricing.posterZh);

  return `<article class="pricing-card">
    <div class="pricing-card__header">
      <div>
        <p class="card-kicker">${zh ? '日常价目' : 'Everyday Pricing'}</p>
        <h3>${zh ? '精致服务，清晰价格' : 'Polished essentials, priced clearly'}</h3>
      </div>
      <span class="pricing-card__mark" aria-hidden="true">✦</span>
    </div>
    <div class="pricing-card__services">${services}</div>
    <div class="pricing-card__addons">
      <div class="pricing-card__subhead">
        <h4>${zh ? '热门加项' : 'Popular add-ons'}</h4>
        <span>${zh ? '按服务加价' : 'Added to service'}</span>
      </div>
      <ul>${addons}</ul>
    </div>
    <div class="pricing-card__highlight">
      <span class="pricing-card__gift" aria-hidden="true">✦</span>
      <div><strong>${zh ? '卸甲再做免费' : 'FREE Removal With a New Set'}</strong>
      <p>${zh ? '卸甲后继续做美甲，不收卸甲费。' : 'Continue with another nail service and pay no removal fee.'}</p></div>
    </div>
    <p class="pricing-card__disclaimer">${zh
      ? '以上价格适用于简单款式。满钻、复杂彩绘、立体造型、雕花及其他高难度款式需单独报价。'
      : 'Prices apply to simple designs. Full rhinestone sets, complex nail art, 3D designs, sculpting, and other advanced styles are quoted separately.'}</p>
    <div class="pricing-card__actions">
      <button class="btn btn-primary" type="button" data-price-poster="${escapeAttr(poster)}">${zh ? '查看完整价目表' : 'View Full Price List (Chinese)'}</button>
      <button class="btn btn-outline" type="button" data-price-poster="${escapeAttr(pricing.posterZh || poster)}">中文价目表</button>
    </div>
  </article>`;
}

function _renderSeasonalCard(promotion, lang) {
  const zh = lang === 'zh';
  if (!promotion) {
    return `<article class="seasonal-card seasonal-card--empty">
      <p class="card-kicker">${zh ? '当前优惠' : 'Current Special'}</p>
      <h3>${zh ? '新的季节优惠即将推出' : 'New seasonal offers are coming soon'}</h3>
      <p>${zh ? '关注我们的最新动态，或联系 Snowy 了解更多。' : 'Follow our latest updates or contact Snowy for details.'}</p>
      <a class="btn btn-white" href="contact.html">${zh ? '联系 Snowy' : 'Contact Snowy'}</a>
    </article>`;
  }
  const image = zh ? (promotion.imageZh || promotion.imageEn) : (promotion.imageEn || promotion.imageZh);
  const alt = _localized(promotion, 'imageAlt', lang);
  const badges = (zh ? promotion.badgesZh : promotion.badgesEn) || [];
  const perks = promotion.perks || [];
  const endDate = _formatPromotionDate(promotion.endDate, lang);
  const label = _localized(promotion, 'label', lang) || (zh ? '当前优惠' : 'Current Special');
  const kicker = _localized(promotion, 'kicker', lang) || (zh ? '季节精选' : 'Seasonal feature');
  const terms = _localized(promotion, 'terms', lang);
  const dateLead = _localized(promotion, 'dateLead', lang);
  const cta = _localized(promotion, 'cta', lang) || (zh ? '咨询此优惠' : 'Ask About This Offer');
  return `<article class="seasonal-card">
    <div class="seasonal-card__image">
      <img src="${escapeAttr(image)}" width="900" height="900" loading="lazy" alt="${escapeAttr(alt)}">
      <span class="seasonal-card__label">${escapeHtml(label)}</span>
    </div>
    <div class="seasonal-card__content">
      <p class="card-kicker">${escapeHtml(kicker)}</p>
      <h3>${escapeHtml(_localized(promotion, 'title', lang))}</h3>
      <p class="seasonal-card__description">${escapeHtml(_localized(promotion, 'description', lang))}</p>
      ${badges.length ? `<div class="seasonal-card__badges">${badges.map(badge => `<span>${escapeHtml(badge)}</span>`).join('')}</div>` : ''}
      ${endDate ? `<p class="seasonal-card__date"><span aria-hidden="true">✦</span> ${escapeHtml(dateLead || (zh ? '有效期至' : 'Valid through'))} ${escapeHtml(endDate)}</p>` : ''}
      ${terms ? `<p class="seasonal-card__terms"><strong>${zh ? '优惠说明' : 'Offer details'}</strong>${escapeHtml(terms)}</p>` : ''}
      ${perks.length ? `<div class="seasonal-card__perks">
        <p class="seasonal-card__perks-label">${zh ? '长期客户优惠' : 'More ways to save'}</p>
        ${perks.map(perk => `<div class="seasonal-perk">
          <span class="seasonal-perk__icon" aria-hidden="true">${escapeHtml(perk.icon || '✦')}</span>
          <div><h4>${escapeHtml(_localized(perk, 'title', lang))}</h4><p>${escapeHtml(_localized(perk, 'description', lang))}</p></div>
        </div>`).join('')}
      </div>` : ''}
      <a class="btn btn-white" href="contact.html">${escapeHtml(cta)}</a>
      ${promotion.isTemplate ? `<p class="seasonal-card__template-note">${zh ? '活动详情确认后，可随时替换此模板。' : 'This template is ready for your confirmed offer details.'}</p>` : ''}
    </div>
  </article>`;
}

async function loadHomePricingSpecials(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const response = await fetch('data/promotions.json');
    if (!response.ok) throw new Error('Pricing data unavailable');
    const data = await response.json();
    const lang = I18N.getLang();
    const currentPromotion = (data.active || [])
      .filter(promotion => _promotionIsCurrent(promotion))
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))[0];
    container.innerHTML = _renderPricingCard(data.pricing || {}, lang) + _renderSeasonalCard(currentPromotion, lang);
    container.querySelectorAll('[data-price-poster]').forEach(button => {
      button.addEventListener('click', () => openPricePoster(button, button.dataset.pricePoster, lang));
    });
    document.querySelectorAll('[data-section-lang]').forEach(button => {
      const active = button.dataset.sectionLang === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.onclick = () => I18N.setLang(button.dataset.sectionLang);
    });
    _initPriceModal();
  } catch (error) {
    container.innerHTML = `<p class="pricing-specials__error">${escapeHtml(I18N.t('common.error', 'Content could not be loaded.'))}</p>`;
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
    const promos = (data.active || [])
      .filter(p => _promotionIsCurrent(p))
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));
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
      const showZh = lang === 'zh';
      const enPanelId = `pp-en-${promo.id}`;
      const zhPanelId = `pp-zh-${promo.id}`;
      const enImg = promo.imageEn
        ? `<img src="${escapeAttr(promo.imageEn)}" alt="${escapeAttr(promo.titleEn || title)} - English" loading="lazy"
               onerror="this.closest('.promo-poster-img').innerHTML='<div class=\\'promo-poster-mock\\'>${escapeAttr(I18N.t('common.mock_note'))}</div>'">`
        : `<div class="promo-poster-mock">${escapeHtml(I18N.t('common.mock_note', 'Replace with real image'))}</div>`;
      const zhImg = promo.imageZh
        ? `<img src="${escapeAttr(promo.imageZh)}" alt="${escapeAttr(promo.titleZh || title)} - 中文" loading="lazy"
               onerror="this.closest('.promo-poster-img').innerHTML='<div class=\\'promo-poster-mock\\'>${escapeAttr(I18N.t('common.mock_note'))}</div>'">`
        : `<div class="promo-poster-mock">${escapeHtml(I18N.t('common.mock_note', 'Replace with real image'))}</div>`;
      const validUntil = promo.validUntil
        ? (lang === 'zh' ? `有效期至：${promo.validUntil}` : `Valid until: ${promo.validUntil}`)
        : '';
      return `<div class="promo-card">
        <h3 class="promo-card-title">${escapeHtml(title)}</h3>
        <p class="promo-card-desc">${escapeHtml(desc)}</p>
        <div class="promo-lang-toggle">
          <button class="promo-lang-btn${showZh ? '' : ' active'}" data-lang="en"
                  onclick="handlePromoLang(this,'en')">${escapeHtml(lblEn)}</button>
          <button class="promo-lang-btn${showZh ? ' active' : ''}" data-lang="zh"
                  onclick="handlePromoLang(this,'zh')">${escapeHtml(lblZh)}</button>
        </div>
        <div class="promo-poster-img" data-promo-panel="en" id="${escapeAttr(enPanelId)}"${showZh ? ' style="display:none;"' : ''}>${enImg}</div>
        <div class="promo-poster-img" data-promo-panel="zh" id="${escapeAttr(zhPanelId)}"${showZh ? '' : ' style="display:none;"'}>${zhImg}</div>
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
      if (c.url && c.url !== '#') {
        return `<a href="${escapeAttr(c.url)}" class="contact-method contact-method--link" aria-label="${escapeAttr(label)}">
          <div class="contact-icon" aria-hidden="true">${icon}</div>
          <div class="contact-info">
            <span class="contact-label">${escapeHtml(label)}</span>
            <span class="contact-value">${escapeHtml(value)}</span>
          </div>
          <span class="contact-method__arrow" aria-hidden="true">↗</span>
        </a>`;
      }
      return `<div class="contact-method contact-method--static">
        <div class="contact-icon" aria-hidden="true">${icon}</div>
        <div class="contact-info">
          <span class="contact-label">${escapeHtml(label)}</span>
          <span class="contact-value">${escapeHtml(value)}</span>
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
    loadHomePricingSpecials('home-promos-container');
  if (document.getElementById('contact-methods-container'))
    loadSiteContacts('contact-methods-container');
  if (document.getElementById('business-hours-container'))
    loadBusinessHours('business-hours-container');
  if (document.getElementById('reviews-grid'))
    loadReviews('reviews-grid', false);
  if (document.getElementById('home-reviews'))
    loadReviews('home-reviews', true);
});
