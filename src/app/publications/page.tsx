import type { Metadata } from "next";
import PublicationsPageClient from "@/components/publications/PublicationsPageClient";
import { getPublications } from "@/lib/content";
import { getMemberAuthorLinks } from "@/lib/content/load-team";
import { collectGitHubHrefsFromPublications, fetchGitHubStarsMap } from "@/lib/github-stars";
import { buildListPageMetadata } from "@/lib/site/page-metadata";

export function generateMetadata(): Metadata {
  return buildListPageMetadata("publications", "/publications");
}

export default async function PublicationsPage() {
  const publications = getPublications();
  const authorLinks = getMemberAuthorLinks();
  const githubStars = await fetchGitHubStarsMap(collectGitHubHrefsFromPublications(publications));

  return (
    <PublicationsPageClient
      publications={publications}
      authorLinks={authorLinks}
      githubStars={githubStars}
    />
  );
}
