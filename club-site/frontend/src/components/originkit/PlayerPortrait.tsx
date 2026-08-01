import { useState } from "react";
import type { Player } from "../../types";

/**
 * Player portrait. Uses the real photo from /public/players when the file
 * exists, and otherwise draws a stylised jersey illustration so the roster
 * still reads as a designed grid rather than a wall of empty boxes.
 *
 * The illustration stays inside the club palette — depth comes from the
 * navy/blue range, not from hue-shifting each player.
 */
function seedOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Four blue grounds so the grid has rhythm without leaving the palette.
const GROUNDS = [
  { from: "#16305e", to: "#0b1f4b" },
  { from: "#1f3d84", to: "#111f42" },
  { from: "#2f54a8", to: "#16305e" },
  { from: "#0f2748", to: "#070f26" },
];

function JerseyIllustration({ player }: { player: Player }) {
  const seed = seedOf(player.name);
  const ground = GROUNDS[seed % GROUNDS.length];
  const uid = player.id;
  // Slight horizontal shift so the figures aren't rubber-stamped.
  const lean = (seed % 3) - 1;

  return (
    <svg viewBox="0 0 300 360" className="h-full w-full" role="img" aria-label={`${player.name}, maillot ${player.number}`}>
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ground.from} />
          <stop offset="100%" stopColor={ground.to} />
        </linearGradient>
        <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ground.to} stopOpacity="0" />
          <stop offset="100%" stopColor={ground.to} stopOpacity="0.85" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect width="300" height="360" />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <rect width="300" height="360" fill={`url(#g-${uid})`} />

        {/* Half-court markings behind the figure */}
        <g stroke="#ffffff" strokeOpacity="0.09" strokeWidth="2" fill="none">
          <circle cx="150" cy="300" r="86" />
          <circle cx="150" cy="300" r="140" />
          <line x1="0" y1="300" x2="300" y2="300" />
        </g>

        <g transform={`translate(${lean * 8},0)`}>
          {/* Shoulders and torso */}
          <path
            d="M150 150 c34 0 62 14 74 38 l14 172 h-176 l14-172 c12-24 40-38 74-38Z"
            fill="#ffffff"
            fillOpacity="0.93"
          />
          {/* Jersey straps */}
          <path d="M108 178 c14-16 26-22 42-24 v34 c-18 2-30 6-42 14Z" fill={ground.from} fillOpacity="0.5" />
          <path d="M192 178 c-14-16-26-22-42-24 v34 c18 2 30 6 42 14Z" fill={ground.from} fillOpacity="0.5" />
          {/* Head */}
          <circle cx="150" cy="106" r="42" fill="#ffffff" fillOpacity="0.93" />
          {/* Jersey number */}
          <text
            x="150"
            y="278"
            textAnchor="middle"
            fontFamily="'Barlow Condensed','Arial Narrow',sans-serif"
            fontSize="96"
            fontWeight="700"
            fill={ground.to}
          >
            {player.number}
          </text>
        </g>

        <rect y="230" width="300" height="130" fill={`url(#fade-${uid})`} />
      </g>
    </svg>
  );
}

export function PlayerPortrait({ player }: { player: Player }) {
  const [failed, setFailed] = useState(false);
  const hasPhoto = Boolean(player.photo) && !failed;

  return (
    <div className="relative aspect-[5/6] overflow-hidden bg-navy-900">
      {hasPhoto ? (
        <img
          src={player.photo}
          alt={player.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
          <JerseyIllustration player={player} />
        </div>
      )}

      {/* Shimmer: a light band sweeps across the portrait on hover. */}
      <span className="player-shimmer pointer-events-none absolute inset-0" aria-hidden="true" />

      <span className="pointer-events-none absolute left-2 top-2 rounded bg-navy-950/70 px-2 py-0.5 font-display text-xs font-bold tabular-nums text-white">
        {player.number}
      </span>
    </div>
  );
}
