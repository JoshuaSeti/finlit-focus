import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { WhoWeAreCarousel } from '@/components/home/WhoWeAreCarousel';
import { WhatWeDoSection } from '@/components/home/WhatWeDoSection';
import { MissionSection } from '@/components/home/MissionSection';
import { BlogPreview } from '@/components/home/BlogPreview';
import { CTASection } from '@/components/home/CTASection';
import { WhatsNewSection } from '@/components/home/WhatsNewSection';

const Index = () => {
  return (
    <Layout>
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
