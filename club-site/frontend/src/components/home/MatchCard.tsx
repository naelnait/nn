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
    <div className={`border-2 bg-white p-5 ${canBuy ? "border-cta-500 shadow-hard-cta" : "border-navy-950 shadow-hard"}`}>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-navy-500">
        <span>{match.competition}{match.matchday ? ` · J${match.matchday}` : ""}</span>
        <span>{formatDate(match.date)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="flex-1 text-right font-display text-lg font-bold uppercase text-navy-900">{match.home}</span>
        <div className="shrink-0 border-2 border-navy-950 bg-navy-950 px-3 py-1.5 text-center">
          {isPlayed ? (
            <span className="font-display text-xl font-bold text-white">
              {match.homeScore}-{match.awayScore}
            </span>
          ) : (
            <span className="font-display text-sm font-bold text-cta-400">{formatTime(match.date)}</span>
          )}
        </div>
        <span className="flex-1 text-left font-display text-lg font-bold uppercase text-navy-900">{match.away}</span>
      </div>

      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-navy-500">{match.venue}</p>

      {canBuy && (
        <Link
          to="/billetterie"
          className="mt-4 flex items-center justify-center gap-1.5 border-2 border-cta-500 bg-cta-500 py-2 text-sm font-bold uppercase tracking-wide text-navy-950 transition-colors hover:bg-navy-950 hover:text-cta-400"
        >
          Réserver ma place
        </Link>
      )}
    </div>
  );
}
