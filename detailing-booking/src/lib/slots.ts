// Calcul des créneaux disponibles. Mêmes règles que create_booking (supabase/schema.sql) :
// le serveur reste l'autorité, ce module sert à n'afficher que des créneaux valides.
import type { BookingErrorCode, Interval, LocationType, OpeningHour, PublicSettings } from './types';
import { type DayKey, parseHHMM, weekdayOf, zonedParts, zonedTime } from './time';

export interface SlotRules {
  tz: string;
  stepMin: number;
  minNoticeMin: number;
  maxDaysAhead: number;
  hours: OpeningHour[];
  /** Plages occupées, temps tampon des RDV existants inclus. */
  busy: Interval[];
  now: Date;
}

export function rulesFrom(settings: PublicSettings, hours: OpeningHour[], busy: Interval[], now = new Date()): SlotRules {
  return {
    tz: settings.timezone,
    stepMin: settings.slot_step_min,
    minNoticeMin: settings.min_notice_hours * 60,
    maxDaysAhead: settings.max_days_ahead,
    hours,
    busy,
    now,
  };
}

/** Temps tampon après une prestation : nettoyage du matériel, plus trajet si à domicile. */
export function bufferAfter(settings: Pick<PublicSettings, 'cleanup_buffer_min' | 'travel_buffer_min'>, location: LocationType): number {
  return settings.cleanup_buffer_min + (location === 'home' ? settings.travel_buffer_min : 0);
}

const MIN = 60_000;

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/** Vérifie un créneau. Renvoie null s'il est réservable, sinon le code d'erreur. */
export function checkSlot(start: Date, durationMin: number, bufferMin: number, r: SlotRules): BookingErrorCode | null {
  if (start.getTime() < r.now.getTime() + r.minNoticeMin * MIN) return 'TOO_SOON';
  if (start.getTime() > r.now.getTime() + r.maxDaysAhead * 1440 * MIN) return 'TOO_FAR';

  const p = zonedParts(start, r.tz);
  const minutes = p.hour * 60 + p.minute;
  const fits = p.second === 0 && start.getMilliseconds() === 0 && r.hours.some((h) => {
    const open = parseHHMM(h.open_time);
    const close = parseHHMM(h.close_time);
    return h.weekday === p.weekday && minutes >= open && minutes + durationMin <= close && (minutes - open) % r.stepMin === 0;
  });
  if (!fits) return 'OUTSIDE_HOURS';

  const occupied: Interval = { start, end: new Date(start.getTime() + (durationMin + bufferMin) * MIN) };
  if (r.busy.some((b) => overlaps(occupied, b))) return 'SLOT_TAKEN';
  return null;
}

/** Créneaux réservables d'une journée (heure de Paris). */
export function daySlots(day: DayKey, durationMin: number, bufferMin: number, r: SlotRules): Date[] {
  const weekday = weekdayOf(day);
  const out: Date[] = [];
  const seen = new Set<number>();
  const ranges = r.hours.filter((h) => h.weekday === weekday).sort((a, b) => parseHHMM(a.open_time) - parseHHMM(b.open_time));
  for (const h of ranges) {
    const open = parseHHMM(h.open_time);
    const close = parseHHMM(h.close_time);
    for (let m = open; m + durationMin <= close; m += r.stepMin) {
      const start = zonedTime(day, m, r.tz);
      if (seen.has(start.getTime())) continue;
      seen.add(start.getTime());
      if (checkSlot(start, durationMin, bufferMin, r) === null) out.push(start);
    }
  }
  return out;
}
