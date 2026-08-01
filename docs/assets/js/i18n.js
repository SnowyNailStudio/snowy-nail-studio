/**
 * i18n.js — Language switching for Snowy Nail Studio
 * Reads translations.json and applies to all [data-i18n] elements.
 * Exposes a global I18N object.
 */
const I18N = (() => {
  'use strict';
  let _translations = {};
  let _lang = 'en';
  const STORAGE_KEY = 'snowy_lang';
  const DATA_FILE   = 'data/translations.json';
  /** Resolve a dot-path key against the translation dict. */
  function _resolve(dict, path) {
    return path.split('.').reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
      dict
    );
  }
  /** Apply the stored language to every translated element in the document. */
  function _apply(lang) {
    const dict = _translations[lang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = _resolve(dict, el.getAttribute('data-i18n'));
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = _resolve(dict, el.getAttribute('data-i18n-placeholder'));
      if (val !== undefined) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = _resolve(dict, el.getAttribute('data-i18n-title'));
      if (val !== undefined) el.title = val;
    });
    ['aria-label', 'alt', 'content'].forEach(attr => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
        const val = _resolve(dict, el.getAttribute(`data-i18n-${attr}`));
        if (val !== undefined) el.setAttribute(attr, val);
      });
    });
    // Update lang-toggle button label
    const btn = document.getElementById('lang-toggle');
    if (btn && dict.lang) btn.textContent = dict.lang.toggle;
  }
  /** Load translations JSON and initialise language. */
  async function init() {
    const saved      = localStorage.getItem(STORAGE_KEY);
    const browserZh  = navigator.language && navigator.language.startsWith('zh');
    _lang = saved || (browserZh ? 'zh' : 'en');
    try {
      const res = await fetch(DATA_FILE);
      if (!res.ok) throw new Error('translations.json not found');
      _translations = await res.json();
    } catch (err) {
      console.warn('[i18n] Failed to load translations:', err.message);
      return;
    }
    document.documentElement.lang = _lang === 'zh' ? 'zh-CN' : 'en';
    _apply(_lang);
  }
  /** Toggle between 'en' and 'zh'. */
  function toggle() {
    setLang(_lang === 'en' ? 'zh' : 'en');
  }
  /** Set a specific language. */
  function setLang(lang) {
    if (lang !== 'en' && lang !== 'zh') return;
    _lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    _apply(lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }
  /** Translate a key, returning fallback if not found. */
  function t(key, fallback) {
    const dict = _translations[_lang];
    if (!dict) return fallback !== undefined ? fallback : key;
    const val = _resolve(dict, key);
    return val !== undefined ? val : (fallback !== undefined ? fallback : key);
  }
  /** Current language code. */
  function getLang() { return _lang; }
  return { init, toggle, setLang, t, getLang };
})();
