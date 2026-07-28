import { Helmet } from 'react-helmet-async';
import { buildPricingFaqStructuredData, PricingPageContent } from './pricing/PricingPageContent';

export const Pricing = () => {
  const faqJsonLd = JSON.stringify(buildPricingFaqStructuredData());

  return (
    <main className="bg-[#FBFCFE] text-brand-navy">
      <Helmet>
        <title>Pricing & Engagement Options | Primewayz UK</title>
        <meta
          name="description"
          content="Compare Foundation Sprint, Essential, Growth, Scale, Maintenance Mode and Enterprise engagement options. Prices exclude VAT. Capacity includes multidisciplinary delivery work."
        />
        <link rel="canonical" href="https://uk.primewayz.com/pricing" />
        <meta property="og:title" content="Pricing & Engagement Options | Primewayz UK" />
        <meta
          property="og:description"
          content="Structured engagement models for UK SMEs — from Foundation Sprint discovery to recurring delivery capacity and maintenance support."
        />
        <meta property="og:url" content="https://uk.primewayz.com/pricing" />
        <script type="application/ld+json">{faqJsonLd}</script>
      </Helmet>
      <PricingPageContent />
    </main>
  );
};
