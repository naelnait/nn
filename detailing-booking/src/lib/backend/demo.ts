// Mode démo : tout est stocké dans le navigateur (localStorage), aucun serveur requis.
// Les règles sont identiques à celles du serveur. Synchronisation entre onglets en temps réel.
import type { Backend } from './types';
import { BookingError, type Booking, type Closure, type Interval, type OpeningHour, type Service, type ServicePrice, type Settings, type VehicleCategory } from '../types';
import { DEFAULT_PRICE_GRID, DEFAULT_VEHICLE_CATEGORIES, categoryForGenre, gridPrice, lookupVehicle, needsGenre, vehicleKey } from '../vehicles';
import { bufferAfter, checkSlot, overlaps, rulesFrom } from '../slots';
import { travelQuote } from '../zone';

interface DemoDb {
  settings: Settings;
  services: Service[];
  hours: OpeningHour[];
  closures: Closure[];
  bookings: Booking[];
  vehicleCategories: VehicleCategory[];
  prices: ServicePrice[];
}

// v3 : grille de prix par catégorie (4 catégories), départ à Gas (les données démo antérieures sont abandonnées)
const KEY = 'detailing-demo-db-v3';
const SESSION_KEY = 'detailing-demo-admin';
export const DEMO_ADMIN = { email: 'admin@demo.fr', password: 'demo' };

export const DEFAULT_SETTINGS: Settings = {
  business_name: 'Detailing Auto & Moto',
  phone: '06 00 00 00 00',
  email: 'contact@exemple.fr',
  timezone: 'Europe/Paris',
  slot_step_min: 30,
  min_notice_hours: 12,
  max_days_ahead: 60,
  cleanup_buffer_min: 30,
  travel_buffer_min: 45,
  home_enabled: true,
  atelier_enabled: false,
  atelier_address: '',
  zone_a_label: 'Paris',
  zone_a_lat: 48.8566,
  zone_a_lon: 2.3522,
  zone_b_label: 'Chartres',
  zone_b_lat: 48.4439,
  zone_b_lon: 1.489,
  zone_width_km: 20,
  // Rue de la République, 28320 Gas
  base_lat: 48.566873,
  base_lon: 1.667562,
  fee_fixed_cents: 0,
  fee_per_km_cents: 50,
  fee_free_km: 10,
  road_factor: 1.3,
};

function uuid(): string {
  return crypto.randomUUID();
}

function seed(): DemoDb {
  const db = seedBase();
  db.prices = db.services.flatMap((s) =>
    Object.entries(DEFAULT_PRICE_GRID[s.name] ?? {}).map(([category, price_cents]) => ({ service_id: s.id, category, price_cents })),
  );
  return db;
}

function seedBase(): DemoDb {
  return {
    settings: { ...DEFAULT_SETTINGS },
    services: [
      { id: uuid(), name: 'Intérieur', description: 'Aspiration, sièges, plastiques, vitres intérieures.', duration_min: 150, price_cents: 8000, active: true, sort: 1 },
      { id: uuid(), name: 'Extérieur', description: 'Lavage, décontamination, jantes, protection.', duration_min: 150, price_cents: 7000, active: true, sort: 2 },
      { id: uuid(), name: 'Complet', description: 'Intérieur + extérieur.', duration_min: 270, price_cents: 14900, active: true, sort: 3 },
    ],
    vehicleCategories: DEFAULT_VEHICLE_CATEGORIES.map((c) => ({ ...c })),
    prices: [],
    hours: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, open_time: '08:30', close_time: '18:30' })),
    closures: [],
    bookings: [],
  };
}

function load(): DemoDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoDb;
  } catch {
    /* stockage indisponible : on repart des valeurs par défaut */
  }
  const db = seed();
  save(db, false);
  return db;
}

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('detailing-demo') : null;
const listeners = new Set<() => void>();
channel?.addEventListener('message', () => listeners.forEach((l) => l()));

function save(db: DemoDb, notify = true) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignoré */
  }
  if (notify) {
    channel?.postMessage('changed');
    listeners.forEach((l) => l());
  }
}

function busyOf(db: DemoDb): Interval[] {
  return [
    ...db.bookings.filter((b) => b.status === 'confirmed').map((b) => ({ start: new Date(b.start_at), end: new Date(b.occupied_until) })),
    ...db.closures.map((c) => ({ start: new Date(c.starts_at), end: new Date(c.ends_at) })),
  ];
}

let memoryAdmin = false;

function isSessionAdmin(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1' || memoryAdmin;
  } catch {
    return memoryAdmin;
  }
}

function requireAdmin() {
  if (!isSessionAdmin()) throw new BookingError('FORBIDDEN');
}

const delay = () => new Promise((r) => setTimeout(r, 120));

export function createDemoBackend(): Backend {
  return {
    mode: 'demo',

    async getPublicConfig() {
      await delay();
      const db = load();
      const { base_lat, base_lon, fee_fixed_cents, fee_per_km_cents, fee_free_km, road_factor, ...pub } = db.settings;
      void [base_lat, base_lon, fee_fixed_cents, fee_per_km_cents, fee_free_km, road_factor];
      return {
        settings: pub,
        services: db.services.filter((s) => s.active).sort((a, b) => a.sort - b.sort),
        hours: [...db.hours],
        vehicle_categories: [...db.vehicleCategories].sort((a, b) => a.sort - b.sort),
        prices: db.prices.filter((p) => db.services.some((s) => s.id === p.service_id && s.active)),
      };
    },

    async getBusy(from, to) {
      await delay();
      const range = { start: from, end: to };
      return busyOf(load()).filter((b) => overlaps(b, range));
    },

    async quoteTravel(lat, lon) {
      return travelQuote({ lat, lon }, load().settings);
    },

    async createBooking(i, opts) {
      await delay();
      const admin = opts?.admin ?? false;
      if (admin) requireAdmin();
      const db = load();
      const s = db.settings;
      const svc = db.services.find((v) => v.id === i.service_id && v.active);
      if (!svc) throw new BookingError('SERVICE_UNAVAILABLE');
      const name = i.customer_name.trim();
      const phone = i.phone.trim();
      const email = i.email.trim();
      if (name.length < 2 || phone.length < 6 || (!admin && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) {
        throw new BookingError('INVALID_INPUT');
      }

      // Véhicule : mêmes contrôles que create_booking côté serveur
      const brand = vehicleKey(i.vehicle_brand);
      const model = vehicleKey(i.vehicle_model);
      if (!brand || !model) throw new BookingError('VEHICLE_REQUIRED');
      const vc = db.vehicleCategories.find((c) => c.code === i.vehicle_category);
      if (!vc) throw new BookingError('INVALID_INPUT');
      const cats = lookupVehicle(brand, model);
      if (cats && !admin) {
        if (needsGenre(cats)) {
          if (!i.vehicle_genre) throw new BookingError('VEHICLE_GENRE_REQUIRED');
          if (vc.code !== categoryForGenre(cats, i.vehicle_genre)) throw new BookingError('VEHICLE_MISMATCH');
        } else if (!cats.includes(vc.code as never)) {
          throw new BookingError('VEHICLE_MISMATCH');
        }
      }
      const price = gridPrice(db.prices, svc.id, vc.code, svc.price_cents);

      let fee = 0;
      let distance: number | null = null;
      if (i.location_type === 'home') {
        if (!s.home_enabled && !admin) throw new BookingError('LOCATION_UNAVAILABLE');
        if (i.lat == null || i.lon == null || !i.address.trim()) throw new BookingError('INVALID_INPUT');
        const q = travelQuote({ lat: i.lat, lon: i.lon }, s);
        if (!q.in_zone && !admin) throw new BookingError('OUT_OF_ZONE');
        fee = q.fee_cents;
        distance = q.distance_km;
      } else if (!s.atelier_enabled && !admin) {
        throw new BookingError('LOCATION_UNAVAILABLE');
      }

      const buffer = bufferAfter(s, i.location_type);
      const end = new Date(i.start.getTime() + svc.duration_min * 60_000);
      const occupiedUntil = new Date(end.getTime() + buffer * 60_000);

      if (admin) {
        const occupied = { start: i.start, end: occupiedUntil };
        const taken = db.bookings.some(
          (b) => b.status === 'confirmed' && overlaps(occupied, { start: new Date(b.start_at), end: new Date(b.occupied_until) }),
        );
        if (taken) throw new BookingError('SLOT_TAKEN');
      } else {
        const err = checkSlot(i.start, svc.duration_min, buffer, rulesFrom(s, db.hours, busyOf(db)));
        if (err) throw new BookingError(err);
      }

      const booking: Booking = {
        id: uuid(),
        created_at: new Date().toISOString(),
        service_id: svc.id,
        service_name: svc.name,
        location_type: i.location_type,
        start_at: i.start.toISOString(),
        end_at: end.toISOString(),
        occupied_until: occupiedUntil.toISOString(),
        customer_name: name,
        email,
        phone,
        vehicle_type: vc.label,
        vehicle: `${brand} ${model}`,
        vehicle_category: vc.code,
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_genre: i.vehicle_genre,
        vehicle_verified: cats !== null,
        address: i.location_type === 'home' ? i.address : '',
        distance_km: distance,
        base_price_cents: svc.price_cents,
        vehicle_surcharge_pct: 0,
        price_cents: price,
        travel_fee_cents: fee,
        total_cents: price + fee,
        notes: i.notes,
        source: admin ? 'admin' : 'online',
        status: 'confirmed',
      };
      db.bookings.push(booking);
      save(db);
      return { id: booking.id, price_cents: price, total_cents: booking.total_cents, travel_fee_cents: fee };
    },

    onAvailabilityChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async signIn(email, password) {
      await delay();
      if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
        throw new Error('Identifiants incorrects.');
      }
      memoryAdmin = true;
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* stockage bloqué */ }
    },

    async signOut() {
      memoryAdmin = false;
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* stockage bloqué */ }
    },

    async isAdmin() {
      return isSessionAdmin();
    },

    async listBookings(from, to) {
      requireAdmin();
      return load()
        .bookings.filter((b) => new Date(b.start_at) >= from && new Date(b.start_at) < to)
        .sort((a, b) => a.start_at.localeCompare(b.start_at));
    },

    async cancelBooking(id) {
      requireAdmin();
      const db = load();
      const b = db.bookings.find((x) => x.id === id);
      if (b) b.status = 'cancelled';
      save(db);
    },

    async listClosures(from) {
      requireAdmin();
      return load()
        .closures.filter((c) => new Date(c.ends_at) >= from)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    },

    async addClosure(start, end, reason) {
      requireAdmin();
      if (end <= start) throw new BookingError('INVALID_INPUT');
      const db = load();
      db.closures.push({ id: uuid(), starts_at: start.toISOString(), ends_at: end.toISOString(), reason });
      save(db);
    },

    async deleteClosure(id) {
      requireAdmin();
      const db = load();
      db.closures = db.closures.filter((c) => c.id !== id);
      save(db);
    },

    async getSettings() {
      requireAdmin();
      return { ...load().settings };
    },

    async saveSettings(s) {
      requireAdmin();
      const db = load();
      db.settings = { ...s };
      save(db);
    },

    async listServices() {
      requireAdmin();
      return [...load().services].sort((a, b) => a.sort - b.sort);
    },

    async saveService(s) {
      requireAdmin();
      const db = load();
      const idx = db.services.findIndex((x) => x.id === s.id);
      if (idx >= 0) db.services[idx] = { ...s };
      else db.services.push({ ...s, id: uuid() });
      save(db);
    },

    async listVehicleCategories() {
      requireAdmin();
      return [...load().vehicleCategories].sort((a, b) => a.sort - b.sort);
    },

    async listServicePrices() {
      requireAdmin();
      return [...load().prices];
    },

    async saveServicePrices(list) {
      requireAdmin();
      if (list.some((p) => !Number.isInteger(p.price_cents) || p.price_cents < 0)) throw new BookingError('INVALID_INPUT');
      const db = load();
      db.prices = list.map((p) => ({ ...p }));
      save(db);
    },

    async listHours() {
      requireAdmin();
      return [...load().hours].sort((a, b) => a.weekday - b.weekday || a.open_time.localeCompare(b.open_time));
    },

    async saveHours(hours) {
      requireAdmin();
      if (hours.some((h) => h.close_time <= h.open_time)) throw new BookingError('INVALID_INPUT');
      const db = load();
      db.hours = hours.map((h) => ({ ...h }));
      save(db);
    },
  };
}
