import type { StandingRow } from "../../types";

export function StandingsTable({ rows, compact = false }: { rows: StandingRow[]; compact?: boolean }) {
  const visible = compact ? rows.slice(0, 6) : rows;

  return (
    <div className="overflow-x-auto border-2 border-navy-950 bg-white">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-navy-950 text-left text-white">
            <th className="px-3 py-3 font-bold uppercase tracking-wide">#</th>
            <th className="px-3 py-3 font-bold uppercase tracking-wide">Équipe</th>
            <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">J</th>
            <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">G</th>
            <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">P</th>
            {!compact && <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">+/-</th>}
            <th className="px-3 py-3 text-center font-bold uppercase tracking-wide">Pts</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr
              key={row.team}
              className={`border-b-2 border-navy-950 last:border-0 ${row.isClub ? "bg-cta-500/15 font-bold" : "odd:bg-navy-50"}`}
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
