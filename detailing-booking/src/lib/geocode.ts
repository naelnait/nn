// Autocomplétion d'adresse via le service public de géocodage (IGN Géoplateforme, gratuit, sans clé).
export interface AddressSuggestion {
  label: string;
  lat: number;
  lon: number;
}

const ENDPOINT = 'https://data.geopf.fr/geocodage/search';

export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&limit=5&autocomplete=1&index=address`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Géocodage indisponible (${res.status})`);
  const json = (await res.json()) as {
    features: { geometry: { coordinates: [number, number] }; properties: { label: string } }[];
  };
  return json.features.map((f) => ({
    label: f.properties.label,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}
