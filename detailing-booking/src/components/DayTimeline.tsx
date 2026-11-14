// Frise de la journée : horaires d'ouverture, plages déjà prises, créneau choisi et son temps tampon.
import type { Interval, OpeningHour } from '../lib/types';
import { type DayKey, parseHHMM, weekdayOf, zonedTime } from '../lib/time';

interface Props {
  day: DayKey;
  tz: string;
  hours: OpeningHour[];
  busy: Interval[];
  selected: { start: Date; durationMin: number; bufferMin: number } | null;
}

export function DayTimeline({ day, tz, hours, busy, selected }: Props) {
  const ranges = hours.filter((h) => h.weekday === weekdayOf(day));
  if (!ranges.length) return null;
  const open = Math.min(...ranges.map((h) => parseHHMM(h.open_time)));
  const close = Math.max(...ranges.map((h) => parseHHMM(h.close_time)));
  const t0 = zonedTime(day, open, tz).getTime();
  const t1 = zonedTime(day, close, tz).getTime();
  const span = t1 - t0;
  const pct = (t: number) => `${Math.max(0, Math.min(100, ((t - t0) / span) * 100))}%`;
  const width = (a: number, b: number) => `${Math.max(0, ((Math.min(b, t1) - Math.max(a, t0)) / span) * 100)}%`;

  // Graduations toutes les 2 heures pleines
  const ticks: number[] = [];
  for (let m = Math.ceil(open / 120) * 120; m <= close; m += 120) ticks.push(m);

  // Pauses entre plages d'ouverture
  const sorted = [...ranges].sort((x, y) => parseHHMM(x.open_time) - parseHHMM(y.open_time));
  const gaps: [number, number][] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push([parseHHMM(sorted[i - 1].close_time), parseHHMM(sorted[i].open_time)]);

  const sel = selected
    ? {
        s: selected.start.getTime(),
        e: selected.start.getTime() + selected.durationMin * 60_000,
        b: selected.start.getTime() + (selected.durationMin + selected.bufferMin) * 60_000,
      }
    : null;

  return (
    <div className="timeline" aria-hidden="true">
      <div className="timeline-track">
        {gaps.map(([a, b]) => {
          const ta = zonedTime(day, a, tz).getTime();
          const tb = zonedTime(day, b, tz).getTime();
          return <span key={a} className="tl-closed" style={{ left: pct(ta), width: width(ta, tb) }} />;
        })}
        {busy.filter((x) => x.end.getTime() > t0 && x.start.getTime() < t1).map((x) => (
          <span key={x.start.getTime()} className="tl-busy" style={{ left: pct(x.start.getTime()), width: width(x.start.getTime(), x.end.getTime()) }} />
        ))}
        {sel && (
          <>
            <span className="tl-sel" style={{ left: pct(sel.s), width: width(sel.s, sel.e) }} />
            <span className="tl-buffer" style={{ left: pct(sel.e), width: width(sel.e, sel.b) }} />
          </>
        )}
        {ticks.map((m) => <span key={m} className="tl-tick" style={{ left: pct(zonedTime(day, m, tz).getTime()) }} />)}
      </div>
      <div className="timeline-scale">
        {ticks.map((m) => <span key={m} style={{ left: pct(zonedTime(day, m, tz).getTime()) }}>{Math.floor(m / 60)}h</span>)}
      </div>
      <div className="timeline-legend">
        <span><i className="tl-key busy" /> Déjà pris</span>
        <span><i className="tl-key sel" /> Votre RDV</span>
        <span><i className="tl-key buffer" /> Préparation et trajet</span>
      </div>
    </div>
  );
}
