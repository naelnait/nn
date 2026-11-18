/*
 * Tableau de bord domotique pour tablette.
 * ES5 uniquement (pas de let/const, fonctions fléchées, fetch, Promise) pour
 * fonctionner sur d'anciens Android / iPad.
 */
(function () {
  'use strict';

  var C = window.CONFIG || {};
  var HA = C.homeAssistant || {};
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // ---------------------------------------------------------------- utilitaires
  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function round(n) { return Math.round(n); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function storageGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }

  function request(method, url, body, headers, cb) {
    var r = new XMLHttpRequest();
    var done = false;
    r.open(method, url, true);
    try { r.timeout = 10000; } catch (e) { /* vieux navigateurs */ }
    for (var k in headers) {
      if (headers.hasOwnProperty(k)) r.setRequestHeader(k, headers[k]);
    }
    r.onreadystatechange = function () {
      if (r.readyState !== 4 || done) return;
      done = true;
      if (r.status >= 200 && r.status < 300) {
        var data = null;
        try { data = r.responseText ? JSON.parse(r.responseText) : null; } catch (e) { cb(e); return; }
        cb(null, data);
      } else {
        cb(new Error('HTTP ' + r.status));
      }
    };
    r.send(body ? JSON.stringify(body) : null);
  }

  // ------------------------------------------------------------ jeton / démo
  // Le jeton peut être passé une fois via index.html#token=XXX puis est mémorisé.
  (function readTokenFromHash() {
    var m = /[#&]token=([^&]+)/.exec(window.location.hash || '');
    if (m) {
      storageSet('ha_token', decodeURIComponent(m[1]));
      try { window.history.replaceState(null, '', window.location.pathname + window.location.search); }
      catch (e) { window.location.hash = ''; }
    }
  })();
  var TOKEN = HA.token || storageGet('ha_token') || '';
  var BASE = (HA.url || '').replace(/\/+$/, '');
  var DEMO = !TOKEN;

  function ha(method, path, body, cb) {
    request(method, BASE + path, body, {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    }, cb);
  }

  // ------------------------------------------------------------------ icônes
  var S = '<svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round" ';
  var SUN_RAYS = '<g stroke="#ffc94d" stroke-width="4"><path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.2 4.2M13.6 50.4l4.2-4.2M46.2 17.8l4.2-4.2"/></g>';
  var CLOUD = '<path d="M20 50h26a10 10 0 0 0 1-20 14 14 0 0 0-27-3A11.5 11.5 0 0 0 20 50z" fill="#c4c7cc"/>';
  var CLOUD_DARK = '<path d="M20 44h26a10 10 0 0 0 1-20 14 14 0 0 0-27-3A11.5 11.5 0 0 0 20 44z" fill="#9aa0a6"/>';
  var ICONS = {
    sun: S + '>' + SUN_RAYS + '<circle cx="32" cy="32" r="12" fill="#ffc94d"/></svg>',
    moon: S + '><path d="M42 44a18 18 0 0 1-16-30 18 18 0 1 0 24 24 18 18 0 0 1-8 6z" fill="#d6dbe4"/></svg>',
    partly: S + '><g transform="translate(-8 -10) scale(.8)">' + SUN_RAYS + '<circle cx="32" cy="32" r="12" fill="#ffc94d"/></g>' +
      '<path d="M24 54h24a9 9 0 0 0 1-18 12 12 0 0 0-23-2A10 10 0 0 0 24 54z" fill="#c4c7cc"/></svg>',
    'partly-night': S + '><path d="M30 30a13 13 0 0 1-12-21 13 13 0 1 0 17 17 13 13 0 0 1-5 4z" fill="#d6dbe4"/>' +
      '<path d="M24 54h24a9 9 0 0 0 1-18 12 12 0 0 0-23-2A10 10 0 0 0 24 54z" fill="#c4c7cc"/></svg>',
    cloud: S + '>' + CLOUD + '</svg>',
    fog: S + '><g stroke="#9aa0a6" stroke-width="4"><path d="M10 24h44M6 34h52M12 44h40M18 54h28"/></g></svg>',
    drizzle: S + '>' + CLOUD_DARK + '<g stroke="#6fa8ff" stroke-width="3"><path d="M24 50v4M34 50v4M44 50v4"/></g></svg>',
    rain: S + '>' + CLOUD_DARK + '<g stroke="#6fa8ff" stroke-width="4"><path d="M22 50l-3 8M33 50l-3 8M44 50l-3 8"/></g></svg>',
    snow: S + '>' + CLOUD_DARK + '<g fill="#e8eaed"><circle cx="22" cy="54" r="3"/><circle cx="33" cy="58" r="3"/><circle cx="44" cy="54" r="3"/></g></svg>',
    storm: S + '>' + CLOUD_DARK + '<path d="M34 44l-8 12h8l-4 8 12-14h-8l4-6z" fill="#ffc94d"/></svg>',
    wind: S + '><g stroke="#c4c7cc" stroke-width="4"><path d="M8 26h32a7 7 0 1 0-7-7M8 38h42a7 7 0 1 1-7 7M8 32h22"/></g></svg>',

    bulb: S + 'stroke="currentColor" stroke-width="4"><path d="M24 46h16M26 54h12M32 8a16 16 0 0 0-9 29c2 2 3 4 3 7v2h12v-2c0-3 1-5 3-7a16 16 0 0 0-9-29z"/></svg>',
    tv: S + 'stroke="currentColor" stroke-width="4"><rect x="6" y="12" width="52" height="34" rx="4"/><path d="M22 56h20M32 46v10"/></svg>',
    pc: S + 'stroke="currentColor" stroke-width="4"><rect x="8" y="10" width="48" height="32" rx="3"/><path d="M24 54h16M32 42v12"/></svg>',
    plug: S + 'stroke="currentColor" stroke-width="4"><path d="M24 8v12M40 8v12M18 20h28v10a14 14 0 0 1-28 0zM32 44v12"/></svg>',
    fan: S + 'stroke="currentColor" stroke-width="4"><circle cx="32" cy="32" r="4"/><path d="M32 28c-2-10 2-18 10-18 6 0 6 10-6 18M36 32c10-2 18 2 18 10 0 6-10 6-18-6M32 36c2 10-2 18-10 18-6 0-6-10 6-18M28 32c-10 2-18-2-18-10 0-6 10-6 18 6"/></svg>',
    speaker: S + 'stroke="currentColor" stroke-width="4"><rect x="16" y="6" width="32" height="52" rx="5"/><circle cx="32" cy="38" r="9"/><circle cx="32" cy="18" r="3"/></svg>'
  };

  // ------------------------------------------------------------------ horloge
  var lastMinute = -1;
  function tickClock() {
    var d = new Date();
    if (d.getMinutes() === lastMinute) return;
    lastMinute = d.getMinutes();
    $('time').innerHTML = pad(d.getHours()) + '<span class="colon">:</span>' + pad(d.getMinutes());
    $('date').textContent = cap(JOURS[d.getDay()]) + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
    applyNight(d.getHours());
  }

  function applyNight(h) {
    var n = C.nightMode;
    var el = $('night');
    if (!n) { el.style.opacity = 0; return; }
    var night = n.from > n.to ? (h >= n.from || h < n.to) : (h >= n.from && h < n.to);
    el.style.opacity = night ? (n.dim || 0.7) : 0;
  }

  // ------------------------------------------------------------------- météo
  var WMO = {
    0: ['Ciel dégagé', 'sun'], 1: ['Plutôt dégagé', 'sun'], 2: ['Partiellement nuageux', 'partly'],
    3: ['Couvert', 'cloud'], 45: ['Brouillard', 'fog'], 48: ['Brouillard givrant', 'fog'],
    51: ['Bruine légère', 'drizzle'], 53: ['Bruine', 'drizzle'], 55: ['Bruine forte', 'drizzle'],
    56: ['Bruine verglaçante', 'drizzle'], 57: ['Bruine verglaçante', 'drizzle'],
    61: ['Pluie faible', 'rain'], 63: ['Pluie', 'rain'], 65: ['Pluie forte', 'rain'],
    66: ['Pluie verglaçante', 'rain'], 67: ['Pluie verglaçante', 'rain'],
    71: ['Neige faible', 'snow'], 73: ['Neige', 'snow'], 75: ['Neige forte', 'snow'], 77: ['Grains de neige', 'snow'],
    80: ['Averses faibles', 'rain'], 81: ['Averses', 'rain'], 82: ['Averses violentes', 'rain'],
    85: ['Averses de neige', 'snow'], 86: ['Fortes averses de neige', 'snow'],
    95: ['Orage', 'storm'], 96: ['Orage avec grêle', 'storm'], 99: ['Orage avec grêle', 'storm']
  };
  var HA_COND = {
    'clear-night': ['Nuit claire', 'moon'], cloudy: ['Couvert', 'cloud'], fog: ['Brouillard', 'fog'],
    hail: ['Grêle', 'storm'], lightning: ['Orage', 'storm'], 'lightning-rainy': ['Orage pluvieux', 'storm'],
    partlycloudy: ['Partiellement nuageux', 'partly'], pouring: ['Averses fortes', 'rain'],
    rainy: ['Pluie', 'rain'], snowy: ['Neige', 'snow'], 'snowy-rainy': ['Pluie et neige', 'snow'],
    sunny: ['Ensoleillé', 'sun'], windy: ['Venteux', 'wind'], 'windy-variant': ['Venteux et nuageux', 'wind'],
    exceptional: ['Exceptionnel', 'storm']
  };

  function nightVariant(icon, isDay) {
    if (isDay) return icon;
    if (icon === 'sun') return 'moon';
    if (icon === 'partly') return 'partly-night';
    return icon;
  }

  function fetchOpenMeteo(cb) {
    var L = C.location || {};
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + L.latitude + '&longitude=' + L.longitude +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
      '&timezone=auto&forecast_days=2';
    request('GET', url, null, {}, function (err, d) {
      if (err) { cb(err); return; }
      var cur = d.current, w = WMO[cur.weather_code] || ['—', 'cloud'];
      var nowKey = cur.time.substring(0, 13);
      var start = 0;
      for (var i = 0; i < d.hourly.time.length; i++) {
        if (d.hourly.time[i].substring(0, 13) > nowKey) { start = i; break; }
      }
      var hourly = [];
      for (var j = start; j < d.hourly.time.length && hourly.length < 6; j += 2) {
        var hw = WMO[d.hourly.weather_code[j]] || ['', 'cloud'];
        hourly.push({
          label: parseInt(d.hourly.time[j].substring(11, 13), 10) + 'h',
          temp: d.hourly.temperature_2m[j],
          icon: nightVariant(hw[1], d.hourly.is_day[j]),
          rain: d.hourly.precipitation_probability[j]
        });
      }
      cb(null, {
        temp: cur.temperature_2m, feels: cur.apparent_temperature,
        label: w[0], icon: nightVariant(w[1], cur.is_day),
        humidity: cur.relative_humidity_2m, wind: cur.wind_speed_10m,
        min: d.daily.temperature_2m_min[0], max: d.daily.temperature_2m_max[0],
        rain: d.daily.precipitation_probability_max[0],
        sunrise: d.daily.sunrise[0].substring(11, 16), sunset: d.daily.sunset[0].substring(11, 16),
        hourly: hourly
      });
    });
  }

  function haForecast(type, cb) {
    var ent = C.weather.haEntity;
    ha('POST', '/api/services/weather/get_forecasts?return_response', { entity_id: ent, type: type }, function (err, d) {
      if (err || !d || !d.service_response || !d.service_response[ent]) { cb([]); return; }
      cb(d.service_response[ent].forecast || []);
    });
  }

  function fetchHAWeather(cb) {
    var ent = C.weather.haEntity;
    ha('GET', '/api/states/' + ent, null, function (err, st) {
      if (err) { cb(err); return; }
      var a = st.attributes || {};
      ha('GET', '/api/states/sun.sun', null, function (e2, sun) {
        var isDay = !sun || sun.state !== 'below_horizon';
        haForecast('daily', function (daily) {
          haForecast('hourly', function (hourlyRaw) {
            var w = HA_COND[st.state] || [st.state, 'cloud'];
            var hourly = [];
            for (var i = 1; i < hourlyRaw.length && hourly.length < 6; i += 2) {
              var f = hourlyRaw[i], fw = HA_COND[f.condition] || ['', 'cloud'];
              var hh = new Date(f.datetime).getHours();
              hourly.push({ label: hh + 'h', temp: f.temperature, icon: nightVariant(fw[1], hh >= 7 && hh < 19), rain: f.precipitation_probability });
            }
            var today = daily[0] || {};
            var sunAttr = (sun && sun.attributes) || {};
            cb(null, {
              temp: a.temperature, feels: a.apparent_temperature,
              label: w[0], icon: nightVariant(w[1], isDay),
              humidity: a.humidity, wind: a.wind_speed,
              min: today.templow, max: today.temperature, rain: today.precipitation_probability,
              sunrise: sunAttr.next_rising ? hhmm(sunAttr.next_rising) : null,
              sunset: sunAttr.next_setting ? hhmm(sunAttr.next_setting) : null,
              hourly: hourly
            });
          });
        });
      });
    });
  }
  function hhmm(iso) { var d = new Date(iso); return isNaN(d) ? null : pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function renderWeather(w) {
    $('w-icon').innerHTML = ICONS[w.icon] || ICONS.cloud;
    $('w-temp').textContent = round(w.temp) + '°';
    $('w-label').textContent = w.label + ((C.location && C.location.name) ? ' · ' + C.location.name : '');
    var det = [];
    if (w.min != null && w.max != null) det.push('<b>' + round(w.min) + '° / ' + round(w.max) + '°</b>');
    if (w.feels != null) det.push('Ressenti <b>' + round(w.feels) + '°</b>');
    if (w.rain != null) det.push('Pluie <b>' + round(w.rain) + ' %</b>');
    if (w.wind != null) det.push('Vent <b>' + round(w.wind) + ' km/h</b>');
    if (w.humidity != null) det.push('Humidité <b>' + round(w.humidity) + ' %</b>');
    if (w.sunrise && w.sunset) det.push('Soleil <b>' + w.sunrise + ' – ' + w.sunset + '</b>');
    var html = '';
    for (var i = 0; i < det.length; i++) html += '<span class="d">' + det[i] + '</span>';
    $('w-details').innerHTML = html;
    var h = '';
    for (var j = 0; j < w.hourly.length; j++) {
      var x = w.hourly[j];
      h += '<div class="h"><div>' + x.label + '</div><div class="h-icon">' + (ICONS[x.icon] || ICONS.cloud) +
        '</div><div class="h-temp">' + round(x.temp) + '°</div>' +
        '<div class="h-rain">' + (x.rain != null ? round(x.rain) + ' %' : '&nbsp;') + '</div></div>';
    }
    $('w-hourly').innerHTML = h;
  }

  function updateWeather() {
    var useHA = C.weather && C.weather.source === 'homeassistant' && !DEMO;
    (useHA ? fetchHAWeather : fetchOpenMeteo)(function (err, w) {
      if (err) {
        if ($('w-temp').textContent === '--°') $('w-label').textContent = 'Météo indisponible';
        setTimeout(updateWeather, 60000);
        return;
      }
      renderWeather(w);
    });
  }

  // --------------------------------------------------------------- appareils
  var devices = C.devices || [];
  var states = {};
  var tiles = [];
  var busyUntil = {};

  function domainOf(entity) { return entity.split('.')[0]; }

  function isOn(st) {
    if (!st) return false;
    var s = st.state;
    if (s === 'on' || s === 'playing' || s === 'paused' || s === 'idle' || s === 'home') return true;
    if (domainOf(st.entity_id) === 'media_player') {
      return s !== 'off' && s !== 'standby' && s !== 'unavailable' && s !== 'unknown';
    }
    return false;
  }

  function stateText(dev, st, ctrl) {
    if (!st || st.state === 'unavailable' || st.state === 'unknown') return 'Indisponible';
    var on = isOn(st);
    if (!on) return 'Arrêt';
    var a = (ctrl && ctrl.attributes) || {};
    if (domainOf(dev.entity) === 'light' && a.brightness != null) return 'Marche · ' + round(a.brightness / 2.55) + ' %';
    if (domainOf(dev.entity) === 'media_player') {
      if (a.media_title) return a.media_title;
      if (a.source) return a.source;
      if (st.state === 'playing') return 'Lecture';
    }
    return 'Marche';
  }

  function buildTiles() {
    var root = $('devices');
    var html = '';
    for (var i = 0; i < devices.length; i++) {
      var d = devices[i], dom = domainOf(d.entity);
      var cls = 'tile' + (dom === 'media_player' ? ' media' : '') + (d.icon === 'pc' ? ' computer' : '');
      var extra = '';
      if (dom === 'light') {
        extra = '<div class="tile-extra" data-kind="light"><input type="range" min="1" max="100" value="100" data-i="' + i + '"></div>';
      } else if (dom === 'media_player') {
        extra = '<div class="tile-extra has btns"><button data-i="' + i + '" data-act="volume_down">−</button>' +
          '<button data-i="' + i + '" data-act="volume_mute">Muet</button>' +
          '<button data-i="' + i + '" data-act="volume_up">+</button></div>';
      }
      html += '<div class="' + cls + '" id="tile' + i + '">' +
        '<button class="tile-main" data-i="' + i + '">' +
        '<div class="t-icon">' + (ICONS[d.icon] || ICONS.plug) + '</div>' +
        '<div class="t-name">' + esc(d.name) + '</div>' +
        '<div class="t-state">…</div></button>' + extra + '</div>';
    }
    root.innerHTML = html;
    for (var k = 0; k < devices.length; k++) tiles.push($('tile' + k));

    root.addEventListener('click', function (ev) {
      var t = ev.target;
      while (t && t !== root && !t.getAttribute('data-i')) t = t.parentNode;
      if (!t || t === root || t.tagName === 'INPUT') return;
      var i = parseInt(t.getAttribute('data-i'), 10);
      var act = t.getAttribute('data-act');
      if (act) mediaAction(i, act); else toggle(i);
    }, false);

    root.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.tagName !== 'INPUT') return;
      setBrightness(parseInt(t.getAttribute('data-i'), 10), parseInt(t.value, 10));
    }, false);
  }

  function renderTiles() {
    for (var i = 0; i < devices.length; i++) {
      var d = devices[i];
      var ctrl = states[d.entity];
      var st = d.statusEntity ? (states[d.statusEntity] || ctrl) : ctrl;
      var tile = tiles[i];
      var on = isOn(st);
      var unavailable = !st || st.state === 'unavailable';
      var cls = tile.className.replace(/\s*\b(on|unavailable|busy)\b/g, '');
      if (on) cls += ' on';
      if (unavailable) cls += ' unavailable';
      if (busyUntil[i] && busyUntil[i] > Date.now()) cls += ' busy';
      tile.className = cls;
      tile.querySelector('.t-state').textContent = stateText(d, st, ctrl);

      var slider = tile.querySelector('input[type=range]');
      if (slider) {
        var bri = ctrl && ctrl.attributes && ctrl.attributes.brightness;
        var extra = slider.parentNode;
        extra.className = 'tile-extra' + (bri != null ? ' has' : '');
        if (bri != null && document.activeElement !== slider) slider.value = Math.max(1, round(bri / 2.55));
      }
    }
  }

  function callService(domain, service, data, cb) {
    if (DEMO) { demoService(domain, service, data); renderTiles(); if (cb) cb(null); return; }
    ha('POST', '/api/services/' + domain + '/' + service, data, function (err) {
      if (err) setStatus('err', 'Erreur commande');
      if (cb) cb(err);
      setTimeout(pollStates, 700);
    });
  }

  function toggle(i) {
    var d = devices[i], dom = domainOf(d.entity);
    var st = d.statusEntity ? (states[d.statusEntity] || states[d.entity]) : states[d.entity];
    var on = isOn(st);
    busyUntil[i] = Date.now() + 1500;
    renderTiles();
    setTimeout(renderTiles, 1600);
    var svc;
    if (dom === 'script' || dom === 'scene') svc = 'turn_on';
    else if (dom === 'button') svc = 'press';
    else if (dom === 'media_player' || d.statusEntity) svc = on ? 'turn_off' : 'turn_on';
    else svc = 'toggle';
    callService(dom, svc, { entity_id: d.entity });
  }

  function setBrightness(i, pct) {
    callService('light', 'turn_on', { entity_id: devices[i].entity, brightness_pct: pct });
  }

  function mediaAction(i, act) {
    var ent = devices[i].entity, data = { entity_id: ent };
    if (act === 'volume_mute') {
      var a = (states[ent] && states[ent].attributes) || {};
      data.is_volume_muted = !a.is_volume_muted;
    }
    callService('media_player', act, data);
  }

  function setStatus(kind, text) {
    $('status').className = 'status ' + kind;
    $('status-text').textContent = text;
  }

  function pollStates() {
    if (DEMO) { renderTiles(); return; }
    ha('GET', '/api/states', null, function (err, list) {
      if (err) {
        setStatus('err', err.message === 'HTTP 401' ? 'Jeton refusé' : 'Home Assistant injoignable');
        return;
      }
      var map = {};
      for (var i = 0; i < list.length; i++) map[list[i].entity_id] = list[i];
      states = map;
      setStatus('ok', 'Connecté');
      renderTiles();
    });
  }

  // ------------------------------------------------------------- mode démo
  function demoInit() {
    for (var i = 0; i < devices.length; i++) {
      var d = devices[i], dom = domainOf(d.entity);
      var on = i % 2 === 0;
      var attrs = {};
      if (dom === 'light') attrs.brightness = on ? 204 : null;
      if (dom === 'media_player') { attrs.source = 'HDMI 1'; attrs.is_volume_muted = false; }
      states[d.entity] = { entity_id: d.entity, state: on ? 'on' : 'off', attributes: attrs };
      if (d.statusEntity) states[d.statusEntity] = { entity_id: d.statusEntity, state: on ? 'on' : 'off', attributes: {} };
    }
    setStatus('demo', 'Mode démo');
  }

  function demoService(domain, service, data) {
    var st = states[data.entity_id];
    if (!st) return;
    var on = st.state === 'on';
    if (service === 'toggle') on = !on;
    else if (service === 'turn_on') on = true;
    else if (service === 'turn_off') on = false;
    else if (service === 'volume_mute') st.attributes.is_volume_muted = data.is_volume_muted;
    st.state = on ? 'on' : 'off';
    if (domain === 'light') {
      if (data.brightness_pct) st.attributes.brightness = round(data.brightness_pct * 2.55);
      else st.attributes.brightness = on ? (st.attributes.brightness || 204) : null;
    }
    for (var i = 0; i < devices.length; i++) {
      if (devices[i].entity === data.entity_id && devices[i].statusEntity) {
        states[devices[i].statusEntity].state = st.state;
      }
    }
  }

  // ---------------------------------------------------------------- démarrage
  var R = C.refresh || {};
  tickClock();
  setInterval(tickClock, 1000);
  updateWeather();
  setInterval(updateWeather, R.weather || 900000);
  buildTiles();
  if (DEMO) demoInit();
  pollStates();
  if (!DEMO) setInterval(pollStates, R.states || 5000);
  if (R.reloadPage) setTimeout(function () { window.location.reload(); }, R.reloadPage);
})();
