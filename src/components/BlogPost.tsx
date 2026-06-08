import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Send,
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, FormEvent } from 'react';
import { BlogCTA } from './blog/BlogCTA';
import { BlogCard } from './blog/BlogCard';
import { getBlogPostById, getRelatedBlogPosts } from '../data/blog/utils';
import type { BlogPost as BlogPostData } from '../data/blog/types';
import { apiUrl } from '../utils/apiUrl';
import { sanitizeBlogHtml } from '../utils/sanitizeHtml';
import { trackEvent } from '../lib/analytics';

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
  const relatedPosts = useMemo(() => (post ? getRelatedBlogPosts(post, 3) : []), [post]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(Boolean(id));
  const [commentsApiEnabled, setCommentsApiEnabled] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

    fetchPost();
  }, [id, initialPost]);

  useEffect(() => {
    if (!post) return;
    trackEvent('blog_article_view', {
      article_id: post.id,
      article_title: post.title,
      article_category: post.category,
      article_tags: post.tags.join(','),
    });
  }, [post?.id]);

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
      } catch (error) {
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
    } catch (error) {
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
      <main className="min-h-screen bg-zinc-50 pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="font-medium text-zinc-500">Loading article...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-zinc-50 pt-32 pb-24">
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
            Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-32 pb-24">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.nav initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Primewayz UK Insights
          </Link>
        </motion.nav>

        <header className="mb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              {post.category}
            </span>
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {tag}
              </span>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 md:text-6xl"
          >
            {post.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl leading-8 text-zinc-600"
          >
            {post.description || post.excerpt}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-6 border-b border-zinc-100 pb-8 text-sm text-zinc-500"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                <User className="h-5 w-5 text-zinc-400" />
              </div>
              <span className="font-semibold text-zinc-900">{post.author}</span>
            </div>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </motion.div>
        </header>

        {post.image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-14 aspect-[21/9] overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/10"
          >
            <img src={post.image} alt={post.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="prose prose-lg prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900 prose-p:leading-relaxed prose-p:text-zinc-600 prose-strong:text-zinc-900"
        >
          <div className="blog-content-preview" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }} />
        </motion.div>

        <section className="mt-16">
          <BlogCTA />
        </section>

        <section className="mt-16 border-t border-zinc-100 pt-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mr-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Share article</span>
              <button onClick={shareOnTwitter} className="rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Share on Twitter">
                <Twitter className="h-5 w-5" />
              </button>
              <button onClick={shareOnLinkedIn} className="rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-blue-50 hover:text-blue-700" title="Share on LinkedIn">
                <Linkedin className="h-5 w-5" />
              </button>
              <button onClick={shareViaEmail} className="rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600" title="Share via Email">
                <Mail className="h-5 w-5" />
              </button>
              <button onClick={copyToClipboard} className="rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900" title="Copy Link">
                <LinkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900">Related insights</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-20">
          <div className="mb-8 flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-zinc-900">Comments ({comments.length})</h2>
          </div>

          <div className="mb-12 rounded-[2rem] border border-zinc-100 bg-zinc-50 p-6 sm:p-8">
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
                    className="rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm shadow-zinc-900/5"
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
              <div className="rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center">
                <p className="font-medium text-zinc-500">No comments yet.</p>
              </div>
            )}
          </div>
        </section>
      </article>
    </main>
  );
};
