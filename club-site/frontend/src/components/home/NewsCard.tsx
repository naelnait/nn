import { Link } from "react-router-dom";
import type { NewsItem } from "../../types";
import { MediaPlaceholder } from "../ui/Placeholders";

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/actualites/${item.slug}`}
      className="group block overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <MediaPlaceholder seed={item.id} label={item.category} />
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-cta-600">
          {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-navy-950">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-navy-500">{item.excerpt}</p>
      </div>
    </Link>
  );
}
