import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Seo } from "../components/ui/Seo";
import { Skeleton, ErrorState } from "../components/ui/Skeleton";
import { MediaPlaceholder } from "../components/ui/Placeholders";
import { Lightbox } from "../components/originkit/Lightbox";
import { useAlbum } from "../hooks/useApi";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading, isError } = useAlbum(id);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();

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
          <p className="mt-2 text-sm text-navy-500">
            {new Date(album.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {album.photos.map((photo, i) => (
              <motion.button
                key={photo}
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Agrandir la photo ${i + 1}`}
                whileHover={reduced ? undefined : { y: -4 }}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT, delay: reduced ? 0 : i * 0.05 }}
                className="overflow-hidden border-2 border-transparent transition-colors hover:border-cta-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-500"
              >
                <MediaPlaceholder seed={photo} ratio="aspect-square" label={`#${i + 1}`} />
              </motion.button>
            ))}
          </div>

          <Lightbox
            photos={album.photos}
            index={openIndex}
            title={album.title}
            onClose={() => setOpenIndex(null)}
            onNavigate={setOpenIndex}
          />
        </>
      )}
    </div>
  );
}
