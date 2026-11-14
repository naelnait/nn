// Schéma de la zone d'intervention : couloir autour de l'axe A–B, avec la position du client.
import { distanceToSegmentKm, type LatLon } from '../lib/zone';

interface Props {
  a: LatLon & { label: string };
  b: LatLon & { label: string };
  widthKm: number;
  /** Adresse du client (affichée si elle est à moins de 60 km de l'axe). */
  point?: (LatLon & { inZone: boolean }) | null;
  /** Point de départ du pro (espace admin uniquement). */
  base?: LatLon | null;
}

export function ZoneMap({ a, b, widthKm, point, base }: Props) {
  const lat0 = (a.lat + b.lat) / 2;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const proj = (p: LatLon) => ({ x: p.lon * k * 111.32, y: -p.lat * 110.574 });
  const A = proj(a);
  const B = proj(b);
  const showPoint = point && distanceToSegmentKm(point, a, b) < 60;
  const pts = [A, B, ...(showPoint ? [proj(point)] : []), ...(base ? [proj(base)] : [])];
  const pad = widthKm + 6;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;
  const w = maxX - minX;
  const h = maxY - minY;
  const u = w / 100; // unité graphique proportionnelle à la carte
  const P = point && showPoint ? proj(point) : null;
  const Bs = base ? proj(base) : null;
  const scaleKm = w > 120 ? 20 : 10;

  return (
    <figure className="zone-map">
      <svg viewBox={`${minX} ${minY} ${w} ${h}`} role="img"
           aria-label={`Zone : ${widthKm} km autour de l'axe ${a.label} – ${b.label}`}>
        <defs>
          <pattern id="zm-grid" width={10} height={10} patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" className="zm-grid" strokeWidth={u * 0.15} />
          </pattern>
        </defs>
        <rect x={minX} y={minY} width={w} height={h} fill="url(#zm-grid)" />
        {/* Couloir desservi */}
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="zm-zone" strokeWidth={widthKm * 2} strokeLinecap="round" />
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="zm-edge" strokeWidth={widthKm * 2} strokeLinecap="round" />
        {/* Axe routier */}
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="zm-road" strokeWidth={u * 1.6} strokeLinecap="round" />
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="zm-lane" strokeWidth={u * 0.4} strokeDasharray={`${u * 2} ${u * 1.6}`} />
        {[{ p: A, l: a.label }, { p: B, l: b.label }].map(({ p, l }) => (
          <g key={l}>
            <circle cx={p.x} cy={p.y} r={u * 2.2} className="zm-city" strokeWidth={u * 0.8} />
            <text x={p.x} y={p.y - u * 4} className="zm-label" fontSize={u * 4.2} textAnchor="middle">{l}</text>
          </g>
        ))}
        {Bs && (
          <g>
            <rect x={Bs.x - u * 2} y={Bs.y - u * 2} width={u * 4} height={u * 4} rx={u} className="zm-base" />
            <text x={Bs.x} y={Bs.y + u * 6.5} className="zm-label small" fontSize={u * 3.4} textAnchor="middle">Départ</text>
          </g>
        )}
        {P && (
          <g className={point!.inZone ? 'zm-pin in' : 'zm-pin out'}>
            <circle cx={P.x} cy={P.y} r={u * 5} className="zm-pulse" />
            <path transform={`translate(${P.x} ${P.y}) scale(${u * 0.32})`} d="M0 0c-6-7-10-12-10-17a10 10 0 0 1 20 0c0 5-4 10-10 17z" />
            <circle cx={P.x} cy={P.y - u * 5.4} r={u * 1.3} className="zm-pin-dot" />
          </g>
        )}
        {/* Échelle et nord */}
        <g transform={`translate(${minX + u * 4} ${maxY - u * 5})`}>
          <line x1={0} y1={0} x2={scaleKm} y2={0} className="zm-scale" strokeWidth={u * 0.6} />
          <line x1={0} y1={-u * 1.2} x2={0} y2={u * 1.2} className="zm-scale" strokeWidth={u * 0.5} />
          <line x1={scaleKm} y1={-u * 1.2} x2={scaleKm} y2={u * 1.2} className="zm-scale" strokeWidth={u * 0.5} />
          <text x={scaleKm / 2} y={-u * 2} className="zm-label small" fontSize={u * 3.2} textAnchor="middle">{scaleKm} km</text>
        </g>
        <g transform={`translate(${maxX - u * 6} ${minY + u * 8})`}>
          <path d={`M0 ${-u * 4} L${u * 2} ${u * 2} L0 ${u * 0.8} L${-u * 2} ${u * 2} Z`} className="zm-north" />
          <text x={0} y={u * 6.5} className="zm-label small" fontSize={u * 3.2} textAnchor="middle">N</text>
        </g>
      </svg>
      <figcaption>
        <span><i className="zm-key zone" /> Zone desservie ({widthKm} km de part et d'autre)</span>
        {P && <span><i className={`zm-key ${point!.inZone ? 'in' : 'out'}`} /> Votre adresse</span>}
        {Bs && <span><i className="zm-key base" /> Point de départ</span>}
      </figcaption>
    </figure>
  );
}
