import { motion, useReducedMotion } from "framer-motion";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { PlayerPortrait } from "../components/originkit/PlayerPortrait";
import { usePlayers } from "../hooks/useApi";
import type { Player } from "../types";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function PersonCard({ person, index, reduced }: { person: Player; index: number; reduced: boolean | null }) {
  // Only show details the club actually publishes.
  const details = [person.height, person.nationality].filter(Boolean).join(" · ");

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: reduced ? 0 : index * 0.04 }}
      tabIndex={0}
      className="group overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-500"
    >
      <PlayerPortrait player={person} />
      <div className="flex items-baseline gap-2 p-4">
        {person.number != null && (
          <span className="font-display text-sm font-semibold tabular-nums text-cta-600">#{person.number}</span>
        )}
        <span className="min-w-0">
          <span className="block truncate font-display text-base font-medium text-navy-950">{person.name}</span>
          {(person.role || person.position) && (
            <span className="block text-xs uppercase tracking-wide text-navy-500">
              {person.role ?? person.position}
              {details && <span className="tabular-nums"> · {details}</span>}
            </span>
          )}
        </span>
      </div>
    </motion.article>
  );
}

export default function Team() {
  const { data: people, isLoading, isError } = usePlayers();
  const reduced = useReducedMotion();

  const squad = people?.filter((p) => !p.staff) ?? [];
  const staff = people?.filter((p) => p.staff) ?? [];

  return (
    <>
      <Seo title="Effectif" description="L'effectif et le staff du CCMB Chartres pour la saison en cours." />

      <Section eyebrow="Saison en cours" title="L'effectif">
        {isLoading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {squad.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {squad.map((player, i) => (
              <PersonCard key={player.id} person={player} index={i} reduced={reduced} />
            ))}
          </div>
        )}
      </Section>

      {staff.length > 0 && (
        <Section eyebrow="Autour de l'équipe" title="Le staff">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {staff.map((member, i) => (
              <PersonCard key={member.id} person={member} index={i} reduced={reduced} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
