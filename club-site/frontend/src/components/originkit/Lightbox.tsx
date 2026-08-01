import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MediaPlaceholder } from "../ui/Placeholders";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface LightboxProps {
  photos: string[];
  index: number | null;
  title: string;
  onClose: () => void;
  onNavigate: (next: number) => void;
}

/**
 * Full-screen photo viewer. The thumbnail and the enlarged view share a
 * `layoutId`, so the image appears to grow out of the grid rather than
 * cross-fading over it.
 */
export function Lightbox({ photos, index, title, onClose, onNavigate }: LightboxProps) {
  const reduced = useReducedMotion();
  const isOpen = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onNavigate]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind from scrolling while the viewer is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose, go]);

  // Rendered through a portal: the page-transition wrapper animates a
  // transform, which would otherwise become the containing block for this
  // fixed overlay and trap it inside the page content.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy-950/95 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.25, ease: EASE_OUT }}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — photo ${index + 1} sur ${photos.length}`}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/40 hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <motion.div
            key={photos[index]}
            className="w-full max-w-4xl overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.42, ease: EASE_OUT }}
          >
            <MediaPlaceholder seed={photos[index]} ratio="aspect-[3/2]" />
          </motion.div>

          <div className="mt-5 flex items-center gap-5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Photo précédente"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <p className="font-display text-sm tabular-nums tracking-wide text-white/70">
              {index + 1} / {photos.length}
            </p>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Photo suivante"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
