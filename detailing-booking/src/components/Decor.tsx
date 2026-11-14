// Éléments décoratifs : silhouette de voiture, code-barres de bon de travail, montant animé.
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../lib/time';

/** Voiture compacte de profil, rendu réaliste (peinture métallisée, vitrage, jantes, éclairage). */
export function CarSilhouette() {
  const wheels = [98, 300];
  return (
    <svg className="car-art" viewBox="0 0 400 160" role="img" aria-label="Voiture">
      <defs>
        <linearGradient id="car-paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset=".32" stopColor="#d3d8de" />
          <stop offset=".55" stopColor="#9aa2ab" />
          <stop offset=".8" stopColor="#5d646d" />
          <stop offset="1" stopColor="#3a3f46" />
        </linearGradient>
        <linearGradient id="car-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset=".45" stopColor="#ffffff" stopOpacity=".45" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="car-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3a44" />
          <stop offset="1" stopColor="#0a0f13" />
        </linearGradient>
        <linearGradient id="car-glass-hl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="car-rim" cx=".4" cy=".35" r=".75">
          <stop offset="0" stopColor="#f2f4f6" />
          <stop offset=".6" stopColor="#a7aeb6" />
          <stop offset="1" stopColor="#5f666e" />
        </radialGradient>
        <linearGradient id="car-head" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfe9ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="car-tail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a0d12" />
          <stop offset="1" stopColor="#e2343c" />
        </linearGradient>
        <filter id="car-blur" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <clipPath id="car-wells"><rect x="0" y="0" width="400" height="122" /></clipPath>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="200" cy="141" rx="172" ry="7" fill="#000" opacity=".55" filter="url(#car-blur)" />

      {/* Passages de roue */}
      <g clipPath="url(#car-wells)" fill="#050607">
        {wheels.map((cx) => <circle key={cx} cx={cx} cy="122" r="28" />)}
      </g>

      {/* Carrosserie */}
      <path className="car-shell" fill="url(#car-paint)"
            d="M44 122C38 122 36 118 36 112L36 98C36 90 40 84 48 80L58 74C62 62 70 54 84 50C110 40 140 36 176 35L236 35C258 36 274 44 292 58L318 62C340 65 356 70 364 78C368 82 370 90 370 98L370 110C370 118 366 122 360 122L328 122A28 28 0 0 0 272 122L126 122A28 28 0 0 0 70 122Z" />
      <path fill="url(#car-sheen)" opacity=".9"
            d="M60 78C150 66 260 66 364 80L366 86C262 74 150 74 58 86Z" />

      {/* Vitrage */}
      <path fill="url(#car-glass)" d="M76 66C86 55 104 45 132 41L232 41C252 42 266 50 281 62L283 66Z" />
      <path fill="url(#car-glass-hl)" d="M100 52C120 44 150 41 190 41L170 66L110 66Z" />
      <path fill="#2e333a" d="M116 44L128 42L127 66L113 66Z M193 41L200 41L199 66L193 66Z" />
      <path d="M76 66L283 66" stroke="#e9edf1" strokeWidth="1.4" opacity=".8" />

      {/* Lignes de carrosserie */}
      <g fill="none" strokeLinecap="round">
        <path d="M80 103C160 99 240 99 332 103" stroke="#3a3f46" strokeWidth="1" opacity=".55" />
        <path d="M128 68C130 84 132 98 129 112M197 68L198 116M270 67C272 82 272 98 268 108" stroke="#4a5058" strokeWidth="1.1" opacity=".8" />
        <path d="M62 78C150 70 262 70 362 79" stroke="#ffffff" strokeWidth=".9" opacity=".55" />
      </g>
      <rect x="170" y="76" width="15" height="3.2" rx="1.6" fill="#3a3f46" />
      <rect x="246" y="76" width="15" height="3.2" rx="1.6" fill="#3a3f46" />
      <path d="M282 62L296 58C300 58 302 61 300 64L286 67Z" fill="#5d646d" />
      <path d="M126 116L272 116L272 122L126 122Z" fill="#2c3036" />

      {/* Éclairage */}
      <path d="M346 70L366 78C367.5 80 366.5 83 363 83L341 79C338 76 341 71 346 70Z" fill="url(#car-head)" />
      <path d="M344 77L364 81" stroke="#7fd8ff" strokeWidth="1" opacity=".9" />
      <path d="M38 86L56 80L58 88L40 94Z" fill="url(#car-tail)" />
      <path d="M352 100L370 100L370 108L350 108Z M36 106L52 106L52 112L36 112Z" fill="#16191d" />

      {/* Roues */}
      {wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="118" r="22" fill="#111316" />
          <circle cx={cx} cy="118" r="19.5" fill="none" stroke="#2b2f35" strokeWidth="1.5" />
          <circle cx={cx} cy="118" r="14.5" fill="#1b1e23" />
          {/* Étrier de frein (fixe) */}
          <path d={`M${cx - 10.5} 112A12 12 0 0 1 ${cx - 4} 106.6`} stroke="#2fa36b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <g className="car-wheel" style={{ transformOrigin: `${cx}px 118px` }}>
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} transform={`rotate(${a} ${cx} 118)`}
                    d={`M${cx - 2.6} 114.2L${cx - 1.7} 104.6L${cx + 1.7} 104.6L${cx + 2.6} 114.2Z`} fill="url(#car-rim)" />
            ))}
            <circle cx={cx} cy="118" r="14" fill="none" stroke="url(#car-rim)" strokeWidth="1.8" />
            <circle cx={cx} cy="118" r="4.2" fill="url(#car-rim)" stroke="#5f666e" strokeWidth=".6" />
            <circle cx={cx} cy="118" r="1.4" fill="#2b2f35" />
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
