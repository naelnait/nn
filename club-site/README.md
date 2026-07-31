# CCMB Chartres — Site du club (démo)

Interface frontend + backend inspirée du site d'un club de basketball professionnel (type [ccmbm.fr](https://www.ccmbm.fr/)), repensée avec une stack moderne et optimisée pour la performance, l'accessibilité et le SEO.

Ce projet est une démonstration : les données (club, effectif, matchs, actualités, galerie, partenaires) sont fictives et servies par une API mockée.

## Stack technique

**Backend** (`backend/`)
- Node.js + Express + TypeScript, API REST (`/api/...`)
- Sécurité et performance : `helmet`, `compression`, `cors`, rate limiting (`express-rate-limit`)
- Cache HTTP (`Cache-Control`) par ressource, données en mémoire (pas de DB à provisionner)
- Endpoints : `club`, `players`, `matches` (+ `next`/`latest`), `standings`, `news` (paginé), `gallery`, `partners`, `contact` (validé + rate-limité)

**Frontend** (`frontend/`)
- React 18 + TypeScript + Vite
- Tailwind CSS pour le design (thème club : bleu marine / or)
- React Router avec routes chargées en lazy loading (code splitting par page)
- TanStack Query pour le cache réseau, le `stale-while-revalidate` et la gestion des états de chargement/erreur
- `react-helmet-async` pour le SEO par page
- Placeholders visuels générés en CSS (pas d'images lourdes à charger) pour rester léger sans assets réels

## Pourquoi "plus optimisé" que le site d'origine

- Chargement différé (lazy) des pages → bundle initial réduit, code splitting automatique par route
- Pas d'images lourdes non optimisées : les visuels sont générés en CSS, ce qui élimine le poids réseau des photos tant qu'aucun vrai média n'est fourni
- Cache HTTP côté API + cache client (TanStack Query) pour limiter les requêtes réseau redondantes
- En-têtes de sécurité (`helmet`), compression gzip/brotli des réponses, rate limiting anti-abus sur l'API et le formulaire de contact
- Accessibilité : lien d'évitement, structure sémantique, contrastes vérifiés
- SEO : meta description par page, structure de titres cohérente

## Démarrage

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev      # démarre l'API sur http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev       # démarre l'app sur http://localhost:5173
```

L'application frontend consomme l'API via `VITE_API_URL` (par défaut `http://localhost:4000/api`).

### Build de production

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

## Structure

```
club-site/
├── backend/
│   └── src/
│       ├── data/        # données mockées (JSON)
│       ├── routes/       # endpoints REST par ressource
│       ├── middleware/   # cache, gestion des erreurs
│       └── app.ts, index.ts
└── frontend/
    └── src/
        ├── api/          # client fetch + gestion d'erreurs
        ├── hooks/        # hooks React Query par ressource
        ├── components/   # layout, UI partagée, sections de la home
        └── pages/        # une page par route
```
