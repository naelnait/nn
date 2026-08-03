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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/70 text-white backdrop-blur-lg">
      <div className="container-page flex h-14 items-center justify-between">
        <NavLink to="/" end className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-[15px] font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <img
            src="/logo/ccmb-logo.webp"
            srcSet="/logo/ccmb-logo.webp 1x, /logo/ccmb-logo@2x.webp 2x"
            alt=""
            width={41}
            height={36}
            className="h-7 w-auto shrink-0"
          />
          <span className="hidden sm:inline">CCMB Chartres</span>
        </NavLink>

        <nav className="hidden lg:flex lg:items-center lg:gap-0.5 xl:gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative whitespace-nowrap px-2 py-2 text-[13px] font-medium transition-colors xl:px-3 ${
                  isActive ? "text-white" : "text-white/60 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {/* One shared underline glides between sections — a thin,
                      understated indicator rather than a filled block. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-[1px] h-px bg-cta-400 xl:inset-x-3"
                      transition={{ type: "spring", stiffness: 420, damping: 38 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NavLink
            to="/billetterie"
            className="hidden rounded-full bg-cta-500 px-4 py-1.5 text-[13px] font-medium text-navy-950 transition-colors hover:bg-cta-400 sm:inline-block"
          >
            Billets
          </NavLink>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-navy-950/95 backdrop-blur-lg lg:hidden">
          <div className="container-page flex flex-col py-2">
            <NavLink
              to="/billetterie"
              onClick={() => setOpen(false)}
              className="my-2 rounded-full bg-cta-500 px-4 py-2.5 text-center text-sm font-medium text-navy-950 sm:hidden"
            >
              Billets
            </NavLink>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `px-3 py-3 text-sm font-medium ${isActive ? "text-cta-400" : "text-white/70"}`}
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
