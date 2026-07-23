/**
 * main.js — Site-wide functionality for Snowy Nail Studio
 * Handles: nav injection, footer injection, mobile drawer,
 *          scroll effects, active-link highlighting, scroll reveal,
 *          back-to-top button.
 *
 * Called from every page. Runs after i18n.js is loaded.
 */
'use strict';
/* ─── Shared nav HTML ──────────────────────────────────────── */
const NAV_HTML = `
<a href="#main-content" class="skip-link" data-i18n="common.skip_nav">Skip to content</a>
<nav class="site-nav" id="site-nav" role="navigation" aria-label="Main navigation">
  <div class="container nav-inner">
    <a href="index.html" class="nav-logo" aria-label="Snowy Nail Studio home">
      <span class="nav-logo-name">Snowy Nail Studio</span>
      <span class="nav-logo-loc">Richmond Hill</span>
    </a>
    <div class="nav-links" role="list">
      <a href="index.html"     class="nav-link" data-i18n="nav.home">Home</a>
      <a href="gallery.html"   class="nav-link" data-i18n="nav.gallery">Gallery</a>
      <a href="services.html"  class="nav-link" data-i18n="nav.services">Services</a>
      <a href="studio.html"    class="nav-link" data-i18n="nav.studio">Studio</a>
      <a href="about.html"     class="nav-link" data-i18n="nav.about">About</a>
      <a href="contact.html"   class="nav-link" data-i18n="nav.contact">Contact</a>
      <a href="aftercare.html" class="nav-link" data-i18n="nav.aftercare">Nail Care</a>
    </div>
    <div class="nav-actions">
      <button class="lang-btn" id="lang-toggle"
              onclick="I18N.toggle()" aria-label="Switch language">中文</button>
      <button class="hamburger" id="hamburger"
              aria-label="Open menu" aria-expanded="false"
              aria-controls="nav-drawer">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>
<div class="nav-drawer" id="nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation">
  <a href="index.html"     class="nav-link" data-i18n="nav.home">Home</a>
  <a href="gallery.html"   class="nav-link" data-i18n="nav.gallery">Gallery</a>
  <a href="services.html"  class="nav-link" data-i18n="nav.services">Services</a>
  <a href="studio.html"    class="nav-link" data-i18n="nav.studio">Studio</a>
  <a href="about.html"     class="nav-link" data-i18n="nav.about">About</a>
  <a href="contact.html"   class="nav-link" data-i18n="nav.contact">Contact</a>
  <a href="aftercare.html" class="nav-link" data-i18n="nav.aftercare">Nail Care</a>
</div>
`;
/* ─── Shared footer HTML ───────────────────────────────────── */
const FOOTER_HTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <span class="nav-logo-name">Snowy Nail Studio</span>
        <p class="footer-tagline" data-i18n="footer.tagline">Handcrafted nail art · Richmond Hill</p>
        <p class="footer-loc"     data-i18n="footer.richmond_hill">Richmond Hill, Ontario</p>
      </div>
      <div class="footer-col">
        <h4 data-i18n="footer.nav_title">Pages</h4>
        <ul>
          <li><a href="index.html"     data-i18n="nav.home">Home</a></li>
          <li><a href="gallery.html"   data-i18n="nav.gallery">Gallery</a></li>
          <li><a href="services.html"  data-i18n="nav.services">Services</a></li>
          <li><a href="studio.html"    data-i18n="nav.studio">Studio</a></li>
          <li><a href="about.html"     data-i18n="nav.about">About</a></li>
          <li><a href="contact.html"   data-i18n="nav.contact">Contact</a></li>
          <li><a href="aftercare.html" data-i18n="nav.aftercare">Nail Care</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4 data-i18n="footer.social_title">Follow Us</h4>
        <ul>
          <li><a href="#" aria-label="Instagram">📸 Instagram</a></li>
          <li><a href="#" aria-label="小红书">🌸 小红书</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copyright"></p>
    </div>
  </div>
</footer>
<button class="back-to-top" id="back-to-top" aria-label="Back to top">↑</button>
`;
/* ─── Helpers ──────────────────────────────────────────────── */
function _getPageName() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  return file || 'index.html';
}
function _setActiveLinks() {
  const page = _getPageName();
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    const isHome = (page === '' || page === 'index.html') && (href === 'index.html' || href === '');
    const isCurrent = href === page || isHome;
    a.classList.toggle('active', isCurrent);
    if (isCurrent) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });
}
/* ─── Navigation behaviour ─────────────────────────────────── */
function _initNav() {
  const nav       = document.getElementById('site-nav');
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('nav-drawer');
  const backTop   = document.getElementById('back-to-top');
  if (!nav) return;
  // Scroll shadow + back-to-top visibility
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 8);
    if (backTop) backTop.classList.toggle('visible', y > 320);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // Hamburger / mobile drawer
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      drawer.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
    // Close drawer on outside click or nav link click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !drawer.contains(e.target)) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  // Back to top
  if (backTop) {
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
  _setActiveLinks();
}
/* ─── Scroll reveal ────────────────────────────────────────── */
function _initScrollReveal() {
  if (!window.IntersectionObserver) {
    // Fallback: reveal all immediately
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
const initScrollReveal = _initScrollReveal;
/* ─── FAQ accordion ────────────────────────────────────────── */
function initFAQAccordion() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');
      // Collapse all others
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        const a = openItem.querySelector('.faq-answer');
        if (a) a.style.height = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        if (answer) answer.style.height = answer.scrollHeight + 'px';
      }
    });
  });
}
/* ─── Poster language toggle ───────────────────────────────── */
function initPosterToggle() {
  document.querySelectorAll('.poster-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const wrap  = tab.closest('.poster-wrap');
      const panel = tab.getAttribute('data-panel');
      if (!wrap || !panel) return;
      wrap.querySelectorAll('.poster-tab').forEach(t => t.classList.remove('active'));
      wrap.querySelectorAll('.poster-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = wrap.querySelector('#' + panel);
      if (target) target.classList.add('active');
    });
  });
}
/* ─── Escape helpers (used by gallery.js / reviews.js) ──────── */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return String(str == null ? '' : str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
/* ─── Copyright year helper ────────────────────────────────── */
function _updateCopyrightYear() {
  const yr   = new Date().getFullYear();
  const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'en';
  document.querySelectorAll('.footer-copyright').forEach(el => {
    el.textContent = lang === 'zh'
      ? `© ${yr} Snowy Nail Studio 版权所有`
      : `© ${yr} Snowy Nail Studio. All rights reserved.`;
  });
}
/* ─── Bootstrap ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Inject nav + footer
  const navPh    = document.getElementById('nav-placeholder');
  const footerPh = document.getElementById('footer-placeholder');
  if (navPh)    navPh.innerHTML    = NAV_HTML;
  if (footerPh) footerPh.innerHTML = FOOTER_HTML;
  // Ensure main has id for skip-link target
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';
  // Boot i18n (loads translations + applies language to all [data-i18n] elements,
  // including those just injected into nav-placeholder / footer-placeholder)
  await I18N.init();
  _updateCopyrightYear();
  _initNav();
  _initScrollReveal();
  initFAQAccordion();
  initPosterToggle();
});
document.addEventListener('langchange', _updateCopyrightYear);
