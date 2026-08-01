import type { StandingRow } from "../../types";

export function StandingsTable({ rows, compact = false }: { rows: StandingRow[]; compact?: boolean }) {
  const visible = compact ? rows.slice(0, 6) : rows;

  return (
    <div className="overflow-x-auto rounded-3xl border border-navy-100 bg-white shadow-sm">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-navy-950 text-left text-white">
            <th className="px-4 py-3.5 font-medium uppercase tracking-wide text-white/70">#</th>
            <th className="px-4 py-3.5 font-medium uppercase tracking-wide text-white/70">Équipe</th>
            <th className="px-4 py-3.5 text-center font-medium uppercase tracking-wide text-white/70">J</th>
            <th className="px-4 py-3.5 text-center font-medium uppercase tracking-wide text-white/70">G</th>
            <th className="px-4 py-3.5 text-center font-medium uppercase tracking-wide text-white/70">P</th>
            {!compact && <th className="px-4 py-3.5 text-center font-medium uppercase tracking-wide text-white/70">+/-</th>}
            <th className="px-4 py-3.5 text-center font-medium uppercase tracking-wide text-white/70">Pts</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr
              key={row.team}
              className={`border-b border-navy-100 last:border-0 ${row.isClub ? "bg-cta-500/10 font-semibold" : ""}`}
            >
              <td className="px-3 py-2.5 text-navy-500">{row.rank}</td>
              <td className="px-3 py-2.5 text-navy-900">{row.team}</td>
              <td className="px-3 py-2.5 text-center text-navy-600">{row.played}</td>
              <td className="px-3 py-2.5 text-center text-navy-600">{row.won}</td>
              <td className="px-3 py-2.5 text-center text-navy-600">{row.lost}</td>
              {!compact && (
                <td className="px-3 py-2.5 text-center text-navy-600">
                  {row.pointsFor - row.pointsAgainst > 0 ? "+" : ""}
                  {row.pointsFor - row.pointsAgainst}
                </td>
              )}
              <td className="px-3 py-2.5 text-center font-bold text-navy-900">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
