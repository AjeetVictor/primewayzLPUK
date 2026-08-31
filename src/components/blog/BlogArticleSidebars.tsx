import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { ArticleHeading } from '../../data/blog/contentUtils';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';
import { BlogLinkedInEmbed } from './BlogLinkedInEmbed';
import { sanitizeLinkedInEmbedHtml } from '../../utils/linkedInEmbed';
import { handleTocClick } from '../../utils/articleAnchorScroll';
import { scrollTocLinkIntoView } from '../../hooks/useActiveArticleHeading';
import { cn } from '../../utils/cn';

type BlogArticleSidebarProps = {
  headings: ArticleHeading[];
  activeId: string | null;
  onHeadingActivate: (headingId: string) => void;
  linkedInEmbedHtml?: string;
  linkedInPostUrl?: string;

};

export const BlogArticleSidebar = ({
  headings,
  activeId,
  onHeadingActivate,
  linkedInEmbedHtml,
  linkedInPostUrl,

}: BlogArticleSidebarProps) => {
  const hasLinkedInEmbed = Boolean(sanitizeLinkedInEmbedHtml(linkedInEmbedHtml));
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const tocLinkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  useEffect(() => {
    if (!activeId) return;

    const container = sidebarScrollRef.current;
    const activeLink = tocLinkRefs.current.get(activeId);

    if (!container || !activeLink) return;

    scrollTocLinkIntoView(container, activeLink);
  }, [activeId]);

  return (
    <aside className="hidden lg:block">
      <div
        ref={sidebarScrollRef}
        className="sticky top-28 w-full max-w-[240px] space-y-10"
      >
{headings.length > 0 ? (
          <nav aria-label="In this article">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">In this article</p>
            <ul className="mt-4 space-y-1">
              {headings.map((heading) => {
                const isActive = activeId === heading.id;

                return (
                  <li key={heading.id}>
                    <a
                      ref={(element) => {
                        if (element) {
                          tocLinkRefs.current.set(heading.id, element);
                        } else {
                          tocLinkRefs.current.delete(heading.id);
                        }
                      }}
                      href={`#${heading.id}`}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={(event) => {
                        onHeadingActivate(heading.id);
                        handleTocClick(event, heading.id);
                      }}
                      className={cn(
                        'relative block rounded-md px-3 py-2 text-sm leading-5 transition-colors',
                        isActive
                          ? 'border-l-2 border-[#179de3] bg-blue-50/80 pl-3 pr-2 font-semibold text-[#003f7d]'
                          : 'border-l-2 border-transparent text-slate-700 hover:bg-slate-50 hover:text-[#003f7d]',
                      )}
                    >
                      {heading.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        {hasLinkedInEmbed ? (
          <BlogLinkedInEmbed
            embedHtml={linkedInEmbedHtml}
            postUrl={linkedInPostUrl}
            variant="sidebar"
          />
        ) : null}
      </div>
    </aside>
  );
};

type BlogRecentSidebarProps = {
  posts: Array<{
    id: string;
    title: string;
    date: string;
    category: string;
    thumbnailImage?: string;
    image?: string;
    imageAlt?: string;
  }>;
  tags?: string[];
};

export const BlogRecentSidebar = ({
  posts,
  tags = [],
}: BlogRecentSidebarProps) => (
  <aside className="lg:block">
    <div className="space-y-9 lg:sticky lg:top-28">
      <section className="border-t border-zinc-900 pt-4 lg:border-t-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-900">
          Recent insights
        </h2>

        <div className="mt-4 space-y-0">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex gap-4 border-b border-zinc-200 py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  {post.category}
                </p>

                <h3 className="mt-1 text-sm font-bold leading-snug text-zinc-900">
                  <Link
                    to={`/blog/${post.id}`}
                    className="transition-colors hover:text-emerald-700"
                  >
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-2 text-xs font-semibold text-zinc-400">
                  {post.date}
                </p>
              </div>

              <Link
                to={`/blog/${post.id}`}
                aria-hidden
                tabIndex={-1}
                className="h-14 w-14 shrink-0 overflow-hidden bg-zinc-100"
              >
                <img
                  src={getBlogThumbnailImage(post.thumbnailImage, post.image)}
                  width={56}
                  height={56}
                  alt={post.imageAlt || post.title}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {tags.length ? (
        <section className="border-t border-zinc-200 pt-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-900">
            Article topics
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold leading-5 text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  </aside>
);

export const BlogAuthorSection = () => (
  <section className="mt-16 border-y border-zinc-200 py-8">
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#000A2D] text-xs font-black uppercase tracking-[0.18em] text-white">
        PW
      </div>
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Primewayz UK Team</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">
          Practical insight for UK SMEs on websites, CRM, automation, technical SEO, software delivery,
          and monthly digital operations from the Primewayz UK delivery team.
        </p>
      </div>
    </div>
  </section>
);
