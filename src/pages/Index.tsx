import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Compass, 
  BookOpen, 
  Gamepad2, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles,
  Award
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { WhoWeAreCarousel } from '@/components/home/WhoWeAreCarousel';
import { BlogPreview } from '@/components/home/BlogPreview';
import { CTASection } from '@/components/home/CTASection';
import { Button } from '@/components/ui/button';

const learningSteps = [
  {
    step: '01',
    icon: Compass,
    title: 'Free Placement Diagnostic',
    description: '15 quick, practical questions to pinpoint your financial knowledge baseline, map your money habits, and recommend your starting lesson.',
    href: '/diagnostic',
    ctaText: 'Start Diagnostic',
    tag: 'Free for everyone',
  },
  {
    step: '02',
    icon: BookOpen,
    title: 'Practical Zambian Lessons',
    description: 'Bite-sized modules built around relatable local realities—budgeting, savings, mobile money, and managing debt.',
    href: '/modules',
    ctaText: 'Explore Lessons',
    tag: 'Mobile friendly',
  },
  {
    step: '03',
    icon: Gamepad2,
    title: 'Yungsta Life Simulator',
    description: 'Put your money skills to the test with real-world scenarios, business ventures, and Kaloba risk decisions.',
    href: '/sim',
    ctaText: 'Open Simulator',
    tag: 'Interactive practice',
  },
];

const clubHighlights = [
  {
    icon: Users,
    title: 'School Chapters',
    description: 'Student-led clubs across secondary schools running weekly challenges and peer money circles.',
  },
  {
    icon: GraduationCap,
    title: 'Facilitator Resources',
    description: 'Structured curricula, discussion guides, and teaching toolkits for teachers and club leaders.',
  },
  {
    icon: ShieldCheck,
    title: 'Community Programs',
    description: 'Youth group workshops and community empowerment cohorts across Lusaka and the Copperbelt.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: 'easeOut' } 
  }
};

const Index = () => {
  return (
    <Layout>
      {/* 1. Main Hero Carousel */}
      <HeroCarousel />

      {/* 2. Priority #1: The Digital Learning Platform (70% emphasis) */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/20 to-background border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Digital Learning Platform
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Learn Money Skills. <br className="hidden sm:inline" />
              <span className="text-primary">Tested in Real Life.</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Start with a free diagnostic to find your level, learn practical Zambian finance concepts, 
              and practice choices risk-free in the Yungsta character simulator.
            </p>
          </motion.div>

          {/* 3 Step Interactive Learning Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12"
          >
            {learningSteps.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="relative group bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-3xl font-extrabold text-primary/30 group-hover:text-primary transition-colors">
                        {item.step}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {item.tag}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  <Link to={item.href} className="mt-auto">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      {item.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center"
          >
            <Link to="/diagnostic">
              <Button size="lg" className="rounded-full px-8 py-6 text-base font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                Start with your free diagnostic <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3. Who We Are Animated Mini-Carousel */}
      <WhoWeAreCarousel />

      {/* 4. Priority #2: FinLit Clubs & Schools (30% emphasis) */}
      <section className="py-20 bg-muted/40 border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
            >
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold tracking-wide uppercase mb-3">
                  On the Ground
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  FinLit Clubs & Schools
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl text-sm md:text-base">
                  Peer-led chapters, school partnerships, and facilitator tools bringing financial education to classrooms across Zambia.
                </p>
              </div>
              <div className="flex gap-3">
                <Link to="/programs">
                  <Button variant="outline" className="rounded-full">
                    Explore Programs
                  </Button>
                </Link>
                <Link to="/facilitator/login">
                  <Button variant="secondary" className="rounded-full">
                    Facilitator Portal
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {clubHighlights.map((club, idx) => {
                const Icon = club.icon;
                return (
                  <motion.div 
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-foreground text-base mb-2">{club.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{club.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. Latest Insights / Blog Preview */}
      <BlogPreview />

      {/* 6. Call to Action Banner */}
      <CTASection />
    </Layout>
  );
};

export default Index;
