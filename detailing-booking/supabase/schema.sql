-- =============================================================================
-- Réservation detailing : schéma Supabase (PostgreSQL)
-- À exécuter une fois dans Supabase > SQL Editor. Ré-exécutable sans perte.
--
-- Règles garanties côté serveur (impossible à contourner depuis le navigateur) :
--   * aucun chevauchement de RDV, temps tampon inclus (contrainte d'exclusion)
--   * respect des horaires d'ouverture, du délai de prévenance et des fermetures
--   * vérification de la zone d'intervention et calcul des frais de déplacement
--   * les clients ne voient jamais les données personnelles des autres clients
-- =============================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.settings (
  id                 int primary key default 1 check (id = 1),
  business_name      text    not null default 'Detailing Auto & Moto',
  phone              text    not null default '',
  email              text    not null default '',
  timezone           text    not null default 'Europe/Paris',
  slot_step_min      int     not null default 30  check (slot_step_min between 5 and 240),
  min_notice_hours   int     not null default 12  check (min_notice_hours >= 0),
  max_days_ahead     int     not null default 60  check (max_days_ahead between 1 and 365),
  cleanup_buffer_min int     not null default 30  check (cleanup_buffer_min >= 0),
  travel_buffer_min  int     not null default 45  check (travel_buffer_min >= 0),
  home_enabled       boolean not null default true,
  atelier_enabled    boolean not null default false,
  atelier_address    text    not null default '',
  -- Zone d'intervention : couloir de largeur zone_width_km autour du segment A-B
  zone_a_label       text    not null default 'Paris',
  zone_a_lat         double precision not null default 48.8566,
  zone_a_lon         double precision not null default 2.3522,
  zone_b_label       text    not null default 'Chartres',
  zone_b_lat         double precision not null default 48.4439,
  zone_b_lon         double precision not null default 1.4890,
  zone_width_km      double precision not null default 20 check (zone_width_km > 0),
  -- Point de départ du pro (privé, jamais exposé aux clients) : rue de la République, 28320 Gas
  base_lat           double precision not null default 48.566873,
  base_lon           double precision not null default 1.667562,
  -- Frais de déplacement = fixe + (distance aller estimée - km offerts) x tarif/km
  fee_fixed_cents    int     not null default 0    check (fee_fixed_cents >= 0),
  fee_per_km_cents   int     not null default 50   check (fee_per_km_cents >= 0),
  fee_free_km        double precision not null default 10 check (fee_free_km >= 0),
  road_factor        double precision not null default 1.3 check (road_factor >= 1)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
-- Point de départ réel (ne remplace que l'ancienne valeur par défaut)
update public.settings set base_lat = 48.566873, base_lon = 1.667562
where id = 1 and base_lat = 48.6436 and base_lon = 1.8296;

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  duration_min int  not null check (duration_min between 15 and 720),
  price_cents  int  not null check (price_cents >= 0),
  active       boolean not null default true,
  sort         int  not null default 0
);

-- weekday : 1 = lundi ... 7 = dimanche (ISO). Plusieurs plages possibles par jour.
create table if not exists public.opening_hours (
  id         uuid primary key default gen_random_uuid(),
  weekday    int  not null check (weekday between 1 and 7),
  open_time  time not null,
  close_time time not null,
  check (close_time > open_time)
);

-- Périodes bloquées (congés, indisponibilités)
create table if not exists public.closures (
  id        uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  reason    text not null default '',
  check (ends_at > starts_at)
);

-- Catégories tarifaires de véhicule (moto, citadine, suv, utilitaire).
-- surcharge_pct n'est plus utilisée : les prix sont fixés formule par formule dans service_prices.
create table if not exists public.vehicle_categories (
  code          text primary key,
  label         text not null,
  surcharge_pct int  not null default 0 check (surcharge_pct between -90 and 300),
  sort          int  not null default 0,
  active        boolean not null default true
);

-- Catalogue marque/modèle -> catégories admises (la première est la catégorie par défaut).
-- Rempli par supabase/vehicle_catalog.sql (sources ADEME/UTAC via data.gouv.fr + complément manuel).
create table if not exists public.vehicle_catalog (
  brand      text not null,
  model      text not null,
  categories text[] not null,
  primary key (brand, model)
);

-- Prix d'une formule pour une catégorie de véhicule. Sans ligne : prix de la formule (services.price_cents).
create table if not exists public.service_prices (
  service_id  uuid not null references public.services(id) on delete cascade,
  category    text not null references public.vehicle_categories(code) on delete cascade,
  price_cents int  not null check (price_cents >= 0),
  primary key (service_id, category)
);

create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  service_id        uuid not null references public.services(id),
  service_name      text not null,
  location_type     text not null check (location_type in ('home', 'atelier')),
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  buffer_after_min  int not null check (buffer_after_min >= 0),
  -- fin de l'occupation = fin de prestation + temps tampon (nettoyage/trajet)
  occupied_until    timestamptz not null,
  customer_name     text not null,
  email             text not null default '',
  phone             text not null,
  vehicle_type      text not null default '',
  vehicle           text not null default '',
  address           text not null default '',
  lat               double precision,
  lon               double precision,
  distance_km       double precision,
  price_cents       int not null,
  travel_fee_cents  int not null default 0,
  total_cents       int not null,
  notes             text not null default '',
  source            text not null default 'online' check (source in ('online', 'admin')),
  status            text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  check (end_at > start_at),
  check (occupied_until >= end_at)
);

-- Garantie anti double réservation, y compris en cas de clics simultanés.
do $$ begin
  alter table public.bookings add constraint bookings_no_overlap
    exclude using gist (tstzrange(start_at, occupied_until) with &&)
    where (status = 'confirmed');
exception when duplicate_object or duplicate_table then null;
end $$;

create index if not exists bookings_start_idx on public.bookings (start_at);

alter table public.bookings add column if not exists vehicle_category      text not null default '';
alter table public.bookings add column if not exists vehicle_brand         text not null default '';
alter table public.bookings add column if not exists vehicle_model         text not null default '';
alter table public.bookings add column if not exists vehicle_genre         text not null default '';
alter table public.bookings add column if not exists vehicle_verified      boolean not null default false;
alter table public.bookings add column if not exists base_price_cents      int;
alter table public.bookings add column if not exists vehicle_surcharge_pct int not null default 0;

create table if not exists public.admins (
  user_id uuid primary key
);

-- ---------------------------------------------------------------------------
-- Données par défaut (à modifier depuis l'espace admin)
-- ---------------------------------------------------------------------------

insert into public.services (name, description, duration_min, price_cents, sort)
select * from (values
  ('Intérieur',  'Aspiration, sièges, plastiques, vitres intérieures.', 150, 8000,  1),
  ('Extérieur',  'Lavage, décontamination, jantes, protection.',       150, 7000,  2),
  ('Complet',    'Intérieur + extérieur.',                              270, 14900, 3)
) as v(name, description, duration_min, price_cents, sort)
where not exists (select 1 from public.services);

-- Prix de référence du Complet (citadine) : 149 € (ne touche pas un prix déjà modifié à la main)
update public.services set price_cents = 14900 where name = 'Complet' and price_cents in (14000, 19000);

-- Quatre catégories seulement : berlines et breaks comptent comme citadines, monospaces comme SUV
delete from public.vehicle_categories where code in ('berline', 'monospace');
insert into public.vehicle_categories (code, label, sort) values
  ('moto',       'Moto / scooter',       0),
  ('citadine',   'Citadine',             1),
  ('suv',        'SUV / 4x4',            2),
  ('utilitaire', 'Utilitaire / fourgon', 3)
on conflict (code) do update set label = excluded.label, sort = excluded.sort;
update public.vehicle_categories set surcharge_pct = 0;

-- Grille de prix par défaut. Complet : prix fournis. Intérieur et Extérieur : même écart entre
-- catégories que le Complet, à partir de 80 € et 70 € pour une citadine.
insert into public.service_prices (service_id, category, price_cents)
select s.id, p.category, p.price_cents
from public.services s
join (values
  ('Complet',   'moto', 7000), ('Complet',   'citadine', 14900), ('Complet',   'suv', 16500), ('Complet',   'utilitaire', 18900),
  ('Intérieur', 'moto', 3800), ('Intérieur', 'citadine',  8000), ('Intérieur', 'suv',  8900), ('Intérieur', 'utilitaire', 10100),
  ('Extérieur', 'moto', 3300), ('Extérieur', 'citadine',  7000), ('Extérieur', 'suv',  7800), ('Extérieur', 'utilitaire',  8900)
) as p(service_name, category, price_cents) on p.service_name = s.name
on conflict (service_id, category) do nothing;

insert into public.opening_hours (weekday, open_time, close_time)
select d, time '08:30', time '18:30' from generate_series(1, 6) as d
where not exists (select 1 from public.opening_hours);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.haversine_km(lat1 double precision, lon1 double precision,
                                               lat2 double precision, lon2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- Distance (km) d'un point au segment A-B, projection équirectangulaire locale.
create or replace function public.distance_to_segment_km(
  plat double precision, plon double precision,
  alat double precision, alon double precision,
  blat double precision, blon double precision)
returns double precision language plpgsql immutable as $$
declare
  k    double precision := cos(radians((alat + blat) / 2));
  a_x  double precision := alon * k * 111.32;
  a_y  double precision := alat * 110.574;
  b_x  double precision := blon * k * 111.32;
  b_y  double precision := blat * 110.574;
  p_x  double precision := plon * k * 111.32;
  p_y  double precision := plat * 110.574;
  d_x  double precision := b_x - a_x;
  d_y  double precision := b_y - a_y;
  len2 double precision := d_x * d_x + d_y * d_y;
  t    double precision;
begin
  if len2 = 0 then
    return sqrt(power(p_x - a_x, 2) + power(p_y - a_y, 2));
  end if;
  t := greatest(0, least(1, ((p_x - a_x) * d_x + (p_y - a_y) * d_y) / len2));
  return sqrt(power(p_x - (a_x + t * d_x), 2) + power(p_y - (a_y + t * d_y), 2));
end $$;

create or replace function public.travel_quote_internal(s public.settings,
                                                        p_lat double precision, p_lon double precision)
returns jsonb language plpgsql immutable as $$
declare
  dist_zone double precision;
  road_km   double precision;
  fee       int;
begin
  dist_zone := public.distance_to_segment_km(p_lat, p_lon, s.zone_a_lat, s.zone_a_lon, s.zone_b_lat, s.zone_b_lon);
  road_km   := public.haversine_km(s.base_lat, s.base_lon, p_lat, p_lon) * s.road_factor;
  fee := (ceil((s.fee_fixed_cents + greatest(0, road_km - s.fee_free_km) * s.fee_per_km_cents) / 100.0) * 100)::int;
  return jsonb_build_object(
    'in_zone',     dist_zone <= s.zone_width_km,
    'distance_km', round(road_km::numeric, 1),
    'fee_cents',   fee
  );
end $$;

-- ---------------------------------------------------------------------------
-- API publique (appelée par le site client, rôle "anon")
-- ---------------------------------------------------------------------------

create or replace function public.get_public_config() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'settings', (select to_jsonb(s) - 'base_lat' - 'base_lon' - 'fee_fixed_cents'
                                    - 'fee_per_km_cents' - 'fee_free_km' - 'road_factor'
                 from public.settings s where id = 1),
    'services', coalesce((select jsonb_agg(to_jsonb(v) order by v.sort, v.name)
                          from public.services v where v.active), '[]'::jsonb),
    'vehicle_categories', coalesce((select jsonb_agg(jsonb_build_object('code', c.code, 'label', c.label, 'sort', c.sort)
                          order by c.sort) from public.vehicle_categories c where c.active), '[]'::jsonb),
    'prices',   coalesce((select jsonb_agg(jsonb_build_object(
                            'service_id', p.service_id, 'category', p.category, 'price_cents', p.price_cents))
                          from public.service_prices p join public.services v on v.id = p.service_id and v.active), '[]'::jsonb),
    'hours',    coalesce((select jsonb_agg(jsonb_build_object(
                            'weekday', h.weekday,
                            'open_time', to_char(h.open_time, 'HH24:MI'),
                            'close_time', to_char(h.close_time, 'HH24:MI'))
                          order by h.weekday, h.open_time)
                          from public.opening_hours h), '[]'::jsonb)
  );
$$;

-- Créneaux occupés (temps tampon inclus), sans aucune donnée personnelle.
create or replace function public.get_busy(p_from timestamptz, p_to timestamptz)
returns table (start_at timestamptz, end_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.start_at, b.occupied_until
  from public.bookings b
  where b.status = 'confirmed'
    and p_to - p_from <= interval '120 days'
    and tstzrange(b.start_at, b.occupied_until) && tstzrange(p_from, p_to)
  union all
  select c.starts_at, c.ends_at
  from public.closures c
  where p_to - p_from <= interval '120 days'
    and tstzrange(c.starts_at, c.ends_at) && tstzrange(p_from, p_to)
  order by 1;
$$;

create or replace function public.quote_travel(p_lat double precision, p_lon double precision)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.travel_quote_internal(s, p_lat, p_lon) from public.settings s where id = 1;
$$;

-- Clé de comparaison marque/modèle : sans accents, majuscules, espaces normalisés.
create or replace function public.vehicle_key(p text) returns text
language sql immutable as $$
  select upper(regexp_replace(btrim(translate(coalesce(p, ''),
    'àâäáãéèêëîïíìôöóòõùûüúçñÀÂÄÁÃÉÈÊËÎÏÍÌÔÖÓÒÕÙÛÜÚÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')), '\s+', ' ', 'g'));
$$;

-- Prix d'une formule pour une catégorie de véhicule (grille service_prices, sinon prix de la formule).
drop function if exists public.vehicle_price_cents(int, int);
create or replace function public.vehicle_price_cents(p_service_id uuid, p_category text) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select price_cents from public.service_prices where service_id = p_service_id and category = p_category),
    (select price_cents from public.services where id = p_service_id));
$$;

-- Ancienne signature (avant la tarification par véhicule)
drop function if exists public.create_booking(uuid, text, timestamptz, text, text, text, text, text, text,
  double precision, double precision, text, boolean);

-- Création d'un RDV. Codes d'erreur renvoyés (message de l'exception) :
-- INVALID_INPUT, SERVICE_UNAVAILABLE, LOCATION_UNAVAILABLE, OUT_OF_ZONE, VEHICLE_REQUIRED,
-- VEHICLE_MISMATCH, VEHICLE_GENRE_REQUIRED, TOO_SOON, TOO_FAR, OUTSIDE_HOURS, SLOT_TAKEN, FORBIDDEN
create or replace function public.create_booking(
  p_service_id       uuid,
  p_location         text,
  p_start            timestamptz,
  p_name             text,
  p_email            text,
  p_phone            text,
  p_vehicle_category text,
  p_vehicle_brand    text,
  p_vehicle_model    text,
  p_vehicle_genre    text,
  p_address          text,
  p_lat          double precision,
  p_lon          double precision,
  p_notes        text,
  p_admin        boolean default false
) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  s        public.settings;
  v        public.services;
  q        jsonb;
  v_end    timestamptz;
  v_buffer int;
  v_fee    int := 0;
  v_dist   double precision;
  v_local  timestamp;
  v_min    int;
  v_id     uuid;
  vc       public.vehicle_categories;
  v_cats   text[];
  v_price  int;
begin
  if p_admin and not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into s from public.settings where id = 1;
  select * into v from public.services where id = p_service_id and active;
  if not found then
    raise exception 'SERVICE_UNAVAILABLE';
  end if;

  p_name  := btrim(coalesce(p_name, ''));
  p_phone := btrim(coalesce(p_phone, ''));
  p_email := btrim(coalesce(p_email, ''));
  if length(p_name) < 2 or length(p_name) > 120
     or length(p_phone) < 6 or length(p_phone) > 30
     or length(p_email) > 200
     or (p_email <> '' and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
     or length(coalesce(p_notes, '')) > 2000
     or length(coalesce(p_address, '')) > 300
     or p_start is null then
    raise exception 'INVALID_INPUT';
  end if;
  if not p_admin and p_email = '' then
    raise exception 'INVALID_INPUT';
  end if;

  -- Véhicule : marque et modèle obligatoires, catégorie cohérente avec le catalogue
  p_vehicle_brand := public.vehicle_key(p_vehicle_brand);
  p_vehicle_model := public.vehicle_key(p_vehicle_model);
  p_vehicle_genre := upper(btrim(coalesce(p_vehicle_genre, '')));
  if p_vehicle_brand = '' or p_vehicle_model = '' then
    raise exception 'VEHICLE_REQUIRED';
  end if;
  if length(p_vehicle_brand) > 60 or length(p_vehicle_model) > 80 or p_vehicle_genre not in ('', 'VP', 'CTTE') then
    raise exception 'INVALID_INPUT';
  end if;
  select * into vc from public.vehicle_categories where code = p_vehicle_category and active;
  if not found then
    raise exception 'INVALID_INPUT';
  end if;
  select categories into v_cats from public.vehicle_catalog where brand = p_vehicle_brand and model = p_vehicle_model;
  if v_cats is not null and not p_admin then
    if 'utilitaire' = any(v_cats) and cardinality(v_cats) > 1 then
      -- Même nom en version voiture (VP) et camionnette (CTTE) : la carte grise tranche (case J.1)
      if p_vehicle_genre = '' then
        raise exception 'VEHICLE_GENRE_REQUIRED';
      end if;
      if p_vehicle_category <> (case p_vehicle_genre when 'CTTE' then 'utilitaire'
                                else (select c from unnest(v_cats) c where c <> 'utilitaire' limit 1) end) then
        raise exception 'VEHICLE_MISMATCH';
      end if;
    elsif not (p_vehicle_category = any(v_cats)) then
      raise exception 'VEHICLE_MISMATCH';
    end if;
  end if;
  v_price := public.vehicle_price_cents(v.id, vc.code);

  -- Lieu et frais de déplacement
  if p_location = 'home' then
    if not s.home_enabled and not p_admin then
      raise exception 'LOCATION_UNAVAILABLE';
    end if;
    if p_lat is null or p_lon is null or btrim(coalesce(p_address, '')) = '' then
      raise exception 'INVALID_INPUT';
    end if;
    q := public.travel_quote_internal(s, p_lat, p_lon);
    if not (q->>'in_zone')::boolean and not p_admin then
      raise exception 'OUT_OF_ZONE';
    end if;
    v_fee  := (q->>'fee_cents')::int;
    v_dist := (q->>'distance_km')::double precision;
    v_buffer := s.cleanup_buffer_min + s.travel_buffer_min;
  elsif p_location = 'atelier' then
    if not s.atelier_enabled and not p_admin then
      raise exception 'LOCATION_UNAVAILABLE';
    end if;
    v_buffer := s.cleanup_buffer_min;
  else
    raise exception 'INVALID_INPUT';
  end if;

  v_end := p_start + make_interval(mins => v.duration_min);

  if not p_admin then
    if p_start < now() + make_interval(hours => s.min_notice_hours) then
      raise exception 'TOO_SOON';
    end if;
    if p_start > now() + make_interval(days => s.max_days_ahead) then
      raise exception 'TOO_FAR';
    end if;

    -- Horaires : la prestation doit commencer sur la grille et finir avant la fermeture
    v_local := p_start at time zone s.timezone;
    v_min   := extract(hour from v_local)::int * 60 + extract(minute from v_local)::int;
    if extract(second from v_local) <> 0 or not exists (
      select 1 from public.opening_hours h
      where h.weekday = extract(isodow from v_local)::int
        and v_min >= extract(epoch from h.open_time)::int / 60
        and v_min + v.duration_min <= extract(epoch from h.close_time)::int / 60
        and (v_min - extract(epoch from h.open_time)::int / 60) % s.slot_step_min = 0
    ) then
      raise exception 'OUTSIDE_HOURS';
    end if;

    if exists (
      select 1 from public.closures c
      where tstzrange(c.starts_at, c.ends_at) && tstzrange(p_start, v_end + make_interval(mins => v_buffer))
    ) then
      raise exception 'SLOT_TAKEN';
    end if;
  end if;

  begin
    insert into public.bookings (
      service_id, service_name, location_type, start_at, end_at, buffer_after_min, occupied_until,
      customer_name, email, phone, vehicle_type, vehicle, vehicle_category, vehicle_brand, vehicle_model,
      vehicle_genre, vehicle_verified, address, lat, lon, distance_km,
      base_price_cents, vehicle_surcharge_pct, price_cents, travel_fee_cents, total_cents, notes, source
    ) values (
      v.id, v.name, p_location, p_start, v_end, v_buffer, v_end + make_interval(mins => v_buffer),
      p_name, p_email, p_phone, vc.label, p_vehicle_brand || ' ' || p_vehicle_model, vc.code, p_vehicle_brand,
      p_vehicle_model, p_vehicle_genre, v_cats is not null, coalesce(p_address, ''),
      case when p_location = 'home' then p_lat end,
      case when p_location = 'home' then p_lon end,
      v_dist, v.price_cents, 0, v_price, v_fee, v_price + v_fee, coalesce(p_notes, ''),
      case when p_admin then 'admin' else 'online' end
    ) returning id into v_id;
  exception when exclusion_violation then
    raise exception 'SLOT_TAKEN';
  end;

  return jsonb_build_object('id', v_id, 'total_cents', v_price + v_fee, 'price_cents', v_price,
                            'travel_fee_cents', v_fee, 'start_at', p_start, 'end_at', v_end);
end $$;

-- Remplacement atomique de la grille horaire (espace admin).
create or replace function public.replace_opening_hours(p_hours jsonb) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  delete from public.opening_hours where true;
  insert into public.opening_hours (weekday, open_time, close_time)
  select (h->>'weekday')::int, (h->>'open_time')::time, (h->>'close_time')::time
  from jsonb_array_elements(p_hours) as h;
end $$;

-- ---------------------------------------------------------------------------
-- Temps réel : chaque changement de RDV/fermeture est diffusé sur le canal
-- public "availability" (sans données personnelles). Les navigateurs ouverts
-- rechargent alors les créneaux.
-- ---------------------------------------------------------------------------

create or replace function public.notify_availability() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform realtime.send(jsonb_build_object('at', now()), 'changed', 'availability', false);
  exception when others then
    null; -- le temps réel ne doit jamais bloquer une réservation
  end;
  return null;
end $$;

drop trigger if exists bookings_notify on public.bookings;
create trigger bookings_notify after insert or update or delete on public.bookings
  for each statement execute function public.notify_availability();

drop trigger if exists closures_notify on public.closures;
create trigger closures_notify after insert or update or delete on public.closures
  for each statement execute function public.notify_availability();

drop trigger if exists hours_notify on public.opening_hours;
create trigger hours_notify after insert or update or delete on public.opening_hours
  for each statement execute function public.notify_availability();

drop trigger if exists services_notify on public.services;
create trigger services_notify after insert or update or delete on public.services
  for each statement execute function public.notify_availability();

drop trigger if exists service_prices_notify on public.service_prices;
create trigger service_prices_notify after insert or update or delete on public.service_prices
  for each statement execute function public.notify_availability();

drop trigger if exists vehicle_categories_notify on public.vehicle_categories;
create trigger vehicle_categories_notify after insert or update or delete on public.vehicle_categories
  for each statement execute function public.notify_availability();

drop trigger if exists settings_notify on public.settings;
create trigger settings_notify after update on public.settings
  for each statement execute function public.notify_availability();

-- ---------------------------------------------------------------------------
-- Sécurité (Row Level Security) : accès direct aux tables réservé à l'admin
-- ---------------------------------------------------------------------------

alter table public.settings      enable row level security;
alter table public.services      enable row level security;
alter table public.opening_hours enable row level security;
alter table public.closures      enable row level security;
alter table public.bookings      enable row level security;
alter table public.admins        enable row level security;
alter table public.vehicle_categories enable row level security;
alter table public.vehicle_catalog    enable row level security;
alter table public.service_prices     enable row level security;

drop policy if exists admin_all on public.settings;
create policy admin_all on public.settings      for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.services;
create policy admin_all on public.services      for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.opening_hours;
create policy admin_all on public.opening_hours for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.closures;
create policy admin_all on public.closures      for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.bookings;
create policy admin_all on public.bookings      for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.vehicle_categories;
create policy admin_all on public.vehicle_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.service_prices;
create policy admin_all on public.service_prices     for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.vehicle_catalog;
create policy admin_all on public.vehicle_catalog    for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_self on public.admins;
create policy admin_self on public.admins       for select to authenticated using (user_id = auth.uid());

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.vehicle_categories, public.vehicle_catalog, public.service_prices to authenticated;
grant select, insert, update, delete on public.settings, public.services, public.opening_hours,
  public.closures, public.bookings to authenticated;
grant select on public.admins to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.get_public_config()                          to anon, authenticated;
grant execute on function public.get_busy(timestamptz, timestamptz)           to anon, authenticated;
grant execute on function public.quote_travel(double precision, double precision) to anon, authenticated;
grant execute on function public.create_booking(uuid, text, timestamptz, text, text, text, text, text, text,
  text, text, double precision, double precision, text, boolean)               to anon, authenticated;
grant execute on function public.is_admin()                                   to authenticated;
grant execute on function public.replace_opening_hours(jsonb)                 to authenticated;
