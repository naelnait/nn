import type { Player } from "../../types";

/**
 * Two rows of jersey cards drifting in opposite directions, adapted from
 * OriginKit's eye-gallery concept (two arcing photo rows) onto our
 * generated jersey-number cards since no real player photos exist.
 * Pure CSS animation — respects prefers-reduced-motion globally.
 */
function hashHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function TickerRow({ players, reverse }: { players: Player[]; reverse?: boolean }) {
  const loop = [...players, ...players];
  return (
    <div className="flex w-max animate-[ticker_28s_linear_infinite] gap-4" style={reverse ? { animationDirection: "reverse" } : undefined}>
      {loop.map((p, i) => {
        const hue = hashHue(p.name);
        return (
          <div
            key={`${p.id}-${i}`}
            className="flex w-56 shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 backdrop-blur-sm"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-display text-lg font-bold text-white/90"
              style={{ background: `linear-gradient(150deg, hsl(${hue} 60% 32%), hsl(${hue} 60% 18%))` }}
              aria-hidden="true"
            >
              {p.number}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{p.name}</span>
              <span className="block truncate text-[0.68rem] uppercase tracking-wide text-white/50">{p.position}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PlayerTicker({ players }: { players: Player[] }) {
  if (players.length === 0) return null;
  const half = Math.ceil(players.length / 2);
  const rowA = players.slice(0, half);
  const rowB = players.slice(half).length ? players.slice(half) : players;

  return (
    <div
      className="mt-10 space-y-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      aria-hidden="true"
    >
      <TickerRow players={rowA} />
      <TickerRow players={rowB} reverse />
    </div>
  );
}
