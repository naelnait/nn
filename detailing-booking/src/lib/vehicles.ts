// Catalogue des véhicules et tarification par catégorie.
// Données : src/data/vehicles.json, généré par scripts/build_vehicle_catalog.py à partir des fichiers
// ADEME/UTAC (data.gouv.fr) des véhicules particuliers commercialisés en France, plus un complément manuel.
import catalog from '../data/vehicles.json';
import type { VehicleCategory } from './types';

export type CategoryCode = 'moto' | 'citadine' | 'berline' | 'suv' | 'monospace' | 'utilitaire';

const CATALOG = catalog as Record<string, Record<string, CategoryCode[]>>;

export const DEFAULT_VEHICLE_CATEGORIES: VehicleCategory[] = [
  { code: 'moto', label: 'Moto / scooter', surcharge_pct: -20, sort: 0 },
  { code: 'citadine', label: 'Citadine', surcharge_pct: 0, sort: 1 },
  { code: 'berline', label: 'Berline / compacte / break', surcharge_pct: 10, sort: 2 },
  { code: 'suv', label: 'SUV / 4x4', surcharge_pct: 20, sort: 3 },
  { code: 'monospace', label: 'Monospace / ludospace', surcharge_pct: 25, sort: 4 },
  { code: 'utilitaire', label: 'Utilitaire / fourgon', surcharge_pct: 35, sort: 5 },
];

/** Exemples affichés sous chaque catégorie. */
export const CATEGORY_EXAMPLES: Record<string, string> = {
  moto: 'Roadster, sportive, trail, scooter',
  citadine: 'Clio, 208, C3, Polo, Yaris, Twingo',
  berline: 'Golf, 308, Mégane, Série 3, Octavia break',
  suv: '3008, Captur, Tiguan, Duster, Model Y',
  monospace: 'Scénic, Touran, Kangoo et Berlingo en version voiture',
  utilitaire: 'Trafic, Transit, Sprinter, Master, Kangoo Van',
};

/** Marques de deux-roues proposées (modèle en saisie libre). */
export const MOTO_BRANDS = [
  'Aprilia', 'BMW Motorrad', 'Ducati', 'Harley-Davidson', 'Honda', 'Husqvarna', 'Kawasaki', 'KTM', 'Kymco',
  'MV Agusta', 'Peugeot Motocycles', 'Piaggio', 'Royal Enfield', 'Suzuki', 'Sym', 'Triumph', 'Vespa', 'Yamaha',
];

/** Clé de comparaison identique à public.vehicle_key côté serveur. */
export function vehicleKey(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ').toUpperCase();
}

const UPPER_BRANDS = new Set(['BMW', 'MG', 'DS', 'BYD', 'KTM', 'SYM', 'MV AGUSTA']);

/** « ALFA ROMEO » -> « Alfa Romeo », « BMW » reste « BMW ». */
export function displayBrand(key: string): string {
  if (UPPER_BRANDS.has(key)) return key;
  return key.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** « CLASSE A » -> « Classe A », « T-ROC » -> « T-Roc », « 3008 » et « X5 » inchangés. */
export function displayModel(key: string): string {
  return key
    .split(/(\s|-)/)
    .map((w) => (/^[A-Z]{3,}$/.test(w) && !/^(AMG|GTI|GTE|RS|SUV|EV|BZ4X|MX)$/.test(w) ? w.charAt(0) + w.slice(1).toLowerCase() : w))
    .join('');
}

export const CAR_BRANDS: { key: string; label: string }[] = Object.keys(CATALOG)
  .map((key) => ({ key, label: displayBrand(key) }))
  .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

export function modelsOf(brand: string): { key: string; label: string }[] {
  const models = CATALOG[vehicleKey(brand)];
  if (!models) return [];
  return Object.keys(models)
    .map((key) => ({ key, label: displayModel(key) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true }));
}

/** Catégories admises pour un modèle du catalogue (la première est la plus courante), ou null s'il est inconnu. */
export function lookupVehicle(brand: string, model: string): CategoryCode[] | null {
  return CATALOG[vehicleKey(brand)]?.[vehicleKey(model)] ?? null;
}

/** Même nom vendu en version voiture (VP) et camionnette (CTTE) : la carte grise tranche. */
export function needsGenre(cats: CategoryCode[] | null): boolean {
  return !!cats && cats.includes('monospace') && cats.includes('utilitaire');
}

/** Prix d'une formule pour une catégorie : majoration puis arrondi à l'euro (comme le serveur). */
export function vehiclePrice(baseCents: number, pct: number): number {
  return Math.round((baseCents * (100 + pct)) / 100 / 100) * 100;
}

/** Recherche dans une liste (début de mot prioritaire), insensible aux accents. */
export function searchList<T extends { label: string }>(list: T[], query: string, limit = 8): T[] {
  const q = vehicleKey(query);
  if (!q) return list.slice(0, limit);
  const starts = list.filter((x) => vehicleKey(x.label).startsWith(q));
  const contains = list.filter((x) => !vehicleKey(x.label).startsWith(q) && vehicleKey(x.label).includes(q));
  return [...starts, ...contains].slice(0, limit);
}

/** Résout la catégorie à appliquer à partir de la saisie du client. */
export function resolveCategory(
  kind: 'car' | 'moto',
  brand: string,
  model: string,
  chosen: string,
  genre: '' | 'VP' | 'CTTE',
): { category: string | null; allowed: string[] | null; known: boolean; needsGenre: boolean } {
  if (kind === 'moto') return { category: 'moto', allowed: ['moto'], known: false, needsGenre: false };
  const cats = brand.trim() && model.trim() ? lookupVehicle(brand, model) : null;
  if (!cats) {
    return { category: chosen && chosen !== 'moto' ? chosen : null, allowed: null, known: false, needsGenre: false };
  }
  if (needsGenre(cats)) {
    return { category: genre ? (genre === 'CTTE' ? 'utilitaire' : 'monospace') : null, allowed: cats, known: true, needsGenre: true };
  }
  return { category: cats.includes(chosen as CategoryCode) ? chosen : cats[0], allowed: cats, known: true, needsGenre: false };
}
