import { usePartners } from "../../hooks/useApi";
import { Skeleton } from "../ui/Skeleton";
import { PartnerBadge } from "../ui/Placeholders";

export function PartnersStrip() {
  const { data, isLoading } = usePartners();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {(data ?? []).slice(0, 12).map((partner) => (
        <a key={partner.id} href={partner.url} target="_blank" rel="noreferrer noopener">
          <PartnerBadge name={partner.name} />
        </a>
      ))}
    </div>
  );
}
