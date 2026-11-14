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
  fee_per_km_cents: number;
  fee_free_km: number;
  road_factor: number;
}

export type PrivateSettingKey = 'base_lat' | 'base_lon' | 'fee_fixed_cents' | 'fee_per_km_cents' | 'fee_free_km' | 'road_factor';
export type PublicSettings = Omit<Settings, PrivateSettingKey>;

export interface PublicConfig {
  settings: PublicSettings;
  services: Service[];
  hours: OpeningHour[];
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
  vehicle_type: string;
  vehicle: string;
  address: string;
  lat: number | null;
  lon: number | null;
  notes: string;
}

export interface BookingResult {
  id: string;
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
  address: string;
  distance_km: number | null;
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
