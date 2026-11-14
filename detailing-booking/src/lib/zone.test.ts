import { describe, expect, it } from 'vitest';
import { isInZone, travelQuote } from './zone';
import { DEFAULT_SETTINGS } from './backend/demo';

describe('zone et frais', () => {
  const s = DEFAULT_SETTINGS;
  it('accepte l’axe Paris–Chartres', () => {
    expect(isInZone({ lat: 48.8566, lon: 2.3522 }, s)).toBe(true); // Paris
    expect(isInZone({ lat: 48.4439, lon: 1.489 }, s)).toBe(true); // Chartres
    expect(isInZone({ lat: 48.8049, lon: 2.1204 }, s)).toBe(true); // Versailles
    expect(isInZone({ lat: 48.6436, lon: 1.8296 }, s)).toBe(true); // Rambouillet
  });
  it('refuse hors zone', () => {
    expect(isInZone({ lat: 45.76, lon: 4.83 }, s)).toBe(false); // Lyon
    expect(isInZone({ lat: 49.4431, lon: 1.0993 }, s)).toBe(false); // Rouen
    expect(isInZone({ lat: 47.9029, lon: 1.9093 }, s)).toBe(false); // Orléans
  });
  it('calcule les frais comme le serveur', () => {
    expect(travelQuote({ lat: 48.6436, lon: 1.8296 }, s).fee_cents).toBe(0); // départ
    const v = travelQuote({ lat: 48.8049, lon: 2.1204 }, s);
    expect(v.fee_cents).toBe(1400); // 36,2 km - 10 offerts = 26,2 x 0,50 € = 13,12 € arrondi à 14 €
    expect(v.distance_km).toBe(36.2);
  });
});
