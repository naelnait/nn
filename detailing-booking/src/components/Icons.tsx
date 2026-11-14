// Jeu d'icônes « garage » dessinées à la main (trait 24x24, couleur héritée).
import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

/** Clé à molette */
export const Wrench = (p: P) => (
  <Icon {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" /></Icon>
);

/** Fiche d'atelier */
export const Clipboard = (p: P) => (
  <Icon {...p}>
    <rect x="8" y="2.5" width="8" height="4" rx="1" />
    <path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2" />
    <path d="M8.5 12l1.5 1.5 3-3M8.5 17h7" />
  </Icon>
);

/** Cône de chantier */
export const Cone = (p: P) => (
  <Icon {...p}>
    <path d="M10 3.5h4l4.6 15.5H5.4z" />
    <path d="M8.2 9.5h7.6M6.9 14h10.2M3 19h18" />
  </Icon>
);

/** Pulvérisateur */
export const Spray = (p: P) => (
  <Icon {...p}>
    <path d="M7.5 11h7v9a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 20z" />
    <path d="M9 11V8h4v3M7.5 8V4.5h6.5l2 2M10.5 4.5V3" />
    <path d="M19 4h.01M21 6.5h.01M19 9h.01M21 11.5h.01" strokeWidth={2.4} />
  </Icon>
);

/** Compte-tours */
export const Gauge = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 17a9 9 0 1 1 17 0" />
    <path d="M12 16l4.5-5.5" />
    <circle cx="12" cy="16" r="1.6" />
    <path d="M12 7v1.5M6.6 9.6l1 1M17.4 9.6l-1 1M4.5 13.5H6M18 13.5h1.5" />
  </Icon>
);

/** Chronomètre (temps tampon) */
export const Stopwatch = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4l2.5 2M10 2.5h4M12 2.5V6M18.5 6.5l1.5-1.5" />
  </Icon>
);

/** Pompe à essence */
export const FuelPump = (p: P) => (
  <Icon {...p}>
    <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M2.5 21h13M7 7.5h4" />
    <path d="M14 10h1.5a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8.5l-3-3" />
  </Icon>
);

/** Itinéraire */
export const Route = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" />
  </Icon>
);

export const MapPin = (p: P) => (
  <Icon {...p}>
    <path d="M12 21.5s-7-6-7-11.5a7 7 0 0 1 14 0c0 5.5-7 11.5-7 11.5z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

/** Clé de voiture */
export const CarKey = (p: P) => (
  <Icon {...p}>
    <circle cx="7.5" cy="16.5" r="4" />
    <path d="M10.4 13.6L20 4M16.5 7.5l2 2M14 10l2 2" />
    <circle cx="7.5" cy="16.5" r="1" />
  </Icon>
);

/** Garage / atelier */
export const Garage = (p: P) => (
  <Icon {...p}>
    <path d="M3 21V9l9-5.5L21 9v12" />
    <path d="M6.5 21v-8.5h11V21M6.5 15.5h11M6.5 18.5h11" />
  </Icon>
);

export const Home = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 10.5L12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
  </Icon>
);

/** Pont élévateur avec voiture */
export const CarLift = (p: P) => (
  <Icon {...p}>
    <path d="M5.5 9.5H4V7l1.6-2.6A1 1 0 0 1 6.5 4h8.3a1 1 0 0 1 .8.4L17.5 7H20v2.5h-1.5" />
    <circle cx="7.5" cy="9.5" r="1.5" />
    <circle cx="16.5" cy="9.5" r="1.5" />
    <path d="M3 13h18M5 13v8M19 13v8M2 21h4M18 21h4" />
  </Icon>
);

/** Voiture de profil */
export const Car = (p: P) => (
  <Icon {...p}>
    <path d="M5 17H3.5a1 1 0 0 1-1-1v-3.2a1 1 0 0 1 .2-.6L5 9.2A2 2 0 0 1 6.6 8.5h8.2a2 2 0 0 1 1.5.7l2.7 3.3 2 .5a1 1 0 0 1 .8 1V16a1 1 0 0 1-1 1H19" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M9 17h6M6 12.5h12.5M11.5 8.5v4" />
  </Icon>
);

export const Suv = (p: P) => (
  <Icon {...p}>
    <path d="M5 17H3a1 1 0 0 1-1-1v-4.5l1.5-4.2a1.5 1.5 0 0 1 1.4-1h10.4a1.5 1.5 0 0 1 1.1.5l3.1 3.7h1.5a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M9 17h6M2.3 11h17.2M11 6.3V11" />
  </Icon>
);

export const Van = (p: P) => (
  <Icon {...p}>
    <path d="M5 17H3a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1h12l4.5 5H21a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M9 17h6M15 5.5v5h4.5M10 5.5v5" />
  </Icon>
);

export const Moto = (p: P) => (
  <Icon {...p}>
    <circle cx="5" cy="16" r="3" />
    <circle cx="19" cy="16" r="3" />
    <path d="M5 16l3.5-5.5h5.5L16 16M14 10.5L16 7h2.5M7.5 8.5h4" />
    <path d="M10.5 16h4" />
  </Icon>
);

/** Siège auto (intérieur) */
export const Seat = (p: P) => (
  <Icon {...p}>
    <path d="M9 2.5h3a1.5 1.5 0 0 1 1.5 1.5v1.5A1.5 1.5 0 0 1 12 7H9a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 9 2.5z" />
    <path d="M8.5 7.5l-1 7.5a1.5 1.5 0 0 0 1.5 1.7h5" />
    <path d="M7.5 16.7L7 21h10l1.6-4.3a1 1 0 0 0-.9-1.4H14" />
  </Icon>
);

/** Voiture sous la pluie de lavage (extérieur) */
export const CarWash = (p: P) => (
  <Icon {...p}>
    <path d="M5 20H3.5a1 1 0 0 1-1-1v-2.6l1.9-3a1.5 1.5 0 0 1 1.3-.7h9.1a1.5 1.5 0 0 1 1.2.6l2 2.6 2.2.5a1 1 0 0 1 .8 1V19a1 1 0 0 1-1 1H19" />
    <circle cx="7" cy="20" r="1.6" />
    <circle cx="17" cy="20" r="1.6" />
    <path d="M8.6 20h6.8" />
    <path d="M7 3.5c0 1.2-1.2 2-1.2 3a1.2 1.2 0 0 0 2.4 0c0-1-1.2-1.8-1.2-3zM12 2c0 1.2-1.2 2-1.2 3a1.2 1.2 0 0 0 2.4 0c0-1-1.2-1.8-1.2-3zM17 3.5c0 1.2-1.2 2-1.2 3a1.2 1.2 0 0 0 2.4 0c0-1-1.2-1.8-1.2-3z" />
  </Icon>
);

/** Voiture qui brille (complet) */
export const CarShine = (p: P) => (
  <Icon {...p}>
    <path d="M5 20H3.5a1 1 0 0 1-1-1v-2.6l1.9-3a1.5 1.5 0 0 1 1.3-.7h9.1a1.5 1.5 0 0 1 1.2.6l2 2.6 2.2.5a1 1 0 0 1 .8 1V19a1 1 0 0 1-1 1H19" />
    <circle cx="7" cy="20" r="1.6" />
    <circle cx="17" cy="20" r="1.6" />
    <path d="M8.6 20h6.8" />
    <path d="M12 2.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9zM18.5 6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" />
  </Icon>
);

/** Jante (sert d'indicateur de chargement) */
export const Wheel = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 9.5V4.5M14.4 11.2l4.7-1.5M13.5 14l2.9 4M10.5 14l-2.9 4M9.6 11.2L4.9 9.7" />
  </Icon>
);

/** Drapeau à damier */
export const Flag = (p: P) => (
  <Icon {...p}>
    <path d="M4 21V4M4 4h15v10H4" />
    <path d="M4 4h3.75v2.5H4zM11.5 4h3.75v2.5H11.5zM7.75 6.5h3.75V9H7.75zM15.25 6.5H19V9h-3.75zM4 9h3.75v2.5H4zM11.5 9h3.75v2.5H11.5zM7.75 11.5h3.75V14H7.75zM15.25 11.5H19V14h-3.75z" fill="currentColor" stroke="none" />
  </Icon>
);

export const ChevronLeft = (p: P) => (
  <Icon {...p} strokeWidth={2.4}><path d="M15 5l-7 7 7 7" /></Icon>
);

/** Icône d'une prestation selon son nom */
export function ServiceIcon({ name, ...p }: P & { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('intérieur') || n.includes('interieur')) return <Seat {...p} />;
  if (n.includes('extérieur') || n.includes('exterieur')) return <CarWash {...p} />;
  if (n.includes('complet')) return <CarShine {...p} />;
  return <Spray {...p} />;
}

/** Icône d'un type de véhicule */
export function VehicleIcon({ type, ...p }: P & { type: string }) {
  const t = type.toLowerCase();
  if (t.includes('suv')) return <Suv {...p} />;
  if (t.includes('utilitaire')) return <Van {...p} />;
  if (t.includes('moto')) return <Moto {...p} />;
  if (t.includes('voiture')) return <Car {...p} />;
  return <Wrench {...p} />;
}

/** Icône d'une catégorie tarifaire de véhicule */
export function CategoryIcon({ code, ...p }: P & { code: string }) {
  if (code === 'moto') return <Moto {...p} />;
  if (code === 'suv') return <Suv {...p} />;
  if (code === 'monospace' || code === 'utilitaire') return <Van {...p} />;
  return <Car {...p} />;
}
