import { Link } from "react-router-dom";
import { Seo } from "../components/ui/Seo";
import { Section } from "../components/ui/Section";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MediaPlaceholder } from "../components/ui/Placeholders";
import { useGallery } from "../hooks/useApi";

export default function Gallery() {
  const { data: albums, isLoading, isError } = useGallery();

  return (
    <>
      <Seo title="Galerie" description="Albums photos des matchs du CCMB Chartres à la Halle Jean Cochet." />
      <Section eyebrow="Ambiance" title="Galerie photos">
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        )}
        {isError && <ErrorState />}
        {albums && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/galerie/${album.id}`}
                className="group block overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <MediaPlaceholder seed={album.id} label={`${album.photos.length} photos`} />
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-navy-900 group-hover:text-navy-600">{album.title}</h3>
                  <p className="mt-1 text-sm text-navy-400">
                    {new Date(album.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
