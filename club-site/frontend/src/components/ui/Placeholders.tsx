function hashIndex(seed: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

// Stand-ins for missing photos stay inside the brand's blue family instead
// of a random hue per item — only the pairing varies.
const GRADIENTS = [
  "linear-gradient(135deg, #2f54a8, #0b1f4b)",
  "linear-gradient(135deg, #0284c7, #070f26)",
  "linear-gradient(135deg, #1f3d84, #070f26)",
  "linear-gradient(135deg, #4f74c4, #111f42)",
];

export function MediaPlaceholder({
  seed,
  label,
  ratio = "aspect-[4/3]",
  className = "",
}: {
  seed: string;
  label?: string;
  ratio?: string;
  className?: string;
}) {
  const gradient = GRADIENTS[hashIndex(seed, GRADIENTS.length)];
  return (
    <div
      className={`relative flex ${ratio} items-center justify-center overflow-hidden ${className}`}
      style={{ background: gradient }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18M4.5 6.5a13 13 0 0 0 15 0M4.5 17.5a13 13 0 0 1 15 0" />
      </svg>
      {label && (
        <span className="absolute bottom-2 left-2 rounded bg-black/30 px-2 py-0.5 text-xs font-medium text-white/80">
          {label}
        </span>
      )}
    </div>
  );
}
