import { Helmet } from 'react-helmet-async';
import { PricingPageContent } from './pricing/PricingPageContent';

export const Pricing = () => {
  return (
    <main className="bg-[#FBFCFE] text-brand-navy">
      <Helmet>
        <title>Pricing & Engagement Options | Primewayz UK</title>
        <meta
          name="description"
          content="Simple, transparent pricing for Foundation Sprint, Essential, Growth, Maintenance Mode and Enterprise. Compare plans, view details and continue with the route that fits your priorities."
        />
        <link rel="canonical" href="https://uk.primewayz.com/pricing" />
        <meta
          property="og:title"
          content="Pricing & Engagement Options | Primewayz UK"
        />
        <meta
          property="og:description"
          content="Compare structured engagement options for UK SMEs - from Foundation Sprint discovery to recurring delivery capacity and maintenance support."
        />
        <meta property="og:url" content="https://uk.primewayz.com/pricing" />
      </Helmet>

      <PricingPageContent />
    </main>
  );
};