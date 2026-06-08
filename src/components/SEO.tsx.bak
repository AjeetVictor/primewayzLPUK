interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export const SEO = ({
  title = 'Software Development Subscription for UK SMEs | Primewayz UK',
  description = 'Primewayz UK helps UK small businesses manage websites, SEO, CRM, automation, integrations, landing pages, and ongoing digital improvements through flexible monthly software delivery.',
  canonical = 'https://uk.primewayz.com/',
  ogImage = 'https://uk.primewayz.com/og-primewayz-uk.jpg',
  noindex = false,
}: SEOProps) => {
  const siteTitle = `${title} | Primewayz UK`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Primewayz UK',
    url: canonical,
    logo: 'https://uk.primewayz.com/favicon.png',
    description,
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    serviceArea: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    availableLanguage: 'en-GB',
    currenciesAccepted: 'GBP',
    priceRange: '££',
    brand: {
      '@type': 'Brand',
      name: 'Primewayz',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'Primewayz Infotech Pvt. Ltd.',
      url: 'https://primewayz.com/',
    },
    serviceType: [
      'Software Development Subscription for UK SMEs',
      'Website Maintenance for UK Small Businesses',
      'UK SEO Support',
      'CRM Integration',
      'Business Automation',
      'Landing Page Development',
      'Digital System Maintenance',
    ],
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'UK small businesses and SMEs',
    },
  };

  return (
    <>
      <title>{siteTitle}</title>

      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="software development subscription UK, subscription software delivery UK, website maintenance subscription UK, digital support for UK SMEs, CRM integration support UK, business automation support UK, SEO foundation support UK, monthly software development support UK"
      />
      <meta name="author" content="Primewayz Infotech Pvt. Ltd." />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <meta name="language" content="en-GB" />
      <meta name="geo.region" content="GB" />
      <meta name="geo.placename" content="United Kingdom" />
      <meta name="distribution" content="United Kingdom" />
      <meta name="rating" content="General" />

      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en-gb" href="https://uk.primewayz.com/" />
      <link rel="alternate" hrefLang="x-default" href="https://uk.primewayz.com/" />
      <link rel="apple-touch-icon" href="https://uk.primewayz.com/favicon.png" />

      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:site_name" content="Primewayz UK" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta
        property="og:image:alt"
        content="Primewayz UK monthly digital delivery for UK small businesses"
      />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta
        name="twitter:image:alt"
        content="Primewayz UK monthly digital delivery for UK small businesses"
      />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </>
  );
};