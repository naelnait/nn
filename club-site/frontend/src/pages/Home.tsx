import { Link } from "react-router-dom";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MatchCard } from "../components/home/MatchCard";
import { StandingsTable } from "../components/home/StandingsTable";
import { NewsCard } from "../components/home/NewsCard";
import { PartnersStrip } from "../components/home/PartnersStrip";
import { StaggerHeadline } from "../components/originkit/StaggerHeadline";
import { MagneticLink } from "../components/originkit/MagneticLink";
import { MatchCountdown } from "../components/originkit/MatchCountdown";
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
  const nextIsHomeGame = Boolean(nextMatch.data && club && nextMatch.data.venue === club.venue);

  return (
    <>
      <Seo
        title="Accueil"
        description="Site officiel du CCMB Chartres : résultats, calendrier, classement NM1, actualités et effectif du club."
      />

      <section className="relative overflow-hidden bg-navy-950 text-white">
        <img
          src="/hero/chartres-cathedral.webp"
          srcSet="/hero/chartres-cathedral-sm.webp 960w, /hero/chartres-cathedral.webp 1920w"
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Duotone: recolors the (naturally warm, floodlit) photo into the
            site's blue rather than fighting it with a color-clashing overlay. */}
        <div className="absolute inset-0 bg-accent-600 mix-blend-color" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,16,34,.95)_0%,rgba(7,16,34,.82)_34%,rgba(7,16,34,.45)_62%,rgba(7,16,34,.15)_82%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />
        <a
          href="https://commons.wikimedia.org/wiki/File:France_Eure_et_Loir_Chartres_Cathedrale_nuit_02.jpg"
          target="_blank"
          rel="noreferrer noopener"
          className="absolute bottom-2 right-3 z-10 text-[0.65rem] text-white/35 transition-colors hover:text-white/70"
        >
          Photo : Calips / Wikimedia Commons, CC BY 2.5
        </a>
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
            className="font-display text-[clamp(2.4rem,7vw,5.6rem)] font-black italic uppercase leading-[0.9] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          />
          <p className="max-w-xl text-white/70">
            {club?.description ?? "Le club de basketball de Chartres, tourné vers la performance et la formation."}
          </p>

          {nextIsHomeGame && nextMatch.data && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cta-400">Prochain match à domicile</p>
              <MatchCountdown date={nextMatch.data.date} />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {nextIsHomeGame ? (
              <MagneticLink to="/billetterie" variant="cta">Réserver ma place</MagneticLink>
            ) : (
              <MagneticLink to="/calendrier" variant="primary">Voir le calendrier</MagneticLink>
            )}
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
          {nextMatch.data && (
            <MatchCard match={nextMatch.data} showTicketCta={nextMatch.data.venue === club?.venue} />
          )}
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
