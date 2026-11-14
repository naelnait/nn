import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { backend } from '../lib/backend';
import { AddressInput } from '../components/AddressInput';
import { USE_DEMO_PLACES, type AddressSuggestion } from '../lib/geocode';
import { bufferAfter, checkSlot, daySlots, rulesFrom } from '../lib/slots';
import { addDays, dayKeyOf, dayKeyString, formatDate, formatDuration, formatPrice, formatTime, sameDay, weekdayOf, zonedTime, type DayKey } from '../lib/time';
import { BookingError, type BookingResult, type Interval, type LocationType, type PublicConfig, type Service, type TravelQuote } from '../lib/types';
import { buildIcs, downloadIcs } from '../lib/ics';
import { Car, CarKey, ChevronLeft, Clipboard, Flag, Garage, Gauge, Home, MapPin, Route, CategoryIcon, ServiceIcon, Spray, Stopwatch, Wheel, Wrench } from '../components/Icons';
import { ZoneMap } from '../components/ZoneMap';
import { DayTimeline } from '../components/DayTimeline';
import { AnimatedPrice, Barcode, CarSilhouette } from '../components/Decor';
import { Combo } from '../components/Combo';
import { CAR_BRANDS, CATEGORY_EXAMPLES, MOTO_BRANDS, displayBrand, displayModel, modelsOf, resolveCategory, vehicleKey, vehiclePrice } from '../lib/vehicles';
import { parseHHMM } from '../lib/time';
import type { OpeningHour, VehicleCategory } from '../lib/types';

/** Build « lien de test » (page hébergée sur claude.ai) : pas de téléchargement de fichier possible. */
const IS_TEST_LINK = import.meta.env.VITE_TEST_LINK === '1';
const STEPS = ['Prestation', 'Véhicule', 'Lieu', 'Créneau', 'Coordonnées'] as const;
const WD = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const WD_LONG = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** « Lun – Sam · 08:30 – 18:30 » : regroupe les jours consécutifs aux horaires identiques. */
function summarizeHours(hours: OpeningHour[]): string[] {
  const byDay = new Map<number, string>();
  for (let d = 1; d <= 7; d++) {
    const r = hours.filter((h) => h.weekday === d).sort((a, b) => parseHHMM(a.open_time) - parseHHMM(b.open_time));
    if (r.length) byDay.set(d, r.map((h) => `${h.open_time} – ${h.close_time}`).join(', '));
  }
  const out: string[] = [];
  let d = 1;
  while (d <= 7) {
    const v = byDay.get(d);
    if (!v) { d++; continue; }
    let e = d;
    while (e < 7 && byDay.get(e + 1) === v) e++;
    out.push(`${WD_LONG[d - 1]}${e > d ? ` – ${WD_LONG[e - 1]}` : ''} · ${v.replace(/:00/g, 'h').replace(/:(\d\d)/g, 'h$1')}`);
    d = e + 1;
  }
  return out;
}

/** Éléments inclus, tirés de la description de la formule. */
function includedItems(description: string): string[] {
  return description
    .split(/[,+.]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .slice(0, 5);
}

function shortRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

interface Confirmed extends BookingResult {
  serviceName: string;
  start: Date;
  end: Date;
  location: string;
  isHome: boolean;
  vehicle: string;
}

export function BookingPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<Interval[]>([]);
  const [now, setNow] = useState(() => new Date());

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');

  const [serviceId, setServiceId] = useState('');
  const [location, setLocation] = useState<LocationType>('home');
  const [address, setAddress] = useState<AddressSuggestion | null>(null);
  const [quote, setQuote] = useState<TravelQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [day, setDay] = useState<DayKey | null>(null);
  const [slot, setSlot] = useState<Date | null>(null);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [veh, setVeh] = useState<{ kind: 'car' | 'moto'; brand: string; model: string; chosen: string; genre: '' | 'VP' | 'CTTE' }>(
    { kind: 'car', brand: '', model: '', chosen: '', genre: '' },
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const settings = config?.settings;
  const service = config?.services.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    if (!settings) return;
    if (location === 'home' && !settings.home_enabled && settings.atelier_enabled) setLocation('atelier');
    if (location === 'atelier' && !settings.atelier_enabled && settings.home_enabled) setLocation('home');
  }, [settings, location]);

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
  const rules = useMemo(() => (config ? rulesFrom(config.settings, config.hours, busy, now) : null), [config, busy, now]);

  const days = useMemo(() => {
    const list: { day: DayKey; count: number }[] = [];
    if (!rules || !service || !settings) return list;
    let d = dayKeyOf(now, settings.timezone);
    for (let i = 0; i <= settings.max_days_ahead; i++, d = addDays(d, 1)) {
      list.push({ day: d, count: daySlots(d, service.duration_min, buffer, rules).length });
    }
    return list;
  }, [rules, service, settings, buffer, now]);

  const slots = useMemo(
    () => (rules && service && day ? daySlots(day, service.duration_min, buffer, rules) : []),
    [rules, service, day, buffer],
  );

  // Jour par défaut : le premier jour disponible
  useEffect(() => {
    if (step !== 3) return;
    const cur = day && days.find((d) => sameDay(d.day, day));
    if (!cur || cur.count === 0) setDay(days.find((d) => d.count > 0)?.day ?? null);
  }, [step, days, day]);

  // Temps réel : créneau choisi pris entre-temps
  useEffect(() => {
    if (!slot || !rules || !service) return;
    if (checkSlot(slot, service.duration_min, buffer, rules) !== null) {
      setSlot(null);
      setToast("Ce créneau vient d'être réservé. Choisissez-en un autre.");
      if (step > 3) { setDir('back'); setStep(3); }
    }
  }, [rules, slot, service, buffer, step]);

  // Véhicule : catégorie tarifaire et prix de la formule
  const vehRes = resolveCategory(veh.kind, veh.brand, veh.model, veh.chosen, veh.genre);
  const vehicleCategory = vehRes.category;
  const category = config?.vehicle_categories.find((c) => c.code === vehicleCategory) ?? null;
  const vehicleReady = veh.brand.trim().length > 0 && veh.model.trim().length > 0 && !!category;
  const vehicleName = `${vehRes.known ? displayBrand(vehicleKey(veh.brand)) : veh.brand.trim()} ${vehRes.known ? displayModel(vehicleKey(veh.model)) : veh.model.trim()}`;
  const priceFor = (base: number, code: string | null) => {
    const c = config?.vehicle_categories.find((x) => x.code === code);
    return c ? vehiclePrice(base, c.surcharge_pct) : base;
  };
  const servicePrice = service ? priceFor(service.price_cents, vehicleCategory) : 0;

  const go = (n: number) => {
    setDir(n > step ? 'fwd' : 'back');
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pickService = (s: Service) => {
    setServiceId(s.id);
    setSlot(null);
    setTimeout(() => go(1), 160);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!service || !slot || !vehicleCategory) return;
    if (formRef.current && !formRef.current.reportValidity()) return;
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
        vehicle_category: vehicleCategory ?? '',
        vehicle_brand: vehicleKey(veh.brand),
        vehicle_model: vehicleKey(veh.model),
        vehicle_genre: vehRes.needsGenre ? veh.genre : '',
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
        location: location === 'home' ? address?.label ?? '' : settings?.atelier_address || 'Atelier',
        isHome: location === 'home',
        vehicle: `${vehicleName} · ${category?.label ?? ''}`,
      });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err instanceof BookingError ? err.message : 'Une erreur est survenue, merci de réessayer.');
      if (err instanceof BookingError && err.code === 'SLOT_TAKEN') {
        setSlot(null);
        void refresh();
        go(3);
        setToast(err.message);
      }
      if (err instanceof BookingError && err.code.startsWith('VEHICLE')) go(1);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setConfirmed(null);
    setSlot(null);
    setDay(null);
    setServiceId('');
    setDir('back');
    setStep(0);
  };

  if (loadError) {
    return (
      <AppFrame>
        <div className="pane"><div className="empty"><p>{loadError}</p><button className="btn" onClick={() => window.location.reload()}>Recharger</button></div></div>
      </AppFrame>
    );
  }
  if (!config || !settings) return <AppFrame><Skeleton /></AppFrame>;

  if (confirmed) {
    return (
      <AppFrame>
        <div className="pane success">
          <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27 l7 7 l15 -16" />
          </svg>
          <p className="eyebrow center"><Flag size={15} /> Réservation confirmée</p>
          <h1 className="title center">C'est réservé !</h1>
          <p className="subtitle center">{formatDate(confirmed.start)}<br />{formatTime(confirmed.start)} – {formatTime(confirmed.end)}</p>
          <div className="ticket">
            <div className="ticket-head">
              <span className="ticket-kicker"><Clipboard size={16} /> Bon d'intervention</span>
              <span className="ticket-ref">N° {shortRef(confirmed.id)}</span>
            </div>
            <div className="ticket-body">
              <Row label="Prestation" value={confirmed.serviceName} />
              <Row label="Véhicule" value={confirmed.vehicle} />
              <Row label="Lieu" value={confirmed.location} />
              {confirmed.travel_fee_cents > 0 && <Row label="Déplacement" value={formatPrice(confirmed.travel_fee_cents)} />}
            </div>
            <div className="ticket-perf" aria-hidden="true" />
            <div className="ticket-foot">
              <div className="sheet-row strong"><span>Total à régler sur place</span><span>{formatPrice(confirmed.total_cents)}</span></div>
              <Barcode seed={confirmed.id} />
            </div>
          </div>
          <div className="prep">
            <p className="section-label"><Wrench size={15} /> À prévoir pour le jour J</p>
            <ul>
              <li>Le véhicule accessible et ses clés disponibles</li>
              {confirmed.isHome && <li>Un point d'eau et une prise électrique à proximité, si possible</li>}
              <li>L'habitacle vidé de vos objets personnels</li>
            </ul>
          </div>
          <p className="fine center">Paiement sur place après la prestation. Pour modifier ou annuler{settings.phone ? <>, appelez le <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></> : ', contactez-nous'}.</p>
          <div className="stack">
            {!IS_TEST_LINK && <button type="button" className="btn primary block" onClick={() => downloadIcs('rendez-vous.ics', buildIcs({
              id: confirmed.id,
              start: confirmed.start,
              end: confirmed.end,
              title: `${settings.business_name} — ${confirmed.serviceName}`,
              location: confirmed.location,
              description: `Total : ${formatPrice(confirmed.total_cents)}${settings.phone ? `\nContact : ${settings.phone}` : ''}`,
            }))}>Ajouter à mon agenda</button>}
            <button type="button" className={`btn block ${IS_TEST_LINK ? 'primary' : 'ghost'}`} onClick={reset}>Nouvelle réservation</button>
          </div>
        </div>
      </AppFrame>
    );
  }

  const total = servicePrice + (location === 'home' ? quote?.fee_cents ?? 0 : 0);
  const carCategories = config.vehicle_categories.filter((c) => c.code !== 'moto');
  const zoneText = `${settings.zone_width_km} km autour de l'axe ${settings.zone_a_label} – ${settings.zone_b_label}`;

  let cta: { label: string; disabled: boolean; onClick: () => void } | null = null;
  if (step === 1) cta = { label: 'Continuer', disabled: !vehicleReady, onClick: () => go(2) };
  if (step === 2) cta = { label: 'Continuer', disabled: !locationReady, onClick: () => go(3) };
  if (step === 3) cta = { label: 'Continuer', disabled: !slot, onClick: () => go(4) };
  if (step === 4) cta = { label: submitting ? 'Réservation…' : `Confirmer · ${formatPrice(total)}`, disabled: submitting, onClick: () => void submit() };

  return (
    <AppFrame
      top={
        step === 0 ? undefined : <div className="topbar">
          <button type="button" className={`round-btn${step === 0 ? ' hidden' : ''}`} aria-label="Retour" onClick={() => go(step - 1)} tabIndex={step === 0 ? -1 : 0}>
            <ChevronLeft size={20} />
          </button>
          <div className="road" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}
               aria-label={`Étape ${step + 1} sur ${STEPS.length} : ${STEPS[step]}`}>
            <span className="road-done" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
            <span className="road-car" style={{ left: `${(step / (STEPS.length - 1)) * 100}%` }}><Car size={22} /></span>
            <span className="road-flag"><Flag size={14} /></span>
          </div>
          <span className="step-count">{step + 1}/{STEPS.length}</span>
          <span className="step-name">{STEPS[step]}</span>
        </div>
      }
      bottom={cta && (
        <div className="bottombar">
          {service && (
            <div className="bottombar-info">
              <span>{service.name}{category && step > 1 ? ` · ${category.label}` : ''}{slot ? ` · ${formatTime(slot)}` : ''}</span>
              <strong><AnimatedPrice cents={total} /></strong>
            </div>
          )}
          <button type="button" className="btn primary block" disabled={cta.disabled} onClick={cta.onClick}>{cta.label}</button>
        </div>
      )}
      toast={toast}
    >
      <div key={step} className={`pane slide-${dir}`}>
        {step === 0 && (
          <>
            <section className="hero-card">
              <div className="hero-copy">
                <p className="eyebrow light"><Wrench size={15} /> {settings.business_name}</p>
                <h1 className="title">Quelle prestation&nbsp;?</h1>
                <p className="hero-sub">Nettoyage et detailing auto & moto, directement chez vous.</p>
              </div>
              <CarSilhouette />
              <ul className="badges">
                <li><Home size={16} /> À domicile</li>
                <li><Route size={16} /> {settings.zone_a_label} ↔ {settings.zone_b_label}</li>
                <li><Spray size={16} /> Paiement sur place</li>
              </ul>
            </section>
            <p className="section-label plain">{config.services.length} formule{config.services.length > 1 ? 's' : ''} · prix selon le véhicule</p>
            <div className="list">
              {config.services.length === 0 && <div className="empty">Aucune prestation disponible pour le moment.</div>}
              {config.services.map((s, i) => {
                const top = config.services.length > 1 && s.duration_min === Math.max(...config.services.map((x) => x.duration_min));
                return (
                  <button key={s.id} type="button" className={`tile${s.id === serviceId ? ' selected' : ''}${top ? ' featured' : ''}`} style={{ animationDelay: `${i * 60}ms` }}
                          aria-pressed={s.id === serviceId} onClick={() => pickService(s)}>
                    <span className="tile-icon"><ServiceIcon name={s.name} size={26} /></span>
                    <span className="tile-main">
                      {top && <span className="ribbon">La plus complète</span>}
                      <span className="tile-title">{s.name}</span>
                      <span className="tile-meta"><Stopwatch size={14} /> {formatDuration(s.duration_min)} de travail</span>
                    </span>
                    <span className="tile-price"><small>Citadine</small>{formatPrice(priceFor(s.price_cents, 'citadine'))}</span>
                    {s.description && (
                      <span className="tile-incl">
                        {includedItems(s.description).map((x) => <span key={x} className="incl"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>{x}</span>)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="info-panel">
              <div><span className="info-icon"><Gauge size={18} /></span><div><strong>Horaires</strong>{summarizeHours(config.hours).map((l) => <span key={l}>{l}</span>)}</div></div>
              <div><span className="info-icon"><MapPin size={18} /></span><div><strong>Zone</strong><span>{zoneText}</span></div></div>
              <div><span className="info-icon"><Stopwatch size={18} /></span><div><strong>Réservation</strong><span>Jusqu'à {settings.max_days_ahead} jours à l'avance, au plus tard {settings.min_notice_hours} h avant.</span></div></div>
            </div>
            {settings.phone && <a className="link-row" href={`tel:${settings.phone.replace(/\s/g, '')}`}>Une question ? {settings.phone}</a>}
          </>
        )}

        {step === 1 && service && (
          <>
            <span className="title-badge"><CategoryIcon code={vehicleCategory ?? 'citadine'} size={22} /></span>
            <h1 className="title">Quel véhicule&nbsp;?</h1>
            <p className="subtitle">La marque et le modèle fixent le tarif : un utilitaire demande plus de travail qu'un SUV, un SUV plus qu'une citadine.</p>
            <div className="segmented" role="radiogroup" aria-label="Type de véhicule">
              <span className={`segmented-thumb ${veh.kind === 'moto' ? 'atelier' : 'home'}`} aria-hidden="true" />
              <button type="button" role="radio" aria-checked={veh.kind === 'car'} onClick={() => setVeh({ kind: 'car', brand: '', model: '', chosen: '', genre: '' })}>
                <CategoryIcon code="citadine" size={18} /> Voiture, utilitaire</button>
              <button type="button" role="radio" aria-checked={veh.kind === 'moto'} onClick={() => setVeh({ kind: 'moto', brand: '', model: '', chosen: '', genre: '' })}>
                <CategoryIcon code="moto" size={18} /> Moto, scooter</button>
            </div>
            <div className="fields">
              <Combo id="brand" label="Marque" required value={veh.brand}
                     options={veh.kind === 'moto' ? MOTO_BRANDS.map((b) => ({ key: b, label: b })) : CAR_BRANDS}
                     onChange={(v) => setVeh({ ...veh, brand: v, model: '', chosen: '', genre: '' })}
                     emptyHint="Marque absente de la liste : vous pouvez la saisir librement." />
              <Combo id="model" label="Modèle" required value={veh.model} disabled={!veh.brand.trim()}
                     options={veh.kind === 'moto' ? [] : modelsOf(veh.brand)}
                     onChange={(v) => setVeh({ ...veh, model: v, chosen: '', genre: '' })}
                     emptyHint="Modèle absent de la liste : saisissez-le, puis choisissez la catégorie ci-dessous." />
            </div>

            {veh.brand.trim() && veh.model.trim() && veh.kind === 'car' && (
              <>
                {vehRes.known && vehRes.needsGenre && (
                  <div className="genre-card">
                    <strong>Ce modèle existe en version voiture et en version utilitaire.</strong>
                    <span>Regardez la case <b>J.1</b> de la carte grise :</span>
                    <div className="genre-btns" role="radiogroup" aria-label="Genre sur la carte grise">
                      {([['VP', 'Voiture particulière'], ['CTTE', 'Camionnette (utilitaire)']] as const).map(([g, l]) => (
                        <button key={g} type="button" role="radio" aria-checked={veh.genre === g} className={`genre-btn${veh.genre === g ? ' on' : ''}`}
                                onClick={() => setVeh({ ...veh, genre: g })}>
                          <span className="genre-code">{g}</span><span>{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {vehRes.known && !vehRes.needsGenre && vehRes.allowed && vehRes.allowed.length === 1 && category && (
                  <div className="result-card good">
                    <strong>{vehicleName} · {category.label}</strong>
                    <span>Catégorie issue du fichier officiel des véhicules commercialisés en France (ADEME).</span>
                  </div>
                )}
                {vehRes.known && !vehRes.needsGenre && vehRes.allowed && vehRes.allowed.length > 1 && (
                  <>
                    <p className="section-label plain">Ce modèle existe en plusieurs carrosseries : laquelle est la vôtre&nbsp;?</p>
                    <CategoryPicker list={carCategories.filter((c) => vehRes.allowed!.includes(c.code))} value={vehicleCategory}
                                    base={service.price_cents} onPick={(code) => setVeh({ ...veh, chosen: code })} />
                  </>
                )}
                {!vehRes.known && (
                  <>
                    <div className="result-card warn">
                      <strong>Modèle non reconnu</strong>
                      <span>Choisissez la catégorie la plus proche. Le professionnel la vérifiera à son arrivée.</span>
                    </div>
                    <CategoryPicker list={carCategories} value={vehicleCategory} base={service.price_cents}
                                    onPick={(code) => setVeh({ ...veh, chosen: code })} />
                  </>
                )}
              </>
            )}
            {veh.kind === 'moto' && veh.brand.trim() && veh.model.trim() && category && (
              <div className="result-card good"><strong>{vehicleName} · {category.label}</strong><span>Tarif deux-roues appliqué.</span></div>
            )}

            <div className="price-grid">
              <p className="section-label plain">Tarifs {service.name} selon le véhicule</p>
              {config.vehicle_categories.map((c) => (
                <div key={c.code} className={`price-row${c.code === vehicleCategory ? ' on' : ''}`}>
                  <span className="price-row-icon"><CategoryIcon code={c.code} size={18} /></span>
                  <span className="price-row-label">{c.label}<small>{CATEGORY_EXAMPLES[c.code] ?? ''}</small></span>
                  <strong>{formatPrice(vehiclePrice(service.price_cents, c.surcharge_pct))}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <span className="title-badge"><MapPin size={22} /></span>
            <h1 className="title">Où intervient-on&nbsp;?</h1>
            <p className="subtitle">Zone desservie : {zoneText}.</p>
            {settings.home_enabled && settings.atelier_enabled && (
              <div className="segmented" role="radiogroup">
                <span className={`segmented-thumb ${location}`} aria-hidden="true" />
                <button type="button" role="radio" aria-checked={location === 'home'} onClick={() => { setLocation('home'); setSlot(null); }}>
                  <Home size={18} /> À domicile</button>
                <button type="button" role="radio" aria-checked={location === 'atelier'} onClick={() => { setLocation('atelier'); setSlot(null); }}>
                  <Garage size={18} /> À l'atelier</button>
              </div>
            )}
            {location === 'home' ? (
              <>
                <label htmlFor="address" className="sr-only">Adresse d'intervention</label>
                <AddressInput id="address" value={address} onChange={setAddress} placeholder="Rechercher votre adresse" />
                {USE_DEMO_PLACES && !address && <p className="fine">Version de test : tapez une ville (Versailles, Rambouillet, Chartres… ou Lyon pour tester le hors zone).</p>}
                {quoteLoading && <div className="result-card loading"><Wheel size={20} className="spin" /> Vérification de l'adresse…</div>}
                {quote && !quote.in_zone && (
                  <div className="result-card bad">
                    <strong>Hors zone</strong>
                    <span>Cette adresse est en dehors de notre zone. Appelez-nous pour une demande particulière.</span>
                  </div>
                )}
                {quote && quote.in_zone && (
                  <div className="result-card good">
                    <strong>Adresse desservie</strong>
                    <span>Environ {String(quote.distance_km).replace('.', ',')} km de route · frais de déplacement : {quote.fee_cents ? formatPrice(quote.fee_cents) : 'offerts'}</span>
                  </div>
                )}
                <ZoneMap
                  a={{ lat: settings.zone_a_lat, lon: settings.zone_a_lon, label: settings.zone_a_label }}
                  b={{ lat: settings.zone_b_lat, lon: settings.zone_b_lon, label: settings.zone_b_label }}
                  widthKm={settings.zone_width_km}
                  point={address && quote ? { lat: address.lat, lon: address.lon, inZone: quote.in_zone } : null}
                />
              </>
            ) : (
              <div className="result-card good"><strong>Atelier</strong><span>{settings.atelier_address || 'Adresse communiquée à la confirmation.'}</span></div>
            )}
          </>
        )}

        {step === 3 && service && (
          <>
            <span className="title-badge"><Gauge size={22} /></span>
            <h1 className="title">Quand&nbsp;?</h1>
            <p className="subtitle">{service.name} · {formatDuration(service.duration_min)}</p>
            <DayStrip days={days} selected={day} onSelect={(d) => { setDay(d); setSlot(null); }} />
            {day && <p className="section-label">{formatDate(zonedTime(day, 720, settings.timezone))}</p>}
            {days.every((d) => d.count === 0) ? (
              <div className="empty">Aucun créneau disponible pour le moment. Appelez-nous{settings.phone ? ` au ${settings.phone}` : ''}.</div>
            ) : (
              <>
                {day && rules && (
                  <DayTimeline day={day} tz={settings.timezone} hours={config.hours} busy={rules.busy}
                               selected={slot ? { start: slot, durationMin: service.duration_min, bufferMin: buffer } : null} />
                )}
                {[['Matin', slots.filter((x) => Number(formatTime(x).slice(0, 2)) < 12)], ['Après-midi', slots.filter((x) => Number(formatTime(x).slice(0, 2)) >= 12)]].map(([label, list]) =>
                  (list as Date[]).length > 0 && (
                    <div key={label as string} className="slot-group">
                      <p className="slot-group-label">{label as string} <span>{(list as Date[]).length} créneau{(list as Date[]).length > 1 ? 'x' : ''}</span></p>
                      <div key={day ? dayKeyString(day) : 'none'} className="slot-grid">
                        {(list as Date[]).map((s, i) => (
                          <button key={s.getTime()} type="button" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
                                  aria-pressed={slot?.getTime() === s.getTime()}
                                  aria-label={`${formatTime(s)} à ${formatTime(new Date(s.getTime() + service.duration_min * 60_000))}`}
                                  className={`slot${slot?.getTime() === s.getTime() ? ' selected' : ''}`}
                                  onClick={() => setSlot(s)}>
                            <span className="slot-start">{formatTime(s)}</span>
                            <span className="slot-end">→ {formatTime(new Date(s.getTime() + service.duration_min * 60_000))}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </>
            )}
            <p className="live"><i className="live-dot" /> Disponibilités en temps réel</p>
          </>
        )}

        {step === 4 && service && slot && (
          <>
            <span className="title-badge"><CarKey size={22} /></span>
            <h1 className="title">Vos coordonnées</h1>
            <p className="subtitle">{formatDate(slot)} à {formatTime(slot)}</p>
            <form ref={formRef} onSubmit={submit} className="fields" noValidate={false}>
              <Field id="name" label="Nom et prénom">
                <input id="name" required minLength={2} maxLength={120} autoComplete="name" placeholder=" "
                       value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field id="phone" label="Téléphone">
                <input id="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" inputMode="tel" placeholder=" "
                       value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field id="email" label="E-mail">
                <input id="email" type="email" required maxLength={200} autoComplete="email" inputMode="email" placeholder=" "
                       value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field id="notes" label="Précisions : état, accès, point d'eau… (facultatif)">
                <textarea id="notes" rows={3} maxLength={2000} placeholder=" " value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <div className="ticket">
                <div className="ticket-head">
                  <span className="ticket-kicker"><Clipboard size={16} /> Récapitulatif</span>
                  <span className="ticket-ref">{formatTime(slot)} → {formatTime(new Date(slot.getTime() + service.duration_min * 60_000))}</span>
                </div>
                <div className="ticket-body">
                  <Row label={`${service.name} · ${formatDuration(service.duration_min)}`} value={formatPrice(servicePrice)} />
                  {category && <Row label="Véhicule" value={`${vehicleName} · ${category.label}${category.surcharge_pct ? ` (${category.surcharge_pct > 0 ? '+' : ''}${category.surcharge_pct} %)` : ''}`} />}
                  {location === 'home' && <Row label={quote ? `Déplacement · ~${String(quote.distance_km).replace('.', ',')} km` : 'Déplacement'} value={quote?.fee_cents ? formatPrice(quote.fee_cents) : 'Offert'} />}
                  {location === 'home' && address && <Row label="Adresse" value={address.label} />}
                </div>
                <div className="ticket-perf" aria-hidden="true" />
                <div className="ticket-foot">
                  <div className="sheet-row strong"><span>Total</span><span><AnimatedPrice cents={total} /></span></div>
                </div>
              </div>
              <p className="fine">Paiement sur place après la prestation.</p>
              {submitError && <div className="result-card bad" role="alert"><span>{submitError}</span></div>}
              <button type="submit" hidden />
            </form>
          </>
        )}
      </div>
    </AppFrame>
  );
}

function DayStrip({ days, selected, onSelect }: { days: { day: DayKey; count: number }[]; selected: DayKey | null; onSelect: (d: DayKey) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selected]);
  return (
    <div className="day-strip" ref={ref} role="listbox" aria-label="Jours">
      {days.map(({ day, count }, i) => {
        const on = !!selected && sameDay(day, selected);
        const showMonth = i === 0 || day.day === 1;
        return (
          <button key={dayKeyString(day)} type="button" disabled={count === 0} aria-pressed={on}
                  aria-label={`${WD[weekdayOf(day) - 1]} ${day.day} ${MONTHS[day.month - 1]}, ${count} créneau${count > 1 ? 'x' : ''}`}
                  className={`day${on ? ' selected' : ''}`} onClick={() => onSelect(day)}>
            <span className="day-month">{showMonth ? MONTHS[day.month - 1] : ' '}</span>
            <span className="day-wd">{WD[weekdayOf(day) - 1]}</span>
            <span className="day-num">{day.day}</span>
            <span className="day-dot" />
          </button>
        );
      })}
    </div>
  );
}

function CategoryPicker({ list, value, base, onPick }: {
  list: VehicleCategory[]; value: string | null; base: number; onPick: (code: string) => void;
}) {
  return (
    <div className="cat-grid" role="radiogroup" aria-label="Catégorie du véhicule">
      {list.map((c) => (
        <button key={c.code} type="button" role="radio" aria-checked={value === c.code}
                className={`cat-btn${value === c.code ? ' on' : ''}`} onClick={() => onPick(c.code)}>
          <CategoryIcon code={c.code} size={24} />
          <span className="cat-label">{c.label}</span>
          <small>{CATEGORY_EXAMPLES[c.code] ?? ''}</small>
          <strong>{formatPrice(vehiclePrice(base, c.surcharge_pct))}</strong>
        </button>
      ))}
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      {children}
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`sheet-row${strong ? ' strong' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="pane" aria-busy="true" aria-label="Chargement">
      <div className="loader"><Wheel size={44} className="spin" /></div>
      <div className="sk sk-line short" />
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      {[0, 1, 2].map((i) => <div key={i} className="sk sk-tile" />)}
    </div>
  );
}

function AppFrame({ children, top, bottom, toast }: { children: React.ReactNode; top?: React.ReactNode; bottom?: React.ReactNode; toast?: string }) {
  return (
    <div className={`app${bottom ? ' has-bottom' : ''}`}>
      {top}
      <main className="app-main">{children}</main>
      {bottom}
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
      {!top && <footer className="app-footer"><a href="#admin">Espace pro</a></footer>}
    </div>
  );
}
