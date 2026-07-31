import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/ui/Seo";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MediaPlaceholder } from "../components/ui/Placeholders";
import { useAlbum } from "../hooks/useApi";

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading, isError } = useAlbum(id);

  return (
    <div className="container-page py-12">
      <Link to="/galerie" className="text-sm font-medium text-navy-500 hover:text-navy-800">
        ← Retour à la galerie
      </Link>

      {isLoading && <Skeleton className="mt-6 h-96" />}
      {isError && <div className="mt-6"><ErrorState message="Cet album est introuvable." /></div>}

      {album && (
        <>
          <Seo title={album.title} />
          <h1 className="mt-6 font-display text-3xl font-bold text-navy-950">{album.title}</h1>
          <p className="mt-2 text-sm text-navy-400">
            {new Date(album.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {album.photos.map((photo, i) => (
              <MediaPlaceholder key={photo} seed={photo} ratio="aspect-square" className="rounded-lg" label={`#${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
