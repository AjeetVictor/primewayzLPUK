import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  twitterHandle?: string;
}

export const SEO = ({
  title = 'Predictable Software Development as a Service',
  description = 'Primewayz offers elite, productized software development as a service. Scale your business with our on-demand engineering teams and agile development services. Predictable pricing, no contracts, just high-velocity delivery.',
  canonical = 'https://ais-pre-mpuvpf5ptocgkdovjijd5p-281079166320.asia-southeast1.run.app',
  ogType = 'website',
  ogImage = 'https://picsum.photos/seed/software/1200/630',
  twitterHandle = '@software_saas',
}: SEOProps) => {
  const siteTitle = `${title} | Primewayz`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="software development agency, outsourcing, product engineering, agile development, software development, saas, productized software development, agile development services, on-demand engineering teams, subscription development, elite engineering, Primewayz" />
      <meta name="author" content="Primewayz Infortech Private Limited" />
      <link rel="canonical" href={canonical} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* Mobile Optimization */}
      <meta name="theme-color" content="#059669" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Primewayz" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="msapplication-TileColor" content="#059669" />
      <link rel="apple-touch-icon" href="https://picsum.photos/seed/logo/180/180" />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Primewayz - Elite Engineering" />
      <meta property="og:site_name" content="Primewayz" />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="Primewayz - Elite Engineering" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />

      {/* Robots and Google Search Console */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="google-site-verification" content="z-1234567890abcdefghijklmnopqrstuvwxyz" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          'serviceType': 'Software Development as a Service',
          'name': 'Primewayz Infortech Private Limited - Elite Engineering',
          'description': description,
          'provider': {
            '@type': 'Organization',
            'name': 'Primewayz Infortech Private Limited',
            'url': canonical,
            'logo': 'https://picsum.photos/seed/logo/200/200',
            'sameAs': [
              'https://www.linkedin.com/company/primewayz',
              'https://twitter.com/primewayz'
            ]
          },
          'areaServed': 'Global',
          'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': 'Software Development Services',
            'itemListElement': [
              {
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': 'Full-Stack Development'
                }
              },
              {
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': 'Product Engineering'
                }
              },
              {
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': 'UI/UX Design'
                }
              }
            ]
          },
          'offers': {
            '@type': 'Offer',
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock'
          }
        })}
      </script>
    </Helmet>
  );
};
