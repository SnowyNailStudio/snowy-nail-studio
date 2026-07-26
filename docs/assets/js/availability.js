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

    if (item.type === 'available') {
      element.classList.add('availability-slot--available');
      element.textContent = _formatHourLabel(item.hour);
      element.setAttribute('aria-label', `${_formatHourLabel(item.hour)} ${I18N.t('availability.available', 'Available')}`);
    } else {
      element.classList.add('availability-slot--booked-range');
      element.textContent = `${_formatHourLabel(item.start)} – ${_formatRangeEndLabel(item.end)} · ${I18N.t('availability.booked', 'Booked')}`;
      element.setAttribute('aria-label', `${_formatHourLabel(item.start)} to ${_formatRangeEndLabel(item.end)} ${I18N.t('availability.booked', 'Booked')}`);
    }

    container.appendChild(element);
  });
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

    const grid = document.createElement('div');
    grid.className = 'availability-grid';

    const heading = document.createElement('div');
    heading.className = 'availability-heading';
    const hTitle = document.createElement('h3');
    hTitle.textContent = I18N.t('availability.hours_heading', I18N.t('contact.hours_heading', 'Business Hours'));
    heading.appendChild(hTitle);
    grid.appendChild(heading);

    const now = new Date();
    for (let d = 1; d <= days; d++) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
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
    }

    wrap.innerHTML = '';
    wrap.appendChild(grid);

    if (opts.autoScroll !== false) {
      const firstDay = wrap.querySelector('.availability-day');
      if (firstDay) firstDay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (e) {
    const errorHeading = I18N.t('availability.unavailable_heading', 'Live availability is temporarily unavailable.');
    const errorMessage = I18N.t('availability.unavailable_description', 'Please contact Snowy Nail Studio to confirm your appointment time.');
    wrap.innerHTML = `<div class="error-state"><p>${errorHeading}</p><p>${errorMessage}</p></div>`;
    console.error('loadAvailability error:', e);
  }
}

window.loadAvailability = loadAvailability;
