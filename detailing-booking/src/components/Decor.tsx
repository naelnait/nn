// Éléments décoratifs : silhouette de voiture, code-barres de bon de travail, montant animé.
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../lib/time';

/**
 * Citadine compacte de profil, proportions réelles (longueur ≈ 2,8 × hauteur, empattement ≈ 64 %
 * de la longueur, porte-à-faux courts) : peinture métallisée, vitrage, jantes, éclairage.
 */
export function CarSilhouette() {
  const wheels = [86, 256]; // centres des roues ; sol à y = 132, rayon du pneu 21
  return (
    <svg className="car-art" viewBox="28 22 292 116" role="img" aria-label="Voiture">
      <defs>
        <linearGradient id="car-paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f7f9" />
          <stop offset=".3" stopColor="#d6dbe0" />
          <stop offset=".55" stopColor="#a1a9b1" />
          <stop offset=".8" stopColor="#636a73" />
          <stop offset="1" stopColor="#3b4047" />
        </linearGradient>
        <linearGradient id="car-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity=".5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="car-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#33444f" />
          <stop offset="1" stopColor="#0b1014" />
        </linearGradient>
        <linearGradient id="car-glass-hl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".3" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="car-rim" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset=".6" stopColor="#aab1b9" />
          <stop offset="1" stopColor="#626970" />
        </radialGradient>
        <linearGradient id="car-head" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfe9ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="car-tail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a0d12" />
          <stop offset="1" stopColor="#e2343c" />
        </linearGradient>
        <filter id="car-blur" x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <clipPath id="car-wells"><rect x="0" y="0" width="400" height="116" /></clipPath>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="174" cy="133" rx="140" ry="5.5" fill="#000" opacity=".6" filter="url(#car-blur)" />

      {/* Passages de roue */}
      <g clipPath="url(#car-wells)" fill="#050607">
        {wheels.map((cx) => <circle key={cx} cx={cx} cy="116" r="27" />)}
      </g>

      {/* Carrosserie : hayon quasi vertical à l'arrière, capot court à l'avant */}
      <path fill="url(#car-paint)"
            d="M50 116C45 116 42 112 42 106L42 88C42 80 45 74 50 70L56 62C59 52 64 45 76 41C100 37 150 36 178 37C196 38 213 49 228 62C250 64 278 66 294 70C302 72 306 78 306 86L306 104C306 112 302 116 296 116L283 116A27 27 0 0 0 229 116L113 116A27 27 0 0 0 59 116Z" />
      <path fill="url(#car-sheen)" d="M52 74C120 66 220 66 300 73L301 79C220 72 120 72 50 80Z" />

      {/* Vitrage (montant arrière épais, montant central) */}
      <path fill="url(#car-glass)" d="M66 67C68 56 72 48 82 45C110 41 150 41 176 42C192 43 204 52 216 64L217 67Z" />
      <path fill="url(#car-glass-hl)" d="M104 44C130 41 160 41 176 42L158 67L118 67Z" />
      <path fill="url(#car-paint)" d="M66 67C68 56 72 48 82 45L100 44L97 67Z" />
      <path fill="#2b3036" d="M136 42L142 42L141.5 67L136.5 67Z" />
      <path d="M68 68L217 68" stroke="#edf0f3" strokeWidth="1.3" opacity=".85" />

      {/* Lignes de carrosserie, poignées, rétroviseur */}
      <g fill="none" strokeLinecap="round">
        <path d="M54 76C120 70 220 70 300 76" stroke="#ffffff" strokeWidth=".9" opacity=".6" />
        <path d="M64 100C130 96 210 96 298 100" stroke="#3b4047" strokeWidth="1" opacity=".5" />
        <path d="M99 70L99 94C103 99 110 104 113 112M141 70L140.5 112M224 66C226 80 226 96 223 108" stroke="#4a5058" strokeWidth="1.1" opacity=".85" />
      </g>
      <rect x="116" y="77" width="12" height="3" rx="1.5" fill="#3b4047" />
      <rect x="196" y="77" width="12" height="3" rx="1.5" fill="#3b4047" />
      <path d="M210 63L222 59.5C226 59.5 227.5 62.5 225.5 65.5L213 67Z" fill="#636a73" />
      <path d="M113 112L229 112L229 116L113 116Z" fill="#2c3036" />

      {/* Éclairage et boucliers */}
      <path d="M284 70L299 74.5C302 76.5 302 80 299 80.5L280 78C278 75 280 71 284 70Z" fill="url(#car-head)" />
      <path d="M282 76.5L298 78.5" stroke="#7fd8ff" strokeWidth="1" opacity=".9" />
      <path d="M46 77L57 72.5L58 81L47 85Z" fill="url(#car-tail)" />
      <path d="M288 96L306 96L306 104L286 104Z M42 100L55 100L55 106L42 106Z" fill="#16191d" />

      {/* Roues */}
      {wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="111" r="21" fill="#111316" />
          <circle cx={cx} cy="111" r="18.5" fill="none" stroke="#2b2f35" strokeWidth="1.4" />
          <circle cx={cx} cy="111" r="14" fill="#1b1e23" />
          {/* Étrier de frein (fixe) */}
          <path d={`M${cx - 10} 105.5A11.5 11.5 0 0 1 ${cx - 4} 100.2`} stroke="#2fa36b" strokeWidth="4.2" strokeLinecap="round" fill="none" />
          <g className="car-wheel" style={{ transformOrigin: `${cx}px 111px` }}>
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} transform={`rotate(${a} ${cx} 111)`}
                    d={`M${cx - 2.5} 107L${cx - 1.6} 98L${cx + 1.6} 98L${cx + 2.5} 107Z`} fill="url(#car-rim)" />
            ))}
            <circle cx={cx} cy="111" r="13.5" fill="none" stroke="url(#car-rim)" strokeWidth="1.8" />
            <circle cx={cx} cy="111" r="4" fill="url(#car-rim)" stroke="#626970" strokeWidth=".6" />
            <circle cx={cx} cy="111" r="1.3" fill="#2b2f35" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Code-barres décoratif dérivé de la référence (stable pour un même RDV). */
export function Barcode({ seed }: { seed: string }) {
  const bars: number[] = [];
  for (const ch of seed.replace(/-/g, '')) {
    const v = parseInt(ch, 16) || 1;
    bars.push((v % 3) + 1, (v >> 2) + 1);
  }
  let x = 0;
  return (
    <svg className="barcode" viewBox={`0 0 ${bars.reduce((s, b) => s + b + 1, 0)} 24`} preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => {
        const el = i % 2 === 0 ? <rect key={i} x={x} y={0} width={b} height={24} /> : null;
        x += b + 1;
        return el;
      })}
    </svg>
  );
}

/** Montant qui défile jusqu'à sa nouvelle valeur. */
export function AnimatedPrice({ cents }: { cents: number }) {
  const [shown, setShown] = useState(cents);
  const from = useRef(cents);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === cents) { setShown(cents); from.current = cents; return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 450);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round((a + (cents - a) * eased) / 100) * 100);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = cents;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = cents; };
  }, [cents]);
  return <span className="price-anim">{formatPrice(shown)}</span>;
}
