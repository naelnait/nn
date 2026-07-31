import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { PartnerBadge } from "../components/ui/Placeholders";
import { usePartners } from "../hooks/useApi";
import type { Partner } from "../types";

const tierLabels: Record<Partner["tier"], string> = {
  gold: "Partenaires Or",
  silver: "Partenaires Argent",
  bronze: "Partenaires Bronze",
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {grouped && (
          <div className="space-y-10">
            {(["gold", "silver", "bronze"] as const).map((tier) =>
              grouped[tier]?.length ? (
                <div key={tier}>
                  <h3 className="mb-4 font-display text-xl font-semibold text-navy-800">{tierLabels[tier]}</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {grouped[tier].map((partner) => (
                      <a key={partner.id} href={partner.url} target="_blank" rel="noreferrer noopener">
                        <PartnerBadge name={partner.name} />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </Section>
    </>
  );
}
