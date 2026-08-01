# CCMB Chartres — Site du club (démo)

Réinterprétation du site de [C'Chartres Métropole Basket](https://www.ccmbm.fr/) avec une stack moderne, pensée pour la performance, l'accessibilité et le rendu sur tous les écrans.

Ce projet est une **démonstration non officielle**. Le club, ses partenaires, son effectif et son staff sont réels et repris de sources publiées par le club ; les matchs, résultats, classement, actualités et albums sont des données d'exemple.

## Stack technique

**Backend** (`backend/`)
- Node.js + Express + TypeScript, API REST (`/api/...`)
- Sécurité et performance : `helmet`, `compression`, `cors`, rate limiting (`express-rate-limit`)
- Cache HTTP (`Cache-Control`) par ressource, données en mémoire (pas de base à provisionner)
- Endpoints : `club`, `players` (`?group=squad|staff`), `matches` (+ `next`/`latest`), `standings`, `news` (paginé), `gallery`, `partners`, `contact` (validé + rate-limité)

**Frontend** (`frontend/`)
- React 18 + TypeScript + Vite
- Tailwind CSS, palette bleu / bleu marine / blanc
- React Router, routes en lazy loading (code splitting par page)
- TanStack Query pour le cache réseau et les états de chargement / erreur
- `framer-motion` pour les transitions de section et les micro-interactions
- `react-helmet-async` pour le SEO par page

## Animations

Composants adaptés depuis [OriginKit](https://originkit.com) et réécrits sur notre palette, nos `<Link>` react-router et nos données réelles :

| Élément | Origine | Effet |
|---|---|---|
| Titre du hero | `stagger-text-rise` | Apparition lettre par lettre, regroupée par mot |
| Boutons du hero | `magnetic-hover-button` | Attraction vers le curseur + balayage de couleur |
| Bandeau effectif | `eye-gallery` | Deux rangées défilant en sens inverse |
| Ticker supporters | `sync-scroll` | Vitesse et sens pilotés par le scroll |
| Mur de partenaires | `interactive-grid` | Soulèvement 3D de la carte survolée et de ses voisines |

Ajouts propres au projet : transition entre rubriques (sortie rapide, entrée sur une longue courbe ease-out), visionneuse photo plein écran, soulignement de nav qui glisse d'une rubrique à l'autre, shimmer au survol des portraits, fond animé du hero.

**Toutes les animations se désactivent avec `prefers-reduced-motion`.**

## Performance

- Portraits convertis en WebP et redimensionnés : **4,56 Mo → 0,39 Mo (−91 %)** sur la page Effectif
- Logo du club rastérisé pour l'affichage (SVG 348 Ko → WebP 5 Ko, `srcset` 1x/2x) ; le SVG vectoriel reste le master
- Code splitting par route, images en `loading="lazy"`
- Cache HTTP côté API + cache client TanStack Query
- Compression et en-têtes de sécurité côté serveur

## Accessibilité

Audit `axe-core` (WCAG 2.1 A + AA) sur les 9 pages : **aucune violation**.

- Lien d'évitement, structure sémantique, `focus-visible` sur tous les éléments interactifs
- Visionneuse photo : navigation aux flèches, fermeture par `Échap`, scroll de la page verrouillé, `aria-modal`
- Contrastes de texte vérifiés (le gris secondaire a été assombri pour repasser le seuil AA)
- Testé sans débordement horizontal en 390 / 768 / 1280 / 1920 px

## Origine des contenus

| Contenu | Source |
|---|---|
| Logo du club, portraits joueurs et staff | Publiés par le club sur [ccmbm.fr](https://www.ccmbm.fr/pages/nm1) |
| Partenaires (noms, niveaux, sites) | [ccmbm.fr/partenaires](https://www.ccmbm.fr/partenaires) |
| Logos E.Leclerc, McDonald's, Ford | [Simple Icons](https://simpleicons.org) (CC0) |
| Autres logos partenaires | Emblèmes originaux, en attendant les visuels réels |
| Photo de la cathédrale (fond du hero) | Calips, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:France_Eure_et_Loir_Chartres_Cathedrale_nuit_02.jpg), CC BY 2.5 — recolorée en bleu et retournée horizontalement pour l'intégration |
| Matchs, classement, actualités, albums | Données d'exemple |

Les fiches joueurs ne contiennent que ce que le club publie (nom, numéro, poste, taille) — les champs non publiés sont optionnels et restent vides plutôt que d'être inventés.

## Démarrage

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev      # API sur http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev      # app sur http://localhost:5173
```

Le frontend consomme l'API via `VITE_API_URL` (défaut `http://localhost:4000/api`).

### Build de production

```bash
cd backend  && npm run build && npm start
cd frontend && npm run build && npm run preview
```

## Remplacer les visuels

Le site affiche les vrais fichiers dès qu'ils sont présents, sinon il retombe sur un visuel généré :

- **Photos joueurs** → `frontend/public/players/`, chemin référencé dans `photo` (`backend/src/data/players.json`)
- **Logos partenaires** → `frontend/public/partners/`, chemin référencé dans `logo` (`backend/src/data/partners.json`)

## Structure

```
club-site/
├── backend/
│   └── src/
│       ├── data/         # données servies par l'API (JSON)
│       ├── routes/       # un fichier par ressource
│       ├── middleware/   # cache, gestion des erreurs
│       └── app.ts, index.ts
└── frontend/
    ├── public/
    │   ├── logo/         # identité du club
    │   ├── players/      # portraits effectif + staff
    │   └── partners/     # logos partenaires
    └── src/
        ├── api/          # client fetch
        ├── hooks/        # hooks React Query
        ├── components/
        │   ├── layout/   # header, footer
        │   ├── originkit/# composants animés
        │   └── ui/       # briques partagées
        └── pages/        # une page par route
```
