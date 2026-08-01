import { Link } from "react-router-dom";
import type { NewsItem } from "../../types";
import { MediaPlaceholder } from "../ui/Placeholders";

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/actualites/${item.slug}`}
      className="group block overflow-hidden border-2 border-navy-950 bg-white shadow-hard transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-cta"
    >
      <MediaPlaceholder seed={item.id} label={item.category} />
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-cta-600">
          {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold uppercase text-navy-950">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-navy-500">{item.excerpt}</p>
      </div>
    </Link>
  );
}
