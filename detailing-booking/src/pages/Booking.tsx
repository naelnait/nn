import { useCallback, useEffect, useMemo, useState } from 'react';
import { backend } from '../lib/backend';
import { AddressInput } from '../components/AddressInput';
import { Calendar } from '../components/Calendar';
import type { AddressSuggestion } from '../lib/geocode';
import { bufferAfter, checkSlot, daySlots, rulesFrom } from '../lib/slots';
import { addDays, dayKeyOf, dayKeyString, formatDate, formatDuration, formatPrice, formatTime, zonedTime, type DayKey } from '../lib/time';
import { BookingError, type BookingResult, type Interval, type LocationType, type PublicConfig, type TravelQuote } from '../lib/types';

const VEHICLE_TYPES = ['Voiture', 'SUV / 4x4', 'Utilitaire / Van', 'Moto / Scooter', 'Autre'];

interface Confirmed extends BookingResult {
  serviceName: string;
  start: Date;
  end: Date;
  location: LocationType;
  address: string;
}

export function BookingPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<Interval[]>([]);
  const [now, setNow] = useState(() => new Date());

  const [serviceId, setServiceId] = useState('');
  const [location, setLocation] = useState<LocationType>('home');
  const [address, setAddress] = useState<AddressSuggestion | null>(null);
  const [quote, setQuote] = useState<TravelQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [month, setMonth] = useState(() => {
    const d = dayKeyOf(new Date(), 'Europe/Paris');
    return { year: d.year, month: d.month };
  });
  const [day, setDay] = useState<DayKey | null>(null);
  const [slot, setSlot] = useState<Date | null>(null);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', vehicleType: VEHICLE_TYPES[0], vehicle: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);

  const refresh = useCallback(async () => {
    try {
      const cfg = await backend.getPublicConfig();
      const t = new Date();
      const b = await backend.getBusy(t, new Date(t.getTime() + (cfg.settings.max_days_ahead + 2) * 86_400_000));
      setConfig(cfg);
      setBusy(b);
      setNow(t);
      setLoadError('');
    } catch {
      setLoadError('Impossible de charger les disponibilités. Vérifiez votre connexion puis rechargez la page.');
    }
  }, []);

  useEffect(() => {
    void refresh();
    return backend.onAvailabilityChange(() => void refresh());
  }, [refresh]);

  const settings = config?.settings;
  const service = config?.services.find((s) => s.id === serviceId) ?? null;

  // Mode d'intervention par défaut selon ce qui est proposé
  useEffect(() => {
    if (!settings) return;
    if (location === 'home' && !settings.home_enabled && settings.atelier_enabled) setLocation('atelier');
    if (location === 'atelier' && !settings.atelier_enabled && settings.home_enabled) setLocation('home');
  }, [settings, location]);

  // Devis de déplacement dès qu'une adresse est choisie
  useEffect(() => {
    setQuote(null);
    if (!address || location !== 'home') return;
    let cancelled = false;
    setQuoteLoading(true);
    backend
      .quoteTravel(address.lat, address.lon)
      .then((q) => !cancelled && setQuote(q))
      .catch(() => !cancelled && setQuote(null))
      .finally(() => !cancelled && setQuoteLoading(false));
    return () => {
      cancelled = true;
    };
  }, [address, location, config]);

  const locationReady = location === 'atelier' || (address !== null && quote?.in_zone === true);
  const buffer = settings ? bufferAfter(settings, location) : 0;

  const rules = useMemo(
    () => (config ? rulesFrom(config.settings, config.hours, busy, now) : null),
    [config, busy, now],
  );

  const availability = useMemo(() => {
    const map = new Map<string, number>();
    if (!rules || !service || !settings) return map;
    let d = dayKeyOf(now, settings.timezone);
    for (let i = 0; i <= settings.max_days_ahead; i++, d = addDays(d, 1)) {
      const n = daySlots(d, service.duration_min, buffer, rules).length;
      if (n) map.set(dayKeyString(d), n);
    }
    return map;
  }, [rules, service, settings, buffer, now]);

  const slots = useMemo(
    () => (rules && service && day ? daySlots(day, service.duration_min, buffer, rules) : []),
    [rules, service, day, buffer],
  );

  // Temps réel : si le créneau choisi vient d'être pris, on le retire
  useEffect(() => {
    if (!slot || !rules || !service) return;
    if (checkSlot(slot, service.duration_min, buffer, rules) !== null) {
      setSlot(null);
      setNotice("Le créneau choisi vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.");
    }
  }, [rules, slot, service, buffer]);

  useEffect(() => {
    if (day && !availability.has(dayKeyString(day))) setDay(null);
  }, [availability, day]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !slot) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await backend.createBooking({
        service_id: service.id,
        location_type: location,
        start: slot,
        customer_name: form.name,
        email: form.email,
        phone: form.phone,
        vehicle_type: form.vehicleType,
        vehicle: form.vehicle,
        address: location === 'home' ? address?.label ?? '' : '',
        lat: location === 'home' ? address?.lat ?? null : null,
        lon: location === 'home' ? address?.lon ?? null : null,
        notes: form.notes,
      });
      setConfirmed({
        ...res,
        serviceName: service.name,
        start: slot,
        end: new Date(slot.getTime() + service.duration_min * 60_000),
        location,
        address: address?.label ?? '',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof BookingError ? err.message : 'Une erreur est survenue, merci de réessayer.');
      if (err instanceof BookingError && err.code === 'SLOT_TAKEN') {
        setSlot(null);
        void refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <Shell><p className="alert error">{loadError}</p></Shell>;
  if (!config || !settings) return <Shell><p className="muted">Chargement…</p></Shell>;

  if (confirmed) {
    return (
      <Shell name={settings.business_name}>
        <section className="card confirm">
          <h2>Rendez-vous confirmé</h2>
          <dl className="summary">
            <dt>Formule</dt><dd>{confirmed.serviceName}</dd>
            <dt>Date</dt><dd>{formatDate(confirmed.start)}</dd>
            <dt>Horaire</dt><dd>{formatTime(confirmed.start)} – {formatTime(confirmed.end)}</dd>
            <dt>Lieu</dt><dd>{confirmed.location === 'home' ? confirmed.address : settings.atelier_address || 'Atelier'}</dd>
            {confirmed.travel_fee_cents > 0 && <><dt>Déplacement</dt><dd>{formatPrice(confirmed.travel_fee_cents)}</dd></>}
            <dt>Total</dt><dd><strong>{formatPrice(confirmed.total_cents)}</strong></dd>
          </dl>
          <p className="muted">Pour modifier ou annuler, contactez-nous{settings.phone ? ` au ${settings.phone}` : ''}.</p>
          <button type="button" className="btn" onClick={() => { setConfirmed(null); setSlot(null); setDay(null); }}>
            Nouvelle réservation
          </button>
        </section>
      </Shell>
    );
  }

  const zoneText = `jusqu'à ${settings.zone_width_km} km autour de l'axe ${settings.zone_a_label} – ${settings.zone_b_label}`;
  const today = dayKeyOf(now, settings.timezone);
  const last = addDays(today, settings.max_days_ahead);
  const total = (service?.price_cents ?? 0) + (location === 'home' ? quote?.fee_cents ?? 0 : 0);

  return (
    <Shell name={settings.business_name} phone={settings.phone}>
      <section className="card">
        <h2><span className="step">1</span> Formule</h2>
        {config.services.length === 0 && <p className="muted">Aucune formule disponible pour le moment.</p>}
        <div className="services">
          {config.services.map((s) => (
            <button key={s.id} type="button" className={`service${s.id === serviceId ? ' selected' : ''}`}
                    aria-pressed={s.id === serviceId}
                    onClick={() => { setServiceId(s.id); setSlot(null); }}>
              <span className="service-name">{s.name}</span>
              <span className="service-price">{formatPrice(s.price_cents)}</span>
              <span className="service-meta">{formatDuration(s.duration_min)}</span>
              {s.description && <span className="service-desc">{s.description}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2><span className="step">2</span> Lieu</h2>
        {settings.home_enabled && settings.atelier_enabled && (
          <div className="segmented" role="radiogroup">
            <button type="button" role="radio" aria-checked={location === 'home'} className={location === 'home' ? 'on' : ''}
                    onClick={() => { setLocation('home'); setSlot(null); }}>À domicile</button>
            <button type="button" role="radio" aria-checked={location === 'atelier'} className={location === 'atelier' ? 'on' : ''}
                    onClick={() => { setLocation('atelier'); setSlot(null); }}>À l'atelier</button>
          </div>
        )}
        {location === 'home' ? (
          <>
            <label htmlFor="address">Adresse d'intervention</label>
            <AddressInput id="address" value={address} onChange={setAddress} />
            <p className="hint">Zone desservie : {zoneText}.</p>
            {quoteLoading && <p className="muted">Calcul des frais de déplacement…</p>}
            {quote && !quote.in_zone && (
              <p className="alert error">Cette adresse est hors de notre zone d'intervention. Contactez-nous pour une demande particulière.</p>
            )}
            {quote && quote.in_zone && (
              <p className="alert ok">
                Adresse desservie. Frais de déplacement : <strong>{quote.fee_cents ? formatPrice(quote.fee_cents) : 'offerts'}</strong>
              </p>
            )}
          </>
        ) : (
          <p>{settings.atelier_address || 'Adresse de l’atelier communiquée à la confirmation.'}</p>
        )}
      </section>

      <section className={`card${!service || !locationReady ? ' disabled' : ''}`}>
        <h2><span className="step">3</span> Date et heure</h2>
        {!service || !locationReady ? (
          <p className="muted">Choisissez d'abord une formule et {location === 'home' ? 'une adresse desservie' : 'un lieu'}.</p>
        ) : (
          <>
            {notice && <p className="alert warn" role="status">{notice}</p>}
            <div className="date-picker">
              <Calendar
                month={month}
                onMonthChange={setMonth}
                minMonth={{ year: today.year, month: today.month }}
                maxMonth={{ year: last.year, month: last.month }}
                selected={day}
                onSelect={(d) => { setDay(d); setSlot(null); setNotice(''); }}
                availability={availability}
                today={today}
              />
              <div className="slots">
                {!day && <p className="muted">{availability.size ? 'Sélectionnez un jour.' : 'Aucun créneau disponible pour le moment.'}</p>}
                {day && (
                  <>
                    <p className="slots-title">{formatDate(zonedTime(day, 720, settings.timezone))}</p>
                    <div className="slot-grid">
                      {slots.map((s) => (
                        <button key={s.getTime()} type="button" aria-pressed={slot?.getTime() === s.getTime()}
                                className={`slot${slot?.getTime() === s.getTime() ? ' selected' : ''}`}
                                onClick={() => { setSlot(s); setNotice(''); }}>
                          {formatTime(s)}
                        </button>
                      ))}
                    </div>
                    <p className="hint live"><i className="live-dot" /> Disponibilités mises à jour en temps réel</p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className={`card${!slot ? ' disabled' : ''}`}>
        <h2><span className="step">4</span> Vos coordonnées</h2>
        {!slot || !service ? (
          <p className="muted">Choisissez d'abord un créneau.</p>
        ) : (
          <form onSubmit={submit} className="form">
            <div className="row">
              <div>
                <label htmlFor="name">Nom et prénom</label>
                <input id="name" required minLength={2} maxLength={120} autoComplete="name"
                       value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="phone">Téléphone</label>
                <input id="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel"
                       value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" required maxLength={200} autoComplete="email"
                   value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="row">
              <div>
                <label htmlFor="vtype">Type de véhicule</label>
                <select id="vtype" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                  {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="vehicle">Marque et modèle</label>
                <input id="vehicle" maxLength={200} placeholder="ex. Peugeot 308"
                       value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
              </div>
            </div>
            <label htmlFor="notes">Précisions (facultatif)</label>
            <textarea id="notes" rows={3} maxLength={2000} placeholder="État du véhicule, accès, point d'eau/électricité…"
                      value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            <dl className="summary">
              <dt>Formule</dt><dd>{service.name} ({formatDuration(service.duration_min)})</dd>
              <dt>Créneau</dt><dd>{formatDate(slot)} à {formatTime(slot)}</dd>
              <dt>Prestation</dt><dd>{formatPrice(service.price_cents)}</dd>
              {location === 'home' && <><dt>Déplacement</dt><dd>{quote?.fee_cents ? formatPrice(quote.fee_cents) : 'offert'}</dd></>}
              <dt>Total</dt><dd><strong>{formatPrice(total)}</strong></dd>
            </dl>
            {submitError && <p className="alert error" role="alert">{submitError}</p>}
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Réservation…' : 'Confirmer le rendez-vous'}
            </button>
            <p className="hint">Paiement sur place après la prestation.</p>
          </form>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children, name, phone }: { children: React.ReactNode; name?: string; phone?: string }) {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-inner">
          <h1>{name ?? 'Réservation'}</h1>
          <p>Nettoyage et detailing auto & moto — réservez votre créneau en ligne.</p>
          {phone && <a className="hero-phone" href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>}
        </div>
      </header>
      <main className="container">{children}</main>
      <footer className="footer"><a href="/admin">Espace pro</a></footer>
    </div>
  );
}
