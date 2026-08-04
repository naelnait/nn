# CCMB Chartres — Site du club (démo)

Réinterprétation du site de [C'Chartres Métropole Basket](https://www.ccmbm.fr/) avec une stack moderne, pensée pour la performance, l'accessibilité, la conversion (billetterie) et le rendu sur tous les écrans.

Ce projet est une **démonstration non officielle**. Le club, ses partenaires, son effectif et son staff sont réels et repris de sources publiées par le club ; les matchs, résultats, classement, actualités et albums sont des données d'exemple.

## Stack technique

**Backend** (`backend/`)
- Node.js + Express + TypeScript, API REST versionnée (`/api/v1/...`)
- SQLite (`better-sqlite3`) avec migrations trackées (`src/db/migrations`, runner maison) plutôt que des lectures JSON directes — voir [DEPLOYMENT.md](DEPLOYMENT.md)
- Sécurité et performance : `helmet`, `compression`, `cors`, rate limiting (`express-rate-limit`), validation par schémas `zod`, erreurs structurées (`{error:{code,message}}`), aucun détail interne exposé sur une erreur 500
- Endpoints : `club`, `players` (`?group=squad|staff`), `matches` (+ `next`/`latest`), `standings`, `news` (paginé), `gallery`, `partners`, `contact` (validé, rate-limité, persisté en base)
- Tests unitaires (`node --test`) sur la couche base de données

**Frontend** (`frontend/`)
- React 18 + TypeScript + Vite
- Tailwind CSS, palette bleu / bleu marine / blanc + un accent bleu ciel réservé à la billetterie (voir [DESIGN_TOKENS.md](DESIGN_TOKENS.md) et [BRAND.md](BRAND.md))
- React Router, routes en lazy loading (code splitting par page)
- TanStack Query pour le cache réseau et les états de chargement / erreur
- `framer-motion` : animations d'apparition au scroll, parallaxe du hero, micro-interactions
- `react-helmet-async` pour le SEO par page + image de partage Open Graph
- Tests end-to-end Playwright (`frontend/e2e`)

## Billetterie

Le site n'est pas qu'une vitrine : une page `/billetterie` met en avant le prochain match à domicile (compte à rebours réel), des tarifs indicatifs et un CTA dédié — visible sur l'accueil uniquement quand le prochain match est à domicile (pas de billet vendu pour les matchs à l'extérieur). Billetterie de démonstration : le vrai bouton d'action renvoie vers la page Contact.

## Direction artistique

Après plusieurs itérations, la direction retenue est détaillée dans [BRAND.md](BRAND.md) : une base élégante façon pages produit Apple (coins arrondis, ombres douces, animations de scroll `whileInView`, parallaxe), avec une exception assumée sur le hero de l'accueil qui reprend des codes plus "premium sport" façon razer.com (halo néon en shader WebGL réactif au curseur, typographie massive, découpe diagonale) — en réutilisant l'accent bleu du site plutôt qu'une couleur néon supplémentaire.

Composants animés adaptés depuis [OriginKit](https://originkit.com) :

| Élément | Origine | Effet |
|---|---|---|
| Titre du hero | `stagger-text-rise` | Apparition lettre par lettre, regroupée par mot |
| Boutons | `magnetic-hover-button` | Attraction vers le curseur |
| Bandeau effectif | `eye-gallery` | Deux rangées défilant en sens inverse |
| Ticker supporters | `sync-scroll` | Vitesse et sens pilotés par le scroll |
| Mur de partenaires | `interactive-grid` | Soulèvement 3D de la carte survolée et de ses voisines |

Ajouts propres au projet : transition entre rubriques, visionneuse photo plein écran, soulignement de nav qui glisse d'une rubrique à l'autre, shimmer au survol des portraits, compte à rebours du prochain match, parallaxe + halo shader animé du hero.

**Toutes les animations se désactivent avec `prefers-reduced-motion`.**

## Performance

- Portraits convertis en WebP et redimensionnés : **4,56 Mo → 0,39 Mo (−91 %)** sur la page Effectif
- Logo du club rastérisé pour l'affichage (SVG 348 Ko → WebP 5 Ko, `srcset` 1x/2x) ; le SVG vectoriel reste le master
- Code splitting par route, images en `loading="lazy"`
- Cache HTTP côté API + cache client TanStack Query
- Compression et en-têtes de sécurité côté serveur

## Accessibilité

- Lien d'évitement, structure sémantique, `focus-visible` sur tous les éléments interactifs
- Visionneuse photo : navigation aux flèches, fermeture par `Échap`, scroll de la page verrouillé, `aria-modal`
- Testé sans débordement horizontal en 390 / 768 / 1280 / 1920 px

## Origine des contenus

| Contenu | Source |
|---|---|
| Logo du club, portraits joueurs et staff | Publiés par le club sur [ccmbm.fr](https://www.ccmbm.fr/pages/nm1) |
| Partenaires (noms, niveaux, sites) | [ccmbm.fr/partenaires](https://www.ccmbm.fr/partenaires) |
| Logos E.Leclerc, McDonald's, Ford | [Simple Icons](https://simpleicons.org) (CC0) |
| Autres logos partenaires | Emblèmes originaux, en attendant les visuels réels |
| Photo de la cathédrale (fond du hero) | Calips, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:France_Eure_et_Loir_Chartres_Cathedrale_nuit_02.jpg), CC BY 2.5 — recolorée en bleu et retournée horizontalement pour l'intégration |
| Matchs, classement, actualités, albums, tarifs billetterie | Données d'exemple |

Les fiches joueurs ne contiennent que ce que le club publie (nom, numéro, poste, taille) — les champs non publiés sont optionnels et restent vides plutôt que d'être inventés.

## Démarrage

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev      # API sur http://localhost:4000 — migre + seed automatiquement une base vide
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev      # app sur http://localhost:5173
```

Le frontend consomme l'API via `VITE_API_URL` (défaut `http://localhost:4000/api/v1`).

### Base de données

```bash
cd backend
npm run db:migrate    # applique les migrations en attente
npm run db:seed       # recharge le contenu depuis src/data/*.json
npm run db:rollback   # annule la dernière migration
```

### Tests et vérification

```bash
cd club-site
./verify.sh          # typecheck + tests + build, backend et frontend
./verify.sh --e2e    # idem + suite Playwright complète
```

### Build de production / Docker

```bash
cd backend  && npm run build && npm start
cd frontend && npm run build && npm run preview
```

Ou avec Docker (voir [DEPLOYMENT.md](DEPLOYMENT.md)) :

```bash
cd club-site
docker compose up --build
```

## Remplacer les visuels

Le site affiche les vrais fichiers dès qu'ils sont présents, sinon il retombe sur un visuel généré :

- **Photos joueurs** → `frontend/public/players/`, chemin référencé dans `photo` (`backend/src/data/players.json`)
- **Logos partenaires** → `frontend/public/partners/`, chemin référencé dans `logo` (`backend/src/data/partners.json`)

Le contenu de `backend/src/data/*.json` reste la source éditable : modifier ces fichiers puis relancer `npm run db:seed` répercute les changements dans la base.

## Structure

```
club-site/
├── verify.sh             # typecheck + tests + build (--e2e pour inclure Playwright)
├── docker-compose.yml
├── DEPLOYMENT.md
├── DESIGN_TOKENS.md
├── BRAND.md
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── data/         # contenu éditable, source du seed (JSON)
│       ├── db/           # sqlite : migrations, seed, mappers, tests
│       ├── routes/       # un fichier par ressource
│       ├── middleware/   # cache, gestion des erreurs
│       └── app.ts, index.ts
└── frontend/
    ├── Dockerfile
    ├── e2e/              # suite Playwright (page objects + specs)
    ├── public/
    │   ├── logo/         # identité du club
    │   ├── players/      # portraits effectif + staff
    │   ├── og/           # image de partage Open Graph
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

## Skills appliqués (v2)

Audit et reconstruction guidés par : `graphify` (cartographie du code avant/après), `security-review` + `coding-standards` + `api-design` (audit backend), `database-migrations` (SQLite), `design-system` + `ui-ux-pro-max` + `brand` (tokens et direction artistique), `banner-design` (image Open Graph), `e2e-testing` (suite Playwright), `tdd-workflow` (persistance des messages de contact), `docker-patterns` + `deployment-patterns` (Dockerfiles, compose, CI), `verification-loop` (`verify.sh`).
