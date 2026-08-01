/**
 * Generative silhouette of Notre-Dame de Chartres — its two mismatched
 * spires (the plain Romanesque "Clocher Vieux" and the ornate Flamboyant
 * "Clocher Neuf"), its rose window, the old town rooftops and the Eure
 * river — built from primitive shapes rather than traced artwork.
 *
 * The rose window glows in the site's own blue accent rather than gold:
 * that blue is itself a nod to the cathedral's famous stained glass,
 * historically referred to as "le bleu de Chartres".
 */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function skylineRooftops(
  xStart: number,
  xEnd: number,
  yBase: number,
  seed: number,
  cfg: { minW: number; maxW: number; minH: number; maxH: number }
) {
  const rand = seededRandom(seed);
  const out: string[] = [];
  let x = xStart;
  while (x < xEnd) {
    const w = cfg.minW + rand() * (cfg.maxW - cfg.minW);
    const h = cfg.minH + rand() * (cfg.maxH - cfg.minH);
    const roofH = 8 + rand() * 14;
    const top = yBase - h;
    out.push(`<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 6).toFixed(1)}"/>`);
    out.push(
      `<polygon points="${x.toFixed(1)},${top.toFixed(1)} ${(x + w).toFixed(1)},${top.toFixed(1)} ${(x + w / 2).toFixed(1)},${(top - roofH).toFixed(1)}"/>`
    );
    x += w + 1.5;
  }
  return out.join("");
}

function spireCrockets(x1: number, y1: number, x2: number, y2: number, count: number, r: number) {
  const out: string[] = [];
  for (let i = 1; i < count; i += 1) {
    const t = i / count;
    out.push(`<circle cx="${(x1 + (x2 - x1) * t).toFixed(1)}" cy="${(y1 + (y2 - y1) * t).toFixed(1)}" r="${r}"/>`);
  }
  return out.join("");
}

function roseSpokes(cx: number, cy: number, rInner: number, rOuter: number, count: number) {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    out.push(
      `<line x1="${(cx + Math.cos(a) * rInner).toFixed(1)}" y1="${(cy + Math.sin(a) * rInner).toFixed(1)}" x2="${(cx + Math.cos(a) * rOuter).toFixed(1)}" y2="${(cy + Math.sin(a) * rOuter).toFixed(1)}"/>`
    );
  }
  return out.join("");
}

function riverStreaks(xStart: number, xEnd: number, y: number, spread: number, seed: number, count: number) {
  const rand = seededRandom(seed);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const op = (0.05 + rand() * 0.16).toFixed(2);
    out.push(
      `<rect x="${(xStart + rand() * (xEnd - xStart)).toFixed(1)}" y="${(y + rand() * spread).toFixed(1)}" width="${(24 + rand() * 90).toFixed(1)}" height="1.4" fill="rgba(255,255,255,${op})"/>`
    );
  }
  return out.join("");
}

function skylineMarkup(uid: string, withRiver: boolean) {
  const W = 1440;
  const H = 480;
  const baseline = 394;
  const sky = `sky-${uid}`;
  const glow = `glow-${uid}`;
  const rose = `rose-${uid}`;
  const water = `water-${uid}`;
  const blur = `blur-${uid}`;

  return `
    <defs>
      <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#05070f"/><stop offset="38%" stop-color="#0c1f47"/>
        <stop offset="68%" stop-color="#1e335f"/><stop offset="100%" stop-color="#2748a0"/>
      </linearGradient>
      <radialGradient id="${glow}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(126,166,234,.85)"/>
        <stop offset="45%" stop-color="rgba(63,101,196,.35)"/>
        <stop offset="100%" stop-color="rgba(63,101,196,0)"/>
      </radialGradient>
      <radialGradient id="${rose}">
        <stop offset="0%" stop-color="#eaf1ff"/><stop offset="35%" stop-color="#a9c2f2"/>
        <stop offset="70%" stop-color="#3f65c4"/><stop offset="100%" stop-color="#1e3f8f"/>
      </radialGradient>
      <linearGradient id="${water}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#16305e"/><stop offset="100%" stop-color="#050a16"/>
      </linearGradient>
      <filter id="${blur}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#${sky})"/>
    <g fill="#0a1730" opacity=".85">${skylineRooftops(-10, W + 10, baseline + 6, 11, { minW: 22, maxW: 46, minH: 14, maxH: 34 })}</g>
    <ellipse cx="672" cy="200" rx="300" ry="230" fill="url(#${glow})"/>

    <g fill="#050a16">
      <rect x="560" y="270" width="200" height="124"/>
      <polygon points="635,350 685,350 660,318"/>
      <rect x="635" y="350" width="50" height="44"/>
      <rect x="565" y="140" width="50" height="130"/>
      <polygon points="565,140 615,140 590,55"/>
      <rect x="725" y="118" width="50" height="152"/>
      <polygon points="725,118 775,118 750,15"/>
    </g>
    <g fill="#2748a0">
      ${spireCrockets(725, 118, 750, 15, 6, 2.6)}${spireCrockets(775, 118, 750, 15, 6, 2.6)}
      <line x1="750" y1="15" x2="750" y2="3" stroke="#2748a0" stroke-width="2"/>
      <circle cx="750" cy="2.5" r="2.6"/>
    </g>
    <circle class="ccs-rose-glow" cx="660" cy="236" r="25" fill="url(#${rose})" filter="url(#${blur})" opacity=".95"/>
    <g stroke="#bcd0ff" stroke-width="1.1" opacity=".65">${roseSpokes(660, 236, 7, 23, 14)}</g>

    <g fill="#0d1c38">${skylineRooftops(-20, W + 20, baseline + 34, 27, { minW: 30, maxW: 60, minH: 20, maxH: 46 })}</g>

    ${
      withRiver
        ? `<rect x="0" y="${H * 0.93}" width="${W}" height="${H * 0.07}" fill="url(#${water})"/>${riverStreaks(0, W, H * 0.945, 14, 42, 24)}`
        : ""
    }
  `;
}

interface ChartresSkylineProps {
  uid: string;
  river?: boolean;
  className?: string;
}

export function ChartresSkyline({ uid, river = true, className = "" }: ChartresSkylineProps) {
  return (
    <svg
      viewBox="0 0 1440 480"
      preserveAspectRatio="xMidYMax slice"
      className={`absolute inset-0 h-full w-full ${className}`}
      role="img"
      aria-label="Silhouette de la cathédrale Notre-Dame de Chartres au crépuscule, au-dessus des toits de la vieille ville et de l'Eure"
      dangerouslySetInnerHTML={{ __html: skylineMarkup(uid, river) }}
    />
  );
}
