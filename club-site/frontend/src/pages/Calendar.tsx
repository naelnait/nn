import { useState } from "react";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MatchCard } from "../components/home/MatchCard";
import { useClub, useMatches } from "../hooks/useApi";

type Filter = "all" | "played" | "upcoming";

export default function Calendar() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: matches, isLoading, isError } = useMatches(filter === "all" ? undefined : filter);
  const { data: club } = useClub();

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "played", label: "Résultats" },
    { key: "upcoming", label: "À venir" },
  ];

  return (
    <>
      <Seo title="Calendrier" description="Calendrier complet des matchs du CCMB Chartres : résultats et rencontres à venir." />
      <Section eyebrow="Saison" title="Calendrier & résultats" action={
        <div className="inline-flex rounded-md border border-navy-200 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key ? "bg-navy-950 text-white" : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }>
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {matches && matches.length === 0 && <p className="text-navy-500">Aucun match à afficher.</p>}
        {matches && matches.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} showTicketCta={match.venue === club?.venue} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
