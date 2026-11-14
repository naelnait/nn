import { type DayKey, addDays, dayKeyString, sameDay, weekdayOf } from '../lib/time';

interface Props {
  month: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
  minMonth: { year: number; month: number };
  maxMonth: { year: number; month: number };
  selected: DayKey | null;
  onSelect: (d: DayKey) => void;
  /** Nombre de créneaux libres par jour (clé AAAA-MM-JJ). */
  availability: Map<string, number>;
  today: DayKey;
}

const WEEKDAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const monthIndex = (m: { year: number; month: number }) => m.year * 12 + m.month - 1;
const fromIndex = (i: number) => ({ year: Math.floor(i / 12), month: (i % 12) + 1 });

export function Calendar({ month, onMonthChange, minMonth, maxMonth, selected, onSelect, availability, today }: Props) {
  const first: DayKey = { year: month.year, month: month.month, day: 1 };
  const lead = weekdayOf(first) - 1;
  const daysInMonth = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
  const cells: (DayKey | null)[] = [...Array(lead).fill(null)];
  for (let d = 0; d < daysInMonth; d++) cells.push(addDays(first, d));
  while (cells.length % 7) cells.push(null);

  const label = new Date(Date.UTC(month.year, month.month - 1, 15)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const idx = monthIndex(month);

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="icon-btn" aria-label="Mois précédent" disabled={idx <= monthIndex(minMonth)}
                onClick={() => onMonthChange(fromIndex(idx - 1))}>‹</button>
        <strong className="calendar-title">{label}</strong>
        <button type="button" className="icon-btn" aria-label="Mois suivant" disabled={idx >= monthIndex(maxMonth)}
                onClick={() => onMonthChange(fromIndex(idx + 1))}>›</button>
      </div>
      <div className="calendar-grid" role="grid">
        {WEEKDAYS.map((w) => <div key={w} className="calendar-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const n = availability.get(dayKeyString(d)) ?? 0;
          const isSel = selected && sameDay(d, selected);
          return (
            <button key={dayKeyString(d)} type="button" disabled={n === 0}
                    className={`calendar-day${isSel ? ' selected' : ''}${sameDay(d, today) ? ' today' : ''}`}
                    aria-pressed={!!isSel}
                    aria-label={`${d.day}, ${n} créneau${n > 1 ? 'x' : ''} libre${n > 1 ? 's' : ''}`}
                    onClick={() => onSelect(d)}>
              <span>{d.day}</span>
              {n > 0 && <i className="dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
