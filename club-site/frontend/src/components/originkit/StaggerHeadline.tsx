import { motion, useReducedMotion } from "framer-motion";

/**
 * Per-character rise-in on mount, adapted from OriginKit's stagger-text-rise
 * onto a real semantic heading tag with our own Tailwind classes.
 */
export function StaggerHeadline({ text, className = "" }: { text: string; className?: string }) {
  const chars = text.split("");
  const reduced = useReducedMotion();

  if (reduced) {
    return <h1 className={className}>{text}</h1>;
  }

  return (
    <motion.h1 className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: i * 0.02 }}
          className="inline-block"
          aria-hidden="true"
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}
