/**
 * availability.js — Lightweight availability renderer
 * Renders hourly slots from business hours and marks booked hours
 * Data sources:
 *  - data/site.json (business.hours)
 *  - data/availability.json (cached Apps Script FreeBusy output)
 */
'use strict';

function _formatHourLabel(hour24) {
  const h = ((hour24 + 11) % 12) + 1; // 12-hour
  const am = hour24 < 12 ? 'AM' : 'PM';
  return `${h} ${am}`;
}

function _overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function loadAvailability(containerId, opts = {}) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div></div>`;
  const endpoint = opts.endpoint || (window.SNOWY && window.SNOWY.availabilityEndpoint) || 'data/availability.json';
  try {
    const [siteRes, avRes] = await Promise.all([
      fetch('data/site.json'),
      fetch(endpoint)
    ]);
    if (!siteRes.ok) throw new Error('site.json not found');
    if (!avRes.ok) throw new Error('availability data not found');
    const site = await siteRes.json();
    const av = await avRes.json();
    const hours = (site.business && site.business.hours) || { openHour: '09:00', closeHour: '22:00' };
    const tz = hours.timezone || av.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const openH = parseInt((hours.openHour || '09:00').split(':')[0], 10);
    const closeH = parseInt((hours.closeHour || '22:00').split(':')[0], 10);
    const busy = Array.isArray(av.busy) ? av.busy.map(b => ({ start: new Date(b.start), end: new Date(b.end) })) : [];
    const days = opts.days || (containerId.includes('preview') ? 3 : 14);
    // Build grid
    const grid = document.createElement('div');
    grid.className = 'availability-grid';
    // Heading
    const heading = document.createElement('div');
    heading.className = 'availability-heading';
    const hTitle = document.createElement('h3');
    hTitle.textContent = I18N.t('contact.hours_heading', 'Business Hours');
    heading.appendChild(hTitle);
    grid.appendChild(heading);

    const now = new Date();
    for (let d = 0; d < days; d++) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      const dayCard = document.createElement('div');
      dayCard.className = 'availability-day';
      const dayLabel = document.createElement('div');
      dayLabel.className = 'availability-day-label';
      dayLabel.textContent = dayDate.toLocaleDateString(I18N.getLang() === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dayCard.appendChild(dayLabel);
      const slots = document.createElement('div');
      slots.className = 'availability-slots';
      for (let h = openH; h < closeH; h++) {
        const slotStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), h, 0, 0);
        const slotEnd = new Date(slotStart.getTime());
        slotEnd.setHours(h + 1);
        const isBooked = busy.some(b => _overlap(slotStart.getTime(), slotEnd.getTime(), b.start.getTime(), b.end.getTime()));
        const slot = document.createElement('div');
        slot.className = 'availability-slot' + (isBooked ? ' booked' : ' free');
        slot.setAttribute('aria-label', `${_formatHourLabel(h)} - ${isBooked ? I18N.t('contact.closed','Booked') : I18N.t('contact.open_now','Available')}`);
        slot.textContent = _formatHourLabel(h) + (isBooked ? ' · ' + I18N.t('contact.closed','Booked') : '');
        slots.appendChild(slot);
      }
      dayCard.appendChild(slots);
      grid.appendChild(dayCard);
    }
    wrap.innerHTML = '';
    wrap.appendChild(grid);
    // Auto-scroll to today if requested
    if (opts.autoScroll !== false) {
      const firstDay = wrap.querySelector('.availability-day');
      if (firstDay) firstDay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (e) {
    wrap.innerHTML = `<div class="error-state"><p data-i18n="common.error">Content could not be loaded.</p></div>`;
    console.error('loadAvailability error:', e);
  }
}

// Expose for manual calls
window.loadAvailability = loadAvailability;
