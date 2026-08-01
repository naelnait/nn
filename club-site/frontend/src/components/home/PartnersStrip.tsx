import { usePartners } from "../../hooks/useApi";
import { Skeleton } from "../ui/Skeleton";
import { PartnerGrid } from "../originkit/PartnerGrid";

export function PartnersStrip() {
  const { data, isLoading } = usePartners();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return <PartnerGrid partners={(data ?? []).slice(0, 12)} />;
}
