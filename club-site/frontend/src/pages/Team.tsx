import { motion, useReducedMotion } from "framer-motion";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { PlayerPortrait } from "../components/originkit/PlayerPortrait";
import { usePlayers } from "../hooks/useApi";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function Team() {
  const { data: players, isLoading, isError } = usePlayers();
  const reduced = useReducedMotion();

  return (
    <>
      <Seo title="Effectif" description="Découvrez l'effectif professionnel du CCMB Chartres pour la saison en cours." />
      <Section eyebrow="Saison en cours" title="L'effectif">
        {isLoading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {players && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {players.map((player, i) => (
              <motion.article
                key={player.id}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: reduced ? 0 : i * 0.04 }}
                tabIndex={0}
                className="group overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              >
                <PlayerPortrait player={player} />
                <div className="p-3">
                  <p className="font-display text-base font-semibold text-navy-900">{player.name}</p>
                  <p className="text-xs uppercase tracking-wide text-accent-700">{player.position}</p>
                  <p className="mt-1 text-xs tabular-nums text-navy-400">
                    {player.height} · {player.birthYear} · {player.nationality}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
