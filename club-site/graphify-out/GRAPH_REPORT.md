# Graph Report - .  (2026-08-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 322 nodes · 566 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea55f868`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.ts
- Team.tsx
- devDependencies
- useApi.ts
- Home.tsx
- backend/package.json
- frontend/package.json
- compilerOptions
- App.tsx
- compilerOptions
- useClub
- compilerOptions
- vite-env.d.ts
- frontend/tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `compilerOptions` - 13 edges
3. `apiGet()` - 13 edges
4. `Seo()` - 13 edges
5. `Skeleton()` - 13 edges
6. `ErrorState()` - 11 edges
7. `Section()` - 10 edges
8. `useClub()` - 10 edges
9. `cacheControl()` - 8 edges
10. `loadData()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --indirect_call--> `errorHandler()`  [INFERRED]
  backend/src/app.ts → backend/src/middleware/errorHandler.ts
- `createApp()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  backend/src/app.ts → backend/src/middleware/errorHandler.ts
- `useAlbum()` --calls--> `apiGet()`  [EXTRACTED]
  frontend/src/hooks/useApi.ts → frontend/src/api/client.ts
- `useClub()` --calls--> `apiGet()`  [EXTRACTED]
  frontend/src/hooks/useApi.ts → frontend/src/api/client.ts
- `useGallery()` --calls--> `apiGet()`  [EXTRACTED]
  frontend/src/hooks/useApi.ts → frontend/src/api/client.ts

## Import Cycles
- None detected.

## Communities (17 total, 2 thin omitted)

### Community 0 - "app.ts"
Cohesion: 0.11
Nodes (29): createApp(), app, cacheControl(), ApiError, errorHandler(), notFoundHandler(), clubRouter, contactLimiter (+21 more)

### Community 1 - "Team.tsx"
Cohesion: 0.12
Nodes (24): NewsCard(), EASE_OUT, Lightbox(), LightboxProps, hashHue(), MediaPlaceholder(), Section(), SectionProps (+16 more)

### Community 2 - "devDependencies"
Cohesion: 0.06
Nodes (31): autoprefixer, devDependencies, tsx, @types/compression, @types/cors, @types/express, @types/morgan, @types/node (+23 more)

### Community 3 - "useApi.ts"
Cohesion: 0.11
Nodes (22): ApiError, apiPost(), PartnersStrip(), PartnerGrid(), initials(), PartnerMark(), GROUNDS, JerseyIllustration() (+14 more)

### Community 4 - "Home.tsx"
Cohesion: 0.11
Nodes (24): apiGet(), formatDate(), formatTime(), MatchCard(), StandingsTable(), MagneticLink(), MagneticLinkProps, MotionLink (+16 more)

### Community 5 - "backend/package.json"
Cohesion: 0.08
Nodes (24): dependencies, compression, cors, express, express-rate-limit, helmet, morgan, description (+16 more)

### Community 6 - "frontend/package.json"
Cohesion: 0.09
Nodes (22): framer-motion, dependencies, framer-motion, react, react-dom, react-helmet-async, react-router-dom, @tanstack/react-query (+14 more)

### Community 7 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+13 more)

### Community 8 - "App.tsx"
Cohesion: 0.10
Nodes (17): AlbumDetail, App(), Calendar, Club, Contact, Gallery, Home, News (+9 more)

### Community 9 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 10 - "useClub"
Cohesion: 0.19
Nodes (10): Footer(), Header(), links, Layout(), ICONS, SocialLinks(), useClub(), useSendContact() (+2 more)

### Community 11 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowSyntheticDefaultImports, lib, module, moduleResolution, skipLibCheck, strict, target (+3 more)

## Knowledge Gaps
- **124 isolated node(s):** `name`, `version`, `description`, `type`, `main` (+119 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `frontend/package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `backend/package.json`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10707070707070707 - nodes in this community are weakly interconnected._
- **Should `Team.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12311265969802555 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `useApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11182795698924732 - nodes in this community are weakly interconnected._