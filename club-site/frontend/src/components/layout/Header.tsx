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
    <header className="sticky top-0 z-50 bg-navy-950 text-white shadow-lg">
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

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-accent-400" : "text-white/85 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {/* One shared underline slides between sections instead of
                      each link fading its own in and out. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent-400"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

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

      {open && (
        <nav className="border-t border-white/10 bg-navy-950 lg:hidden">
          <div className="container-page flex flex-col py-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-sm font-medium ${isActive ? "text-accent-400" : "text-white/85"}`
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
