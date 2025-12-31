import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3333",
});

export interface ShortenedLink {
  id: string;
  url: string;
  shortenedUrl: string;
  visits: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShortenedLinksResponse {
  shortenedLinks: ShortenedLink[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getShortenedLinks(params?: {
  searchQuery?: string;
  sortBy?: "createdAt" | "url" | "shortenedUrl" | "visits";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<ShortenedLinksResponse> {
  const response = await api.get<ShortenedLinksResponse>("/shortened-links", {
    params,
  });
  return response.data;
}

export async function exportShortenedLinksCSV(): Promise<string> {
  const response = await api.get<string>("/shortened-links/export/csv");
  return response.data;
}

export async function deleteShortenedLink(id: string): Promise<void> {
  await api.delete(`/shortened-links/${id}`);
}

export async function createShortenedLink(data: {
  url: string;
  shortenedUrl: string;
}): Promise<ShortenedLink> {
  const response = await api.post<ShortenedLink>("/shortened-links", data);
  return response.data;
}

export async function getOriginalUrlByShortened(
  shortenedUrl: string
): Promise<ShortenedLink> {
  const response = await api.get<ShortenedLink>(
    `/shortened-links/shortened/${shortenedUrl}`
  );
  return response.data;
}
