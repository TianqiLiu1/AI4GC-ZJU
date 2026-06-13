"use client";

import { useMemo, useState, type ReactNode } from "react";
import ContentSection from "@/components/layout/ContentSection";
import PublicationEntry from "@/components/site/PublicationEntry";
import SegmentedControl from "@/components/site/SegmentedControl";
import { isPreprintVenue, publicationYear } from "@/lib/publications-utils";
import type { GitHubStarsMap } from "@/lib/github-stars";
import type { PublicationItem } from "@/types/lab";

const ALL = "all";
const BEFORE = "before";
const CURRENT_YEAR = new Date().getFullYear();
const OLD_BOUNDARY = CURRENT_YEAR - 3; // years strictly before this fall into "Before {OLD_BOUNDARY}"

type PublicationsPageClientProps = {
  publications: PublicationItem[];
  authorLinks: Record<string, string>;
  githubStars: GitHubStarsMap;
};

export default function PublicationsPageClient({
  publications,
  authorLinks,
  githubStars,
}: PublicationsPageClientProps) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<string>(ALL);
  const [topic, setTopic] = useState<string>(ALL);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const pub of publications) for (const t of pub.topics) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [publications]);

  // Search + topic filtering (year handled separately via buckets).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publications.filter((pub) => {
      if (topic !== ALL && !pub.topics.includes(topic)) return false;
      if (q && !`${pub.title} ${pub.authors} ${pub.venue}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [publications, query, topic]);

  const visible = useMemo(() => {
    return filtered.filter((pub) => {
      if (year === ALL) return true;
      const y = publicationYear(pub.venue);
      if (year === BEFORE) return y > 0 && y < OLD_BOUNDARY;
      return String(y) === year;
    });
  }, [filtered, year]);

  const atYear = (items: PublicationItem[], y: number) =>
    items.filter((p) => publicationYear(p.venue) === y);
  const beforeItems = visible.filter((p) => {
    const y = publicationYear(p.venue);
    return y > 0 && y < OLD_BOUNDARY;
  });

  const currentPubs = atYear(visible, CURRENT_YEAR);
  const currentPublished = currentPubs.filter((p) => !isPreprintVenue(p.venue));
  const currentPreprints = currentPubs.filter((p) => isPreprintVenue(p.venue));
  const prevYearItems = atYear(visible, CURRENT_YEAR - 1).filter((p) => !isPreprintVenue(p.venue));

  const filterActive = query.trim() !== "" || topic !== ALL || year !== ALL;

  const yearOptions = [
    { value: ALL, label: "All" },
    { value: String(CURRENT_YEAR), label: String(CURRENT_YEAR) },
    { value: String(CURRENT_YEAR - 1), label: String(CURRENT_YEAR - 1) },
    { value: String(CURRENT_YEAR - 2), label: String(CURRENT_YEAR - 2) },
    { value: String(CURRENT_YEAR - 3), label: String(CURRENT_YEAR - 3) },
    { value: BEFORE, label: `Before ${OLD_BOUNDARY}` },
  ];
  const topicOptions = [{ value: ALL, label: "All" }, ...topics.map((t) => ({ value: t, label: t }))];

  const renderEntry = (pub: PublicationItem) => (
    <PublicationEntry key={pub.id} pub={pub} githubStars={githubStars} authorLinks={authorLinks} />
  );

  const hasAny =
    currentPubs.length + prevYearItems.length + beforeItems.length +
      atYear(visible, CURRENT_YEAR - 2).length + atYear(visible, CURRENT_YEAR - 3).length >
    0;

  return (
    <main>
      <ContentSection className="section-page-body">
        <div className="publications-toolbar">
          <div className="publications-search">
            <svg className="publications-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="search"
              className="publications-search__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, or venue…"
              aria-label="Search publications"
            />
          </div>
          <div className="publications-toolbar__filters">
            <SegmentedControl value={year} options={yearOptions} onChange={setYear} ariaLabel="Filter publications by year" />
            {topics.length > 0 ? (
              <SegmentedControl value={topic} options={topicOptions} onChange={setTopic} ariaLabel="Filter publications by topic" />
            ) : null}
          </div>
        </div>

        {currentPubs.length > 0 ? (
          <section className="publication-year-group">
            <h2 className="publication-year-group__heading">{CURRENT_YEAR}</h2>
            {currentPublished.length > 0 ? (
              <div className="publication-subgroup">
                <h3 className="publication-subgroup__heading">Published</h3>
                {currentPublished.map(renderEntry)}
              </div>
            ) : null}
            {currentPreprints.length > 0 ? (
              <div className="publication-subgroup">
                <h3 className="publication-subgroup__heading">Preprints · arXiv</h3>
                {currentPreprints.map(renderEntry)}
              </div>
            ) : null}
          </section>
        ) : null}

        {prevYearItems.length > 0 ? (
          <section className="publication-year-group">
            <h2 className="publication-year-group__heading">{CURRENT_YEAR - 1}</h2>
            {prevYearItems.map(renderEntry)}
          </section>
        ) : null}

        <CollapsibleYear label={String(CURRENT_YEAR - 2)} items={atYear(visible, CURRENT_YEAR - 2)} open={filterActive} render={renderEntry} />
        <CollapsibleYear label={String(CURRENT_YEAR - 3)} items={atYear(visible, CURRENT_YEAR - 3)} open={filterActive} render={renderEntry} />
        <CollapsibleYear label={`Before ${OLD_BOUNDARY}`} items={beforeItems} open={filterActive} render={renderEntry} />

        {!hasAny ? <p className="publications-empty">No publications match your filters.</p> : null}
      </ContentSection>
    </main>
  );
}

function CollapsibleYear({
  label,
  items,
  open,
  render,
}: {
  label: string;
  items: PublicationItem[];
  open: boolean;
  render: (pub: PublicationItem) => ReactNode;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <details className="publication-collapse" open={open}>
      <summary className="publication-collapse__summary">
        <span className="publication-collapse__chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
        <span className="publication-collapse__label">{label}</span>
        <span className="publication-collapse__count">{items.length} papers</span>
      </summary>
      <div className="publication-collapse__body">{items.map(render)}</div>
    </details>
  );
}
