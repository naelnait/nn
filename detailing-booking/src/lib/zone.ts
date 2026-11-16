// Zone d'intervention et frais de déplacement. Mêmes formules que supabase/schema.sql.
import type { PublicSettings, Settings, TravelQuote } from './types';

export interface LatLon {
  lat: number;
  lon: number;
}

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance (km) du point p au segment [a, b]. */
export function distanceToSegmentKm(p: LatLon, a: LatLon, b: LatLon): number {
  const k = Math.cos(rad((a.lat + b.lat) / 2));
  const proj = (q: LatLon) => ({ x: q.lon * k * 111.32, y: q.lat * 110.574 });
  const A = proj(a), B = proj(b), P = proj(p);
  const dx = B.x - A.x, dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(P.x - A.x, P.y - A.y);
  const t = Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2));
  return Math.hypot(P.x - (A.x + t * dx), P.y - (A.y + t * dy));
}

export function zoneEnds(s: PublicSettings): [LatLon, LatLon] {
  return [{ lat: s.zone_a_lat, lon: s.zone_a_lon }, { lat: s.zone_b_lat, lon: s.zone_b_lon }];
}

export function isInZone(p: LatLon, s: PublicSettings): boolean {
  const [a, b] = zoneEnds(s);
  return distanceToSegmentKm(p, a, b) <= s.zone_width_km;
}

export function travelQuote(p: LatLon, s: Settings): TravelQuote {
  const roadKm = haversineKm({ lat: s.base_lat, lon: s.base_lon }, p) * s.road_factor;
  // Carburant de l'aller-retour (le pro rentre au point de départ après chaque RDV)
  const billedKm = Math.max(0, roadKm - s.fee_free_km) * (s.round_trip ? 2 : 1);
  const raw = s.fee_fixed_cents + (billedKm * s.fuel_l_per_100km) / 100 * s.fuel_price_cents;
  return {
    in_zone: isInZone(p, s),
    distance_km: Math.round(roadKm * 10) / 10,
    fee_cents: Math.ceil(raw / 100) * 100,
  };
}
