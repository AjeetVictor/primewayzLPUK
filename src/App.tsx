import { useEffect, useState, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UKTrustStrip } from './components/UKTrustStrip';
import { UKSmePainPoints } from './components/UKSmePainPoints';
import { ServicePathCards } from './components/ServicePathCards';
import { Philosophy } from './components/Philosophy';
import { HowItWorks } from './components/HowItWorks';
import { InteractiveDemo } from './components/InteractiveDemo';
import { TechStack } from './components/TechStack';
import { Stats } from './components/Stats';
import { Experience } from './components/Experience';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { Testimonials } from './components/Testimonials';
import { BlogSection } from './components/BlogSection';
import { SuccessStories } from './components/SuccessStories';
import { ContactBookingCta } from './components/ContactBookingCta';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { LazyLiveChat } from './components/LazyLiveChat';
import { AdminPanel } from './components/AdminPanel';
import { AdminMobileChat } from './components/AdminMobileChat';
import { AdminForgotPassword, AdminResetPassword } from './components/AdminPasswordReset';
import { BlogPost } from './components/BlogPost';
import { BlogListPage } from './components/blog/BlogListPage';
import type { BlogPost as BlogPostData } from './data/blog/types';
import LegalPage from './components/LegalPage';
import AnalyticsTracker from './components/AnalyticsTracker';
import { TrackedLink } from './components/common/TrackedLink';
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
import { ClientConfidenceSignals } from './components/ClientConfidenceSignals';
import { UkSmeDigitalVisibilityCheckerPage } from './components/UkSmeDigitalVisibilityCheckerPage';
import { WebPresenceAuditSharedReportPage } from './components/tools/WebPresenceAuditSharedReportPage';
import { WebPresenceAuditForm } from './components/tools/WebPresenceAuditForm';
import { CampaignLandingHandler } from './components/CampaignLandingHandler';
import { SelfAuditCta } from './components/SelfAuditCta';
import { RemoteItCapacitySection } from './components/sections/RemoteItCapacitySection';
import { RemoteItResourceAugmentationPage } from './components/RemoteItResourceAugmentationPage';
import { ContactRedirect } from './components/ContactRedirect';
import { BOOK_CALL_URL } from './constants/contactBooking';

// SSR-safe: use static path for logo
const logo = '/assets/primewayz-infotech-logo.svg';

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
};

const MainContent = () => (
  <main>
    <Hero />
    <UKTrustStrip />
    <ClientConfidenceSignals />
    <UKSmePainPoints />
    <SelfAuditCta
      variant="banner"
      utmContent="homepage_banner"
      ctaLocation="homepage_banner"
    />
    <WebPresenceAuditForm />
    <Philosophy />
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}>
      <HowItWorks />
    </motion.div>
    <InteractiveDemo />
    <TechStack />
    <Experience />
    <Stats />
    <ServicePathCards />
    <RemoteItCapacitySection />
    <Pricing />
    <FAQ />
    <SuccessStories />
    <Testimonials />
    <BlogSection />
    <ContactBookingCta />
    <section className="py-24 bg-emerald-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-8">
          Ready to plan your next <br /> delivery phase?
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-xl text-emerald-50 mb-12">
          Start with Foundation Sprint, then move into the monthly delivery capacity that fits your roadmap.
        </motion.p>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <TrackedLink
            href={BOOK_CALL_URL}
            ctaText="Book a UK discovery call"
            ctaLocation="final_cta"
            eventType="book_call_click_home"
            className="inline-block bg-white text-emerald-600 px-10 py-5 rounded-full text-xl font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20"
          >
            Book a UK discovery call
          </TrackedLink>
        </motion.div>
      </div>
    </section>
  </main>
);

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
      {showSiteChrome ? <Navbar /> : null}
      {showSiteChrome ? <ScrollToTop /> : null}

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
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactRedirect />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/remote-it-resource-augmentation" element={<RemoteItResourceAugmentationPage />} />
        <Route path="/web-presence-audit/report/:publicToken" element={<WebPresenceAuditSharedReportPage />} />
        <Route path="/software-development-subscription-uk" element={<SoftwareDevelopmentSubscriptionUkPage />} />
        <Route path="/website-maintenance-subscription-uk" element={<WebsiteMaintenanceSubscriptionUkPage />} />
        <Route path="/crm-integration-support-uk" element={<CrmIntegrationSupportUkPage />} />
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
