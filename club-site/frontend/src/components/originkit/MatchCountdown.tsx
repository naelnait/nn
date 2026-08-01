import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

function timeLeft(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { days, hours, minutes, ended: diff <= 0 };
}

/**
 * Countdown to a real match date — no invented scarcity, just the actual
 * kickoff time, styled to read as urgency (the ui-ux-pro-max "Kinetic
 * Typography" profile: oversized numerals, high contrast).
 */
export function MatchCountdown({ date }: { date: string }) {
  const reduced = useReducedMotion();
  const [left, setLeft] = useState(() => timeLeft(date));

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setLeft(timeLeft(date)), 60_000);
    return () => clearInterval(id);
  }, [date, reduced]);

  if (left.ended) return null;

  const units: { value: number; label: string }[] = [
    { value: left.days, label: left.days > 1 ? "jours" : "jour" },
    { value: left.hours, label: "heures" },
    { value: left.minutes, label: "min" },
  ];

  return (
    <div className="flex items-center gap-3" aria-label={`Prochain match dans ${left.days} jours, ${left.hours} heures et ${left.minutes} minutes`}>
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center border-2 border-cta-500 px-3 py-1.5">
          <span className="font-display text-xl font-bold tabular-nums text-cta-400">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-white/60">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
