import type { Club, GalleryAlbum, Match, NewsItem, Partner, Player, StandingRow } from "../types/index.js";

// sqlite has no boolean/array/object types; these map the flat row shape
// (as read back via better-sqlite3, which returns snake_case columns
// verbatim) to the API's camelCase, typed shape.

export function rowToClub(row: Record<string, unknown>): Club {
  return {
    name: row.name as string,
    shortName: row.short_name as string,
    founded: row.founded as number,
    league: row.league as string,
    venue: row.venue as string,
    city: row.city as string,
    address: row.address as string,
    colors: JSON.parse(row.colors_json as string),
    description: row.description as string,
    history: row.history as string,
    values: JSON.parse(row.values_json as string),
    social: JSON.parse(row.social_json as string),
    contactEmail: row.contact_email as string,
    contactPhone: row.contact_phone as string,
  };
}

export function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    photo: row.photo as string,
    staff: Boolean(row.staff),
    role: (row.role as string) ?? undefined,
    number: (row.number as number | null) ?? undefined,
    position: (row.position as string) ?? undefined,
    height: (row.height as string) ?? undefined,
    birthYear: (row.birth_year as number | null) ?? undefined,
    nationality: (row.nationality as string) ?? undefined,
  };
}

export function rowToMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as string,
    competition: row.competition as string,
    matchday: (row.matchday as number | null) ?? null,
    date: row.date as string,
    home: row.home as string,
    away: row.away as string,
    homeScore: (row.home_score as number | null) ?? undefined,
    awayScore: (row.away_score as number | null) ?? undefined,
    venue: row.venue as string,
    status: row.status as Match["status"],
  };
}

export function rowToStanding(row: Record<string, unknown>): StandingRow {
  return {
    rank: row.rank as number,
    team: row.team as string,
    played: row.played as number,
    won: row.won as number,
    lost: row.lost as number,
    pointsFor: row.points_for as number,
    pointsAgainst: row.points_against as number,
    points: row.points as number,
    isClub: Boolean(row.is_club),
  };
}

export function rowToNews(row: Record<string, unknown>): NewsItem {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: row.excerpt as string,
    content: row.content as string,
    date: row.date as string,
    category: row.category as string,
    image: row.image as string,
  };
}

export function rowToPartner(row: Record<string, unknown>): Partner {
  return {
    id: row.id as string,
    name: row.name as string,
    tier: row.tier as Partner["tier"],
    logo: row.logo as string,
    url: row.url as string,
  };
}

export function rowToAlbum(row: Record<string, unknown>, photos: string[]): GalleryAlbum {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    cover: row.cover as string,
    photos,
  };
}
