export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-navy-100 ${className}`} />;
}

export function ErrorState({ message = "Une erreur est survenue. Merci de réessayer plus tard." }: { message?: string }) {
  return <p className="border-2 border-soldout-500 bg-soldout-500/10 px-4 py-3 text-sm font-semibold text-soldout-600">{message}</p>;
}
