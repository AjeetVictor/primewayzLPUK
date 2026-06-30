import { cn } from '../../utils/cn';

type OptimizedPictureProps = {
  /** Path without extension, e.g. `/images/visibility` */
  basePath: string;
  /** Fallback raster extension when WebP is unavailable */
  fallbackExtension?: 'jpg' | 'jpeg' | 'png';
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export function OptimizedPicture({
  basePath,
  fallbackExtension = 'jpg',
  alt,
  width,
  height,
  className,
  imgClassName,
  loading = 'lazy',
  fetchPriority,
}: OptimizedPictureProps) {
  const webpSrc = `${basePath}.webp`;
  const fallbackSrc = `${basePath}.${fallbackExtension}`;

  return (
    <picture className={cn('block h-full w-full', className)}>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={cn('block h-full w-full', imgClassName ?? 'object-contain object-center')}
      />
    </picture>
  );
}
