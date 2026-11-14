import { useCallback, useEffect, useState } from 'react';
import { backend } from '../lib/backend';
import { AddressInput } from '../components/AddressInput';
import type { AddressSuggestion } from '../lib/geocode';
import { BookingError, type Booking, type Closure, type LocationType, type OpeningHour, type Service, type ServicePrice, type Settings, type VehicleCategory } from '../lib/types';
import { CarLift, Clipboard, Cone, FuelPump, Garage, Gauge, MapPin, Route, CategoryIcon, ServiceIcon, Spray, Stopwatch, Wrench } from '../components/Icons';
import { ZoneMap } from '../components/ZoneMap';
import { Combo } from '../components/Combo';
import { CAR_BRANDS, DEFAULT_VEHICLE_CATEGORIES, displayBrand, displayModel, canonicalBrand, lookupVehicle, modelsOf, resolveVehicle, vehicleKey } from '../lib/vehicles';
import { TZ, dayKeyOf, dayKeyString, formatDate, formatDuration, formatPrice, formatTime, zonedTime } from '../lib/time';

type Tab = 'planning' | 'closures' | 'services' | 'hours' | 'settings';
const TABS: [Tab, string, typeof Wrench][] = [
  ['planning', 'Planning', Clipboard],
  ['closures', 'Indisponibilités', Cone],
  ['services', 'Formules', Spray],
  ['hours', 'Horaires', Gauge],
  ['settings', 'Paramètres', Wrench],
];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** "AAAA-MM-JJTHH:MM" (heure de Paris) -> instant */
function parseLocal(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  return zonedTime({ year: +m[1], month: +m[2], day: +m[3] }, +m[4] * 60 + +m[5], TZ);
}

/** « dans 3 h », « demain à 09:30 »… */
function relativeTime(d: Date): string {
  const diff = d.getTime() - Date.now();
  const k = dayKeyString(dayKeyOf(d, TZ));
  if (diff < 3_600_000) return `dans ${Math.max(1, Math.round(diff / 60_000))} min`;
  if (k === dayKeyString(dayKeyOf(new Date(), TZ))) return `aujourd'hui à ${formatTime(d)} (dans ${Math.round(diff / 3_600_000)} h)`;
  if (k === dayKeyString(dayKeyOf(new Date(Date.now() + 86_400_000), TZ))) return `demain à ${formatTime(d)}`;
  return `${formatDate(d)} à ${formatTime(d)}`;
}

function errMsg(e: unknown): string {
  return e instanceof BookingError || e instanceof Error ? e.message : 'Erreur inconnue.';
}

export function AdminPage() {
  const [state, setState] = useState<'loading' | 'out' | 'in'>('loading');
  const [tab, setTab] = useState<Tab>('planning');

  useEffect(() => {
    backend.isAdmin().then((ok) => setState(ok ? 'in' : 'out'), () => setState('out'));
  }, []);

  if (state === 'loading') return <AdminShell><p className="muted">Chargement…</p></AdminShell>;
  if (state === 'out') return <AdminShell><Login onDone={() => setState('in')} /></AdminShell>;

  return (
    <AdminShell onLogout={async () => { await backend.signOut(); setState('out'); }}>
      <nav className="tabs" role="tablist">
        {TABS.map(([id, label, TabIcon]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <TabIcon size={18} /> {label}
          </button>
        ))}
      </nav>
      {tab === 'planning' && <Planning />}
      {tab === 'closures' && <Closures />}
      {tab === 'services' && <Services />}
      {tab === 'hours' && <Hours />}
      {tab === 'settings' && <SettingsForm />}
    </AdminShell>
  );
}

function AdminShell({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  return (
    <div className="page admin">
      <header className="admin-bar">
        <strong className="brand"><span className="brand-icon"><Wrench size={18} /></span> Espace pro</strong>
        <span className="spacer" />
        <a href="#">Voir le site</a>
        {onLogout && <button type="button" className="btn small" onClick={onLogout}>Déconnexion</button>}
      </header>
      <main className="container wide">{children}</main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form className="card login" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      setError('');
      try {
        await backend.signIn(email, password);
        if (!(await backend.isAdmin())) {
          await backend.signOut();
          throw new Error("Ce compte n'a pas les droits administrateur.");
        }
        onDone();
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setBusy(false);
      }
    }}>
      <span className="login-icon"><Garage size={30} /></span>
      <h2>Accès atelier</h2>
      <p className="hint">Réservé au professionnel.</p>
      <label htmlFor="em">E-mail</label>
      <input id="em" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="pw">Mot de passe</label>
      <input id="pw" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="alert error">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  );
}

// ---------------------------------------------------------------- Planning

function Planning() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const from = showPast ? new Date(now.getTime() - 30 * 86_400_000) : new Date(now.getTime() - 86_400_000);
      setBookings(await backend.listBookings(from, new Date(now.getTime() + 370 * 86_400_000)));
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, [showPast]);

  useEffect(() => {
    void load();
    return backend.onAvailabilityChange(() => void load());
  }, [load]);

  const visible = bookings.filter((b) => showCancelled || b.status === 'confirmed');
  const groups = new Map<string, Booking[]>();
  for (const b of visible) {
    const k = dayKeyString(dayKeyOf(new Date(b.start_at), TZ));
    groups.set(k, [...(groups.get(k) ?? []), b]);
  }

  // Indicateurs des 7 prochains jours
  const nowT = Date.now();
  const week = bookings.filter((b) => b.status === 'confirmed' && new Date(b.start_at).getTime() >= nowT && new Date(b.start_at).getTime() < nowT + 7 * 86_400_000);
  const next = bookings.find((b) => b.status === 'confirmed' && new Date(b.start_at).getTime() >= nowT);
  const weekRevenue = week.reduce((s, b) => s + b.total_cents, 0);
  const weekKm = week.reduce((s, b) => s + (b.distance_km ?? 0), 0);
  const weekHours = week.reduce((s, b) => s + (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3_600_000, 0);
  const todayKey = dayKeyString(dayKeyOf(new Date(), TZ));
  const tomorrowKey = dayKeyString(dayKeyOf(new Date(nowT + 86_400_000), TZ));

  return (
    <section>
      <div className="kpis">
        <div className="kpi"><span className="kpi-icon"><Clipboard size={18} /></span><span className="kpi-label">RDV sur 7 jours</span><strong>{week.length}</strong></div>
        <div className="kpi"><span className="kpi-icon"><FuelPump size={18} /></span><span className="kpi-label">CA prévu sur 7 jours</span><strong>{formatPrice(weekRevenue)}</strong></div>
        <div className="kpi"><span className="kpi-icon"><Stopwatch size={18} /></span><span className="kpi-label">Heures de travail</span><strong>{formatDuration(Math.round(weekHours * 60))}</strong></div>
        <div className="kpi"><span className="kpi-icon"><Route size={18} /></span><span className="kpi-label">Km estimés (aller)</span><strong>{Math.round(weekKm)} km</strong></div>
      </div>
      {next && (
        <div className="next-up">
          <span className="next-label">Prochain RDV</span>
          <strong>{relativeTime(new Date(next.start_at))}</strong>
          <span className="muted">{next.service_name} · {next.customer_name}{next.address ? ` · ${next.address}` : ''}</span>
        </div>
      )}
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Fermer' : '+ Ajouter un RDV'}
        </button>
        <label className="check"><input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Afficher les annulés</label>
        <label className="check"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> 30 derniers jours</label>
        <span className="hint live"><i className="live-dot" /> Temps réel</span>
      </div>
      {adding && <ManualBooking onDone={() => { setAdding(false); void load(); }} />}
      {error && <p className="alert error">{error}</p>}
      {groups.size === 0 && (
        <div className="card empty-state">
          <CarLift size={48} />
          <strong>Le pont est libre</strong>
          <span className="muted">Aucun rendez-vous à venir.</span>
        </div>
      )}
      {[...groups.entries()].map(([k, list]) => (
        <div key={k} className="day-group">
          <h3>
            {k === todayKey && <span className="day-chip today">Aujourd'hui</span>}
            {k === tomorrowKey && <span className="day-chip">Demain</span>}
            <span>{formatDate(new Date(list[0].start_at))}</span>
            <span className="day-sum">
              {list.filter((b) => b.status === 'confirmed').length} RDV · {formatPrice(list.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.total_cents, 0))}
            </span>
          </h3>
          {list.map((b) => (
            <article key={b.id} className={`booking${b.status === 'cancelled' ? ' cancelled' : ''}`}>
              <div className="booking-time">
                <strong>{formatTime(new Date(b.start_at))}</strong>
                <span>{formatTime(new Date(b.end_at))}</span>
                <small>libre à {formatTime(new Date(b.occupied_until))}</small>
              </div>
              <div className="booking-body">
                <div className="booking-head">
                  <span className="booking-svc"><ServiceIcon name={b.service_name} size={18} /></span>
                  <strong>{b.service_name}</strong>
                  <span className="tag">{b.location_type === 'home' ? 'Domicile' : 'Atelier'}</span>
                  {b.source === 'admin' && <span className="tag">Ajouté manuellement</span>}
                  {b.status === 'cancelled' && <span className="tag danger">Annulé</span>}
                </div>
                <div>{b.customer_name} · <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a>{b.email && <> · <a href={`mailto:${b.email}`}>{b.email}</a></>}</div>
                {(b.vehicle_brand || b.vehicle) && (
                  <div className="veh-line">
                    <span className="with-icon small"><CategoryIcon code={b.vehicle_category} size={16} />
                      <strong>{b.vehicle_brand ? `${displayBrand(b.vehicle_brand)} ${displayModel(b.vehicle_model)}` : b.vehicle}</strong>
                      {b.vehicle_type && <span className="muted">· {b.vehicle_type}</span>}
                    </span>
                    {b.vehicle_genre && <span className="tag">Carte grise : {b.vehicle_genre}</span>}
                    {b.vehicle_brand && !b.vehicle_verified && <span className="tag warn">Modèle à vérifier</span>}
                  </div>
                )}
                {b.address && (
                  <div className="addr-row">
                    <span className="muted with-icon small"><MapPin size={16} /> {b.address}{b.distance_km != null && b.distance_km >= 1 && <> · ~{String(b.distance_km).replace('.', ',')} km</>}</span>
                    <a className="chip-link" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}`} target="_blank" rel="noreferrer"><Route size={14} /> Itinéraire</a>
                  </div>
                )}
                {b.notes && <div className="notes">{b.notes}</div>}
                <div className="booking-foot">
                  <span>
                    {b.travel_fee_cents > 0 && <>{formatPrice(b.price_cents)} + {formatPrice(b.travel_fee_cents)} déplacement = </>}
                    <strong>{formatPrice(b.total_cents)}</strong>
                  </span>
                  {b.status === 'confirmed' && confirmId !== b.id && (
                    <button type="button" className="btn small danger" onClick={() => setConfirmId(b.id)}>Annuler</button>
                  )}
                  {b.status === 'confirmed' && confirmId === b.id && (
                    <span className="confirm-row">
                      <span className="muted">Libérer ce créneau ?</span>
                      <button type="button" className="btn small" onClick={() => setConfirmId(null)}>Non</button>
                      <button type="button" className="btn small danger" onClick={async () => {
                        try { await backend.cancelBooking(b.id); setConfirmId(null); await load(); } catch (e) { setError(errMsg(e)); }
                      }}>Oui, annuler</button>
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}

function ManualBooking({ onDone }: { onDone: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [f, setF] = useState({ serviceId: '', location: 'home' as LocationType, when: '', name: '', phone: '', email: '', brand: '', model: '', category: '', notes: '' });
  const [cats, setCats] = useState<VehicleCategory[]>(DEFAULT_VEHICLE_CATEGORIES);
  const [address, setAddress] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    backend.listServices().then((s) => {
      const active = s.filter((x) => x.active);
      setServices(active);
      setF((p) => ({ ...p, serviceId: p.serviceId || active[0]?.id || '' }));
    }, (e) => setError(errMsg(e)));
    backend.listVehicleCategories().then(setCats, () => undefined);
  }, []);

  return (
    <form className="card form" onSubmit={async (e) => {
      e.preventDefault();
      const start = parseLocal(f.when);
      if (!start) return setError('Date invalide.');
      if (f.location === 'home' && !address) return setError("Choisissez l'adresse dans la liste.");
      if (!f.brand.trim() || !f.model.trim()) return setError('La marque et le modèle sont obligatoires.');
      const known = lookupVehicle(f.brand, f.model);
      const category = f.category || known?.[0] || '';
      if (!category) return setError('Modèle non reconnu : choisissez la catégorie.');
      setBusy(true);
      setError('');
      try {
        await backend.createBooking({
          service_id: f.serviceId, location_type: f.location, start,
          customer_name: f.name, email: f.email, phone: f.phone,
          vehicle_category: category, vehicle_brand: resolveVehicle(f.brand, f.model)?.brand ?? vehicleKey(f.brand),
          vehicle_model: resolveVehicle(f.brand, f.model)?.model ?? vehicleKey(f.model), vehicle_genre: '',
          address: address?.label ?? '', lat: address?.lat ?? null, lon: address?.lon ?? null, notes: f.notes,
        }, { admin: true });
        onDone();
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setBusy(false);
      }
    }}>
      <h3 className="with-icon"><Clipboard size={20} /> RDV pris par téléphone</h3>
      <p className="hint">Les horaires et la zone ne sont pas imposés ici, mais un chevauchement reste impossible.</p>
      <div className="row">
        <div>
          <label htmlFor="m-svc">Formule</label>
          <select id="m-svc" value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatDuration(s.duration_min)})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="m-when">Début</label>
          <input id="m-when" type="datetime-local" required step={300} value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} />
        </div>
        <div>
          <label htmlFor="m-loc">Lieu</label>
          <select id="m-loc" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value as LocationType })}>
            <option value="home">Domicile</option>
            <option value="atelier">Atelier</option>
          </select>
        </div>
      </div>
      {f.location === 'home' && (<><label htmlFor="m-addr">Adresse</label><AddressInput id="m-addr" value={address} onChange={setAddress} /></>)}
      <div className="row">
        <div><label htmlFor="m-name">Nom</label><input id="m-name" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label htmlFor="m-phone">Téléphone</label><input id="m-phone" required minLength={6} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label htmlFor="m-email">E-mail (facultatif)</label><input id="m-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      </div>
      <div className="row veh-row">
        <Combo plain id="m-brand" label="Marque" required value={f.brand} options={CAR_BRANDS} onChange={(v) => setF({ ...f, brand: v, model: '', category: '' })} />
        <Combo plain id="m-model" label="Modèle" required value={f.model} options={modelsOf(canonicalBrand(f.brand) ?? f.brand)} onChange={(v) => setF({ ...f, model: v, category: '' })} />
        <div>
          <label htmlFor="m-cat">Catégorie tarifaire</label>
          <select id="m-cat" value={f.category || lookupVehicle(f.brand, f.model)?.[0] || ''} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option value="">À choisir</option>
            {cats.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <label htmlFor="m-notes">Notes</label><input id="m-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      {error && <p className="alert error">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le RDV'}</button>
    </form>
  );
}

// ---------------------------------------------------------------- Indisponibilités

function Closures() {
  const [list, setList] = useState<Closure[]>([]);
  const [f, setF] = useState({ start: '', end: '', reason: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setList(await backend.listClosures(new Date())); } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <section>
      <form className="card form" onSubmit={async (e) => {
        e.preventDefault();
        const s = parseLocal(f.start), en = parseLocal(f.end);
        if (!s || !en || en <= s) return setError('La fin doit être après le début.');
        try {
          await backend.addClosure(s, en, f.reason);
          setF({ start: '', end: '', reason: '' });
          setError('');
          await load();
        } catch (err) { setError(errMsg(err)); }
      }}>
        <h3 className="with-icon"><Cone size={20} /> Bloquer une période</h3>
        <p className="hint">Congés, rendez-vous perso… Aucun client ne pourra réserver sur cette période. Les RDV déjà pris ne sont pas annulés.</p>
        <div className="row">
          <div><label htmlFor="c-s">Début</label><input id="c-s" type="datetime-local" required value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
          <div><label htmlFor="c-e">Fin</label><input id="c-e" type="datetime-local" required value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
          <div><label htmlFor="c-r">Motif (privé)</label><input id="c-r" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        </div>
        {error && <p className="alert error">{error}</p>}
        <button type="submit" className="btn primary">Bloquer</button>
      </form>
      {list.length === 0 && (
        <div className="card empty-state">
          <Cone size={44} />
          <strong>Route dégagée</strong>
          <span className="muted">Aucune période bloquée.</span>
        </div>
      )}
      {list.map((c) => (
        <div key={c.id} className="card line">
          <span>
            Du <strong>{formatDate(new Date(c.starts_at))} {formatTime(new Date(c.starts_at))}</strong> au{' '}
            <strong>{formatDate(new Date(c.ends_at))} {formatTime(new Date(c.ends_at))}</strong>
            {c.reason && <span className="muted"> — {c.reason}</span>}
          </span>
          <button type="button" className="btn small danger" onClick={async () => {
            try { await backend.deleteClosure(c.id); await load(); } catch (e) { setError(errMsg(e)); }
          }}>Supprimer</button>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------- Formules

function Services() {
  const [list, setList] = useState<Service[]>([]);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    try { setList(await backend.listServices()); } catch (e) { setMsg(errMsg(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const update = (i: number, patch: Partial<Service>) => setList((l) => l.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <section>
      <p className="hint">Les modifications s'appliquent aux nouvelles réservations ; les RDV déjà pris gardent leur prix et leur durée.</p>
      {list.map((s, i) => (
        <form key={s.id || `new${i}`} className="card form" onSubmit={async (e) => {
          e.preventDefault();
          try { await backend.saveService(s); setMsg(`« ${s.name} » enregistrée.`); await load(); } catch (err) { setMsg(errMsg(err)); }
        }}>
          <div className="row">
            <div><label>Nom</label><input required value={s.name} onChange={(e) => update(i, { name: e.target.value })} /></div>
            <div><label>Prix de référence (€)</label><input type="number" min={0} step={1} required value={s.price_cents / 100}
                   onChange={(e) => update(i, { price_cents: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><label>Durée (min)</label><input type="number" min={15} max={720} step={15} required value={s.duration_min}
                   onChange={(e) => update(i, { duration_min: Number(e.target.value) })} /></div>
            <div><label>Ordre</label><input type="number" value={s.sort} onChange={(e) => update(i, { sort: Number(e.target.value) })} /></div>
          </div>
          <label>Description</label>
          <input value={s.description} onChange={(e) => update(i, { description: e.target.value })} />
          <div className="toolbar">
            <label className="check"><input type="checkbox" checked={s.active} onChange={(e) => update(i, { active: e.target.checked })} /> Proposée en ligne</label>
            <span className="muted">{formatDuration(s.duration_min)} · {formatPrice(s.price_cents)}</span>
            <span className="spacer" />
            <button type="submit" className="btn primary small">Enregistrer</button>
          </div>
        </form>
      ))}
      <VehicleTariffs services={list.filter((x) => x.active)} />
      <button type="button" className="btn" onClick={() => setList((l) => [...l, { id: '', name: 'Nouvelle formule', description: '', duration_min: 120, price_cents: 5000, active: false, sort: l.length + 1 }])}>
        + Ajouter une formule
      </button>
      {msg && <p className="alert ok">{msg}</p>}
    </section>
  );
}

function VehicleTariffs({ services }: { services: Service[] }) {
  const [cats, setCats] = useState<VehicleCategory[]>([]);
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    Promise.all([backend.listVehicleCategories(), backend.listServicePrices()]).then(
      ([c, p]) => { setCats(c); setPrices(p); },
      (e) => setMsg({ ok: false, text: errMsg(e) }),
    );
  }, []);
  const get = (sid: string, code: string) => prices.find((p) => p.service_id === sid && p.category === code)?.price_cents;
  const set = (sid: string, code: string, euros: number) =>
    setPrices((l) => [...l.filter((p) => !(p.service_id === sid && p.category === code)), { service_id: sid, category: code, price_cents: Math.round(euros * 100) }]);
  return (
    <form className="card form" onSubmit={async (e) => {
      e.preventDefault();
      try { await backend.saveServicePrices(prices); setMsg({ ok: true, text: 'Grille de prix enregistrée.' }); } catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    }}>
      <h3 className="with-icon"><CategoryIcon code="utilitaire" size={20} /> Prix selon le véhicule</h3>
      <p className="hint">Prix en euros de chaque formule pour chaque catégorie. Case vide : prix de la formule ci-dessus. Les RDV déjà pris gardent leur prix.</p>
      <div className="tariff-table" role="table">
        <div className="tariff-row head" role="row">
          <span role="columnheader">Catégorie</span>
          {services.map((s) => <span key={s.id} role="columnheader">{s.name}</span>)}
        </div>
        {cats.map((c) => (
          <div key={c.code} className="tariff-row" role="row">
            <span role="cell" className="with-icon small"><CategoryIcon code={c.code} size={16} /> {c.label}</span>
            {services.map((s) => {
              const v = get(s.id, c.code);
              return (
                <span key={s.id} role="cell" className="pct-input">
                  <input type="number" min={0} step={1} value={v != null ? v / 100 : ''} placeholder={String(s.price_cents / 100)}
                         aria-label={`${s.name}, ${c.label}`} onChange={(e) => set(s.id, c.code, Number(e.target.value))} /> €
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</p>}
      <button type="submit" className="btn primary">Enregistrer la grille</button>
    </form>
  );
}

// ---------------------------------------------------------------- Horaires

function Hours() {
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { backend.listHours().then(setHours, (e) => setMsg({ ok: false, text: errMsg(e) })); }, []);

  const set = (idx: number, patch: Partial<OpeningHour>) => setHours((h) => h.map((x, j) => (j === idx ? { ...x, ...patch } : x)));

  return (
    <form className="card form" onSubmit={async (e) => {
      e.preventDefault();
      if (hours.some((h) => h.close_time <= h.open_time)) return setMsg({ ok: false, text: "L'heure de fin doit être après l'heure de début." });
      try { await backend.saveHours(hours); setMsg({ ok: true, text: 'Horaires enregistrés.' }); } catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    }}>
      <p className="hint">Une prestation doit se terminer avant l'heure de fin. Plusieurs plages possibles par jour (ex. pause midi).</p>
      {DAYS.map((label, d) => {
        const weekday = d + 1;
        const ranges = hours.map((h, idx) => ({ h, idx })).filter((x) => x.h.weekday === weekday);
        return (
          <div key={weekday} className="hours-row">
            <strong>{label}</strong>
            <div className="hours-ranges">
              {ranges.length === 0 && <span className="muted">Fermé</span>}
              {ranges.map(({ h, idx }) => (
                <span key={idx} className="range">
                  <input type="time" required value={h.open_time} onChange={(e) => set(idx, { open_time: e.target.value })} aria-label={`${label} début`} />
                  –
                  <input type="time" required value={h.close_time} onChange={(e) => set(idx, { close_time: e.target.value })} aria-label={`${label} fin`} />
                  <button type="button" className="icon-btn" aria-label="Supprimer la plage" onClick={() => setHours((x) => x.filter((_, j) => j !== idx))}>×</button>
                </span>
              ))}
              <button type="button" className="btn small" onClick={() => setHours((x) => [...x, { weekday, open_time: '08:30', close_time: '18:30' }])}>+ plage</button>
            </div>
          </div>
        );
      })}
      {msg && <p className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</p>}
      <button type="submit" className="btn primary">Enregistrer les horaires</button>
    </form>
  );
}

// ---------------------------------------------------------------- Paramètres

function SettingsForm() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { backend.getSettings().then(setS, (e) => setMsg({ ok: false, text: errMsg(e) })); }, []);
  if (!s) return msg ? <p className="alert error">{msg.text}</p> : <p className="muted">Chargement…</p>;

  const num = (k: keyof Settings, factor = 1) => ({
    type: 'number' as const,
    value: (s[k] as number) / factor,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Math.round(Number(e.target.value) * factor * 100) / 100 }),
  });
  const point = (lat: keyof Settings, lon: keyof Settings, label?: keyof Settings) => (a: AddressSuggestion | null) => {
    if (!a) return;
    setS({ ...s, [lat]: a.lat, [lon]: a.lon, ...(label ? { [label]: a.label.replace(/^\d+\s+/, '') } : {}) });
  };

  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault();
      try { await backend.saveSettings(s); setMsg({ ok: true, text: 'Paramètres enregistrés.' }); } catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    }}>
      <fieldset className="card">
        <legend className="with-icon"><Garage size={20} /> Entreprise</legend>
        <div className="row">
          <div><label>Nom affiché</label><input value={s.business_name} onChange={(e) => setS({ ...s, business_name: e.target.value })} /></div>
          <div><label>Téléphone</label><input value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></div>
          <div><label>E-mail</label><input type="email" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></div>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="with-icon"><Stopwatch size={20} /> Réservations et temps tampon</legend>
        <div className="row">
          <div><label>Pas des créneaux (min)</label><input {...num('slot_step_min')} min={5} max={240} step={5} /></div>
          <div><label>Délai minimum avant RDV (h)</label><input {...num('min_notice_hours')} min={0} /></div>
          <div><label>Réservable jusqu'à (jours)</label><input {...num('max_days_ahead')} min={1} max={365} /></div>
        </div>
        <div className="row">
          <div><label>Tampon après chaque RDV (min)</label><input {...num('cleanup_buffer_min')} min={0} step={5} /></div>
          <div><label>Tampon trajet en plus, à domicile (min)</label><input {...num('travel_buffer_min')} min={0} step={5} /></div>
        </div>
        <p className="hint">À domicile, le créneau suivant n'est proposé qu'après fin de prestation + {s.cleanup_buffer_min + s.travel_buffer_min} min.</p>
      </fieldset>

      <fieldset className="card">
        <legend className="with-icon"><MapPin size={20} /> Lieux d'intervention</legend>
        <label className="check"><input type="checkbox" checked={s.home_enabled} onChange={(e) => setS({ ...s, home_enabled: e.target.checked })} /> Service à domicile</label>
        <label className="check"><input type="checkbox" checked={s.atelier_enabled} onChange={(e) => setS({ ...s, atelier_enabled: e.target.checked })} /> Atelier</label>
        {s.atelier_enabled && (<><label>Adresse de l'atelier</label><input value={s.atelier_address} onChange={(e) => setS({ ...s, atelier_address: e.target.value })} /></>)}
      </fieldset>

      <fieldset className="card">
        <legend className="with-icon"><Route size={20} /> Zone d'intervention à domicile</legend>
        <p className="hint">Zone = tout ce qui est à moins de X km de la ligne entre le point A et le point B.</p>
        <ZoneMap a={{ lat: s.zone_a_lat, lon: s.zone_a_lon, label: s.zone_a_label }} b={{ lat: s.zone_b_lat, lon: s.zone_b_lon, label: s.zone_b_label }}
                 widthKm={s.zone_width_km} base={{ lat: s.base_lat, lon: s.base_lon }} />
        <div className="row">
          <div><label>Point A : {s.zone_a_label}</label><AddressInput value={null} placeholder="Changer le point A" onChange={point('zone_a_lat', 'zone_a_lon', 'zone_a_label')} /></div>
          <div><label>Point B : {s.zone_b_label}</label><AddressInput value={null} placeholder="Changer le point B" onChange={point('zone_b_lat', 'zone_b_lon', 'zone_b_label')} /></div>
          <div><label>Largeur autour de l'axe (km)</label><input {...num('zone_width_km')} min={1} step={1} /></div>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="with-icon"><FuelPump size={20} /> Frais de déplacement</legend>
        <label>Point de départ (privé, non affiché) — actuellement {s.base_lat.toFixed(4)}, {s.base_lon.toFixed(4)}</label>
        <AddressInput value={null} placeholder="Adresse de départ" onChange={point('base_lat', 'base_lon')} />
        <div className="row">
          <div><label>Forfait fixe (€)</label><input {...num('fee_fixed_cents', 100)} min={0} step={0.5} /></div>
          <div><label>Consommation (L/100 km)</label><input {...num('fuel_l_per_100km')} min={0} max={40} step={0.1} /></div>
          <div><label>Prix du litre (€)</label><input {...num('fuel_price_cents', 100)} min={0} max={10} step={0.01} /></div>
          <div><label>Km offerts (par trajet)</label><input {...num('fee_free_km')} min={0} step={1} /></div>
          <div><label>Coef. route / vol d'oiseau</label><input {...num('road_factor')} min={1} step={0.05} /></div>
        </div>
        <label className="check"><input type="checkbox" checked={s.round_trip} onChange={(e) => setS({ ...s, round_trip: e.target.checked })} /> Compter l'aller-retour (retour au point de départ après chaque RDV)</label>
        <p className="hint">
          Frais = carburant : (distance estimée − {s.fee_free_km} km){s.round_trip ? ' × 2 (aller-retour)' : ''} × {String(s.fuel_l_per_100km).replace('.', ',')} L/100 km × {formatPrice(s.fuel_price_cents)}/L
          {s.fee_fixed_cents ? ` + forfait ${formatPrice(s.fee_fixed_cents)}` : ''}, arrondi à l'euro supérieur, soit
          {' '}{(((s.round_trip ? 2 : 1) * s.fuel_l_per_100km * s.fuel_price_cents) / 10000).toFixed(2).replace('.', ',')} € par km d'éloignement.
          La distance estimée = vol d'oiseau × {s.road_factor}.
        </p>
      </fieldset>

      {msg && <p className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</p>}
      <button type="submit" className="btn primary">Enregistrer les paramètres</button>
    </form>
  );
}
