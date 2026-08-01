import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { PartnerGrid } from "../components/originkit/PartnerGrid";
import { usePartners } from "../hooks/useApi";
import type { Partner } from "../types";

const tierLabels: Record<Partner["tier"], string> = {
  institutionnel: "Nos partenaires institutionnels",
  majeur: "Nos partenaires majeurs",
  officiel: "Nos partenaires officiels",
};

export default function Partners() {
  const { data: partners, isLoading, isError } = usePartners();

  const grouped = partners?.reduce<Record<string, Partner[]>>((acc, partner) => {
    (acc[partner.tier] ??= []).push(partner);
    return acc;
  }, {});

  return (
    <>
      <Seo title="Partenaires" description="Découvrez les partenaires qui accompagnent le CCMB Chartres." />
      <Section eyebrow="Merci à eux" title="Nos partenaires">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {grouped && (
          <div className="space-y-10">
            {(["institutionnel", "majeur", "officiel"] as const).map((tier) =>
              grouped[tier]?.length ? (
                <div key={tier}>
                  <h3 className="mb-4 font-display text-xl font-semibold text-navy-800">{tierLabels[tier]}</h3>
                  <PartnerGrid partners={grouped[tier]} />
                </div>
              ) : null
            )}
          </div>
        )}
      </Section>
    </>
  );
}
