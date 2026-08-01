import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Accueil", end: true },
  { to: "/club", label: "Le Club" },
  { to: "/effectif", label: "Effectif" },
  { to: "/calendrier", label: "Calendrier" },
  { to: "/classement", label: "Classement" },
  { to: "/actualites", label: "Actualités" },
  { to: "/galerie", label: "Galerie" },
  { to: "/partenaires", label: "Partenaires" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-cta-500 bg-navy-950 text-white">
      <div className="container-page flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide" onClick={() => setOpen(false)}>
          <img
            src="/logo/ccmb-logo.webp"
            srcSet="/logo/ccmb-logo.webp 1x, /logo/ccmb-logo@2x.webp 2x"
            alt=""
            width={41}
            height={36}
            className="h-9 w-auto"
          />
          CCMB Chartres
        </NavLink>

        <nav className="hidden lg:flex lg:items-center">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative whitespace-nowrap px-2.5 py-2 text-xs font-bold uppercase tracking-normal transition-colors xl:px-3 xl:text-sm xl:tracking-wide ${
                  isActive ? "text-navy-950" : "text-white/85 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* One shared solid block slides between sections — a hard
                      cut, not a fade — matching the flood-invert press state
                      used on buttons throughout. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-block"
                      className="absolute inset-0 -z-10 bg-cta-500"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Kept out of the rotating nav on purpose — the one non-brand-blue
              color on the site stays meaningful only if it's reserved for
              this single action. */}
          <NavLink
            to="/billetterie"
            className="hidden border-2 border-cta-500 bg-cta-500 px-4 py-2 text-sm font-bold uppercase tracking-wide text-navy-950 transition-colors hover:bg-navy-950 hover:text-cta-400 sm:inline-block"
          >
            Billets
          </NavLink>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-navy-950 lg:hidden">
          <div className="container-page flex flex-col py-2">
            <NavLink
              to="/billetterie"
              onClick={() => setOpen(false)}
              className="my-1 border-2 border-cta-500 bg-cta-500 px-3 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy-950 sm:hidden"
            >
              Billets
            </NavLink>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 text-sm font-bold uppercase tracking-wide ${isActive ? "bg-cta-500 text-navy-950" : "text-white/85"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
