# Tableau de bord domotique pour tablette

Page web plein écran pour une vieille tablette murale : **heure**, **météo du jour**
(actuelle, min/max, pluie, vent, prochaines heures) et **tuiles d'appareils**
(ampoules avec variateur, télé avec volume, PC, prises).

Écrit en HTML/CSS/JavaScript ES5 sans dépendance : fonctionne sur Android 4.4+ et
iPad sous iOS 9+.

## Principe

Une page web ne peut pas piloter directement des ampoules, une télé ou un PC
(protocoles propriétaires, cloud des fabricants). Le pilotage passe donc par
**Home Assistant**, logiciel libre qui sert de passerelle unique ; la tablette
n'est qu'un écran.

```
Tablette (cette page) ──HTTP──> Home Assistant ──> ampoules / télé / PC
          │
          └──HTTPS──> Open-Meteo (météo, gratuit, sans clé)
```

Sans Home Assistant configuré, la page tourne en **mode démo** (appareils simulés).

## 1. Installer Home Assistant

Sur une machine allumée en permanence : Raspberry Pi 4/5, mini-PC, NAS (Docker)
ou machine virtuelle. Guide officiel : https://www.home-assistant.io/installation/

## 2. Ajouter les appareils dans Home Assistant

Paramètres > Appareils et services > Ajouter une intégration :

| Appareil | Intégration |
|---|---|
| Ampoules Philips Hue | Philips Hue |
| Ampoules IKEA | IKEA TRÅDFRI / Dirigera |
| Ampoules Tuya / Smart Life / Lidl / Calex | Tuya |
| Ampoules Xiaomi Yeelight | Yeelight |
| Ampoules/prises TP-Link Tapo, Kasa | TP-Link |
| TV LG | LG webOS TV |
| TV Samsung | Samsung Smart TV |
| TV Android / Google TV, Chromecast | Android TV Remote, Google Cast |
| TV Philips | Philips TV |
| PC (état) | Ping (ICMP) → crée `binary_sensor.pc` |
| PC (allumer) | Wake on LAN → crée `switch.pc` (voir ci-dessous) |
| PC Windows (éteindre, veille) | HASS.Agent (application à installer sur le PC) |

**Wake on LAN** (dans `configuration.yaml`) :

```yaml
switch:
  - platform: wake_on_lan
    name: PC
    mac: "AA:BB:CC:DD:EE:FF"   # adresse MAC du PC
    host: 192.168.1.20         # IP fixe du PC
```

Le Wake-on-LAN doit aussi être activé dans le BIOS et dans les propriétés de la
carte réseau Windows. Le PC doit être relié en Ethernet (le WoL en Wi-Fi est
rarement fiable). Pour éteindre via la même tuile, ajoutez `turn_off:` avec un
script (par exemple un bouton HASS.Agent).

**Télé** : la plupart des TV ne peuvent pas être *allumées* par le réseau quand
elles sont en veille profonde. LG : activer « Allumer via Wi-Fi/LAN » ; Samsung :
renseigner l'adresse MAC dans l'intégration.

## 3. Installer la page sur Home Assistant

1. Copier le dossier `home-dashboard` dans `/config/www/dashboard/` de Home
   Assistant (add-on « File editor » ou « Samba share »).
2. Éditer `config.js` :
   - `location` : ville et coordonnées GPS ;
   - `devices` : un bloc par appareil, avec l'identifiant d'entité visible dans
     Paramètres > Entités (ex. `light.salon`).
3. Créer un compte Home Assistant dédié à la tablette (Paramètres > Personnes),
   s'y connecter, puis Profil > Sécurité > **Jetons d'accès longue durée** > Créer.
4. Sur la tablette, ouvrir une seule fois :
   `http://IP_HOME_ASSISTANT:8123/local/dashboard/index.html#token=LE_JETON`
   Le jeton est enregistré sur la tablette et retiré de l'adresse. Ensuite,
   l'adresse sans `#token=` suffit.

Le voyant en haut à droite indique : vert = connecté, orange = démo,
rouge = erreur (« Jeton refusé » ou « Home Assistant injoignable »).

## 4. Préparer la tablette

**Android** : installer **Fully Kiosk Browser** (gratuit pour l'essentiel) →
URL de démarrage = l'adresse ci-dessus, plein écran, écran toujours allumé,
lancement au démarrage. Laisser la tablette sur secteur ; si la batterie gonfle
avec l'âge, la retirer ou limiter la charge.

**iPad** : Safari → Partager → « Sur l'écran d'accueil » (plein écran), Réglages >
Luminosité > Verrouillage auto : Jamais, puis Accessibilité > **Accès guidé**
pour bloquer l'iPad sur la page.

## Options (`config.js`)

| Clé | Rôle |
|---|---|
| `weather.source` | `"open-meteo"` (défaut) ou `"homeassistant"` : à utiliser si la tablette est trop ancienne pour les certificats HTTPS récents (Android < 7) ; la météo passe alors par Home Assistant (`weather.forecast_maison` par défaut). |
| `devices[].icon` | `bulb`, `tv`, `pc`, `plug`, `fan`, `speaker` |
| `devices[].statusEntity` | Entité donnant l'état réel (ex. ping du PC) quand l'entité de commande ne le reflète pas. |
| `nightMode` | Assombrit l'écran la nuit (`from`, `to` en heures, `dim` de 0 à 1). `null` pour désactiver. |
| `refresh.states` | Fréquence de lecture des états (5 s par défaut). |
| `refresh.reloadPage` | Rechargement complet périodique (12 h) pour éviter les fuites mémoire des vieux navigateurs. |

Types d'entités gérés : `light` (marche/arrêt + variateur), `switch`, `fan`,
`input_boolean`, `media_player` (marche/arrêt, volume, muet), `script`, `scene`,
`button`.

## Sécurité

- Le dossier `/local/` de Home Assistant est servi **sans authentification**.
  D'où la méthode `#token=` : le jeton reste sur la tablette, pas dans
  `config.js`. Ne mettez pas le jeton dans `config.js` si Home Assistant est
  accessible depuis Internet.
- Un compte non administrateur peut tout de même piloter tous les appareils :
  quiconque a la tablette en main a ce pouvoir. Révoquez le jeton depuis le profil
  si la tablette est perdue.

## Tester sur un ordinateur

```bash
cd home-dashboard
python3 -m http.server 8000
# ouvrir http://localhost:8000  (mode démo)
```

Pour se connecter à Home Assistant depuis une autre origine que lui-même,
ajouter dans `configuration.yaml` :

```yaml
http:
  cors_allowed_origins:
    - http://IP_DU_SERVEUR:8000
```
