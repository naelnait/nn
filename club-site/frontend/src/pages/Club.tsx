import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { useClub } from "../hooks/useApi";

export default function Club() {
  const { data: club, isLoading, isError } = useClub();

  return (
    <>
      <Seo title="Le Club" description="Histoire, valeurs et identité du CCMB Chartres." />

      <Section eyebrow="Depuis" title={club ? `${club.founded}` : "Le Club"}>
        {isLoading && <Skeleton className="h-32" />}
        {isError && <ErrorState />}
        {club && (
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-lg leading-relaxed text-navy-700">{club.description}</p>
              <h3 className="mt-8 font-display text-2xl font-bold text-navy-900">Notre histoire</h3>
              <p className="mt-3 leading-relaxed text-navy-600">{club.history}</p>
            </div>
            <div className="rounded-3xl border border-navy-100 bg-navy-50 p-6">
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-navy-500">Salle</dt>
                  <dd className="text-navy-900">{club.venue}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-500">Ville</dt>
                  <dd className="text-navy-900">{club.city}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-500">Championnat</dt>
                  <dd className="text-navy-900">{club.league}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-500">Fondation</dt>
                  <dd className="text-navy-900">{club.founded}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Section>

      {club && (
        <Section eyebrow="Notre ADN" title="Nos valeurs" tone="dark">
          <div className="grid gap-6 sm:grid-cols-3">
            {club.values.map((value) => (
              <div key={value.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-display text-xl font-semibold text-cta-400">{value.title}</h3>
                <p className="mt-2 text-sm text-white/70">{value.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
