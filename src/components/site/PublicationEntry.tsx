import Link from "next/link";
import CopyBibtexButton from "@/components/site/CopyBibtexButton";
import LinkChip from "@/components/site/LinkChip";
import { normalizeAuthorName } from "@/lib/content/slug";
import { getVenueBadge, parsePublicationVenue } from "@/lib/publications-utils";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { PublicationItem } from "@/types/lab";

type PublicationEntryProps = {
  pub: PublicationItem;
  githubStars?: GitHubStarsMap;
  variant?: "default" | "profile";
  /** Map of normalized author name → profile href; matching authors render as links. */
  authorLinks?: Record<string, string>;
};

function PublicationAuthors({
  pub,
  authorLinks,
}: {
  pub: PublicationItem;
  authorLinks?: Record<string, string>;
}) {
  if (pub.authorList.length === 0) {
    return <>{pub.authors}</>;
  }

  return (
    <>
      {pub.authorList.map((name, index) => {
        const href = authorLinks?.[normalizeAuthorName(name)];
        return (
          <span key={`${pub.id}-author-${index}`}>
            {index > 0 ? ", " : null}
            {href ? (
              <Link href={href} className="site-link site-link--inline">
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
        );
      })}
    </>
  );
}

export default function PublicationEntry({
  pub,
  githubStars,
  variant = "default",
  authorLinks,
}: PublicationEntryProps) {
  const badge = pub.honor ?? getVenueBadge(pub.venue);
  const parsedVenue = parsePublicationVenue(pub.venue);

  if (variant === "profile") {
    const honor = pub.honor ?? parsedVenue.honor;

    return (
      <article className="publication-entry publication-entry--profile">
        <div
          className="publication-entry__venue-col"
          aria-label={[parsedVenue.conference, parsedVenue.year, honor].filter(Boolean).join(" ")}
        >
          <p className="publication-entry__venue-line">
            {parsedVenue.conference ? (
              <span className="publication-entry__venue-name">{parsedVenue.conference}</span>
            ) : null}
            {parsedVenue.year ? (
              <span className="publication-entry__venue-year">{parsedVenue.year}</span>
            ) : null}
          </p>
          {honor ? (
            <p className="publication-entry__venue-honor-line">
              <span className="publication-entry__venue-honor">{honor}</span>
            </p>
          ) : null}
        </div>

        <div className="publication-entry__content">
          <h3 className="publication-entry__title">{pub.title}</h3>
          <p className="publication-entry__authors">
            <PublicationAuthors pub={pub} authorLinks={authorLinks} />
          </p>
          {pub.links.length > 0 ? (
            <div className="publication-entry__links site-link-chip-list">
              {pub.links.map((link) => (
                <LinkChip key={`${pub.id}-${link.label}-${link.href}`} link={link} githubStars={githubStars} />
              ))}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="publication-entry">
      <div className="publication-entry__header">
        <p className="publication-entry__title">{pub.title}</p>
        {badge ? (
          <span className="publication-entry__badge publication-entry__badge--honor">{badge}</span>
        ) : null}
      </div>
      <p className="publication-entry__authors">
        <PublicationAuthors pub={pub} authorLinks={authorLinks} />
      </p>
      <p className="publication-entry__venue">{pub.venue}</p>
      <div className="publication-entry__actions">
        {pub.links.length > 0 ? (
          <div className="publication-entry__links site-link-chip-list">
            {pub.links.map((link) => (
              <LinkChip key={`${pub.id}-${link.label}-${link.href}`} link={link} githubStars={githubStars} />
            ))}
          </div>
        ) : null}
        {pub.bibtex ? <CopyBibtexButton bibtex={pub.bibtex} /> : null}
      </div>
    </article>
  );
}
