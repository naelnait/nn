import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const { data: club } = useClub();
  const nextMatch = useNextMatch();
  const latestMatch = useLatestMatch();
  const standings = useStandings();
  const news = useNews(1, 3);
  const players = usePlayers();
  const squad = players.data?.filter((p) => !p.staff) ?? [];
  const nextIsHomeGame = Boolean(nextMatch.data && club && nextMatch.data.venue === club.venue);

  const heroRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // Apple's product-page parallax: the image drifts and grows slightly
  // while the copy fades and lifts away as the section scrolls out.
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.18]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <>
      <Seo
        title="Accueil"
        description="Site officiel du CCMB Chartres : résultats, calendrier, classement NM1, actualités et effectif du club."
      />

      <section ref={heroRef} className="relative h-[100vh] min-h-[640px] overflow-hidden bg-navy-950 text-white">
        <motion.img
          src="/hero/chartres-cathedral.webp"
          srcSet="/hero/chartres-cathedral-sm.webp 960w, /hero/chartres-cathedral.webp 1920w"
          sizes="100vw"
          alt=""
          fetchPriority="high"
          style={{ scale: imgScale, opacity: imgOpacity }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Duotone: recolors the (naturally warm, floodlit) photo into the
            site's blue rather than fighting it with a color-clashing overlay. */}
        <div className="absolute inset-0 bg-cta-600 mix-blend-color" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(7,16,34,.9)_0%,rgba(7,16,34,.72)_38%,rgba(7,16,34,.35)_66%,rgba(7,16,34,.1)_88%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-950 to-transparent" />
        <a
          href="https://commons.wikimedia.org/wiki/File:France_Eure_et_Loir_Chartres_Cathedrale_nuit_02.jpg"
          target="_blank"
          rel="noreferrer noopener"
          className="absolute bottom-2 right-3 z-10 text-[0.65rem] text-white/35 transition-colors hover:text-white/70"
        >
          Photo : Calips / Wikimedia Commons, CC BY 2.5
        </a>

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="container-page relative flex h-full flex-col items-start justify-center gap-5"
        >
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13Z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            Le Colisée, Chartres
          </motion.p>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 }}
            className="text-[13px] font-medium uppercase tracking-[0.25em] text-cta-400"
          >
            {club?.league ?? "Nationale Masculine 1"}
          </motion.p>
          <StaggerHeadline
            text={club?.name ?? "CCMB Chartres"}
            className="font-display text-[clamp(2.6rem,7vw,5.75rem)] font-semibold leading-[1.03] tracking-tight"
          />
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
            className="max-w-xl text-lg font-light text-white/60"
          >
            {club?.description ?? "Le club de basketball de Chartres, tourné vers la performance et la formation."}
          </motion.p>

          {nextIsHomeGame && nextMatch.data && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <p className="text-[13px] font-medium text-white/50">Prochain match à domicile</p>
              <MatchCountdown date={nextMatch.data.date} />
            </motion.div>
          )}

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.25 }}
            className="flex flex-wrap gap-3"
          >
            {nextIsHomeGame ? (
              <MagneticLink to="/billetterie" variant="cta">Réserver ma place</MagneticLink>
            ) : (
              <MagneticLink to="/calendrier" variant="primary">Voir le calendrier</MagneticLink>
            )}
            <MagneticLink to="/effectif" variant="ghost">Découvrir l'effectif</MagneticLink>
          </motion.div>
        </motion.div>
      </section>

      {squad.length > 0 && (
        <div className="border-y border-navy-100 bg-navy-950 py-6">
          <p className="container-page mb-3 text-[13px] font-medium text-white/40">Notre effectif</p>
          <PlayerTicker players={squad} />
        </div>
      )}

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
        <Link to="/classement" className="text-sm font-medium text-cta-400 hover:underline">
          Classement complet →
        </Link>
      }>
        {standings.isLoading && <Skeleton className="h-64" />}
        {standings.isError && <ErrorState />}
        {standings.data && <StandingsTable rows={standings.data} compact />}
      </Section>

      <Section eyebrow="Le Club" title="Dernières actualités" action={
        <Link to="/actualites" className="text-sm font-medium text-navy-600 hover:underline">
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
        <Link to="/partenaires" className="text-sm font-medium text-navy-600 hover:underline">
          Voir tous les partenaires →
        </Link>
      }>
        <PartnersStrip />
      </Section>
    </>
  );
}
