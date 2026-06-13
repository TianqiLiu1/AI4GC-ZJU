export function slugify(text: string, maxLength = 48): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);

  return base || "item";
}

export function resolveId(
  explicitId: string | undefined,
  fallbackSource: string,
  fallbackSuffix?: string,
): string {
  if (explicitId?.trim()) return explicitId.trim();
  const slug = slugify(fallbackSource);
  return fallbackSuffix ? `${slug}-${fallbackSuffix}` : slug;
}

export function memberSlug(name: string): string {
  return slugify(name.replace(/\./g, ""));
}

/**
 * Normalizes a person name for matching BibTeX author names against team members.
 * Lowercases, strips diacritics and periods, and collapses whitespace.
 */
export function normalizeAuthorName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\./g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function memberDateSlug(startDate: string): string {
  const trimmed = startDate.trim();
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return yearMatch[0];

  return slugify(trimmed, 16);
}

export function memberIdFromNameAndDate(name: string, startDate: string): string {
  return `${memberSlug(name)}-${memberDateSlug(startDate)}`;
}

/** Team card label for enrollment/join date. Pure years stay as `2020`; terms keep full text. */
export function formatMemberStartDisplay(startDate: string): string {
  const trimmed = startDate.trim();
  if (!trimmed) return "";
  if (/^(19|20)\d{2}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export function formatMemberStartMeta(
  startDate: string,
  groupLabel?: string,
): string {
  const date = formatMemberStartDisplay(startDate);
  if (!date) {
    return "";
  }

  const label = groupLabel?.trim();
  return label ? `${label} · ${date}` : date;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/** Sort key for enrollment/join dates — higher = later. */
export function parseMemberStartDate(startDate: string): number {
  const trimmed = startDate.trim();
  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number.parseInt(yearMatch[0], 10) : 0;

  const lower = trimmed.toLowerCase();
  let month = 0;
  if (/\bspring\b/.test(lower)) month = 1;
  else if (/\bsummer\b/.test(lower)) month = 5;
  else if (/\bfall\b|\bautumn\b/.test(lower)) month = 9;
  else if (/\bwinter\b/.test(lower)) month = 11;
  else {
    const isoMatch = trimmed.match(/\b(19|20)\d{2}-(\d{2})\b/);
    if (isoMatch) {
      month = Number.parseInt(isoMatch[1], 10);
    } else {
      const monthMatch = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
      if (monthMatch) month = MONTH_NAMES[monthMatch[1]] ?? 0;
    }
  }

  return year * 100 + month;
}

export function newsSlug(title: string, date: string, desc?: string): string {
  const source = title.trim() || (desc?.slice(0, 40) ?? "news");
  const year = date.trim().split(/\s+/).pop() ?? "";
  const shortYear = year.length === 4 ? year.slice(2) : year;
  const base = slugify(source, 36);
  return shortYear ? `${base}-${shortYear}` : base;
}

export function publicationBibKey(title: string, venue: string): string {
  const yearMatch = venue.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? "0000";
  const words = slugify(title, 60).split("-").filter(Boolean);
  const short = words.slice(0, 2).join("") || "paper";
  return `${short}${year}`;
}
