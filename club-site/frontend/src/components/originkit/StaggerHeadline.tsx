import { motion, useReducedMotion } from "framer-motion";

/**
 * Per-character rise-in on mount, adapted from OriginKit's stagger-text-rise
 * onto a real semantic heading tag with our own Tailwind classes.
 *
 * Characters are grouped per word so the line can only wrap between words —
 * a flat list of inline-block letters lets the browser break mid-word.
 */
export function StaggerHeadline({ text, className = "" }: { text: string; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <h1 className={className}>{text}</h1>;
  }

  const words = text.split(" ");
  let charIndex = 0;

  return (
    <motion.h1 className={className} aria-label={text}>
      {words.map((word, w) => {
        const chars = word.split("");
        const node = (
          <span key={w} className="inline-block whitespace-nowrap" aria-hidden="true">
            {chars.map((char, c) => {
              const delay = charIndex * 0.02;
              charIndex += 1;
              return (
                <motion.span
                  key={c}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18, delay }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              );
            })}
            {w < words.length - 1 ? " " : null}
          </span>
        );
        charIndex += 1; // account for the space between words
        return node;
      })}
    </motion.h1>
  );
}
