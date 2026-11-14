-- Tests des règles de réservation. Chaque échec interrompt le script.
\set QUIET on

create or replace function pg_temp.monday(h int, m int default 0) returns timestamptz language sql as $$
  -- Lundi dans deux semaines, à h:m heure de Paris
  select ((date_trunc('week', now() at time zone 'Europe/Paris') + interval '14 days'
           + make_interval(hours => h, mins => m)) at time zone 'Europe/Paris');
$$;

create or replace function pg_temp.svc(n text) returns uuid language sql security definer as $$
  select id from public.services where name = n;
$$;

-- Exécute un appel et vérifie le code d'erreur attendu (null = succès attendu)
create or replace function pg_temp.expect(sql text, code text) returns void language plpgsql as $$
begin
  execute sql;
  if code is not null then
    raise exception 'ÉCHEC: attendu % mais succès pour %', code, sql;
  end if;
exception when others then
  if code is null or sqlerrm <> code then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
    raise exception 'ÉCHEC: attendu %, obtenu "%" pour %', coalesce(code, 'succès'), sqlerrm, sql;
  end if;
end $$;

grant execute on function pg_temp.expect(text, text), pg_temp.monday(int, int), pg_temp.svc(text) to anon, authenticated;

-- Préparation des requêtes (Versailles : dans la zone, Lyon : hors zone)
create or replace function pg_temp.book(svc text, start_at timestamptz,
                                        lat double precision default 48.8049,
                                        lon double precision default 2.1204,
                                        is_admin boolean default false,
                                        loc text default 'home',
                                        cat text default 'citadine',
                                        brand text default 'Renault',
                                        model text default 'Clio',
                                        genre text default '') returns text language sql as $$
  select format($f$select public.create_booking(%L, %L, %L, 'Jean Test', 'jean@test.fr', '0600000000',
                 %L, %L, %L, %L, '1 rue Test, Versailles', %s, %s, '', %s)$f$,
                pg_temp.svc(svc), loc, start_at, cat, brand, model, genre, lat, lon, is_admin::text);
$$;
grant execute on function pg_temp.book(text, timestamptz, double precision, double precision, boolean, text, text, text, text, text) to anon, authenticated;

-- Prix facturé (prestation, hors déplacement) d'un RDV créé par un appel
create or replace function pg_temp.price_of(sql text) returns int language plpgsql as $$
declare r jsonb;
begin
  execute sql into r;
  return (r->>'price_cents')::int;
end $$;
grant execute on function pg_temp.price_of(text) to anon, authenticated;

set role anon;

-- 1. Réservation valide : Complet lundi 09:00 (270 min -> 13:30, tampon 75 min -> 14:45)
select pg_temp.expect(pg_temp.book('Complet', pg_temp.monday(9)), null);
-- 2. Chevauchement direct
select pg_temp.expect(pg_temp.book('Intérieur', pg_temp.monday(11)), 'SLOT_TAKEN');
-- 3. Dans le temps tampon (14:30 < 14:45)
select pg_temp.expect(pg_temp.book('Intérieur', pg_temp.monday(14, 30)), 'SLOT_TAKEN');
-- 4. Juste après le tampon : 15:00 -> 17:30, OK
select pg_temp.expect(pg_temp.book('Intérieur', pg_temp.monday(15)), null);
-- 5. Avant l'ouverture (08:30)
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(7, 30)), 'OUTSIDE_HOURS');
-- 6. Hors zone (Lyon)
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9) + interval '1 day', 45.76, 4.83), 'OUT_OF_ZONE');
-- 7. Dimanche fermé
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9) - interval '1 day'), 'OUTSIDE_HOURS');
-- 8. Fin après la fermeture (mardi 17:00 + 270 min)
select pg_temp.expect(pg_temp.book('Complet', pg_temp.monday(17) + interval '1 day'), 'OUTSIDE_HOURS');
-- 9. Hors grille (09:10)
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9, 10) + interval '1 day'), 'OUTSIDE_HOURS');
-- 10. Délai de prévenance
select pg_temp.expect(pg_temp.book('Extérieur', date_trunc('hour', now()) + interval '2 hours'), 'TOO_SOON');
-- 11. Trop loin dans le futur
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9) + interval '120 days'), 'TOO_FAR');
-- 12. Atelier désactivé par défaut
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9) + interval '2 days', loc => 'atelier'), 'LOCATION_UNAVAILABLE');
-- 13. Un anonyme ne peut pas se faire passer pour l'admin
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9) + interval '1 day', is_admin => true), 'FORBIDDEN');
-- 14. Un anonyme ne lit pas les données des clients
select pg_temp.expect('select * from public.bookings', 'permission denied for table bookings');
select pg_temp.expect('select * from public.settings', 'permission denied for table settings');
-- 15. Les créneaux occupés sont visibles, sans données personnelles
do $$
declare n int;
begin
  select count(*) into n from public.get_busy(now(), now() + interval '60 days');
  if n <> 2 then raise exception 'ÉCHEC: get_busy devrait renvoyer 2 plages, obtenu %', n; end if;
  if (select max(end_at) from public.get_busy(now(), now() + interval '60 days'))
     <> pg_temp.monday(18, 45) then
    raise exception 'ÉCHEC: le tampon du 2e RDV devrait finir à 18:45';
  end if;
end $$;
-- 16. Config publique : le point de départ et la grille tarifaire restent privés
do $$
declare c jsonb := public.get_public_config();
begin
  if c->'settings' ? 'base_lat' or c->'settings' ? 'fuel_price_cents' or c->'settings' ? 'round_trip' then
    raise exception 'ÉCHEC: données privées exposées';
  end if;
  if jsonb_array_length(c->'services') <> 3 then raise exception 'ÉCHEC: 3 formules attendues'; end if;
end $$;
-- 17. Carburant aller-retour Gas -> Versailles : (55,2 - 10) x 2 = 90,5 km x 8 L/100 x 1,80 € = 13,03 € -> 14 €
do $$
declare q jsonb := public.quote_travel(48.8049, 2.1204);
begin
  if not (q->>'in_zone')::boolean then raise exception 'ÉCHEC: Versailles devrait être dans la zone'; end if;
  if (q->>'fee_cents')::int <> 1400 or (q->>'distance_km')::numeric <> 55.2 then
    raise exception 'ÉCHEC: frais inattendus %', q;
  end if;
  if (public.quote_travel(48.1173, -1.6778)->>'in_zone')::boolean then
    raise exception 'ÉCHEC: Rennes ne devrait pas être dans la zone';
  end if;
end $$;

reset role;

-- 18. Admin : RDV pris par téléphone un dimanche (hors horaires autorisé pour l'admin)
insert into public.admins values ('11111111-1111-1111-1111-111111111111');
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(10) - interval '1 day', is_admin => true), null);
-- ... mais jamais en double, même pour l'admin
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(10) - interval '1 day', is_admin => true), 'SLOT_TAKEN');
-- Grille horaire : remplacement atomique, refusé si plage invalide
select pg_temp.expect($q$select public.replace_opening_hours('[{"weekday":1,"open_time":"18:00","close_time":"09:00"}]')$q$,
  'new row for relation "opening_hours" violates check constraint "opening_hours_check"');
do $$ begin
  if (select count(*) from public.opening_hours) <> 6 then raise exception 'ÉCHEC: horaires perdus après erreur'; end if;
end $$;
-- 19. Fermeture : bloque les réservations clients
insert into public.closures (starts_at, ends_at, reason)
values (pg_temp.monday(0) + interval '1 day', pg_temp.monday(0) + interval '2 days', 'Congés');
reset role;
reset request.jwt.claim.sub;
set role anon;
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(9) + interval '1 day'), 'SLOT_TAKEN');
reset role;
-- 20. Annulation : le créneau se libère
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set role authenticated;
update public.bookings set status = 'cancelled' where start_at = pg_temp.monday(9);
reset role;
reset request.jwt.claim.sub;
set role anon;
select pg_temp.expect(pg_temp.book('Intérieur', pg_temp.monday(11)), null);
reset role;
-- 21. Un utilisateur connecté non admin ne voit rien et ne modifie rien
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set role authenticated;
select pg_temp.expect($q$select public.replace_opening_hours('[]')$q$, 'FORBIDDEN');
do $$ begin
  if (select count(*) from public.bookings) <> 0 then raise exception 'ÉCHEC: non-admin voit des RDV'; end if;
end $$;
reset role;
reset request.jwt.claim.sub;
-- 22. Temps réel : des notifications ont été émises
do $$ begin
  if (select count(*) from realtime.sent where topic = 'availability') < 5 then
    raise exception 'ÉCHEC: notifications temps réel manquantes';
  end if;
end $$;
-- 23. Concurrence : la contrainte d'exclusion protège même un insert direct
do $$ begin
  insert into public.bookings (service_id, service_name, location_type, start_at, end_at, buffer_after_min,
    occupied_until, customer_name, phone, price_cents, total_cents)
  select id, name, 'home', pg_temp.monday(12), pg_temp.monday(13), 0, pg_temp.monday(13), 'X', '0600000000', 0, 0
  from public.services where name = 'Extérieur';
  raise exception 'ÉCHEC: chevauchement accepté';
exception when exclusion_violation then null;
end $$;

-- 24. Grille de prix par véhicule (Complet : moto 70, citadine 149, SUV 165, utilitaire 189)
set role anon;
do $$
declare cit int; ber int; suv int; mono int; uti int; moto int; inte int;
begin
  cit  := pg_temp.price_of(pg_temp.book('Complet', pg_temp.monday(8, 30) + interval '2 days'));
  ber  := pg_temp.price_of(pg_temp.book('Complet', pg_temp.monday(8, 30) + interval '3 days', brand => 'Volkswagen', model => 'Golf'));
  suv  := pg_temp.price_of(pg_temp.book('Complet', pg_temp.monday(8, 30) + interval '4 days', cat => 'suv', brand => 'peugeot', model => ' 3008 '));
  uti  := pg_temp.price_of(pg_temp.book('Complet', pg_temp.monday(8, 30) + interval '5 days', cat => 'utilitaire', brand => 'Renault', model => 'Trafic'));
  moto := pg_temp.price_of(pg_temp.book('Complet', pg_temp.monday(8, 30) + interval '9 days', cat => 'moto', brand => 'Yamaha', model => 'MT-07'));
  mono := pg_temp.price_of(pg_temp.book('Complet', pg_temp.monday(8, 30) + interval '10 days', cat => 'suv', brand => 'Renault', model => 'Scenic'));
  inte := pg_temp.price_of(pg_temp.book('Intérieur', pg_temp.monday(8, 30) + interval '11 days', cat => 'utilitaire', brand => 'Ford', model => 'Transit'));
  if cit <> 14900 then raise exception 'ÉCHEC: citadine % au lieu de 14900', cit; end if;
  if ber <> 14900 then raise exception 'ÉCHEC: une berline (Golf) compte comme citadine : % au lieu de 14900', ber; end if;
  if suv <> 16500 then raise exception 'ÉCHEC: SUV % au lieu de 16500', suv; end if;
  if uti <> 18900 then raise exception 'ÉCHEC: utilitaire % au lieu de 18900', uti; end if;
  if moto <> 7000 then raise exception 'ÉCHEC: moto % au lieu de 7000', moto; end if;
  if mono <> 16500 then raise exception 'ÉCHEC: un monospace (Scénic) compte comme SUV : % au lieu de 16500', mono; end if;
  if inte <> 10100 then raise exception 'ÉCHEC: Intérieur utilitaire % au lieu de 10100', inte; end if;
end $$;
-- Seules 4 catégories existent
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'berline', brand => 'Volkswagen', model => 'Golf'), 'INVALID_INPUT');
-- 25. Contrôles du véhicule
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'citadine', brand => 'Peugeot', model => '3008'), 'VEHICLE_MISMATCH');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'citadine', brand => 'Renault', model => 'Trafic'), 'VEHICLE_MISMATCH');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', brand => 'Renault', model => ''), 'VEHICLE_REQUIRED');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', brand => '', model => 'Clio'), 'VEHICLE_REQUIRED');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'inconnue'), 'INVALID_INPUT');
-- Kangoo : version voiture (VP -> SUV) ou camionnette (CTTE -> utilitaire) selon la carte grise
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'suv', brand => 'Renault', model => 'Kangoo'), 'VEHICLE_GENRE_REQUIRED');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'suv', brand => 'Renault', model => 'Kangoo', genre => 'CTTE'), 'VEHICLE_MISMATCH');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '2 days', cat => 'utilitaire', brand => 'Renault', model => 'Kangoo', genre => 'CTTE'), null);
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '3 days', cat => 'suv', brand => 'Citroen', model => 'Berlingo', genre => 'VP'), null);
-- Accents et casse : « citroën  c3 » est reconnu comme CITROEN C3 (citadine), donc contrôlé
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '4 days', cat => 'utilitaire', brand => 'citroën', model => '  c3 '), 'VEHICLE_MISMATCH');
-- Marques chinoises et modèles anciens reconnus
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '4 days', cat => 'citadine', brand => 'BYD', model => 'Atto 3'), 'VEHICLE_MISMATCH');
select pg_temp.expect(pg_temp.book('Extérieur', pg_temp.monday(15) + interval '4 days', cat => 'citadine', brand => 'Peugeot', model => '206'), null);
reset role;
do $$ begin
  if (select vehicle_verified from public.bookings where vehicle_model = 'MT-07') then
    raise exception 'ÉCHEC: un modèle hors catalogue doit être marqué « à vérifier »';
  end if;
  if not (select vehicle_verified from public.bookings where vehicle_model = '3008') then
    raise exception 'ÉCHEC: un modèle du catalogue doit être marqué vérifié';
  end if;
  if (select vehicle from public.bookings where vehicle_model = '3008') <> 'PEUGEOT 3008' then
    raise exception 'ÉCHEC: marque/modèle mal enregistrés';
  end if;
  if (select price_cents from public.services where name = 'Complet') <> 14900 then
    raise exception 'ÉCHEC: le Complet citadine doit valoir 149 €';
  end if;
  if (select count(*) from public.vehicle_categories) <> 4 then
    raise exception 'ÉCHEC: 4 catégories attendues';
  end if;
  if (select (public.quote_travel(48.4439, 1.489)->>'fee_cents')::int) <> 500 then
    raise exception 'ÉCHEC: Chartres aller-retour attendu à 5 €';
  end if;
  if (select (public.quote_travel(48.61, 1.6744)->>'fee_cents')::int) <> 0 then
    raise exception 'ÉCHEC: Épernon doit rester offert';
  end if;
  if (select base_lat from public.settings) <> 48.566873 then
    raise exception 'ÉCHEC: point de départ attendu à Gas';
  end if;
end $$;

\echo 'Tous les tests SQL sont passés.'
