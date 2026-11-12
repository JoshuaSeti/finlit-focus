import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { WhoWeAreCarousel } from '@/components/home/WhoWeAreCarousel';
import { WhatWeDoSection } from '@/components/home/WhatWeDoSection';
import { MissionSection } from '@/components/home/MissionSection';
import { BlogPreview } from '@/components/home/BlogPreview';
import { CTASection } from '@/components/home/CTASection';
import { WhatsNewSection } from '@/components/home/WhatsNewSection';

const SEEN_KEY = 'finlit2-launch-seen';

const Index = () => {
  const [showIntro, setShowIntro] = useState(() => {
    try { return !localStorage.getItem(SEEN_KEY); } catch { return false; }
  });
  useEffect(() => {
    if (!showIntro) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showIntro]);
  const enter = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setShowIntro(false);
    window.scrollTo({ top: 0 });
  };
  return (
    <Layout>
      <AnimatePresence>
        {showIntro && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-background" role="dialog" aria-label="Welcome to FinLit 2.0">
            <WhatsNewSection onEnter={enter} />
          </motion.div>
        )}
      </AnimatePresence>
      <HeroCarousel />
      <WhatsNewSection />
      <WhoWeAreCarousel />
      <WhatWeDoSection />
      <MissionSection />
      <BlogPreview />
      <CTASection />
    </Layout>
  );
};

export default Index;
