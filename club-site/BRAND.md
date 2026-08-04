# Identité de marque — v2

Résumé des décisions de direction artistique retenues après plusieurs itérations, pour éviter qu'un futur changement reparte de zéro sans savoir ce qui a déjà été tranché et pourquoi.

## Couleurs

| Rôle | Token Tailwind | Valeur |
|---|---|---|
| Fond sombre / marque | `navy-950` → `navy-500` | `#070f26` → `#2f54a8` |
| Accent brand (texte, liens secondaires) | `accent-*` | `#3f65c4` family |
| Accent de conversion (CTA, billetterie, "néon" du hero) | `cta-*` | bleu ciel, `#0ea5e9` family |
| Rareté / complet | `soldout-*` | rouge, `#dc2626` family |

Un seul accent non-bleu existe sur tout le site (`soldout`, pour la rareté) — tout le reste reste dans la famille bleu/marine/blanc demandée dès le départ. Voir `DESIGN_TOKENS.md` pour le détail primitive → sémantique → composant.

## Typographie

Une seule famille, `Inter`, du gros titre au texte courant — plus proche de la façon dont Apple associe SF Pro Display/Text qu'un mélange de deux polices contrastées. Les tests précédents (Barlow Condensed, Space Grotesk) ont été abandonnés au profit de cette unification.

## Style général : élégance "Apple", pas brutalisme

Deux directions ont été essayées et écartées :
- Un style brutaliste (bords à 0px, ombres dures décalées, blocs pleins) — abandonné car le client voulait des "visuels élaborés façon Apple", pas un rendu dur.
- Une réinterprétation OriginKit littérale — remplacée par une reconstruction sur-mesure une fois la référence Apple précisée.

Ce qui reste :
- Coins arrondis généreux (`rounded-2xl`/`rounded-3xl`), ombres douces (`shadow-sm` → `shadow-xl` au survol), jamais d'ombre dure.
- Animations d'apparition au scroll (`whileInView`, fade + léger déplacement vertical, easing `cubic-bezier(0.16,1,0.3,1)`) sur chaque section via le composant `Section` partagé — donc automatiques sur toutes les pages.
- Parallaxe de scroll sur le hero de l'accueil (`useScroll`/`useTransform`) : l'image s'agrandit et s'estompe, le texte s'envole légèrement, pendant que la section défile — technique récurrente des pages produit Apple.
- Micro-interactions douces (aimantation du curseur sur les CTA, `whileHover`/`whileTap` avec `scale`), jamais d'effet brusque.

## Exception assumée : le hero de l'accueil, façon Razer

Sur demande explicite, le hero (uniquement) reprend des codes plus "premium gaming/sport" inspirés de razer.com : fond assombri dominant, un halo "néon" animé et réactif au curseur (shader WebGL `ShaderBackground`, `frontend/src/components/ui/blue-noise.tsx`, palette déjà réglée sur le bleu/cyan/blanc du site — remplace l'ancienne version en CSS pur à deux blobs flous statiques), typographie du titre massive/majuscule avec une légère lueur, découpe diagonale à la transition vers le bloc suivant. Le shader se fond en mode `screen` au-dessus du fond sombre (jamais en dessous du texte) et se désactive intégralement avec `prefers-reduced-motion`, comme le reste des animations du site. Cette exception est cantonnée au hero — le reste du site suit la direction Apple ci-dessus.

## Contenu

Toujours privilégier les données réelles du club (joueurs, partenaires, salle, historique) publiées sur ccmbm.fr plutôt que des données inventées, sauf pour ce qui est explicitement signalé comme exemple (matchs, classement, actualités — voir le README, section "Origine des contenus").
