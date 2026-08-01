import { useState } from "react";
import type { Partner } from "../../types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Renders a partner's real logo from /public/partners when the file is
 * present, and falls back to an initials monogram otherwise — so the wall
 * stays complete whether or not a given partner has supplied artwork.
 */
export function PartnerMark({ partner }: { partner: Partner }) {
  const [failed, setFailed] = useState(false);

  if (partner.logo && !failed) {
    return (
      <img
        src={partner.logo}
        alt={partner.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="max-h-10 w-auto max-w-full object-contain"
      />
    );
  }

  return (
    <span className="font-display text-sm font-semibold uppercase tracking-wide text-navy-700">
      {initials(partner.name)}
      <span className="hidden text-navy-500 sm:inline"> · {partner.name}</span>
    </span>
  );
}
