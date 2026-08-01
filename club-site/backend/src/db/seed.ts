import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";
import type { Club, GalleryAlbum, Match, NewsItem, Partner, Player, StandingRow } from "../types/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(dataDir, file), "utf-8")) as T;
}

/**
 * Loads backend/src/data/*.json (the club's editable content, see README
 * "Remplacer les visuels") into the database. Idempotent: safe to run on
 * every boot — tables with a stable external id upsert by id, tables
 * without one (standings, gallery photos) are fully replaced since they're
 * small and entirely derived from the JSON source of truth.
 */
export function seedDatabase(db: Database.Database): void {
  const club = readJson<Club>("club.json");
  db.prepare(
    `INSERT INTO club (id, name, short_name, founded, league, venue, city, address, colors_json, description, history, values_json, social_json, contact_email, contact_phone)
     VALUES (1, @name, @shortName, @founded, @league, @venue, @city, @address, @colors, @description, @history, @values, @social, @contactEmail, @contactPhone)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, short_name=excluded.short_name, founded=excluded.founded,
       league=excluded.league, venue=excluded.venue, city=excluded.city, address=excluded.address,
       colors_json=excluded.colors_json, description=excluded.description, history=excluded.history,
       values_json=excluded.values_json, social_json=excluded.social_json,
       contact_email=excluded.contact_email, contact_phone=excluded.contact_phone`
  ).run({
    name: club.name,
    shortName: club.shortName,
    founded: club.founded,
    league: club.league,
    venue: club.venue,
    city: club.city,
    address: club.address,
    colors: JSON.stringify(club.colors),
    description: club.description,
    history: club.history,
    values: JSON.stringify(club.values),
    social: JSON.stringify(club.social),
    contactEmail: club.contactEmail,
    contactPhone: club.contactPhone,
  });

  const players = readJson<Player[]>("players.json");
  const upsertPlayer = db.prepare(
    `INSERT INTO players (id, name, photo, staff, role, number, position, height, birth_year, nationality, sort_order)
     VALUES (@id, @name, @photo, @staff, @role, @number, @position, @height, @birthYear, @nationality, @sortOrder)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, photo=excluded.photo, staff=excluded.staff, role=excluded.role,
       number=excluded.number, position=excluded.position, height=excluded.height,
       birth_year=excluded.birth_year, nationality=excluded.nationality, sort_order=excluded.sort_order`
  );
  players.forEach((p, i) => {
    upsertPlayer.run({
      id: p.id,
      name: p.name,
      photo: p.photo ?? null,
      staff: p.staff ? 1 : 0,
      role: p.role ?? null,
      number: p.number ?? null,
      position: p.position ?? null,
      height: p.height ?? null,
      birthYear: p.birthYear ?? null,
      nationality: p.nationality ?? null,
      sortOrder: i,
    });
  });

  const matches = readJson<Match[]>("matches.json");
  const upsertMatch = db.prepare(
    `INSERT INTO matches (id, competition, matchday, date, home, away, home_score, away_score, venue, status)
     VALUES (@id, @competition, @matchday, @date, @home, @away, @homeScore, @awayScore, @venue, @status)
     ON CONFLICT(id) DO UPDATE SET
       competition=excluded.competition, matchday=excluded.matchday, date=excluded.date,
       home=excluded.home, away=excluded.away, home_score=excluded.home_score,
       away_score=excluded.away_score, venue=excluded.venue, status=excluded.status`
  );
  for (const m of matches) {
    upsertMatch.run({
      id: m.id,
      competition: m.competition,
      matchday: m.matchday,
      date: m.date,
      home: m.home,
      away: m.away,
      homeScore: m.homeScore ?? null,
      awayScore: m.awayScore ?? null,
      venue: m.venue,
      status: m.status,
    });
  }

  const standings = readJson<StandingRow[]>("standings.json");
  db.prepare("DELETE FROM standings").run();
  const insertStanding = db.prepare(
    `INSERT INTO standings (rank, team, played, won, lost, points_for, points_against, points, is_club)
     VALUES (@rank, @team, @played, @won, @lost, @pointsFor, @pointsAgainst, @points, @isClub)`
  );
  for (const s of standings) {
    insertStanding.run({ ...s, isClub: s.isClub ? 1 : 0 });
  }

  const news = readJson<NewsItem[]>("news.json");
  const upsertNews = db.prepare(
    `INSERT INTO news (id, title, slug, excerpt, content, date, category, image)
     VALUES (@id, @title, @slug, @excerpt, @content, @date, @category, @image)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title, slug=excluded.slug, excerpt=excluded.excerpt, content=excluded.content,
       date=excluded.date, category=excluded.category, image=excluded.image`
  );
  for (const n of news) {
    upsertNews.run({ ...n, image: n.image ?? null });
  }

  const albums = readJson<GalleryAlbum[]>("gallery.json");
  const upsertAlbum = db.prepare(
    `INSERT INTO gallery_albums (id, title, date, cover)
     VALUES (@id, @title, @date, @cover)
     ON CONFLICT(id) DO UPDATE SET title=excluded.title, date=excluded.date, cover=excluded.cover`
  );
  const deletePhotos = db.prepare("DELETE FROM gallery_photos WHERE album_id = ?");
  const insertPhoto = db.prepare(
    "INSERT INTO gallery_photos (album_id, photo, position) VALUES (?, ?, ?)"
  );
  for (const a of albums) {
    upsertAlbum.run({ id: a.id, title: a.title, date: a.date, cover: a.cover ?? null });
    deletePhotos.run(a.id);
    a.photos.forEach((photo, i) => insertPhoto.run(a.id, photo, i));
  }

  const partners = readJson<Partner[]>("partners.json");
  const upsertPartner = db.prepare(
    `INSERT INTO partners (id, name, tier, logo, url)
     VALUES (@id, @name, @tier, @logo, @url)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, tier=excluded.tier, logo=excluded.logo, url=excluded.url`
  );
  for (const p of partners) {
    upsertPartner.run({ ...p, logo: p.logo ?? null, url: p.url ?? null });
  }
}
