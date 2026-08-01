import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/ui/Seo";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MediaPlaceholder } from "../components/ui/Placeholders";
import { useNewsItem } from "../hooks/useApi";

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading, isError } = useNewsItem(slug);

  return (
    <article className="container-page py-12">
      <Link to="/actualites" className="text-sm font-medium text-navy-500 hover:text-navy-800">
        ← Retour aux actualités
      </Link>

      {isLoading && <Skeleton className="mt-6 h-96" />}
      {isError && <div className="mt-6"><ErrorState message="Cet article est introuvable." /></div>}

      {item && (
        <>
          <Seo title={item.title} description={item.excerpt} />
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent-700">{item.category}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy-950 sm:text-4xl">{item.title}</h1>
          <p className="mt-2 text-sm text-navy-500">
            {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <MediaPlaceholder seed={item.id} ratio="aspect-[16/7]" className="mt-6 rounded-xl" />
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-navy-700">{item.content}</p>
        </>
      )}
    </article>
  );
}
