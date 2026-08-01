import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MatchCountdown } from "../components/originkit/MatchCountdown";
import { MagneticLink } from "../components/originkit/MagneticLink";
import { useClub, useMatches } from "../hooks/useApi";

const TIERS = [
  { name: "Tarif réduit", price: "8 €", desc: "Étudiants, moins de 18 ans, demandeurs d'emploi" },
  { name: "Tarif plein", price: "12 €", desc: "Place numérotée, tribune principale" },
  { name: "Carte 10 matchs", price: "90 €", desc: "Valable toute la saison, transmissible" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default function Billetterie() {
  const { data: club } = useClub();
  const { data: matches, isLoading, isError } = useMatches("upcoming");
  const homeMatches = (matches ?? []).filter((m) => club && m.venue === club.venue);

  return (
    <>
      <Seo
        title="Billetterie"
        description="Réservez votre place pour les prochains matchs à domicile du CCMB Chartres au Colisée de Chartres."
      />

      <section className="bg-navy-950 py-16 text-white">
        <div className="container-page">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cta-400">Billetterie</p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
            Vivez chaque match du Colisée
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Rejoignez les supporters du CCMB pour un match à domicile. Places disponibles en ligne ou au guichet
            le soir même.
          </p>

          {isLoading && <Skeleton className="mt-8 h-24 max-w-md" />}
          {isError && <ErrorState />}
          {homeMatches[0] && (
            <div className="mt-8 inline-flex flex-col gap-3 border-2 border-white/30 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Prochain match à domicile</p>
              <p className="font-display text-xl font-bold">
                {homeMatches[0].home} vs {homeMatches[0].away}
              </p>
              <p className="text-sm text-white/60">{formatDate(homeMatches[0].date)} · {homeMatches[0].venue}</p>
              <MatchCountdown date={homeMatches[0].date} />
            </div>
          )}
          {!isLoading && homeMatches.length === 0 && (
            <p className="mt-8 text-white/60">Aucun match à domicile programmé pour le moment.</p>
          )}
        </div>
      </section>

      <Section eyebrow="Tarifs" title="Choisissez votre place">
        <div className="grid gap-6 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div key={tier.name} className="border-2 border-navy-950 bg-white p-6 shadow-hard">
              <p className="text-sm font-bold uppercase tracking-wide text-cta-600">{tier.name}</p>
              <p className="mt-2 font-display text-3xl font-bold text-navy-950">{tier.price}</p>
              <p className="mt-2 text-sm text-navy-500">{tier.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {homeMatches.length > 0 && (
        <Section eyebrow="Calendrier" title="Tous les matchs à domicile" tone="dark">
          <div className="grid gap-4 sm:grid-cols-2">
            {homeMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-2 border-white/30 bg-white/5 p-4">
                <div>
                  <p className="font-display font-bold uppercase text-white">{m.home} vs {m.away}</p>
                  <p className="text-sm text-white/50">{formatDate(m.date)}</p>
                </div>
                <MagneticLink to="/contact" variant="cta" className="!px-4 !py-2 text-xs">
                  Réserver
                </MagneticLink>
              </div>
            ))}
          </div>
        </Section>
      )}

      <p className="container-page py-8 text-center text-xs text-navy-400">
        Billetterie de démonstration — pour une vraie réservation, contactez le club via la page{" "}
        <a href="/contact" className="underline hover:text-navy-600">Contact</a>.
      </p>
    </>
  );
}
