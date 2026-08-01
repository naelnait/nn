import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Route-change transition in the vein of Apple's product pages: the outgoing
 * view drops away quickly, the incoming one rises and settles on a long
 * ease-out so the motion decelerates rather than stopping flat.
 */

// Apple-ish deceleration curve (close to ease-out-expo); the exit uses a
// sharper curve so the old view gets out of the way without dragging.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const { pathname } = useLocation();

  // Land at the top of each new section, the way a real page load would.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [pathname, reduced]);

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.995 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          opacity: { duration: 0.38, ease: EASE_OUT },
          y: { duration: 0.52, ease: EASE_OUT },
          scale: { duration: 0.52, ease: EASE_OUT },
        },
      }}
      exit={{
        opacity: 0,
        y: -8,
        scale: 0.997,
        transition: { duration: 0.22, ease: EASE_IN },
      }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
