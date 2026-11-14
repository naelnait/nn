export type LocationType = 'home' | 'atelier';

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number;
  active: boolean;
  sort: number;
}

/** weekday : 1 = lundi ... 7 = dimanche. Heures au format HH:MM, heure de Paris. */
export interface OpeningHour {
  weekday: number;
  open_time: string;
  close_time: string;
}

export interface Settings {
  business_name: string;
  phone: string;
  email: string;
  timezone: string;
  slot_step_min: number;
  min_notice_hours: number;
  max_days_ahead: number;
  cleanup_buffer_min: number;
  travel_buffer_min: number;
  home_enabled: boolean;
  atelier_enabled: boolean;
  atelier_address: string;
  zone_a_label: string;
  zone_a_lat: number;
  zone_a_lon: number;
  zone_b_label: string;
  zone_b_lat: number;
  zone_b_lon: number;
  zone_width_km: number;
  base_lat: number;
  base_lon: number;
  fee_fixed_cents: number;
  fee_free_km: number;
  road_factor: number;
  /** Frais calculés sur l'aller-retour (retour au point de départ après chaque RDV). */
  round_trip: boolean;
  fuel_l_per_100km: number;
  /** Prix du litre de carburant, en centimes. */
  fuel_price_cents: number;
}

export type PrivateSettingKey = 'base_lat' | 'base_lon' | 'fee_fixed_cents' | 'fee_free_km' | 'road_factor' | 'round_trip' | 'fuel_l_per_100km' | 'fuel_price_cents';
export type PublicSettings = Omit<Settings, PrivateSettingKey>;

export interface VehicleCategory {
  code: string;
  label: string;
  sort: number;
}

/** Prix d'une formule pour une catégorie de véhicule. */
export interface ServicePrice {
  service_id: string;
  category: string;
  price_cents: number;
}

export interface PublicConfig {
  settings: PublicSettings;
  services: Service[];
  hours: OpeningHour[];
  vehicle_categories: VehicleCategory[];
  prices: ServicePrice[];
}

export interface Interval {
  start: Date;
  end: Date;
}

export interface TravelQuote {
  in_zone: boolean;
  distance_km: number;
  fee_cents: number;
}

export interface BookingInput {
  service_id: string;
  location_type: LocationType;
  start: Date;
  customer_name: string;
  email: string;
  phone: string;
  vehicle_category: string;
  vehicle_brand: string;
  vehicle_model: string;
  /** Genre inscrit en case J.1 de la carte grise, demandé seulement s'il lève une ambiguïté. */
  vehicle_genre: '' | 'VP' | 'CTTE';
  address: string;
  lat: number | null;
  lon: number | null;
  notes: string;
}

export interface BookingResult {
  id: string;
  price_cents: number;
  total_cents: number;
  travel_fee_cents: number;
}

export interface Booking {
  id: string;
  created_at: string;
  service_id: string;
  service_name: string;
  location_type: LocationType;
  start_at: string;
  end_at: string;
  occupied_until: string;
  customer_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle: string;
  vehicle_category: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_genre: string;
  vehicle_verified: boolean;
  address: string;
  distance_km: number | null;
  base_price_cents: number | null;
  vehicle_surcharge_pct: number;
  price_cents: number;
  travel_fee_cents: number;
  total_cents: number;
  notes: string;
  source: 'online' | 'admin';
  status: 'confirmed' | 'cancelled';
}

export interface Closure {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
}

export type BookingErrorCode =
  | 'INVALID_INPUT'
  | 'SERVICE_UNAVAILABLE'
  | 'LOCATION_UNAVAILABLE'
  | 'OUT_OF_ZONE'
  | 'VEHICLE_REQUIRED'
  | 'VEHICLE_MISMATCH'
  | 'VEHICLE_GENRE_REQUIRED'
  | 'TOO_SOON'
  | 'TOO_FAR'
  | 'OUTSIDE_HOURS'
  | 'SLOT_TAKEN'
  | 'FORBIDDEN';

export const ERROR_MESSAGES: Record<BookingErrorCode, string> = {
  INVALID_INPUT: 'Certaines informations sont manquantes ou invalides.',
  SERVICE_UNAVAILABLE: "Cette formule n'est plus disponible.",
  LOCATION_UNAVAILABLE: "Ce mode d'intervention n'est pas disponible.",
  OUT_OF_ZONE: "Cette adresse est en dehors de la zone d'intervention.",
  VEHICLE_REQUIRED: 'La marque et le modèle du véhicule sont obligatoires.',
  VEHICLE_MISMATCH: 'La catégorie choisie ne correspond pas à ce modèle. Revenez à l’étape Véhicule.',
  VEHICLE_GENRE_REQUIRED: 'Indiquez le genre inscrit sur la carte grise (case J.1) : VP ou CTTE.',
  TOO_SOON: 'Ce créneau est trop proche, merci de choisir une date plus lointaine.',
  TOO_FAR: 'Ce créneau est trop loin dans le futur.',
  OUTSIDE_HOURS: "Ce créneau est en dehors des horaires d'ouverture.",
  SLOT_TAKEN: "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.",
  FORBIDDEN: 'Action non autorisée.',
};

export class BookingError extends Error {
  constructor(public code: BookingErrorCode) {
    super(ERROR_MESSAGES[code]);
  }
}
