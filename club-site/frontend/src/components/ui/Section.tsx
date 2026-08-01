import type { PropsWithChildren, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface SectionProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}

export function Section({ title, eyebrow, action, className = "", tone = "light", children }: SectionProps) {
  const reduced = useReducedMotion();

  return (
    <section className={`overflow-hidden py-20 sm:py-28 ${tone === "dark" ? "bg-navy-950 text-white" : ""} ${className}`}>
      <div className="container-page">
        {(title || action) && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="mb-10 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              {eyebrow && (
                <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${tone === "dark" ? "text-cta-400" : "text-cta-600"}`}>
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
              )}
            </div>
            {action}
          </motion.div>
        )}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: reduced ? 0 : 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
