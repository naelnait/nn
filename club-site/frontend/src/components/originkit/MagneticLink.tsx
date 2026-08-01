import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Pointer-follow "magnetic" link, adapted from OriginKit's
 * magnetic-hover-button onto react-router's <Link> — a soft pill that leans
 * toward the cursor, closer to Apple's understated hover physics than a
 * loud visual effect.
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

      const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const gap = Math.hypot(edgeX, edgeY);

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
    }

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y, sx, sy]);

  const base =
    "relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-colors duration-200";
  const surface =
    variant === "ghost"
      ? "border border-white/25 text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/10"
      : "bg-cta-500 text-navy-950 shadow-[0_0_28px_-4px_rgba(56,189,248,0.7)] hover:bg-cta-400 hover:shadow-[0_0_36px_-2px_rgba(56,189,248,0.9)]";

  return (
    <MotionLink
      ref={ref}
      to={to}
      style={{ x: sx, y: sy }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className={`${base} ${surface} ${className}`}
    >
      {children}
    </MotionLink>
  );
}
