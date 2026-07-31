export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-navy-100 ${className}`} />;
}

export function ErrorState({ message = "Une erreur est survenue. Merci de réessayer plus tard." }: { message?: string }) {
  return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>;
}
