import MarkdownBody from "@/components/markdown/MarkdownBody";
import ProfileBlogPosts from "@/components/profile/ProfileBlogPosts";
import PublicationEntry from "@/components/site/PublicationEntry";
import type { GitHubStarsMap } from "@/lib/github-stars";
import { cn } from "@/lib/utils";
import type { ProfileBodySegment } from "@/lib/content/resolve-profile-papers";

type MemberMarkdownProps = {
  segments: ProfileBodySegment[];
  githubStars?: GitHubStarsMap;
  authorLinks?: Record<string, string>;
  variant?: "pi" | "member";
};

function segmentKey(segment: ProfileBodySegment): string {
  if (segment.kind === "papers") {
    return `papers-${segment.title}`;
  }

  if (segment.kind === "blog") {
    return `blog-${segment.title}`;
  }

  return `markdown-${segment.content.trim().slice(0, 80).replace(/\s+/g, "-")}`;
}

export default function MemberMarkdown({
  segments,
  githubStars,
  authorLinks,
  variant = "member",
}: MemberMarkdownProps) {
  return (
    <article className={cn("profile-markdown", `profile-markdown--${variant}`)}>
      {segments.map((segment, index) => {
        if (segment.kind === "markdown") {
          if (!segment.content.trim()) {
            return null;
          }

          const isIntro = index === 0 && !segment.content.trimStart().startsWith("##");

          return (
            <MarkdownBody
              key={segmentKey(segment)}
              content={segment.content}
              variant="profile"
              className={isIntro ? "profile-markdown-body--intro" : undefined}
            />
          );
        }

        if (segment.kind === "blog") {
          return (
            <ProfileBlogPosts
              key={segmentKey(segment)}
              title={segment.title}
              channels={segment.channels}
              posts={segment.posts}
            />
          );
        }

        return (
          <section key={segmentKey(segment)} className="profile-markdown-papers">
            <h2 className="profile-markdown-body__h2">{segment.title}</h2>
            <div className="profile-markdown-papers__list">
              {segment.publications.map((pub) => (
                <PublicationEntry
                  key={pub.id}
                  pub={pub}
                  variant="profile"
                  githubStars={githubStars}
                  authorLinks={authorLinks}
                />
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}
