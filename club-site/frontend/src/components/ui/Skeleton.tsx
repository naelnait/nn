export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-navy-100 ${className}`} />;
}

export function ErrorState({ message = "Une erreur est survenue. Merci de réessayer plus tard." }: { message?: string }) {
  return <p className="rounded-2xl border border-soldout-400/30 bg-soldout-500/5 px-4 py-3 text-sm font-medium text-soldout-600">{message}</p>;
}
