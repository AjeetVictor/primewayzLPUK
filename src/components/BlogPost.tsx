import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, Clock, User, Share2, MessageSquare, Send, Twitter, Linkedin, Mail, Link as LinkIcon } from 'lucide-react';
import { useEffect, useState, FormEvent } from 'react';
import { blogPosts } from '../data/blogPosts';
import { extraBlogPosts } from '../data/extraBlogPosts';
import { apiUrl } from '../utils/apiUrl';

interface BlogPostData {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  image: string;
}

interface Comment {
  id: number;
  name: string;
  text: string;
  createdAt: string;
}

export const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(true);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentsApiEnabled, setCommentsApiEnabled] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(apiUrl(`/api/blog/posts/${id}`));
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        const localPost = [...blogPosts, ...extraBlogPosts].find((p) => p.id === id) || null;
        setPost(localPost as BlogPostData | null);
      }
    } catch (error) {
      const localPost = [...blogPosts, ...extraBlogPosts].find((p) => p.id === id) || null;
      setPost(localPost as BlogPostData | null);
    } finally {
      setIsPostLoading(false);
    }
  };

  const fetchComments = async () => {
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

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !commentText || isSubmitting || !commentsApiEnabled) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/blog/${id}/comments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text: commentText })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
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
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this article: ${post?.title}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(post?.title || '');
    const body = encodeURIComponent(`I thought you might find this interesting: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (isPostLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Post not found</h2>
          <Link 
            to="/" 
            className="text-emerald-600 font-semibold hover:underline flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-zinc-500 hover:text-emerald-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Insights
          </button>
        </motion.div>

        {/* Header */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
              {post.category}
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900 mb-8 leading-[1.1]"
          >
            {post.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-6 text-sm text-zinc-500 border-b border-zinc-100 pb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <span className="font-semibold text-zinc-900">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {post.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </div>
          </motion.div>
        </header>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl shadow-emerald-900/10"
        >
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="prose prose-zinc prose-lg max-w-none 
            prose-headings:text-zinc-900 prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-zinc-600 prose-p:leading-relaxed
            prose-strong:text-zinc-900
            prose-emerald"
        >
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 pt-12 border-t border-zinc-100"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mr-2">Share Article</span>
              
              <button 
                onClick={shareOnTwitter}
                className="p-3 bg-zinc-50 text-zinc-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all group"
                title="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              
              <button 
                onClick={shareOnLinkedIn}
                className="p-3 bg-zinc-50 text-zinc-600 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-all group"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              
              <button 
                onClick={shareViaEmail}
                className="p-3 bg-zinc-50 text-zinc-600 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
                title="Share via Email"
              >
                <Mail className="w-5 h-5" />
              </button>

              <button 
                onClick={copyToClipboard}
                className="p-3 bg-zinc-50 text-zinc-600 rounded-full hover:bg-zinc-100 hover:text-zinc-900 transition-all group"
                title="Copy Link"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate(-1)}>
              <span className="text-sm text-zinc-400 font-medium group-hover:text-emerald-600 transition-colors">Next Article</span>
              <ArrowLeft className="w-4 h-4 text-zinc-300 rotate-180 group-hover:text-emerald-600 transition-colors group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <section className="mt-24">
          <div className="flex items-center gap-3 mb-12">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-zinc-900">Comments ({comments.length})</h2>
          </div>

          {/* Comment Form */}
          <div className="bg-zinc-50 rounded-[2rem] p-8 mb-16 border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Leave a comment</h3>
            <form onSubmit={handleSubmitComment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 placeholder:text-zinc-300"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="comment" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  Comment
                </label>
                <textarea
                  id="comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  required
                  rows={4}
                  className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 placeholder:text-zinc-300 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !commentsApiEnabled}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/10"
              >
                {commentsApiEnabled ? (isSubmitting ? 'Posting...' : 'Post Comment') : 'Comments unavailable'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Comments List */}
          <div className="space-y-8">
            {isLoadingComments ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-8 bg-white border border-zinc-100 rounded-[2rem] hover:shadow-xl hover:shadow-zinc-900/5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900">{comment.name}</h4>
                          <p className="text-xs text-zinc-400 font-medium">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-600 leading-relaxed">
                      {comment.text}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                <p className="text-zinc-500 font-medium">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
