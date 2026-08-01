import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Partner } from "../../types";
import { PartnerMark } from "./PartnerMark";

/**
 * Partner wall with a 3D lift that also nudges the hovered card's
 * neighbours, adapted from OriginKit's interactive-grid.
 *
 * Two changes from the original: the column count is measured from the
 * rendered grid instead of being a fixed prop (our grid is responsive),
 * and the effect only arms on devices that actually support hover, so
 * touch screens never get stuck in a lifted state.
 */
const LEAVE_DELAY = 180;

export function PartnerGrid({ partners }: { partners: Partner[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [cols, setCols] = useState(2);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCanHover(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Read the real column count so neighbour maths stays correct across breakpoints.
  useLayoutEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    const measure = () => {
      const template = getComputedStyle(node).gridTemplateColumns;
      const count = template ? template.split(" ").filter(Boolean).length : 1;
      setCols(Math.max(1, count));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

  const neighbours = useMemo(() => {
    if (hovered === null) return [];
    const out: number[] = [];
    if (hovered % cols !== 0) out.push(hovered - 1);
    if (hovered % cols !== cols - 1) out.push(hovered + 1);
    out.push(hovered - cols, hovered + cols);
    return out.filter((n) => n >= 0 && n < partners.length);
  }, [hovered, cols, partners.length]);

  const onEnter = (i: number) => {
    if (!canHover) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(i);
  };
  const onLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(null), LEAVE_DELAY);
  };

  return (
    <div
      ref={gridRef}
      onPointerLeave={onLeave}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
      style={{ perspective: "1200px" }}
    >
      {partners.map((partner, i) => {
        const isBig = hovered === i;
        const isSmall = !isBig && neighbours.includes(i);
        const transform = isBig
          ? "scale(1.09) translateY(-6px) translateZ(20px)"
          : isSmall
            ? "scale(1.04) translateY(-3px) translateZ(8px)"
            : "none";

        const tile = `flex h-20 items-center justify-center rounded-lg border bg-white px-3 text-center transition-all duration-200 ${
          isBig ? "border-accent-500 shadow-lg" : "border-navy-100 shadow-sm"
        }`;
        const style = { transform, zIndex: isBig ? 10 : 1 };
        const hasSite = Boolean(partner.url) && partner.url !== "#";

        // Partners the club lists without a website stay non-clickable
        // rather than pointing at a dead link.
        if (!hasSite) {
          return (
            <div key={partner.id} onPointerEnter={() => onEnter(i)} title={partner.name} className={tile} style={style}>
              <PartnerMark partner={partner} />
            </div>
          );
        }

        return (
          <a
            key={partner.id}
            href={partner.url}
            target="_blank"
            rel="noreferrer noopener"
            onPointerEnter={() => onEnter(i)}
            title={`${partner.name} — ouvrir le site`}
            className={`${tile} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500`}
            style={style}
          >
            <PartnerMark partner={partner} />
          </a>
        );
      })}
    </div>
  );
}
