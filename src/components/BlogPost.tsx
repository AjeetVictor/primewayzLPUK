import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  MessageSquare,
  Send,
  Twitter,
  Linkedin,
  Mail,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, FormEvent, useCallback } from 'react';
import { BlogCard } from './blog/BlogCard';
import { BlogArticleCTA } from './blog/BlogArticleCTA';
import { BlogFaqSection } from './blog/BlogFaqSection';
import { BlogBreadcrumbs } from './blog/BlogBreadcrumbs';
import { BlogCategoryNav } from './blog/BlogCategoryNav';
import {
  BlogArticleSidebar,
  BlogAuthorSection,
  BlogRecentSidebar,
} from './blog/BlogArticleSidebars';
import { BlogLinkedInEmbed } from './blog/BlogLinkedInEmbed';
import {
  getAllBlogPosts,
  getBlogPostById,
  getRelatedBlogPosts,
} from '../data/blog/utils';
import {
  buildArticleBreadcrumbs,
  getArticlePrimaryCategory,
  getArticleSecondaryCategories,
  getBlogCategoryBySlug,
  getCategoryArticleCount,
  getNavigableCategories,
} from '../data/blog/categories';
import { getBlogBannerImage } from '../data/blog/imageFallbacks';
import { extractArticleHeadings, injectHeadingIds } from '../data/blog/contentUtils';
import type { BlogPost as BlogPostData } from '../data/blog/types';
import { apiUrl } from '../utils/apiUrl';
import { sanitizeBlogHtml } from '../utils/sanitizeHtml';
import { trackEvent } from '../lib/analytics';
import { sanitizeLinkedInEmbedHtml } from '../utils/linkedInEmbed';
import { scrollToArticleHeading } from '../utils/articleAnchorScroll';
import { useActiveArticleHeading } from '../hooks/useActiveArticleHeading';

interface Comment {
  id: number;
  name: string;
  text: string;
  createdAt: string;
}

type BlogPostProps = {
  initialPost?: BlogPostData | null;
};

export const BlogPost = ({ initialPost }: BlogPostProps) => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostData | null>(() => initialPost || getBlogPostById(id) || null);
  const [isPostLoading, setIsPostLoading] = useState(Boolean(id && !initialPost && !getBlogPostById(id)));
  const [postsPool, setPostsPool] = useState<BlogPostData[]>(() => getAllBlogPosts());
  const relatedPosts = useMemo(
    () => (post ? getRelatedBlogPosts(post, 3, postsPool) : []),
    [post, postsPool],
  );
  const recentPosts = useMemo(
    () => postsPool.filter((candidate) => candidate.id !== post?.id).slice(0, 4),
    [post?.id, postsPool],
  );
  const primaryCategorySlug = post ? getArticlePrimaryCategory(post) : undefined;
  const primaryCategory = primaryCategorySlug
    ? getBlogCategoryBySlug(primaryCategorySlug)
    : undefined;
  const secondaryCategories = useMemo(() => {
    if (!post) return [];
    return getArticleSecondaryCategories(post)
      .map((slug) => getBlogCategoryBySlug(slug))
      .filter((category): category is NonNullable<typeof category> => Boolean(category));
  }, [post]);
  const breadcrumbs = useMemo(
    () => (post ? buildArticleBreadcrumbs(post, primaryCategory) : []),
    [post, primaryCategory],
  );
  const navigableCategories = useMemo(() => getNavigableCategories(postsPool), [postsPool]);
  const articleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of navigableCategories) {
      counts[category.slug] = getCategoryArticleCount(category.slug, postsPool);
    }
    return counts;
  }, [navigableCategories, postsPool]);
  const heroImage = getBlogBannerImage(post?.image);
  const articleHeadings = useMemo(
    () => (post ? extractArticleHeadings(post.content) : []),
    [post?.content],
  );
  const articleContent = useMemo(
    () => (post ? injectHeadingIds(post.content, articleHeadings) : ''),
    [post, articleHeadings],
  );
  const renderedArticleContent = useMemo(
    () => (articleContent ? sanitizeBlogHtml(articleContent) : ''),
    [articleContent],
  );
  const hasLinkedInEmbed = Boolean(sanitizeLinkedInEmbedHtml(post?.linkedInEmbedHtml));
  const articleContentRef = useRef<HTMLDivElement>(null);
  const headingIds = useMemo(() => articleHeadings.map((heading) => heading.id), [articleHeadings]);
  const { activeId, setActiveId } = useActiveArticleHeading(
    articleContentRef,
    headingIds,
    renderedArticleContent,
  );
  const handleHeadingActivate = useCallback(
    (headingId: string) => {
      setActiveId(headingId);
    },
    [setActiveId],
  );

  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(Boolean(id));
  const [commentsApiEnabled, setCommentsApiEnabled] = useState(true);

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [id]);

  useEffect(() => {
    if (!post?.id || !window.location.hash) return undefined;

    const headingId = decodeURIComponent(window.location.hash.slice(1));

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tryScroll = () => {
      attempts += 1;

      const didScroll = scrollToArticleHeading(headingId, attempts === 1 ? 'auto' : 'smooth');

      if (didScroll) {
        setActiveId(headingId);
      }

      if (!didScroll && attempts < 10) {
        timer = setTimeout(tryScroll, 100);
      }
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(tryScroll);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [post?.id, renderedArticleContent, setActiveId]);

  useEffect(() => {
    const localPost = initialPost?.id === id || initialPost?.slug === id ? initialPost : getBlogPostById(id);
    setPost(localPost || null);
    setIsPostLoading(Boolean(id && !localPost));

    if (!id) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(apiUrl(`/api/blog/posts/${id}`));
        if (res.ok) {
          setPost(await res.json());
        } else {
          setPost(localPost || null);
        }
      } catch {
        setPost(localPost || null);
      } finally {
        setIsPostLoading(false);
      }
    };

    const fetchPostsPool = async () => {
      try {
        const res = await fetch(apiUrl('/api/blog/posts'));
        if (res.ok) {
          setPostsPool(await res.json());
        }
      } catch {
        setPostsPool(getAllBlogPosts());
      }
    };

    fetchPost();
    fetchPostsPool();
  }, [id, initialPost]);

  useEffect(() => {
    if (!post) return;
    trackEvent('blog_article_view', {
      article_id: post.id,
      article_title: post.title,
      article_category: primaryCategorySlug || post.category,
      article_tags: post.tags.join(','),
    });
  }, [post?.id, primaryCategorySlug]);

  useEffect(() => {
    if (!id) {
      setIsLoadingComments(false);
      return;
    }

    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const res = await fetch(apiUrl(`/api/blog/${id}/comments`));
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        } else {
          setCommentsApiEnabled(false);
        }
      } catch {
        setCommentsApiEnabled(false);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [id]);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !name || !commentText || isSubmitting || !commentsApiEnabled) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/blog/${id}/comments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text: commentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setCommentText('');
      } else {
        setCommentsApiEnabled(false);
      }
    } catch {
      setCommentsApiEnabled(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareOnTwitter = () => {
    if (post) {
      trackEvent('blog_article_share', {
        article_id: post.id,
        article_title: post.title,
        share_channel: 'twitter',
      });
    }
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this article: ${post?.title}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (post) {
      trackEvent('blog_article_share', {
        article_id: post.id,
        article_title: post.title,
        share_channel: 'linkedin',
      });
    }
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareViaEmail = () => {
    if (post) {
      trackEvent('blog_article_share', {
        article_id: post.id,
        article_title: post.title,
        share_channel: 'email',
      });
    }
    const subject = encodeURIComponent(post?.title || '');
    const body = encodeURIComponent(`I thought you might find this interesting: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = () => {
    if (post) {
      trackEvent('blog_article_share', {
        article_id: post.id,
        article_title: post.title,
        share_channel: 'copy_link',
      });
    }
    navigator.clipboard?.writeText(window.location.href);
  };

  if (isPostLoading) {
    return (
      <main className="min-h-screen bg-white pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="font-medium text-zinc-500">Loading article...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-white pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Article not found</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">This insight is not available</h1>
          <p className="mx-auto mt-5 max-w-xl text-zinc-600">
            The article may have moved, or the link may no longer be current.
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to insights
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-32 pb-24">
      <article className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-4">
          <BlogBreadcrumbs items={breadcrumbs} />
          {navigableCategories.length ? (
            <BlogCategoryNav
              categories={navigableCategories}
              activeSlug={primaryCategorySlug}
              articleCounts={articleCounts}
            />
          ) : null}
        </div>

        <header className="mx-auto mb-14 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {primaryCategory ? (
              <Link
                to={primaryCategory.canonicalPath}
                className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600 transition hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {primaryCategory.name}
              </Link>
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">
                {post.category}
              </p>
            )}
          </motion.div>

          {secondaryCategories.length ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {secondaryCategories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.canonicalPath}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  {category.shortName || category.name}
                </Link>
              ))}
            </div>
          ) : null}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-4xl font-bold leading-tight tracking-tight text-zinc-900 md:text-5xl"
          >
            {post.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg leading-8 text-zinc-600"
          >
            {post.description || post.excerpt}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400"
          >
            <span>{post.date}</span>
            <span aria-hidden>·</span>
            <span>{post.readTime}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-2 normal-case tracking-normal text-zinc-600">
              <User className="h-4 w-4" aria-hidden />
              {post.author}
            </span>
          </motion.div>
        </header>

        <div className="grid gap-12 lg:grid-cols-[230px_minmax(0,1fr)_260px] lg:gap-10 xl:gap-12">
          <BlogArticleSidebar
            headings={articleHeadings}
            activeId={activeId}
            onHeadingActivate={handleHeadingActivate}
            linkedInEmbedHtml={post.linkedInEmbedHtml}
            linkedInPostUrl={post.linkedInPostUrl}
            onShareTwitter={shareOnTwitter}
            onShareLinkedIn={shareOnLinkedIn}
            onShareEmail={shareViaEmail}
            onCopyLink={copyToClipboard}
          />

          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-10 aspect-[16/9] overflow-hidden bg-zinc-100"
            >
              <img
                src={heroImage}
                alt={post.imageAlt || post.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.div
              ref={articleContentRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="article-content blog-content-preview max-w-none text-[1.05rem] leading-[1.85] text-zinc-700"
            >
              <div dangerouslySetInnerHTML={{ __html: renderedArticleContent }} />
            </motion.div>

            <div className="mt-10 border-t border-zinc-200 pt-8 lg:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">Share</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={shareOnTwitter}
                  className="rounded-full border border-zinc-200 p-2.5 text-zinc-600"
                  title="Share on Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={shareOnLinkedIn}
                  className="rounded-full border border-zinc-200 p-2.5 text-zinc-600"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={shareViaEmail}
                  className="rounded-full border border-zinc-200 p-2.5 text-zinc-600"
                  title="Share via email"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>

            {hasLinkedInEmbed ? (
              <div className="lg:hidden">
                <BlogLinkedInEmbed
                  embedHtml={post.linkedInEmbedHtml}
                  postUrl={post.linkedInPostUrl}
                  variant="inline"
                />
              </div>
            ) : null}
          </div>

          <BlogRecentSidebar posts={recentPosts} />
        </div>

        <BlogAuthorSection />

        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Related insights</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}

        {post.faqs?.length ? <BlogFaqSection faqs={post.faqs} /> : null}

        <BlogArticleCTA post={post} />

        <section className="mt-20">
          <div className="mb-8 flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-zinc-900">Comments ({comments.length})</h2>
          </div>

          <div className="mb-12 border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
            <h3 className="mb-6 text-lg font-bold text-zinc-900">Leave a comment</h3>
            <form onSubmit={handleSubmitComment} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Your name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-zinc-900 placeholder:text-zinc-300 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label htmlFor="comment" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Comment
                </label>
                <textarea
                  id="comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  required
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-zinc-900 placeholder:text-zinc-300 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !commentsApiEnabled}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {commentsApiEnabled ? (isSubmitting ? 'Posting...' : 'Post comment') : 'Comments unavailable'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="space-y-6">
            {isLoadingComments ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                <p className="font-medium text-zinc-500">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-zinc-200 bg-white p-6"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">{comment.name}</h4>
                        <p className="text-xs font-medium text-zinc-400">
                          {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="leading-relaxed text-zinc-600">{comment.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center">
                <p className="font-medium text-zinc-500">No comments yet.</p>
              </div>
            )}
          </div>
        </section>
      </article>
    </main>
  );
};
