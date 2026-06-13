import type { PublicationItem } from "@/types/lab";

export function publicationYear(venue: string): number {
  const match = venue.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

export function groupPublicationsByYear(items: PublicationItem[]) {
  const groups = new Map<number, PublicationItem[]>();

  for (const item of items) {
    const year = publicationYear(item.venue);
    const existing = groups.get(year) ?? [];
    existing.push(item);
    groups.set(year, existing);
  }

  return [...groups.entries()].sort(([yearA], [yearB]) => yearB - yearA);
}

export function normalizeHonorLabel(value: string): string {
  const trimmed = value.trim();
  if (/^oral$/i.test(trimmed)) return "Oral";
  if (/^highlight$/i.test(trimmed)) return "Highlight";
  if (/^spotlight$/i.test(trimmed)) return "Spotlight";
  if (/best paper/i.test(trimmed)) return "Best Paper";
  return trimmed;
}

/** True for preprint venues (arXiv / CoRR / TechRxiv) — i.e. not formally published. */
export function isPreprintVenue(venue: string): boolean {
  return /\barxiv\b|\bcorr\b|techrxiv|preprint/i.test(venue);
}

export function getVenueBadge(venue: string): string | null {
  if (/oral/i.test(venue)) return "Oral";
  if (/highlight/i.test(venue)) return "Highlight";
  if (/spotlight/i.test(venue)) return "Spotlight";
  if (/best paper/i.test(venue)) return "Best Paper";
  return null;
}

export type ParsedPublicationVenue = {
  conference: string;
  year: string;
  honor: string | null;
};

export function normalizeVenueLabel(venue: string): string {
  const trimmed = venue.trim();
  if (!trimmed) {
    return "";
  }

  if (/\barxiv\b/i.test(trimmed) || /arxiv:\s*\d{4}\.\d+/i.test(trimmed)) {
    return "arXiv";
  }

  return trimmed;
}

export function parsePublicationVenue(venue: string): ParsedPublicationVenue {
  const honor = getVenueBadge(venue);
  const yearMatch = venue.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? "";

  let conference = venue
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\b(oral|highlight|spotlight|best paper)\b/gi, "")
    .trim()
    .replace(/\s{2,}/g, " ");

  if (!conference) {
    conference = venue.trim();
  }

  conference = normalizeVenueLabel(conference);

  return { conference, year, honor };
}
