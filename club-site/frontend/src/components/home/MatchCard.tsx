import type { Match } from "../../types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function MatchCard({ match }: { match: Match }) {
  const isPlayed = match.status === "played";
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-navy-400">
        <span>{match.competition}{match.matchday ? ` · J${match.matchday}` : ""}</span>
        <span>{formatDate(match.date)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-display text-lg font-semibold text-navy-900">{match.home}</span>
        <div className="shrink-0 rounded-md bg-navy-950 px-3 py-1.5 text-center">
          {isPlayed ? (
            <span className="font-display text-xl font-bold text-white">
              {match.homeScore}-{match.awayScore}
            </span>
          ) : (
            <span className="font-display text-sm font-semibold text-accent-400">{formatTime(match.date)}</span>
          )}
        </div>
        <span className="flex-1 text-left font-display text-lg font-semibold text-navy-900">{match.away}</span>
      </div>

      <p className="mt-3 text-center text-xs text-navy-400">{match.venue}</p>
    </div>
  );
}
