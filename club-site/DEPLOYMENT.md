# Déploiement

## En local avec Docker

```bash
cd club-site
docker compose up --build
```

- Frontend : http://localhost:8080
- Backend : http://localhost:4000/api/v1
- La base sqlite persiste dans le volume nommé `backend-data` (migrations + seed au premier démarrage, comme en local sans Docker).

Pour un déploiement réel (pas localhost), reconstruire le frontend avec la bonne URL :

```bash
docker compose build frontend --build-arg VITE_API_URL=https://api.mondomaine.fr/api/v1
```

## CI (`.github/workflows/ci.yml`)

Quatre jobs, déclenchés sur push/PR touchant `club-site/` :
1. **backend** — typecheck, tests (`node --test`), build
2. **frontend** — typecheck, build
3. **e2e** — suite Playwright complète (dépend des deux précédents)
4. **docker-build** — vérifie que les deux images se construisent

## Note sur le test des Dockerfiles dans cette session

Le daemon Docker de cet environnement d'exécution n'a pas d'accès réseau sortant réel depuis les conteneurs (vérifié : un simple `fetch()` échoue dans un conteneur `node` tout juste tiré). Les builds `npm ci` à l'intérieur des Dockerfiles n'ont donc pas pu être testés bout en bout ici — ils sont écrits selon les conventions standard (multi-stage, utilisateur non-root, healthcheck) et relus avec soin, mais **pas exécutés avec succès en local**. Le job `docker-build` de la CI GitHub Actions constitue le premier test réel (accès réseau normal sur les runners GitHub).

## Checklist avant mise en production

- [ ] `VITE_API_URL` du frontend pointe vers la vraie URL du backend (pas localhost)
- [ ] `CORS_ORIGIN` du backend correspond à l'URL réelle du frontend
- [ ] Le volume `backend-data` est bien un volume persistant (pas un `tmpfs`) sur l'hôte de prod
- [ ] `npm run db:migrate` tourne comme étape de release avant de démarrer une nouvelle instance, plutôt que de compter sur le seed automatique au boot (`getDb()` gère les migrations dans tous les cas ; le seed automatique ne s'exécute que si la base est vide)
- [ ] HTTPS en amont (reverse proxy / load balancer) — aucune des deux images ne termine TLS elle-même
