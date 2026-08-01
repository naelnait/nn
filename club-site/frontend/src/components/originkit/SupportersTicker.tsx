import { useEffect, useRef, useState } from "react";

/**
 * Scroll-velocity-reactive marquee adapted from OriginKit's sync-scroll:
 * speeds up and reverses direction with the visitor's scroll input.
 * Used here as a stadium LED ticker celebrating the fans, not a product feature list.
 */
const PHRASES = [
  "LE COLISÉE DE CHARTRES",
  "LE 12E HOMME",
  "#ALLEZCCMB",
  "CHARTRES VIBRE POUR SON CLUB",
  "SUPPORTERS FIDÈLES DEPUIS 1970",
  "NATIONALE MASCULINE 1",
];

export function SupportersTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [unitWidth, setUnitWidth] = useState(0);
  const [copies, setCopies] = useState(3);

  const state = useRef({ x: 0, dir: 1, lastY: 0, lastFrame: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const block = blockRef.current;
    if (!container || !block) return;

    const measure = () => {
      const cw = container.getBoundingClientRect().width || 0;
      const bw = block.getBoundingClientRect().width || 0;
      if (bw > 0) {
        setUnitWidth(bw);
        setCopies(Math.max(3, Math.ceil(cw / bw) + 2));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(block);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (unitWidth <= 0) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const baseVelocity = 4;
    let rafId = 0;

    const wrap = (v: number, min: number, max: number) => {
      const range = max - min;
      return range <= 0 ? min : (((v - min) % range) + range) % range + min;
    };

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - state.current.lastY;
      state.current.lastY = y;
      if (Math.abs(dy) > 0.5) state.current.dir = dy > 0 ? 1 : -1;
    };

    const tick = (now: number) => {
      const last = state.current.lastFrame || now;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      state.current.lastFrame = now;

      const pxPerSecond = (unitWidth * baseVelocity) / 100;
      state.current.x += (prefersReduced ? 1 : state.current.dir) * pxPerSecond * dt;

      const offset = -wrap(state.current.x, 0, unitWidth);
      if (scrollerRef.current) scrollerRef.current.style.transform = `translate3d(${offset}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [unitWidth]);

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-navy-950 py-3" aria-hidden="true">
      <div ref={containerRef} className="overflow-hidden">
        <div ref={scrollerRef} className="flex w-max whitespace-nowrap will-change-transform">
          {Array.from({ length: copies }).map((_, i) => (
            <div key={i} ref={i === 0 ? blockRef : null} className="flex shrink-0 items-center">
              {PHRASES.map((phrase, j) => (
                <span key={j} className="mx-4 flex items-center gap-4 font-display text-sm font-bold uppercase tracking-[0.15em] text-cta-400">
                  {phrase}
                  <span className="text-white/25">●</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
