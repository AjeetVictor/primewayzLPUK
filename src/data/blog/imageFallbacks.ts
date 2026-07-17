export const BLOG_THUMBNAIL_PLACEHOLDER =
  '/images/blog/primewayzuk-article-thumbnail-placeholder.webp';

export const BLOG_BANNER_PLACEHOLDER =
  '/images/blog/primewayzuk-article-banner-placeholder.webp';

export const getBlogThumbnailImage = (thumbnailImage?: string) =>
  thumbnailImage || BLOG_THUMBNAIL_PLACEHOLDER;

export const getBlogBannerImage = (image?: string) =>
  image || BLOG_BANNER_PLACEHOLDER;
