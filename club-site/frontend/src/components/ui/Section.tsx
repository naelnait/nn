import type { PropsWithChildren, ReactNode } from "react";

interface SectionProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}

export function Section({ title, eyebrow, action, className = "", tone = "light", children }: SectionProps) {
  return (
    <section className={`py-12 sm:py-16 ${tone === "dark" ? "bg-navy-950 text-white" : ""} ${className}`}>
      <div className="container-page">
        {(title || action) && (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow && (
                <p className={`mb-1 text-sm font-semibold uppercase tracking-wider ${tone === "dark" ? "text-accent-400" : "text-accent-700"}`}>
                  {eyebrow}
                </p>
              )}
              {title && <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">{title}</h2>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
