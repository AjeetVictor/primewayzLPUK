import { useEffect, useMemo, useRef } from 'react';
import {
  loadLinkedInEmbedScript,
  processLinkedInEmbeds,
  sanitizeLinkedInEmbedHtml,
  sanitizeLinkedInPostUrl,
} from '../../utils/linkedInEmbed';

type BlogLinkedInEmbedProps = {
  embedHtml?: string;
  postUrl?: string;
  variant: 'sidebar' | 'inline';
};

export const BlogLinkedInEmbed = ({ embedHtml, postUrl, variant }: BlogLinkedInEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeHtml = useMemo(() => sanitizeLinkedInEmbedHtml(embedHtml), [embedHtml]);
  const safeUrl = useMemo(() => sanitizeLinkedInPostUrl(postUrl), [postUrl]);

  useEffect(() => {
    if (!safeHtml || !containerRef.current) return undefined;

    let active = true;

    loadLinkedInEmbedScript()
      .then(() => {
        if (!active || !containerRef.current) return;
        processLinkedInEmbeds(containerRef.current);
      })
      .catch(() => {
        // Keep the fallback link visible when LinkedIn's script cannot load.
      });

    return () => {
      active = false;
    };
  }, [safeHtml]);

  if (!safeHtml) return null;

  return (
    <section
      aria-label="Related LinkedIn post"
      className={
        variant === 'sidebar'
          ? 'blog-linkedin-embed-sidebar w-full max-w-[240px]'
          : 'blog-linkedin-embed-inline mt-10 border-t border-zinc-200 pt-8'
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">Related LinkedIn post</p>

      <div
        ref={containerRef}
        className="blog-linkedin-embed-host mt-4 min-w-0 overflow-hidden"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
        >
          View on LinkedIn
        </a>
      ) : null}
    </section>
  );
};
