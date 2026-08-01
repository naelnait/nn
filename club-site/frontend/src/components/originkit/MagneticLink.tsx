import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Pointer-follow "magnetic" link with a circular color-sweep reveal,
 * adapted from OriginKit's magnetic-hover-button onto react-router's
 * <Link> so SPA navigation keeps working.
 */
const MotionLink = motion(Link);

const REACH = 90;
const PULL = 0.35;

interface MagneticLinkProps {
  to: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "cta";
  className?: string;
}

export function MagneticLink({ to, children, variant = "primary", className = "" }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0, d: 0 });
  const hoverRef = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(event: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - sx.get();
      const cy = rect.top + rect.height / 2 - sy.get();
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;

      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;

      const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const gap = Math.hypot(edgeX, edgeY);

      if (inside !== hoverRef.current) {
        const lx = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const ly = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        setOrigin({ x: lx, y: ly, d: 2 * Math.hypot(rect.width, rect.height) });
        hoverRef.current = inside;
        setHover(inside);
      }

      if (gap > REACH) {
        x.set(0);
        y.set(0);
        return;
      }
      const falloff = 1 - gap / REACH;
      x.set(dx * PULL * falloff);
      y.set(dy * PULL * falloff);
    }

    function onLeave() {
      x.set(0);
      y.set(0);
      hoverRef.current = false;
      setHover(false);
    }

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y, sx, sy]);

  const base = "relative inline-flex items-center gap-2 overflow-hidden rounded-md px-5 py-2.5 text-sm font-semibold";
  const sweepColor = variant === "cta" ? "bg-cta-400" : variant === "primary" ? "bg-accent-400" : "bg-white/15";
  const surface =
    variant === "cta"
      ? "bg-cta-600 text-white shadow-[0_6px_18px_-6px_rgba(22,163,74,0.7)]"
      : variant === "primary"
        ? "bg-accent-500 text-white"
        : "border border-white/30 text-white";

  return (
    <MotionLink
      ref={ref}
      to={to}
      style={{ x: sx, y: sy }}
      className={`${base} ${surface} ${className}`}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: hover ? 1 : 0 }}
        transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
        className={`pointer-events-none absolute rounded-full ${sweepColor}`}
        style={{
          top: origin.y, left: origin.x, width: origin.d, height: origin.d,
          marginLeft: -origin.d / 2, marginTop: -origin.d / 2,
        }}
      />
      <span className="relative z-10">{children}</span>
    </MotionLink>
  );
}
