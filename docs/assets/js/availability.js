/**
 * availability.js — Lightweight availability renderer
 * Renders hourly slots from business hours and marks booked hours
 * Data sources:
 *  - data/site.json (business.hours)
 *  - data/availability.json (cached Apps Script FreeBusy output)
 */
'use strict';

function _formatHourLabel(hour24) {
  const normalizedHour = ((hour24 % 24) + 24) % 24;
  if (normalizedHour === 0) return '12 AM';
  if (normalizedHour === 12) return '12 PM';
  if (normalizedHour < 12) return `${normalizedHour} AM`;
  return `${normalizedHour - 12} PM`;
}

function _overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function _getHourlyStatus(date, hour, busyPeriods, bufferHours = 3, closingHour = 22) {
  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0);

  const slotEnd = new Date(slotStart);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  const isBooked = busyPeriods.some((busyPeriod) => {
    const busyStart = busyPeriod.start instanceof Date ? busyPeriod.start : new Date(busyPeriod.start);
    const busyEnd = busyPeriod.end instanceof Date ? busyPeriod.end : new Date(busyPeriod.end);
    return _overlap(slotStart.getTime(), slotEnd.getTime(), busyStart.getTime(), busyEnd.getTime());
  });

  if (isBooked) {
    return { hour, slotStart, slotEnd, type: 'booked' };
  }

  const isBuffer = busyPeriods.some((busyPeriod) => {
    const busyStart = busyPeriod.start instanceof Date ? busyPeriod.start : new Date(busyPeriod.start);
    const bufferEndTime = busyStart.getTime();
    const bufferStartTime = bufferEndTime - (bufferHours * 60 * 60 * 1000);
    const slotStartTime = slotStart.getTime();
    return slotStartTime >= bufferStartTime && slotStartTime < bufferEndTime;
  });

  if (isBuffer) {
    return { hour, slotStart, slotEnd, type: 'hidden' };
  }

  if (hour >= closingHour - 2) {
    return { hour, slotStart, slotEnd, type: 'hidden' };
  }

  return { hour, slotStart, slotEnd, type: 'available' };
}

function getHourlyStatuses(date, busyPeriods, openingHour = 9, closingHour = 22) {
  const statuses = [];

  for (let hour = openingHour; hour < closingHour; hour += 1) {
    const status = _getHourlyStatus(date, hour, busyPeriods, 3, closingHour);
    statuses.push(status);
  }

  return statuses;
}

function buildHybridAvailabilityItems(hourlyStatuses) {
  const items = [];
  let index = 0;

  while (index < hourlyStatuses.length) {
    const current = hourlyStatuses[index];

    if (current.type === 'booked') {
      const rangeStart = current.hour;
      let rangeEnd = current.hour + 1;
      index += 1;

      while (index < hourlyStatuses.length) {
        const next = hourlyStatuses[index];

        if (next.type === 'booked') {
          rangeEnd = next.hour + 1;
          index += 1;
          continue;
        }

        if (next.type === 'hidden') {
          let lookAhead = index + 1;
          let hasAvailableBetween = false;

          while (lookAhead < hourlyStatuses.length && hourlyStatuses[lookAhead].type !== 'booked') {
            if (hourlyStatuses[lookAhead].type === 'available') {
              hasAvailableBetween = true;
              break;
            }
            lookAhead += 1;
          }

          if (lookAhead < hourlyStatuses.length && !hasAvailableBetween && hourlyStatuses[lookAhead].type === 'booked') {
            rangeEnd = hourlyStatuses[lookAhead].hour + 1;
            index = lookAhead + 1;
            continue;
          }
        }

        break;
      }

      items.push({ type: 'booked', start: rangeStart, end: rangeEnd });
    } else {
      items.push({ type: current.type, hour: current.hour });
      index += 1;
    }
  }

  return items;
}

function _formatRangeEndLabel(hour24) {
  const endHour = ((hour24 % 24) + 24) % 24;
  const previousHour = (endHour + 23) % 24;
  const isAfternoon = previousHour >= 12;
  const hour12 = previousHour === 0 ? 12 : previousHour > 12 ? previousHour - 12 : previousHour;
  return `${hour12}:59 ${isAfternoon ? 'PM' : 'AM'}`;
}

function renderHybridAvailability(container, items) {
  container.innerHTML = '';

  items.forEach((item) => {
    if (item.type === 'hidden') return;

    const element = document.createElement('span');
    element.className = 'availability-slot';

    const label = document.createElement('span');
    label.className = 'availability-slot-label';

    if (item.type === 'available') {
      element.classList.add('availability-slot--available');
      label.textContent = _formatHourLabel(item.hour);
      element.setAttribute('aria-label', `${_formatHourLabel(item.hour)} ${I18N.t('availability.available', 'Available')}`);
    } else {
      element.classList.add('availability-slot--booked-range');
      label.textContent = `${_formatHourLabel(item.start)} – ${_formatRangeEndLabel(item.end)} · ${I18N.t('availability.booked', 'Booked')}`;
      element.setAttribute('aria-label', `${_formatHourLabel(item.start)} to ${_formatRangeEndLabel(item.end)} ${I18N.t('availability.booked', 'Booked')}`);
    }

    element.appendChild(label);

    container.appendChild(element);
  });
}

function _normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function _isDateInRange(date, startDate, endDate) {
  if (!startDate && !endDate) return true;
  const time = date.getTime();
  if (startDate && time < startDate.getTime()) return false;
  if (endDate && time > endDate.getTime()) return false;
  return true;
}

function _canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve));
}

function renderAvailabilityGrid(containerId, busy, openH, closeH, days, startDate, endDate, autoScroll = true) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  wrap.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div></div>`;

  const grid = document.createElement('div');
  grid.className = 'availability-grid';

  const heading = document.createElement('div');
  heading.className = 'availability-heading';
  const hTitle = document.createElement('h3');
  hTitle.textContent = I18N.t('availability.hours_heading', I18N.t('contact.hours_heading', 'Business Hours'));
  heading.appendChild(hTitle);
  grid.appendChild(heading);

  const now = new Date();
  const normalizedStart = _normalizeDate(startDate);
  const normalizedEnd = _normalizeDate(endDate);
  let renderedCount = 0;

  for (let d = 1; d <= days; d++) {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);

    if (!_isDateInRange(dayDate, normalizedStart, normalizedEnd)) {
      continue;
    }

    const dayCard = document.createElement('div');
    dayCard.className = 'availability-day';

    const dayLabel = document.createElement('div');
    dayLabel.className = 'availability-day-label';
    dayLabel.textContent = dayDate.toLocaleDateString(I18N.getLang() === 'zh' ? 'zh-CN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    dayCard.appendChild(dayLabel);

    const slots = document.createElement('div');
    slots.className = 'availability-slots';

    const hourlyStatuses = getHourlyStatuses(dayDate, busy, openH, closeH);
    const displayItems = buildHybridAvailabilityItems(hourlyStatuses);
    const hasAvailableSlots = displayItems.some((item) => item.type === 'available');

    if (hasAvailableSlots) {
      renderHybridAvailability(slots, displayItems);
    } else {
      const fullyBooked = document.createElement('div');
      fullyBooked.className = 'availability-fully-booked';
      fullyBooked.textContent = I18N.t('availability.fully_booked', 'Fully Booked');
      slots.appendChild(fullyBooked);
    }

    dayCard.appendChild(slots);
    grid.appendChild(dayCard);
    renderedCount += 1;
  }

  wrap.innerHTML = '';

  if (renderedCount === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'availability-no-results';
    emptyState.textContent = I18N.t('availability.no_range_results', 'No availability matches your selected date range.');
    wrap.appendChild(emptyState);
    return;
  }

  wrap.appendChild(grid);

  if (autoScroll !== false) {
    const firstDay = wrap.querySelector('.availability-day');
    if (firstDay) firstDay.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function loadAvailability(containerId, opts = {}) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  wrap.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div></div>`;
  const defaultEndpoint = 'data/availability.json';

  try {
    const siteRes = await fetch('data/site.json', { method: 'GET', redirect: 'follow', cache: 'no-store' });
    if (!siteRes.ok) throw new Error('site.json not found');
    const site = await siteRes.json();

    const endpoint = opts.endpoint || (window.SNOWY && window.SNOWY.availabilityEndpoint) || (site.business && site.business.availabilityEndpoint) || defaultEndpoint;
    const avRes = await fetch(endpoint, { method: 'GET', redirect: 'follow', cache: 'no-store' });
    if (!avRes.ok) throw new Error('availability data not found');
    const av = await avRes.json();

    const hours = (site.business && site.business.hours) || { openHour: '09:00', closeHour: '22:00' };
    const openH = parseInt((hours.openHour || '09:00').split(':')[0], 10);
    const closeH = parseInt((hours.closeHour || '22:00').split(':')[0], 10);
    const busy = Array.isArray(av.busy) ? av.busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })) : [];
    const days = opts.days || (containerId.includes('preview') ? 3 : 14);

    window.__SNOWY_AVAILABILITY = { busy, openH, closeH, days, containerId };
    renderAvailabilityGrid(containerId, busy, openH, closeH, days, opts.startDate || null, opts.endDate || null, opts.autoScroll);
  } catch (e) {
    const errorHeading = I18N.t('availability.unavailable_heading', 'Live availability is temporarily unavailable.');
    const errorMessage = I18N.t('availability.unavailable_description', 'Please contact Snowy Nail Studio to confirm your appointment time.');
    wrap.innerHTML = `<div class="error-state"><p>${errorHeading}</p><p>${errorMessage}</p></div>`;
    console.error('loadAvailability error:', e);
  }
}

function _getAvailabilityInputs() {
  return {
    start: document.getElementById('availability-start-date'),
    end: document.getElementById('availability-end-date')
  };
}

async function applyAvailabilityFilter() {
  let state = window.__SNOWY_AVAILABILITY;
  const inputs = _getAvailabilityInputs();

  // If availability data hasn't loaded yet, try to load it first.
  if (!state) {
    try {
      await loadAvailability('availability-grid', { days: 60, autoScroll: false });
      state = window.__SNOWY_AVAILABILITY;
    } catch (e) {
      console.warn('applyAvailabilityFilter: availability not ready', e);
      return;
    }
  }

  let startDate = _normalizeDate(inputs.start?.value ? `${inputs.start.value}T00:00:00` : null);
  let endDate = _normalizeDate(inputs.end?.value ? `${inputs.end.value}T00:00:00` : null);

  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  renderAvailabilityGrid(state.containerId, state.busy, state.openH, state.closeH, state.days, startDate, endDate, true);
}

async function resetAvailabilityFilter() {
  const inputs = _getAvailabilityInputs();
  if (inputs.start) inputs.start.value = '';
  if (inputs.end) inputs.end.value = '';

  let state = window.__SNOWY_AVAILABILITY;
  if (!state) {
    try {
      await loadAvailability('availability-grid', { days: 60, autoScroll: false });
      state = window.__SNOWY_AVAILABILITY;
    } catch (e) {
      console.warn('resetAvailabilityFilter: availability not ready', e);
      return;
    }
  }

  if (state) {
    renderAvailabilityGrid(state.containerId, state.busy, state.openH, state.closeH, state.days, null, null, true);
  }
}

async function _loadHtml2Canvas() {
  if (window.html2canvas) return;
  if (document.getElementById('html2canvas-script')) return;

  const script = document.createElement('script');
  script.id = 'html2canvas-script';
  script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  script.crossOrigin = 'anonymous';
  document.body.appendChild(script);

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load screenshot helper')); 
  });
}

async function captureAvailabilityScreenshot() {
  const state = window.__SNOWY_AVAILABILITY;
  const grid = document.querySelector('.availability-grid');
  if (!state || !grid) return;

  try {
    await _loadHtml2Canvas();

    const screenshotBox = document.createElement('div');
    screenshotBox.className = 'availability-screenshot-wrapper';
    screenshotBox.style.position = 'absolute';
    screenshotBox.style.left = '-9999px';
    screenshotBox.style.top = '0';
    screenshotBox.style.backgroundColor = '#ffffff';
    screenshotBox.style.padding = '16px';
    screenshotBox.style.borderRadius = '18px';
    screenshotBox.style.boxSizing = 'border-box';
    screenshotBox.style.maxWidth = `${Math.min(document.body.offsetWidth, 1100)}px`;
    screenshotBox.style.width = '100%';

    const banner = document.createElement('div');
    banner.className = 'availability-screenshot-url';
    banner.textContent = window.location.origin + window.location.pathname;
    screenshotBox.appendChild(banner);

    const menuBar = document.createElement('div');
    menuBar.style.display = 'flex';
    menuBar.style.flexWrap = 'wrap';
    menuBar.style.alignItems = 'center';
    menuBar.style.justifyContent = 'center';
    menuBar.style.gap = '12px';
    menuBar.style.padding = '16px 0';
    menuBar.style.borderBottom = '1px solid rgba(0,0,0,0.08)';
    menuBar.style.textAlign = 'center';

    const nav = document.querySelector('nav');
    const logoText = (nav && nav.querySelector('.nav-logo .nav-logo-name')?.textContent?.trim()) || window.location.hostname;
    const logo = document.createElement('div');
    logo.textContent = logoText;
    logo.style.fontWeight = '700';
    logo.style.color = '#6f4152';
    logo.style.fontSize = '0.95rem';
    logo.style.letterSpacing = '0.02em';
    logo.style.lineHeight = '1.4';
    menuBar.appendChild(logo);

    const linksWrapper = document.createElement('div');
    linksWrapper.style.display = 'flex';
    linksWrapper.style.flexWrap = 'wrap';
    linksWrapper.style.justifyContent = 'center';
    linksWrapper.style.gap = '10px';

    // Prefer primary nav links inside `#site-nav .nav-links` to avoid duplicates
    const navLinks = document.querySelectorAll('#site-nav .nav-links .nav-link');
    if (navLinks && navLinks.length) {
      navLinks.forEach((link) => {
        const item = document.createElement('span');
        item.className = 'availability-screenshot-nav-item';
        item.textContent = link.textContent.trim();
        linksWrapper.appendChild(item);
      });
    } else {
      // Fallback static menu if nav links are not present yet
      ['Home','Gallery','Services','Studio','Availability','About','Contact','Nail Care'].forEach((t) => {
        const item = document.createElement('span');
        item.className = 'availability-screenshot-nav-item';
        item.textContent = t;
        linksWrapper.appendChild(item);
      });
    }

    menuBar.appendChild(linksWrapper);
    screenshotBox.appendChild(menuBar);

    const gridClone = grid.cloneNode(true);
    screenshotBox.appendChild(gridClone);

    document.body.appendChild(screenshotBox);

    const canvas = await window.html2canvas(screenshotBox, {
      backgroundColor: '#ffffff',
      scale: window.devicePixelRatio || 2,
      useCORS: true,
      allowTaint: true
    });

    screenshotBox.remove();

    const blob = await _canvasToBlob(canvas);
    if (!blob) throw new Error('Screenshot blob generation failed');

    const file = new File([blob], 'availability-screenshot.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Availability screenshot', text: 'Save this availability screenshot to Photos.' });
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'availability-screenshot.png';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  } catch (e) {
    console.error('captureAvailabilityScreenshot error:', e);
    alert(I18N.t('availability.screenshot_error', 'Unable to capture screenshot. Please use your device screenshot function.'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const filterButton = document.getElementById('availability-filter-button');
  const resetButton = document.getElementById('availability-reset-button');
  const screenshotButton = document.getElementById('availability-screenshot-button');

  if (filterButton) filterButton.addEventListener('click', applyAvailabilityFilter);
  if (resetButton) resetButton.addEventListener('click', resetAvailabilityFilter);
  if (screenshotButton) screenshotButton.addEventListener('click', captureAvailabilityScreenshot);
});

window.loadAvailability = loadAvailability;
