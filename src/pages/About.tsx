import { Layout } from '@/components/layout/Layout';
import { WhoWeAreCarousel } from '@/components/home/WhoWeAreCarousel';
import { OurPeopleSection } from '@/components/home/OurPeopleSection';
import { MissionSection } from '@/components/home/MissionSection';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <Layout>
      {/* Hero Banner */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-green-50 to-green-100/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About FinLit
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover our mission, meet our team, and learn how we're transforming 
              financial literacy education across Zambia.
            </p>
          </motion.div>
        </div>
      </section>

      <WhoWeAreCarousel />
      <MissionSection />
      <OurPeopleSection />
    </Layout>
  );
};

export default About;
