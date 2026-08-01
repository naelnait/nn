import { Link } from "react-router-dom";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MatchCard } from "../components/home/MatchCard";
import { StandingsTable } from "../components/home/StandingsTable";
import { NewsCard } from "../components/home/NewsCard";
import { PartnersStrip } from "../components/home/PartnersStrip";
import { ChartresSkyline } from "../components/originkit/ChartresSkyline";
import { StaggerHeadline } from "../components/originkit/StaggerHeadline";
import { MagneticLink } from "../components/originkit/MagneticLink";
import { PlayerTicker } from "../components/originkit/PlayerTicker";
import { SupportersTicker } from "../components/originkit/SupportersTicker";
import { useClub, useLatestMatch, useNews, useNextMatch, usePlayers, useStandings } from "../hooks/useApi";

export default function Home() {
  const { data: club } = useClub();
  const nextMatch = useNextMatch();
  const latestMatch = useLatestMatch();
  const standings = useStandings();
  const news = useNews(1, 3);
  const players = usePlayers();
  const squad = players.data?.filter((p) => !p.staff) ?? [];

  return (
    <>
      <Seo
        title="Accueil"
        description="Site officiel du CCMB Chartres : résultats, calendrier, classement NM1, actualités et effectif du club."
      />

      <section className="relative overflow-hidden bg-navy-950 text-white">
        <ChartresSkyline uid="home" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,16,34,.95)_0%,rgba(7,16,34,.78)_32%,rgba(7,16,34,.32)_60%,rgba(7,16,34,0)_78%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />
        <div className="container-page relative flex flex-col items-start gap-6 py-20 sm:py-28">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13Z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            Le Colisée, Chartres
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-400">
            {club?.league ?? "Nationale Masculine 1"}
          </p>
          <StaggerHeadline
            text={club?.name ?? "CCMB Chartres"}
            className="font-display text-6xl font-black italic uppercase leading-[0.9] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] sm:text-7xl lg:text-8xl"
          />
          <p className="max-w-xl text-white/70">
            {club?.description ?? "Le club de basketball de Chartres, tourné vers la performance et la formation."}
          </p>
          <div className="flex flex-wrap gap-3">
            <MagneticLink to="/calendrier" variant="primary">Voir le calendrier</MagneticLink>
            <MagneticLink to="/effectif" variant="ghost">Découvrir l'effectif</MagneticLink>
          </div>

          {squad.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Notre effectif</p>
              <PlayerTicker players={squad} />
            </div>
          )}
        </div>
      </section>

      <SupportersTicker />

      <Section eyebrow="Match" title="Dernier résultat & prochain rendez-vous">
        <div className="grid gap-6 sm:grid-cols-2">
          {latestMatch.isLoading && <Skeleton className="h-40" />}
          {latestMatch.isError && <ErrorState />}
          {latestMatch.data && <MatchCard match={latestMatch.data} />}

          {nextMatch.isLoading && <Skeleton className="h-40" />}
          {nextMatch.isError && <ErrorState />}
          {nextMatch.data && <MatchCard match={nextMatch.data} />}
        </div>
      </Section>

      <Section eyebrow="NM1" title="Classement" tone="dark" action={
        <Link to="/classement" className="text-sm font-semibold text-accent-400 hover:underline">
          Classement complet →
        </Link>
      }>
        {standings.isLoading && <Skeleton className="h-64" />}
        {standings.isError && <ErrorState />}
        {standings.data && <StandingsTable rows={standings.data} compact />}
      </Section>

      <Section eyebrow="Le Club" title="Dernières actualités" action={
        <Link to="/actualites" className="text-sm font-semibold text-navy-700 hover:underline">
          Toutes les actualités →
        </Link>
      }>
        {news.isLoading && (
          <div className="grid gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        )}
        {news.isError && <ErrorState />}
        {news.data && (
          <div className="grid gap-6 sm:grid-cols-3">
            {news.data.items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      <Section eyebrow="Ils nous soutiennent" title="Nos partenaires" action={
        <Link to="/partenaires" className="text-sm font-semibold text-navy-700 hover:underline">
          Voir tous les partenaires →
        </Link>
      }>
        <PartnersStrip />
      </Section>
    </>
  );
}
