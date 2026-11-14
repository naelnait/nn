import { describe, expect, it } from 'vitest';
import { CAR_BRANDS, displayModel, lookupVehicle, modelsOf, needsGenre, resolveCategory, vehiclePrice } from './vehicles';

describe('catalogue véhicules', () => {
  it('classe les modèles courants', () => {
    expect(lookupVehicle('Renault', 'Clio')?.[0]).toBe('citadine');
    expect(lookupVehicle('peugeot', '3008')).toEqual(['suv']);
    expect(lookupVehicle('Volkswagen', 'Golf')).toEqual(['berline']);
    expect(lookupVehicle('Renault', 'Trafic')).toEqual(['utilitaire']);
    expect(lookupVehicle('Mercedes', 'Classe A')?.[0]).toBe('berline');
    expect(lookupVehicle('BMW', 'Série 3')?.[0]).toBe('berline');
    expect(lookupVehicle('Citroën', 'c3')).toEqual(['citadine']);
    expect(lookupVehicle('Tesla', 'Model Y')).toEqual(['suv']);
    expect(lookupVehicle('Inconnue', 'X')).toBeNull();
  });
  it('demande la carte grise pour les modèles voiture/utilitaire', () => {
    expect(needsGenre(lookupVehicle('Renault', 'Kangoo'))).toBe(true);
    expect(needsGenre(lookupVehicle('Citroen', 'Berlingo'))).toBe(true);
    expect(needsGenre(lookupVehicle('Renault', 'Clio'))).toBe(false);
    expect(resolveCategory('car', 'Renault', 'Kangoo', '', '').category).toBeNull();
    expect(resolveCategory('car', 'Renault', 'Kangoo', '', 'CTTE').category).toBe('utilitaire');
    expect(resolveCategory('car', 'Renault', 'Kangoo', '', 'VP').category).toBe('monospace');
  });
  it('résout la catégorie', () => {
    expect(resolveCategory('car', 'Peugeot', '3008', 'citadine', '').category).toBe('suv'); // impossible de déclarer un SUV en citadine
    expect(resolveCategory('car', 'Renault', 'Clio', 'berline', '').category).toBe('berline'); // Clio break admise
    expect(resolveCategory('car', 'Marque', 'Inconnue', '', '').category).toBeNull();
    expect(resolveCategory('car', 'Marque', 'Inconnue', 'suv', '').category).toBe('suv');
    expect(resolveCategory('moto', 'Yamaha', 'MT-07', '', '').category).toBe('moto');
  });
  it('arrondit le prix à l’euro comme le serveur', () => {
    expect(vehiclePrice(19000, 0)).toBe(19000);
    expect(vehiclePrice(19000, 10)).toBe(20900);
    expect(vehiclePrice(19000, 20)).toBe(22800);
    expect(vehiclePrice(19000, 35)).toBe(25700); // 256,50 € -> 257 €
    expect(vehiclePrice(19000, -20)).toBe(15200);
  });
  it('affiche des noms lisibles', () => {
    expect(displayModel('CLASSE A')).toBe('Classe A');
    expect(displayModel('T-ROC')).toBe('T-Roc');
    expect(displayModel('3008')).toBe('3008');
    expect(CAR_BRANDS.find((b) => b.key === 'BMW')?.label).toBe('BMW');
    expect(CAR_BRANDS.find((b) => b.key === 'ALFA ROMEO')?.label).toBe('Alfa Romeo');
    expect(modelsOf('renault').some((m) => m.label === 'Clio')).toBe(true);
  });
});
