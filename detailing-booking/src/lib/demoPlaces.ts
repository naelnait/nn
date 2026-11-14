// Communes intégrées pour le lien de test, où le service de géocodage externe est inaccessible.
// La version réelle utilise l'API de géocodage nationale (adresses complètes).
import type { AddressSuggestion } from './geocode';

const PLACES: [string, string, number, number][] = [
  ['Paris', '75001', 48.8566, 2.3522],
  ['Boulogne-Billancourt', '92100', 48.8397, 2.2399],
  ['Issy-les-Moulineaux', '92130', 48.8245, 2.27],
  ['Saint-Cloud', '92210', 48.844, 2.219],
  ['Sèvres', '92310', 48.8239, 2.2117],
  ['Meudon', '92190', 48.8123, 2.238],
  ['Massy', '91300', 48.7309, 2.2713],
  ['Palaiseau', '91120', 48.7144, 2.2453],
  ['Orsay', '91400', 48.6981, 2.1875],
  ['Saint-Germain-en-Laye', '78100', 48.8989, 2.0938],
  ['Versailles', '78000', 48.8049, 2.1204],
  ['Le Chesnay-Rocquencourt', '78150', 48.8222, 2.1222],
  ['Vélizy-Villacoublay', '78140', 48.784, 2.191],
  ['Jouy-en-Josas', '78350', 48.765, 2.168],
  ['Buc', '78530', 48.771, 2.125],
  ["Saint-Cyr-l'École", '78210', 48.8003, 2.0625],
  ['Guyancourt', '78280', 48.7733, 2.0739],
  ['Montigny-le-Bretonneux', '78180', 48.7711, 2.0333],
  ['Trappes', '78190', 48.7775, 2.0025],
  ['Plaisir', '78370', 48.8231, 1.9472],
  ['Élancourt', '78990', 48.784, 1.955],
  ['Chevreuse', '78460', 48.7067, 2.04],
  ['Le Mesnil-Saint-Denis', '78320', 48.7442, 1.9608],
  ['Coignières', '78310', 48.75, 1.92],
  ["Montfort-l'Amaury", '78490', 48.7778, 1.8094],
  ['Les Essarts-le-Roi', '78690', 48.7167, 1.8944],
  ['Le Perray-en-Yvelines', '78610', 48.695, 1.855],
  ['Rambouillet', '78120', 48.6436, 1.8296],
  ['Saint-Arnoult-en-Yvelines', '78730', 48.5717, 1.94],
  ['Houdan', '78550', 48.79, 1.6],
  ['Épernon', '28230', 48.61, 1.6744],
  ['Nogent-le-Roi', '28210', 48.6481, 1.5303],
  ['Maintenon', '28130', 48.5867, 1.5783],
  ['Gallardon', '28320', 48.5272, 1.695],
  ['Jouy', '28300', 48.51, 1.55],
  ['Saint-Prest', '28300', 48.49, 1.53],
  ['Lèves', '28300', 48.4711, 1.4825],
  ['Champhol', '28300', 48.4683, 1.5036],
  ['Mainvilliers', '28300', 48.4528, 1.4567],
  ['Chartres', '28000', 48.4439, 1.489],
  ['Lucé', '28110', 48.4378, 1.4644],
  ['Luisant', '28600', 48.4294, 1.4728],
  ['Dreux', '28100', 48.7372, 1.3664],
  ['Étampes', '91150', 48.4347, 2.1617],
  ['Meaux', '77100', 48.9601, 2.8788],
  ['Évreux', '27000', 49.0241, 1.1508],
  ['Rouen', '76000', 49.4431, 1.0993],
  ['Orléans', '45000', 47.9029, 1.9093],
  ['Le Mans', '72000', 48.0061, 0.1996],
  ['Lyon', '69002', 45.764, 4.8357],
];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’-]/g, ' ').replace(/\s+/g, ' ').trim();

export function searchDemoPlaces(query: string): AddressSuggestion[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const found: { score: number; s: AddressSuggestion }[] = [];
  for (const [name, cp, lat, lon] of PLACES) {
    const n = norm(name);
    let score = -1;
    if (q.includes(n)) score = 3 + n.length / 100; // « 12 rue X, Versailles »
    else if (n.startsWith(q)) score = 2;
    else if (n.includes(q)) score = 1;
    else if (/^\d{2,5}$/.test(q) && cp.startsWith(q)) score = 1;
    if (score < 0) continue;
    // Conserve la partie « rue » saisie par l'utilisateur
    const street = score >= 3 ? query.replace(new RegExp(name.replace(/[-']/g, '.'), 'i'), '').replace(/[\s,]+$/, '').replace(/^[\s,]+/, '') : '';
    found.push({ score, s: { label: `${street ? street + ', ' : ''}${cp} ${name}`, lat, lon } });
  }
  return found.sort((a, b) => b.score - a.score).slice(0, 5).map((f) => f.s);
}
