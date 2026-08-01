import { Link } from "react-router-dom";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MatchCard } from "../components/home/MatchCard";
import { StandingsTable } from "../components/home/StandingsTable";
import { NewsCard } from "../components/home/NewsCard";
import { PartnersStrip } from "../components/home/PartnersStrip";
import { useClub, useLatestMatch, useNews, useNextMatch, useStandings } from "../hooks/useApi";

export default function Home() {
  const { data: club } = useClub();
  const nextMatch = useNextMatch();
  const latestMatch = useLatestMatch();
  const standings = useStandings();
  const news = useNews(1, 3);

  return (
    <>
      <Seo
        title="Accueil"
        description="Site officiel du CCMB Chartres : résultats, calendrier, classement NM1, actualités et effectif du club."
      />

      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(63,101,196,0.28),_transparent_55%)]" />
        <div className="container-page relative flex flex-col items-start gap-6 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-400">
            {club?.league ?? "Nationale Masculine 1"}
          </p>
          <h1 className="font-display text-4xl font-bold uppercase leading-tight sm:text-6xl">
            {club?.name ?? "CCMB Chartres"}
          </h1>
          <p className="max-w-xl text-white/70">
            {club?.description ?? "Le club de basketball de Chartres, tourné vers la performance et la formation."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/calendrier" className="rounded-md bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-400">
              Voir le calendrier
            </Link>
            <Link to="/effectif" className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Découvrir l'effectif
            </Link>
          </div>
        </div>
      </section>

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
