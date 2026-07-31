import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "../api/client";
import type {
  Club,
  ContactPayload,
  GalleryAlbum,
  Match,
  NewsItem,
  NewsPage,
  Partner,
  Player,
  StandingRow,
} from "../types";

export function useClub() {
  return useQuery({ queryKey: ["club"], queryFn: () => apiGet<Club>("/club") });
}

export function usePlayers() {
  return useQuery({ queryKey: ["players"], queryFn: () => apiGet<Player[]>("/players") });
}

export function useMatches(status?: "played" | "upcoming") {
  return useQuery({
    queryKey: ["matches", status ?? "all"],
    queryFn: () => apiGet<Match[]>(`/matches${status ? `?status=${status}` : ""}`),
  });
}

export function useNextMatch() {
  return useQuery({ queryKey: ["matches", "next"], queryFn: () => apiGet<Match | null>("/matches/next") });
}

export function useLatestMatch() {
  return useQuery({ queryKey: ["matches", "latest"], queryFn: () => apiGet<Match | null>("/matches/latest") });
}

export function useStandings() {
  return useQuery({ queryKey: ["standings"], queryFn: () => apiGet<StandingRow[]>("/standings") });
}

export function useNews(page = 1, pageSize = 6) {
  return useQuery({
    queryKey: ["news", page, pageSize],
    queryFn: () => apiGet<NewsPage>(`/news?page=${page}&pageSize=${pageSize}`),
  });
}

export function useNewsItem(slug: string | undefined) {
  return useQuery({
    queryKey: ["news", slug],
    queryFn: () => apiGet<NewsItem>(`/news/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useGallery() {
  return useQuery({ queryKey: ["gallery"], queryFn: () => apiGet<GalleryAlbum[]>("/gallery") });
}

export function useAlbum(id: string | undefined) {
  return useQuery({
    queryKey: ["gallery", id],
    queryFn: () => apiGet<GalleryAlbum>(`/gallery/${id}`),
    enabled: Boolean(id),
  });
}

export function usePartners() {
  return useQuery({ queryKey: ["partners"], queryFn: () => apiGet<Partner[]>("/partners") });
}

export function useSendContact() {
  return useMutation({
    mutationFn: (payload: ContactPayload) => apiPost<{ success: boolean }, ContactPayload>("/contact", payload),
  });
}
