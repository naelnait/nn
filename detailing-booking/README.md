# Réservation detailing (auto & moto)

Site de prise de rendez-vous en ligne pour une activité de nettoyage / detailing, avec calendrier mis à jour en temps réel.

## Fonctionnalités

**Côté client**
- 3 formules à prix fixe : Intérieur, Extérieur, Complet (modifiables).
- Service à domicile : adresse avec autocomplétion, vérification de la zone (couloir autour de l'axe Paris – Chartres), calcul des frais de déplacement.
- Calendrier qui n'affiche que les créneaux réellement libres (temps tampon inclus), mis à jour en direct : si quelqu'un réserve un créneau, il disparaît immédiatement chez les autres visiteurs.
- Récapitulatif avec total (prestation + déplacement) et confirmation.

**Espace pro (`/admin`)**
- Planning des RDV (temps réel), annulation, ajout manuel d'un RDV pris par téléphone.
- Blocage de périodes (congés, indisponibilités).
- Édition des formules (prix, durée, description), des horaires (plusieurs plages par jour), des temps tampon, de la zone et des frais.

**Règles garanties par le serveur** (`supabase/schema.sql`)
- Aucune double réservation possible, y compris en cas de clics simultanés (contrainte d'exclusion PostgreSQL).
- Temps tampon après chaque RDV : nettoyage (30 min par défaut) + trajet si à domicile (45 min par défaut).
- Respect des horaires, du délai de prévenance (12 h), de l'horizon de réservation (60 jours), des périodes bloquées.
- Zone et frais recalculés côté serveur : le prix ne peut pas être falsifié depuis le navigateur.
- Les visiteurs ne voient que des plages occupées, jamais les données des autres clients. Le point de départ du pro reste privé.

### Tarif selon le véhicule

Quatre catégories. Le client choisit la marque et le modèle (obligatoires) ; le prix vient d'une grille formule × catégorie, modifiable dans l'espace pro (onglet Formules) :

| Catégorie | Complet | Intérieur | Extérieur |
|---|---|---|---|
| Moto / scooter | 70 € | 38 € | 33 € |
| Citadine (berlines et breaks compris) | 149 € | 80 € | 70 € |
| SUV / 4x4 (monospaces compris) | 165 € | 89 € | 78 € |
| Utilitaire / fourgon | 189 € | 101 € | 89 € |

Les prix du Complet ont été fournis. Ceux d'Intérieur et d'Extérieur appliquent le même écart entre catégories, à partir de 80 € et 70 € pour une citadine : à valider.

**Classement des modèles** : `src/data/vehicles.json` (805 modèles, 88 marques) est généré par `scripts/build_vehicle_catalog.py` à partir des fichiers officiels ADEME/UTAC « véhicules particuliers commercialisés en France » (data.gouv.fr) :
- éditions 2012, 2013, 2014 et courante, d'après le champ *Carrosserie* : berline, break, coupé, cabriolet → citadine ; TS terrains/chemins, monospace, combispace, minispace → SUV ; minibus → utilitaire ;
- édition 2011 (sans carrosserie) : modèles encore vendus en 2011, classés par mots-clés.

Un complément manuel couvre les modèles 2000-2010 retirés avant 2011, les modèles récents (2015-2025) dont les marques chinoises vendues en France (BYD, MG, Leapmotor, Xpeng, Zeekr, Omoda, Jaecoo, Lynk & Co, Seres, Voyah, Chery…), les voitures sans permis et les utilitaires immatriculés en camionnette. Quand un même nom existe en version voiture et utilitaire (Kangoo, Berlingo, Partner, Caddy…), le client indique le **genre de la carte grise (case J.1)** : VP → SUV, CTTE → utilitaire. Le serveur refuse une catégorie incohérente avec le modèle ; un modèle absent du catalogue est accepté avec la catégorie choisie et signalé « à vérifier » dans le planning.

### Calcul des frais de déplacement

```
distance estimée = distance à vol d'oiseau (point de départ → client) × 1,3
frais            = forfait fixe + (distance estimée − km offerts) × prix/km, arrondi à l'euro supérieur
```
Point de départ : rue de la République, 28320 Gas. Valeurs par défaut : forfait 0 €, 10 km offerts, 0,50 €/km. Exemples : Épernon offert, Chartres 8 €, Versailles 23 €, Paris 34 €.

### Zone d'intervention

Tout ce qui est à moins de 20 km (réglable) du segment Paris – Chartres. Les points A et B, la largeur et le point de départ se changent dans Paramètres.

## Démarrer en local (mode démo)

```bash
npm install
npm run dev
```
Sans configuration Supabase, le site tourne en **mode démo** : les données sont stockées dans le navigateur, le temps réel fonctionne entre onglets. Admin : `admin@demo.fr` / `demo`.

## Mise en production

### 1. Base de données : Supabase (gratuit pour démarrer)
1. Créer un projet sur supabase.com (région Europe, ex. Paris `eu-west-3`).
2. **SQL Editor** → coller et exécuter `supabase/schema.sql`, puis `supabase/vehicle_catalog.sql` (catalogue des modèles).
3. **Authentication → Sign In / Providers** : désactiver « Allow new users to sign up ».
4. **Authentication → Users → Add user** : créer le compte du pro (e-mail + mot de passe).
5. SQL Editor : `insert into public.admins (user_id) select id from auth.users where email = 'email-du-pro@exemple.fr';`
6. **Project Settings → API** : récupérer l'URL et la clé `anon` (publique).

### 2. Configuration
```bash
cp .env.example .env
# renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

### 3. Hébergement : Cloudflare Workers (gratuit, usage commercial autorisé)
```bash
npx wrangler login
npm run deploy
```
Puis brancher le nom de domaine dans le tableau de bord Cloudflare (Workers → Settings → Domains).

## Versions de l'interface

| Version | Contenu | Où la retrouver |
|---|---|---|
| Épurée | Parcours en 4 étapes, style sobre | commit `d681514`, page autonome `versions/epuree.html` |
| Détaillée (actuelle) | + carte de la zone, frise de la journée, créneaux matin/après-midi avec heure de fin, bon d'intervention, liste « à prévoir », indicateurs de l'espace pro | branche actuelle, page autonome `versions/detaillee.html` |

Les fichiers de `versions/` sont des pages de démonstration autonomes (mode démo, communes intégrées) générées par `npm run build:test-link`.

## Tests

```bash
npm test          # logique créneaux / zone / frais (Vitest)
npm run test:db   # règles SQL sur un PostgreSQL local jetable (nécessite PostgreSQL 15+)
```

## Structure

```
supabase/schema.sql        Tables, règles de réservation, sécurité, temps réel
supabase/test/             Tests SQL
src/lib/slots.ts           Calcul des créneaux (mêmes règles que le serveur)
src/lib/zone.ts            Zone et frais de déplacement
src/lib/backend/           Accès aux données : supabase.ts (production) / demo.ts (local)
src/pages/Booking.tsx      Parcours de réservation client
src/pages/Admin.tsx        Espace pro
```

## À faire / à valider avec le pro

- [ ] Prix et durées réels des formules.
- [ ] Valider les prix Intérieur et Extérieur par catégorie (déduits du Complet).
- [ ] Atelier : adresse, puis activation dans Paramètres.
- [ ] Grille de frais de déplacement (0,50 €/km au-delà de 10 km par défaut).
- [ ] E-mails de confirmation (client + pro) via Resend et une Edge Function Supabase.
- [ ] Anti-spam du formulaire (Cloudflare Turnstile).
- [ ] Acompte en ligne (Stripe), si souhaité. Actuellement : paiement sur place.
- [ ] Mentions légales et politique de confidentialité (RGPD : données clients stockées).
