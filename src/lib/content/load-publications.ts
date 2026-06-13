import { existsSync } from "fs";
import { CONTENT_PATHS } from "@/lib/content/paths";
import {
  loadPublicationsFromBibFile,
  sortPublicationsByYear,
} from "@/lib/content/bib-publications";
import type { PublicationItem } from "@/types/lab";

export function loadPublications(): PublicationItem[] {
  const bibPath = CONTENT_PATHS.publicationsBib;
  if (!existsSync(bibPath)) {
    return [];
  }

  return sortPublicationsByYear(loadPublicationsFromBibFile(bibPath));
}

/**
 * Reverse of the paper→blog link: finds the global publication whose `blog` field
 * points at this blog post, so the post can show a "Related paper" link.
 */
export function getRelatedPaperForBlog(slug: string): PublicationItem | null {
  const target = `/blog/${slug.replace(/^\//, "").toLowerCase()}`;
  return loadPublications().find((pub) => pub.blogHref?.toLowerCase() === target) ?? null;
}
