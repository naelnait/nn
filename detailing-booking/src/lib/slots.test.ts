import { describe, expect, it } from 'vitest';
import { bufferAfter, checkSlot, daySlots, type SlotRules } from './slots';
import { formatTime, zonedTime } from './time';
import type { OpeningHour } from './types';

const TZ = 'Europe/Paris';
const hours: OpeningHour[] = [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, open_time: '08:30', close_time: '18:30' }));
// Lundi 16 novembre 2026
const monday = { year: 2026, month: 11, day: 16 };
const at = (h: number, m = 0, day = monday) => zonedTime(day, h * 60 + m, TZ);

function rules(busy: SlotRules['busy'] = []): SlotRules {
  return { tz: TZ, stepMin: 30, minNoticeMin: 12 * 60, maxDaysAhead: 60, hours, busy, now: new Date('2026-11-14T12:00:00Z') };
}

describe('créneaux', () => {
  it('convertit l’heure de Paris (hiver UTC+1, été UTC+2)', () => {
    expect(at(9).toISOString()).toBe('2026-11-16T08:00:00.000Z');
    expect(zonedTime({ year: 2026, month: 7, day: 6 }, 9 * 60, TZ).toISOString()).toBe('2026-07-06T07:00:00.000Z');
  });

  it('propose des créneaux qui finissent avant la fermeture', () => {
    const slots = daySlots(monday, 270, 75, rules());
    expect(formatTime(slots[0])).toBe('08:30');
    expect(formatTime(slots[slots.length - 1])).toBe('14:00'); // 14:00 + 4h30 = 18:30
  });

  it('respecte le temps tampon des RDV existants et du nouveau RDV', () => {
    // RDV existant 09:00-13:30, occupé jusqu’à 14:45 (tampon 75 min)
    const busy = [{ start: at(9), end: at(14, 45) }];
    const slots = daySlots(monday, 150, 75, rules(busy)).map((d) => formatTime(d));
    expect(slots).not.toContain('08:30'); // 08:30 + 150 + 75 = 12:15 > 09:00
    expect(slots).not.toContain('14:30');
    expect(slots[0]).toBe('15:00');
    expect(slots[slots.length - 1]).toBe('16:00');
  });

  it('refuse dimanche, hors grille, trop tôt et trop tard', () => {
    const r = rules();
    expect(checkSlot(at(20, 0, { year: 2026, month: 11, day: 14 }), 150, 30, r)).toBe('TOO_SOON'); // 7 h après « maintenant »
    expect(checkSlot(at(9, 0, { year: 2026, month: 11, day: 22 }), 150, 30, r)).toBe('OUTSIDE_HOURS');
    expect(checkSlot(at(9, 10), 150, 30, r)).toBe('OUTSIDE_HOURS');
    expect(checkSlot(at(17), 150, 30, r)).toBe('OUTSIDE_HOURS');
    expect(checkSlot(at(9, 0, { year: 2027, month: 2, day: 1 }), 150, 30, r)).toBe('TOO_FAR');
    expect(checkSlot(at(9), 150, 30, r)).toBeNull();
  });

  it('ajoute le trajet au tampon pour le domicile', () => {
    const s = { cleanup_buffer_min: 30, travel_buffer_min: 45 };
    expect(bufferAfter(s, 'home')).toBe(75);
    expect(bufferAfter(s, 'atelier')).toBe(30);
  });
});
