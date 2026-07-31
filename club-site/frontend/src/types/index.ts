export interface ClubValue {
  title: string;
  description: string;
}

export interface Club {
  name: string;
  shortName: string;
  founded: number;
  league: string;
  venue: string;
  city: string;
  address: string;
  colors: string[];
  description: string;
  history: string;
  values: ClubValue[];
  social: Record<string, string>;
  contactEmail: string;
  contactPhone: string;
}

export interface Player {
  id: string;
  number: number;
  name: string;
  position: string;
  height: string;
  birthYear: number;
  nationality: string;
  photo: string;
}

export interface Match {
  id: string;
  competition: string;
  matchday: number | null;
  date: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  status: "played" | "upcoming";
}

export interface StandingRow {
  rank: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
  isClub?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  image: string;
}

export interface NewsPage {
  items: NewsItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  date: string;
  cover: string;
  photos: string[];
}

export interface Partner {
  id: string;
  name: string;
  tier: "gold" | "silver" | "bronze";
  logo: string;
  url: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}
