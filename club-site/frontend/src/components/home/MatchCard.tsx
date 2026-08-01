import { Link } from "react-router-dom";
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

interface MatchCardProps {
  match: Match;
  /** Home games only — the club doesn't sell tickets for away fixtures. */
  showTicketCta?: boolean;
}

export function MatchCard({ match, showTicketCta = false }: MatchCardProps) {
  const isPlayed = match.status === "played";
  const canBuy = showTicketCta && !isPlayed;

  return (
    <div className={`rounded-3xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-xl ${canBuy ? "border-cta-200" : "border-navy-100"}`}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-navy-400">
        <span>{match.competition}{match.matchday ? ` · J${match.matchday}` : ""}</span>
        <span>{formatDate(match.date)}</span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-display text-lg font-medium text-navy-900">{match.home}</span>
        <div className="shrink-0 rounded-full bg-navy-950 px-4 py-2 text-center">
          {isPlayed ? (
            <span className="font-display text-lg font-semibold text-white">
              {match.homeScore}-{match.awayScore}
            </span>
          ) : (
            <span className="font-display text-sm font-medium text-cta-400">{formatTime(match.date)}</span>
          )}
        </div>
        <span className="flex-1 text-left font-display text-lg font-medium text-navy-900">{match.away}</span>
      </div>

      <p className="mt-4 text-center text-xs text-navy-400">{match.venue}</p>

      {canBuy && (
        <Link
          to="/billetterie"
          className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-cta-500 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-cta-400"
        >
          Réserver ma place
        </Link>
      )}
    </div>
  );
}
