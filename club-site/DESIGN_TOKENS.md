# Tokens de design — v2

Applique l'architecture à trois couches du skill `design-system` (primitive → sémantique → composant) à ce qui a réellement changé en v2 : l'ajout d'un accent de conversion pour la billetterie. Le reste de la palette (bleu / bleu marine / blanc) est la marque déjà validée du club et n'est pas renommé sans raison.

## Pourquoi cet ajout

Le site vend un produit (des places de match), pas seulement une vitrine du club. La base de données `ui-ux-pro-max` (`data/colors.csv`) confirme que la palette bleu marine foncé déjà en place correspond exactement au profil « Ticketing / Box Office » (`#0F172A` primaire), qui recommande un accent à fort contraste réservé à l'action d'achat. Le brief initial du club imposant un site tout en bleu (bleu / bleu marine / blanc), cet accent reste dans la famille bleue : un **bleu ciel** nettement plus clair et plus saturé que le bleu de marque (`accent-*`, plus indigo), pour rester repérable sans introduire une couleur hors charte.

## Couche 1 — Primitives (valeurs brutes)

| Token | Valeur | Source |
|---|---|---|
| `cta-600` | `#0284c7` | Bleu ciel (Tailwind `sky-600`), distinct de `accent-600` (`#2748a0`, plus indigo) |
| `cta-500` / `cta-400` | `#0ea5e9` / `#38bdf8` | Nuances de la même teinte (hover / fond léger) |
| `cta-700` | `#0369a1` | Nuance foncée (texte sur fond clair, focus ring) |
| `soldout-600` | `#dc2626` | `ui-ux-pro-max` → profil Ticketing/Box Office, accent « sold-out » |
| `soldout-500` / `soldout-400` | `#ef4444` / `#f87171` | Nuances (hover / fond léger) |

## Couche 2 — Sémantique (rôle)

| Token sémantique | Primitive | Rôle |
|---|---|---|
| `cta` | `cta-*` | *Unique* couleur d'action d'achat ("Réserver ma place", "Billetterie") — n'apparaît que sur ces actions, jamais en décoration générale, pour rester repérable |
| `soldout` | `soldout-*` | Signal de rareté / complet, jamais utilisé pour une simple erreur (qui reste rouge neutre existant) |

## Couche 3 — Composant

| Composant | Token utilisé |
|---|---|
| `TicketCta` (bouton "Réserver ma place") | `bg-cta-600 hover:bg-cta-500`, focus ring `cta-400` |
| `MatchCountdown` (compte à rebours prochain match) | accents `cta-500` sur les unités de temps |
| `MatchCard` (match à venir) | bordure/latéral `cta-600` quand un CTA billetterie est affiché |
| Page Billetterie — tarif complet | `soldout-500` sur le badge "Complet" |

## Typographie et style — validés, pas changés

`Barlow Condensed` (titres) + `Inter` (texte courant) correspondent déjà aux recommandations `ui-ux-pro-max` pour un profil sportif/énergique à fort taux de conversion (catégorie *Kinetic Typography* / *Vibrant & Block-based* : grande typographie condensée, fort contraste). Le shimmer, le ticker et la pastille de nav en verre liquide déjà en place correspondent au profil *Motion-Driven* (Conversion-Focused: ✓ High) de la même base.
