import { describe, expect, it } from 'vitest';
import { CAR_BRANDS, DEFAULT_PRICE_GRID, displayModel, gridPrice, lookupVehicle, modelsOf, needsGenre, resolveCategory } from './vehicles';

describe('catalogue véhicules', () => {
  it('classe les modèles courants', () => {
    expect(lookupVehicle('Renault', 'Clio')?.[0]).toBe('citadine');
    expect(lookupVehicle('peugeot', '3008')).toEqual(['suv']);
    expect(lookupVehicle('Volkswagen', 'Golf')).toEqual(['citadine']); // berline -> citadine
    expect(lookupVehicle('Renault', 'Scenic')).toEqual(['suv']); // monospace -> SUV
    expect(lookupVehicle('Peugeot', '206')).toEqual(['citadine']); // modèle des années 2000
    expect(lookupVehicle('BYD', 'Atto 3')).toEqual(['suv']); // marque chinoise
    expect(lookupVehicle('MG', 'ZS')).toEqual(['suv']);
    expect(lookupVehicle('Leapmotor', 'T03')).toEqual(['citadine']);
    expect(lookupVehicle('Renault', 'Trafic')).toEqual(['utilitaire']);
    expect(lookupVehicle('Mercedes', 'Classe A')?.[0]).toBe('citadine');
    expect(lookupVehicle('BMW', 'Série 3')?.[0]).toBe('citadine');
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
    expect(resolveCategory('car', 'Renault', 'Kangoo', '', 'VP').category).toBe('suv');
  });
  it('résout la catégorie', () => {
    expect(resolveCategory('car', 'Peugeot', '3008', 'citadine', '').category).toBe('suv'); // impossible de déclarer un SUV en citadine
    expect(resolveCategory('car', 'Marque', 'Inconnue', '', '').category).toBeNull();
    expect(resolveCategory('car', 'Marque', 'Inconnue', 'suv', '').category).toBe('suv');
    expect(resolveCategory('moto', 'Yamaha', 'MT-07', '', '').category).toBe('moto');
  });
  it('applique la grille de prix', () => {
    expect(DEFAULT_PRICE_GRID.Complet).toEqual({ moto: 7000, citadine: 14900, suv: 16500, utilitaire: 18900 });
    const prices = [{ service_id: 's', category: 'suv', price_cents: 16500 }];
    expect(gridPrice(prices, 's', 'suv', 14900)).toBe(16500);
    expect(gridPrice(prices, 's', 'citadine', 14900)).toBe(14900); // sans ligne : prix de la formule
    for (const g of Object.values(DEFAULT_PRICE_GRID)) {
      expect(g.utilitaire > g.suv && g.suv > g.citadine && g.citadine > g.moto).toBe(true);
    }
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
