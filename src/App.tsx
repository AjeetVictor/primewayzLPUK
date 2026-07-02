import { useEffect, useState, type ReactNode } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UKTrustStrip } from './components/UKTrustStrip';
import { WebsiteProblemSection } from './components/sections/WebsiteProblemSection';
import { OutcomePillarsSection } from './components/sections/OutcomePillarsSection';
import { TrustPillarSection } from './components/sections/TrustPillarSection';
import { EnquiriesPillarSection } from './components/sections/EnquiriesPillarSection';
import { ServiceRoutesSection } from './components/sections/ServiceRoutesSection';
import { MonthlySupportRhythmSection } from './components/sections/MonthlySupportRhythmSection';
import { AuditLedProcessSection } from './components/sections/AuditLedProcessSection';
import { WhatWeReviewFirstSection } from './components/sections/WhatWeReviewFirstSection';
import { CommercialClaritySection } from './components/sections/CommercialClaritySection';
import { InsightsSection } from './components/sections/InsightsSection';
import { HomepageContactSection } from './components/sections/HomepageContactSection';
import { RemoteItCapacitySection } from './components/sections/RemoteItCapacitySection';
import { Philosophy } from './components/Philosophy';
import { HowItWorks } from './components/HowItWorks';
import { TechStack } from './components/TechStack';
import { FAQ } from './components/FAQ';
import { SuccessStories } from './components/SuccessStories';
import { Footer } from './components/Footer';
import { ScrollToTop, ScrollToTopButton } from './components/ScrollToTop';
import { LazyLiveChat } from './components/LazyLiveChat';
import { AdminPanel } from './components/AdminPanel';
import { AdminMobileChat } from './components/AdminMobileChat';
import { AdminForgotPassword, AdminResetPassword } from './components/AdminPasswordReset';
import { BlogPost } from './components/BlogPost';
import { BlogListPage } from './components/blog/BlogListPage';
import type { BlogPost as BlogPostData } from './data/blog/types';
import LegalPage from './components/LegalPage';
import AnalyticsTracker from './components/AnalyticsTracker';
import { SoftwareDevelopmentSubscriptionUkPage } from './components/SoftwareDevelopmentSubscriptionUkPage';
import { WebsiteMaintenanceSubscriptionUkPage } from './components/WebsiteMaintenanceSubscriptionUkPage';
import { CrmIntegrationSupportUkPage } from './components/CrmIntegrationSupportUkPage';
import { ProfessionalServicesCrmSupportUkPage } from './components/ProfessionalServicesCrmSupportUkPage';
import { ServicesPage } from './components/ServicesPage';
import { LocalTradesLeadCapturePage } from './components/LocalTradesLeadCapturePage';
import { ProfessionalServicesCrmCleanupPage } from './components/ProfessionalServicesCrmCleanupPage';
import { EcommerceStoreStabilitySupportPage } from './components/EcommerceStoreStabilitySupportPage';
import { SuccessStoriesPage } from './components/SuccessStoriesPage';
import { AboutUsPage } from './components/AboutUsPage';
import { ContactUsPage } from './components/ContactUsPage';
import { UkSmeDigitalVisibilityCheckerPage } from './components/UkSmeDigitalVisibilityCheckerPage';
import { WebPresenceAuditSharedReportPage } from './components/tools/WebPresenceAuditSharedReportPage';
import { CampaignLandingHandler } from './components/CampaignLandingHandler';
import { RemoteItResourceAugmentationPage } from './components/RemoteItResourceAugmentationPage';
import { ContactRedirect } from './components/ContactRedirect';
import { Pricing } from './components/Pricing';
import { useRevealMotion } from './hooks/useRevealMotion';

// SSR-safe: use static path for logo
const logo = '/assets/primewayz-infotech-logo.svg';

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
};

const MainContent = () => {
  const reveal = useRevealMotion();

  return (
  <main>
    <Hero />
    <UKTrustStrip />
    <WebsiteProblemSection />
    <OutcomePillarsSection />
    <TrustPillarSection />
    <EnquiriesPillarSection />
    <ServiceRoutesSection />
    <MonthlySupportRhythmSection />
    <AuditLedProcessSection />
    <WhatWeReviewFirstSection />
    <CommercialClaritySection />
    <InsightsSection />
    <Philosophy />
    <motion.div initial={reveal.initial({ opacity: 0 })} whileInView={reveal.whileInView({ opacity: 1 })} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}>
      <HowItWorks />
    </motion.div>
    <TechStack />
    <RemoteItCapacitySection />
    <FAQ />
    <SuccessStories />
    <HomepageContactSection />
  </main>
  );
};

export type InitialAppData = {
  blogPosts?: BlogPostData[];
  blogPost?: BlogPostData | null;
};

type AppProps = {
  initialData?: InitialAppData;
};

export const App = ({ initialData }: AppProps) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isSharedAuditReport = location.pathname.startsWith('/web-presence-audit/report/');
  const showSiteChrome = !isAdmin && !isSharedAuditReport;

  return (
    <div className="relative min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <AnalyticsTracker />
      <CampaignLandingHandler />
      <ScrollToTop />
      {showSiteChrome ? <Navbar /> : null}
      {showSiteChrome ? <ScrollToTopButton /> : null}

      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/chat" element={<AdminMobileChat />} />
        <Route path="/admin/mobile-chat" element={<AdminMobileChat />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/blog" element={<BlogListPage initialPosts={initialData?.blogPosts} />} />
        <Route path="/blog/:id" element={<BlogPost initialPost={initialData?.blogPost} />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/uk-sme-digital-visibility-checker" element={<UkSmeDigitalVisibilityCheckerPage />} />
        <Route path="/website-visibility-support" element={<WebsiteMaintenanceSubscriptionUkPage />} />
        <Route path="/maintenance" element={<WebsiteMaintenanceSubscriptionUkPage />} />
        <Route path="/crm-automation-support" element={<CrmIntegrationSupportUkPage />} />
        <Route path="/software-product-delivery" element={<SoftwareDevelopmentSubscriptionUkPage />} />
        <Route path="/remote-it-resources" element={<RemoteItResourceAugmentationPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/about" element={<Navigate to="/about-us" replace />} />
        <Route path="/contact" element={<ContactRedirect />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/website-maintenance-subscription-uk" element={<Navigate to="/maintenance" replace />} />
        <Route path="/remote-it-resource-augmentation" element={<Navigate to="/remote-it-resources" replace />} />
        <Route path="/web-presence-audit/report/:publicToken" element={<WebPresenceAuditSharedReportPage />} />
        <Route path="/software-development-subscription-uk" element={<Navigate to="/software-product-delivery" replace />} />
        <Route path="/crm-integration-support-uk" element={<Navigate to="/crm-automation-support" replace />} />
        <Route path="/professional-services-crm-support-uk" element={<ProfessionalServicesCrmSupportUkPage />} />
        <Route path="/success-stories" element={<SuccessStoriesPage />} />
        <Route path="/success-stories/local-trades-lead-capture" element={<LocalTradesLeadCapturePage />} />
        <Route path="/success-stories/professional-services-crm-cleanup" element={<ProfessionalServicesCrmCleanupPage />} />
        <Route path="/success-stories/ecommerce-store-stability-support" element={<EcommerceStoreStabilitySupportPage />} />
        <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
        <Route path="/terms-of-service" element={<LegalPage type="terms" />} />
        <Route path="/cookie-policy" element={<LegalPage type="cookies" />} />
      </Routes>

      {!showSiteChrome ? null : <Footer />}
      {showSiteChrome ? <ClientOnly><LazyLiveChat /></ClientOnly> : null}
    </div>
  );
};

export default App;
