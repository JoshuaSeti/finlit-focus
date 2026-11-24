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
  Sparkles 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { BlogPreview } from '@/components/home/BlogPreview';
import { Button } from '@/components/ui/button';

const learningSteps = [
  {
    step: '01',
    icon: Compass,
    title: 'Free Placement Diagnostic',
    description: '15 quick, practical questions to pinpoint your financial knowledge baseline and recommend your starting lesson.',
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

const Index = () => {
  return (
    <Layout>
      {/* 1. Hero Visual Centerpiece */}
      <HeroCarousel />

      {/* 2. Primary Focus: Digital Learning Pathway */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Core Learning Journey
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Master your money in three steps
            </h2>
            <p className="mt-3 text-muted-foreground text-base md:text-lg">
              Start with a diagnostic, master bite-sized modules, and practice risk-free in the character simulator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {learningSteps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-card rounded-2xl p-7 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono font-bold tracking-wider text-muted-foreground">
                      STEP {item.step}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {item.tag}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <Link to={item.href}>
                  <Button variant="outline" className="w-full group">
                    {item.ctaText}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Secondary Focus: FinLit Clubs & School Chapters */}
      <section className="py-16 bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Grassroots Movement
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-2 mb-4">
                FinLit Clubs in schools and communities
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Beyond our digital platform, we partner with educators and youth leaders across Zambia to form peer-led finance clubs with real-life activities and community savings circles.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/programs">
                  <Button>Start a Club</Button>
                </Link>
                <Link to="/facilitator/login">
                  <Button variant="ghost">Facilitator Portal</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {clubHighlights.map((club) => (
                <div key={club.title} className="bg-card p-5 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <club.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{club.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{club.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Latest Insights & Community Updates */}
      <BlogPreview />

      {/* 5. Minimal Bottom Call to Action */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
            Take control of your financial future
          </h3>
          <p className="text-muted-foreground mb-8 text-base">
            Join thousands of Zambians developing lifelong money skills today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/diagnostic">
              <Button size="lg" className="rounded-full px-8">
                Take the Placement Test
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
