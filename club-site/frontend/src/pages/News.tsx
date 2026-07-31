import { useState } from "react";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { NewsCard } from "../components/home/NewsCard";
import { useNews } from "../hooks/useApi";

export default function News() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useNews(page, 6);

  return (
    <>
      <Seo title="Actualités" description="Toutes les actualités du CCMB Chartres : résultats, transferts, vie du club." />
      <Section eyebrow="Le Club" title="Actualités">
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {data && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-sm text-navy-500">
                  Page {data.page} / {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  className="rounded-md border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </Section>
    </>
  );
}
