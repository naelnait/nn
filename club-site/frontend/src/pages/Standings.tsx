import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { StandingsTable } from "../components/home/StandingsTable";
import { useStandings } from "../hooks/useApi";

export default function Standings() {
  const { data: standings, isLoading, isError } = useStandings();

  return (
    <>
      <Seo title="Classement" description="Classement complet de la poule NM1 avec le CCMB Chartres." />
      <Section eyebrow="NM1" title="Classement">
        {isLoading && <Skeleton className="h-96" />}
        {isError && <ErrorState />}
        {standings && <StandingsTable rows={standings} />}
      </Section>
    </>
  );
}
