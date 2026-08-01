import { Link } from "react-router-dom";
import type { NewsItem } from "../../types";
import { MediaPlaceholder } from "../ui/Placeholders";

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/actualites/${item.slug}`}
      className="group block overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <MediaPlaceholder seed={item.id} label={item.category} />
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-navy-500">
          {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold text-navy-900 group-hover:text-navy-600">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-navy-500">{item.excerpt}</p>
      </div>
    </Link>
  );
}
