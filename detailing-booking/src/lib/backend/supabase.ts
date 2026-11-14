import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Backend } from './types';
import { BookingError, ERROR_MESSAGES, type Booking, type BookingErrorCode, type Closure, type Service, type Settings } from '../types';

function asBookingError(err: { message: string } | null): Error | null {
  if (!err) return null;
  const code = err.message as BookingErrorCode;
  return code in ERROR_MESSAGES ? new BookingError(code) : new Error(err.message);
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  const e = asBookingError(res.error);
  if (e) throw e;
  return res.data as T;
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb: SupabaseClient = createClient(url, anonKey);

  return {
    mode: 'supabase',

    async getPublicConfig() {
      return check(await sb.rpc('get_public_config'));
    },

    async getBusy(from, to) {
      const rows = check(await sb.rpc('get_busy', { p_from: from.toISOString(), p_to: to.toISOString() })) as
        { start_at: string; end_at: string }[];
      return rows.map((r) => ({ start: new Date(r.start_at), end: new Date(r.end_at) }));
    },

    async quoteTravel(lat, lon) {
      return check(await sb.rpc('quote_travel', { p_lat: lat, p_lon: lon }));
    },

    async createBooking(i, opts) {
      return check(
        await sb.rpc('create_booking', {
          p_service_id: i.service_id,
          p_location: i.location_type,
          p_start: i.start.toISOString(),
          p_name: i.customer_name,
          p_email: i.email,
          p_phone: i.phone,
          p_vehicle_type: i.vehicle_type,
          p_vehicle: i.vehicle,
          p_address: i.address,
          p_lat: i.lat,
          p_lon: i.lon,
          p_notes: i.notes,
          p_admin: opts?.admin ?? false,
        }),
      );
    },

    onAvailabilityChange(cb) {
      const channel = sb.channel('availability').on('broadcast', { event: 'changed' }, () => cb()).subscribe();
      // Filet de sécurité si la connexion temps réel tombe : rafraîchissement toutes les 60 s.
      const timer = setInterval(cb, 60_000);
      const onFocus = () => document.visibilityState === 'visible' && cb();
      document.addEventListener('visibilitychange', onFocus);
      return () => {
        clearInterval(timer);
        document.removeEventListener('visibilitychange', onFocus);
        void sb.removeChannel(channel);
      };
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Identifiants incorrects.');
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async isAdmin() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return false;
      const res = await sb.rpc('is_admin');
      return res.data === true;
    },

    async listBookings(from, to) {
      return check(
        await sb.from('bookings').select('*').gte('start_at', from.toISOString()).lt('start_at', to.toISOString()).order('start_at'),
      ) as Booking[];
    },

    async cancelBooking(id) {
      check(await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id));
    },

    async listClosures(from) {
      return check(await sb.from('closures').select('*').gte('ends_at', from.toISOString()).order('starts_at')) as Closure[];
    },

    async addClosure(start, end, reason) {
      check(await sb.from('closures').insert({ starts_at: start.toISOString(), ends_at: end.toISOString(), reason }));
    },

    async deleteClosure(id) {
      check(await sb.from('closures').delete().eq('id', id));
    },

    async getSettings() {
      return check(await sb.from('settings').select('*').eq('id', 1).single()) as Settings;
    },

    async saveSettings(s) {
      check(await sb.from('settings').update(s).eq('id', 1));
    },

    async listServices() {
      return check(await sb.from('services').select('*').order('sort').order('name')) as Service[];
    },

    async saveService(s) {
      const row = { ...s, id: s.id || undefined };
      check(await sb.from('services').upsert(row));
    },

    async listHours() {
      const rows = check(await sb.from('opening_hours').select('weekday, open_time, close_time').order('weekday').order('open_time')) as
        { weekday: number; open_time: string; close_time: string }[];
      return rows.map((h) => ({ ...h, open_time: h.open_time.slice(0, 5), close_time: h.close_time.slice(0, 5) }));
    },

    async saveHours(hours) {
      check(await sb.rpc('replace_opening_hours', { p_hours: hours }));
    },
  };
}
