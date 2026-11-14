// Éléments décoratifs : silhouette de voiture, code-barres de bon de travail, montant animé.
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../lib/time';

/** Silhouette de voiture de sport, au trait. */
export function CarSilhouette() {
  return (
    <svg className="car-art" viewBox="0 0 320 112" aria-hidden="true">
      <defs>
        <linearGradient id="car-shine" x1="0" x2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".05" />
          <stop offset=".55" stopColor="currentColor" stopOpacity=".28" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".05" />
        </linearGradient>
      </defs>
      <g className="car-speed">
        <path d="M2 48h34M10 60h22M0 72h28" />
      </g>
      <path className="car-body" fill="url(#car-shine)"
            d="M40 80c0-8 4-13 13-15l40-7c15-14 33-23 58-24h46c19 0 35 8 52 21l37 6c18 3 27 10 28 19v6c0 3-2 4-5 4h-21a22 22 0 0 0-44 0H104a22 22 0 0 0-44 0H45c-3 0-5-2-5-5z" />
      <path className="car-line" d="M108 58c11-10 24-17 41-18h22v18zM179 40h18c15 0 27 6 38 18h-56z" />
      <path className="car-line" d="M178 60v26M192 66h11M296 70l12 3M46 70h9" />
      {[82, 260].map((cx) => (
        <g key={cx} className="car-wheel" style={{ transformOrigin: `${cx}px 90px` }}>
          <circle cx={cx} cy={90} r={17} />
          <circle cx={cx} cy={90} r={9} />
          <path d={`M${cx} 81v18M${cx - 9} 90h18M${cx - 6.4} 83.6l12.8 12.8M${cx + 6.4} 83.6l-12.8 12.8`} />
        </g>
      ))}
      <path className="car-ground" d="M30 108h270" />
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
