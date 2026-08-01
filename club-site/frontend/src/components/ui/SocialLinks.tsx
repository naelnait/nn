const ICONS: Record<string, { label: string; path: string }> = {
  facebook: {
    label: "Facebook",
    path: "M14 8.5h2.2V5.6c-.4 0-1.6-.1-3-.1-3 0-5 1.8-5 5.2V13H5.5v3.3h2.7V24h3.3v-7.7h2.7l.4-3.3h-3.1v-2c0-1 .3-1.5 1.5-1.5Z",
  },
  instagram: {
    label: "Instagram",
    path: "M14.5 5.5h-5A4 4 0 0 0 5.5 9.5v5a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-5a4 4 0 0 0-4-4Zm2.2 9a2.2 2.2 0 0 1-2.2 2.2h-5a2.2 2.2 0 0 1-2.2-2.2v-5a2.2 2.2 0 0 1 2.2-2.2h5a2.2 2.2 0 0 1 2.2 2.2v5Zm-4.7-6.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm0 5.9a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Zm4.6-6a.85.85 0 1 1-1.7 0 .85.85 0 0 1 1.7 0Z",
  },
  twitter: {
    label: "X",
    path: "M17.3 5.5h2.6l-5.7 6.5 6.7 8.8h-5.2l-4.1-5.4-4.7 5.4H4.3l6.1-7-6.4-8.3h5.4l3.7 4.9 4.2-4.9Zm-.9 13.7h1.4L8.3 6.9H6.8l9.6 12.3Z",
  },
  youtube: {
    label: "YouTube",
    path: "M21.1 8.6a2.5 2.5 0 0 0-1.7-1.8C17.9 6.4 12 6.4 12 6.4s-5.9 0-7.4.4A2.5 2.5 0 0 0 2.9 8.6C2.5 10.1 2.5 12 2.5 12s0 1.9.4 3.4a2.5 2.5 0 0 0 1.7 1.8c1.5.4 7.4.4 7.4.4s5.9 0 7.4-.4a2.5 2.5 0 0 0 1.7-1.8c.4-1.5.4-3.4.4-3.4s0-1.9-.4-3.4ZM10.1 14.9V9.1l4.9 2.9-4.9 2.9Z",
  },
};

export function SocialLinks({ social }: { social?: Record<string, string> }) {
  if (!social) return null;
  const entries = Object.entries(social).filter(([key, url]) => ICONS[key] && url);
  if (entries.length === 0) return null;

  return (
    <ul className="flex items-center gap-2">
      {entries.map(([key, url]) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={ICONS[key].label}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-cta-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d={ICONS[key].path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
