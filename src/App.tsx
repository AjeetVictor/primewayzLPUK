import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
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
import { ContactForm } from './components/ContactForm';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { LiveChat } from './components/LiveChat';
import { AdminPanel } from './components/AdminPanel';
import { BlogPost } from './components/BlogPost';

const MainContent = () => (
  <main>
    <Hero />
    
    <Philosophy />
    
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1 }}
    >
      <HowItWorks />
    </motion.div>

    <InteractiveDemo />

    <TechStack />

    <Experience />
    
    <Stats />

    <Pricing />
    
    <FAQ />

    <SuccessStories />

    <Testimonials />

    <BlogSection />
    
    <ContactForm />
    
    <section className="py-24 bg-emerald-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-8"
        >
          Ready to plan your next <br />
          delivery phase?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-emerald-50 mb-12"
        >
          Start with Foundation Sprint, then move into the monthly delivery capacity
          that fits your roadmap.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <a 
            href="#contact"
            className="inline-block bg-white text-emerald-600 px-10 py-5 rounded-full text-xl font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20"
          >
            Book a UK discovery call
          </a>
        </motion.div>
      </div>
    </section>
  </main>
);

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {!isAdmin && <Navbar />}
      {!isAdmin && <ScrollToTop />}

      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/blog/:id" element={<BlogPost />} />
      </Routes>

      {!isAdmin && <Footer />}
      {!isAdmin && <LiveChat />}
    </div>
  );
}
