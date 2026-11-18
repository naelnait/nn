/*
 * Configuration du tableau de bord.
 * Seul fichier à modifier. Syntaxe ES5 (compatible vieilles tablettes) :
 * pas de virgule après le dernier élément d'une liste.
 */
var CONFIG = {
  // Lieu pour la météo (coordonnées GPS : clic droit sur Google Maps > copier les coordonnées)
  location: {
    name: "Paris",
    latitude: 48.8566,
    longitude: 2.3522
  },

  // Source météo :
  //  - "open-meteo"    : service gratuit sans clé, appelé directement par la tablette
  //  - "homeassistant" : utilise l'entité météo de Home Assistant (utile si la tablette
  //                      est trop vieille pour les certificats HTTPS récents)
  weather: {
    source: "open-meteo",
    haEntity: "weather.forecast_maison"
  },

  homeAssistant: {
    // Laisser vide si le tableau est servi par Home Assistant lui-même (/local/...).
    // Sinon : "http://192.168.1.50:8123"
    url: "",
    // Jeton longue durée. Recommandé : le laisser vide et l'ajouter une seule fois
    // dans l'URL de la tablette : index.html#token=VOTRE_JETON (il est alors mémorisé
    // sur la tablette et n'apparaît pas dans ce fichier).
    // Sans jeton : mode démo (appareils simulés).
    token: ""
  },

  // Appareils affichés. "entity" = identifiant Home Assistant (Paramètres > Entités).
  // icon : "bulb" | "tv" | "pc" | "plug" | "fan" | "speaker"
  // statusEntity (facultatif) : entité qui donne l'état réel (ex. ping du PC).
  devices: [
    // Identifiants probables : à vérifier dans Home Assistant (Paramètres > Entités)
    { name: "Salon",        entity: "light.salon",        icon: "bulb" },
    { name: "Donut",        entity: "light.donut",        icon: "bulb" },
    { name: "Cuisine",      entity: "light.cuisine",      icon: "bulb" },
    { name: "Chambre",      entity: "light.chambre",      icon: "bulb" },
    { name: "Salle de bain", entity: "light.salle_de_bain", icon: "bulb" },
    { name: "Enceinte",     entity: "media_player.salon", icon: "speaker" },
    { name: "Télé",         entity: "media_player.tv",    icon: "tv" },
    { name: "PC",           entity: "switch.pc", statusEntity: "binary_sensor.pc", icon: "pc" }
  ],

  // Assombrit l'écran la nuit (heures pleines, 0-23). Mettre null pour désactiver.
  nightMode: { from: 23, to: 7, dim: 0.75 },

  // Intervalles de rafraîchissement (ms)
  refresh: {
    states: 5000,
    weather: 900000,
    reloadPage: 43200000
  }
};
