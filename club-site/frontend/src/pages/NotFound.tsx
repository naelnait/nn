import { Link } from "react-router-dom";
import { Seo } from "../components/ui/Seo";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <Seo title="Page introuvable" />
      <p className="font-display text-6xl font-bold text-navy-950">404</p>
      <p className="mt-3 text-navy-500">Cette page n'existe pas ou plus.</p>
      <Link to="/" className="mt-6 rounded-md bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
        Retour à l'accueil
      </Link>
    </div>
  );
}
