import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { MissionSection } from '@/components/home/MissionSection';
import { BlogPreview } from '@/components/home/BlogPreview';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      <HeroCarousel />
      <MissionSection />
      <BlogPreview />
      <CTASection />
    </Layout>
  );
};

export default Index;
