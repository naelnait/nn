import type { Booking, BookingInput, BookingResult, Closure, Interval, OpeningHour, PublicConfig, Service, Settings, TravelQuote } from '../types';

export interface Backend {
  mode: 'demo' | 'supabase';
  // Public
  getPublicConfig(): Promise<PublicConfig>;
  getBusy(from: Date, to: Date): Promise<Interval[]>;
  quoteTravel(lat: number, lon: number): Promise<TravelQuote>;
  createBooking(input: BookingInput, opts?: { admin?: boolean }): Promise<BookingResult>;
  /** Appelé à chaque changement de disponibilité (temps réel). Renvoie la fonction de désabonnement. */
  onAvailabilityChange(cb: () => void): () => void;
  // Admin
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isAdmin(): Promise<boolean>;
  listBookings(from: Date, to: Date): Promise<Booking[]>;
  cancelBooking(id: string): Promise<void>;
  listClosures(from: Date): Promise<Closure[]>;
  addClosure(start: Date, end: Date, reason: string): Promise<void>;
  deleteClosure(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  listServices(): Promise<Service[]>;
  saveService(s: Service): Promise<void>;
  listHours(): Promise<OpeningHour[]>;
  saveHours(hours: OpeningHour[]): Promise<void>;
}
