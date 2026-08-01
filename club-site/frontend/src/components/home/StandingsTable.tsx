import type { StandingRow } from "../../types";

export function StandingsTable({ rows, compact = false }: { rows: StandingRow[]; compact?: boolean }) {
  const visible = compact ? rows.slice(0, 6) : rows;

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-navy-950 text-left text-white">
            <th className="px-3 py-3 font-medium">#</th>
            <th className="px-3 py-3 font-medium">Équipe</th>
            <th className="px-3 py-3 text-center font-medium">J</th>
            <th className="px-3 py-3 text-center font-medium">G</th>
            <th className="px-3 py-3 text-center font-medium">P</th>
            {!compact && <th className="px-3 py-3 text-center font-medium">+/-</th>}
            <th className="px-3 py-3 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr
              key={row.team}
              className={`border-b border-navy-50 last:border-0 ${row.isClub ? "bg-accent-500/10 font-semibold" : "odd:bg-navy-50/40"}`}
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
