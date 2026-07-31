import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { PlayerAvatar } from "../components/ui/Placeholders";
import { usePlayers } from "../hooks/useApi";

export default function Team() {
  const { data: players, isLoading, isError } = usePlayers();

  return (
    <>
      <Seo title="Effectif" description="Découvrez l'effectif professionnel du CCMB Chartres pour la saison en cours." />
      <Section eyebrow="Saison en cours" title="L'effectif">
        {isLoading && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {players && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {players.map((player) => (
              <div key={player.id} className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
                <PlayerAvatar name={player.name} number={player.number} />
                <div className="p-3">
                  <p className="font-display text-base font-semibold text-navy-900">{player.name}</p>
                  <p className="text-xs uppercase tracking-wide text-navy-400">{player.position}</p>
                  <p className="mt-1 text-xs text-navy-400">{player.height} · {player.birthYear} · {player.nationality}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
