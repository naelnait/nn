import { Link } from "react-router-dom";
import { useClub } from "../../hooks/useApi";
import { SocialLinks } from "../ui/SocialLinks";

export function Footer() {
  const { data: club } = useClub();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-white/80">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo/ccmb-logo.svg" alt="" width={55} height={48} className="h-12 w-auto" />
            <p className="font-display text-lg font-bold uppercase tracking-wide text-white">
              {club?.shortName ?? "CCMB Chartres"}
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            {club?.venue ?? "Colisée de Chartres"} · {club?.city ?? "Chartres"}
          </p>
          <p className="mt-1 text-sm">{club?.league ?? "Nationale Masculine 1"}</p>
          <div className="mt-4">
            <SocialLinks social={club?.social} />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-400">Navigation</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/club" className="hover:text-white">Le Club</Link></li>
            <li><Link to="/effectif" className="hover:text-white">Effectif</Link></li>
            <li><Link to="/calendrier" className="hover:text-white">Calendrier</Link></li>
            <li><Link to="/actualites" className="hover:text-white">Actualités</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-400">Club</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/galerie" className="hover:text-white">Galerie</Link></li>
            <li><Link to="/partenaires" className="hover:text-white">Partenaires</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-400">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>{club?.address ?? "Chartres"}</li>
            <li>
              <a href={`mailto:${club?.contactEmail ?? ""}`} className="hover:text-white">
                {club?.contactEmail ?? "contact@ccmb-basket.example"}
              </a>
            </li>
            <li>{club?.contactPhone ?? ""}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-white/50 sm:flex-row">
          <p>© {year} {club?.name ?? "CCMB Chartres"}. Tous droits réservés.</p>
          <p>Site non officiel réalisé à titre de démonstration.</p>
        </div>
      </div>
    </footer>
  );
}
