import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfilePageContent from "@/components/profile/ProfilePageContent";
import JsonLd from "@/components/site/JsonLd";
import { getSiteConfig } from "@/lib/content";
import { absoluteUrl, getSiteUrl } from "@/lib/site/site-url";
import { filterHeroMemberLinks } from "@/lib/content/member-blog-channels";
import { resolveProfileSegmentsWithBlog } from "@/lib/content/profile-blog";
import { getMemberAuthorLinks, listMemberProfileSlugs, loadMemberProfile } from "@/lib/content/load-team";
import { collectGitHubHrefsFromPublications, fetchGitHubStarsMap } from "@/lib/github-stars";
import type { ProfileBodySegment } from "@/lib/content/resolve-profile-papers";
import type { PublicationItem } from "@/types/lab";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function collectProfilePublications(segments: ProfileBodySegment[]): PublicationItem[] {
  return segments.flatMap((segment) =>
    segment.kind === "papers" ? segment.publications : [],
  );
}

export function generateStaticParams() {
  return listMemberProfileSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = loadMemberProfile(slug);
  if (!profile) {
    return {};
  }

  const site = getSiteConfig();
  const canonical = `/${profile.slug}`;

  return {
    title: profile.member.name,
    description: profile.member.bio,
    alternates: { canonical },
    // Force per-page noindex for opt-out profiles (e.g. templates), even when
    // the site is indexable. Otherwise inherit the site-wide robots policy.
    ...(profile.member.noindex
      ? {
          robots: {
            index: false,
            follow: false,
            nocache: true,
            googleBot: { index: false, follow: false, noimageindex: true },
          },
        }
      : {}),
    openGraph: {
      type: "profile",
      title: `${profile.member.name} | ${site.name}`,
      description: profile.member.bio,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.member.name} | ${site.name}`,
      description: profile.member.bio,
    },
  };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = loadMemberProfile(slug);
  if (!profile) {
    notFound();
  }

  const site = getSiteConfig();
  const heroLinks = filterHeroMemberLinks(profile.member.links);
  const pathLabel = `content/team/${profile.group}/${profile.slug}/`;
  const profilePublications = collectProfilePublications(profile.segments);
  const githubStars = await fetchGitHubStarsMap(
    collectGitHubHrefsFromPublications(profilePublications),
  );
  const segments = resolveProfileSegmentsWithBlog(
    profile.member.id,
    profile.segments,
    profile.member.links,
    pathLabel,
  );

  const sameAs = profile.member.links
    .map((link) => link.href)
    .filter((href) => /^https?:\/\//i.test(href));

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.member.name,
    url: absoluteUrl(`/${profile.slug}`),
    ...(profile.member.photo ? { image: absoluteUrl(profile.member.photo) } : {}),
    ...(profile.member.bio ? { description: profile.member.bio } : {}),
    ...(profile.member.degree ? { jobTitle: profile.member.degree } : {}),
    affiliation: {
      "@type": "CollegeOrUniversity",
      name: site.schoolName,
      url: site.schoolHref,
    },
    worksFor: { "@type": "Organization", name: site.name, url: getSiteUrl() },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <>
      <JsonLd data={personJsonLd} />
      <ProfilePageContent
        profile={{ ...profile, segments }}
        siteName={site.name}
        heroLinks={heroLinks}
        githubStars={githubStars}
        authorLinks={getMemberAuthorLinks()}
      />
    </>
  );
}
