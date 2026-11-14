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
    expect(isInZone({ lat: 48.566873, lon: 1.667562 }, s)).toBe(true); // Gas (point de départ)
  });
  it('refuse hors zone', () => {
    expect(isInZone({ lat: 45.76, lon: 4.83 }, s)).toBe(false); // Lyon
    expect(isInZone({ lat: 49.4431, lon: 1.0993 }, s)).toBe(false); // Rouen
    expect(isInZone({ lat: 47.9029, lon: 1.9093 }, s)).toBe(false); // Orléans
  });
  it('calcule les frais comme le serveur', () => {
    expect(travelQuote({ lat: 48.566873, lon: 1.667562 }, s).fee_cents).toBe(0); // départ : Gas
    expect(travelQuote({ lat: 48.61, lon: 1.6744 }, s).fee_cents).toBe(0); // Épernon, dans les 10 km offerts
    const v = travelQuote({ lat: 48.8049, lon: 2.1204 }, s);
    // Carburant aller-retour : (55,2 - 10) x 2 = 90,5 km x 8 L/100 km x 1,80 €/L = 13,03 € -> 14 €
    expect(v.fee_cents).toBe(1400);
    expect(v.distance_km).toBe(55.2);
    expect(travelQuote({ lat: 48.4439, lon: 1.489 }, s).fee_cents).toBe(500); // Chartres
    expect(travelQuote({ lat: 48.8566, lon: 2.3522 }, s).fee_cents).toBe(2000); // Paris
    expect(travelQuote({ lat: 48.8049, lon: 2.1204 }, { ...s, round_trip: false }).fee_cents).toBe(700); // aller seul
  });
});

import { searchDemoPlaces } from './demoPlaces';
describe('communes du lien de test', () => {
  it('trouve une commune et garde la rue saisie', () => {
    expect(searchDemoPlaces('ramb')[0].label).toBe('78120 Rambouillet');
    expect(searchDemoPlaces('12 rue de la Paix, Chartres')[0].label).toBe('12 rue de la Paix, 28000 Chartres');
    expect(searchDemoPlaces('saint cyr l ecole')[0].label).toContain("Saint-Cyr-l'École");
  });
  it('classe les communes de la liste dans ou hors zone', () => {
    const inZone = (n: string) => isInZone(searchDemoPlaces(n)[0], DEFAULT_SETTINGS);
    expect(['Paris', 'Versailles', 'Rambouillet', 'Maintenon', 'Chartres'].every(inZone)).toBe(true);
    expect(['Lyon', 'Rouen', 'Orléans', 'Le Mans', 'Meaux'].some(inZone)).toBe(false);
  });
});
