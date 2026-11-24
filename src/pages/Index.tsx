import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Compass, 
  BookOpen, 
  Gamepad2, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Smartphone,
  Wallet
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { WhoWeAreCarousel } from '@/components/home/WhoWeAreCarousel';
import { BlogPreview } from '@/components/home/BlogPreview';
import { CTASection } from '@/components/home/CTASection';
import { Button } from '@/components/ui/button';

const clubHighlights = [
  {
    icon: Users,
    title: 'School Chapters',
    description: 'Student-led clubs across secondary schools running weekly money circles and practical budget exercises.',
  },
  {
    icon: GraduationCap,
    title: 'Facilitator Toolkits',
    description: 'Structured lesson plans, discussion rubrics, and print guides for teachers and club leaders.',
  },
  {
    icon: ShieldCheck,
    title: 'Community Cohorts',
    description: 'Grassroots youth and women group workshops across Lusaka and Copperbelt communities.',
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'simulator'>('diagnostic');
  const [diagnosticChoice, setDiagnosticChoice] = useState<number | null>(null);
  const [simChoice, setSimChoice] = useState<number | null>(null);

  return (
    <Layout>
      {/* 1. Main Hero Carousel */}
      <HeroCarousel />

      {/* 2. Primary Priority: Interactive Digital Learning Showcase */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-background border-b border-border/40">
        {/* Subtle background ambient glow */}
        <div 
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-primary/10 rounded-full blur-[130px] -z-10" 
          aria-hidden="true" 
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Editorial Section Header (No generic AI sparkles or split gradients) */}
          <motion.div 
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mb-14"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-primary/90 font-mono">
              The Learning Platform
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mt-2 mb-4 leading-[1.15]">
              Real Zambian money choices. <br />
              Zero financial risk.
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              Skip generic advice. FinLit tests where you stand, guides you through practical local modules, 
              and lets you run life decisions through our interactive Yungsta character simulator.
            </p>
          </motion.div>

          {/* Interactive Showcase: Device / Question Simulator (Left) + Learning Steps (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
            
            {/* Interactive Preview Widget (7 cols on desktop) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 bg-card rounded-3xl border border-border/80 shadow-xl overflow-hidden"
            >
              {/* Tab Selector Header */}
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 p-3 sm:p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('diagnostic')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === 'diagnostic'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-primary" />
                    Diagnostic Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === 'simulator'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4 text-primary" />
                    Yungsta Simulator
                  </button>
                </div>

                <span className="hidden sm:inline-block text-[11px] font-mono font-medium text-muted-foreground px-2.5 py-1 rounded-md bg-background/60">
                  Interactive Preview
                </span>
              </div>

              {/* Dynamic Screen Area */}
              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'diagnostic' ? (
                    <motion.div
                      key="diagnostic-view"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                          Scenario Check • Question 04 of 15
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          Habit Assessment
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 leading-snug">
                        It’s 5 days to payday. You have K450 left on Airtel Money. A relative calls asking for K300 urgent transport assistance. What do you do?
                      </h3>

                      <p className="text-xs text-muted-foreground mb-6">
                        Select a response to test our trait mapping system:
                      </p>

                      <div className="space-y-3 mb-6">
                        {[
                          { id: 1, label: 'Send the K300 immediately without asking questions.', note: 'High Generosity (GEN) • Increases month-end Kaloba vulnerability' },
                          { id: 2, label: 'Explain your balance, offer K100, and protect your essentials.', note: 'High Planning (PLN) • Protects cash reserve while helping responsibly' },
                          { id: 3, label: 'Apologize and decline, keeping the K450 for emergencies.', note: 'High Savings Discipline (SAV) • Low scam & pressure vulnerability' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setDiagnosticChoice(opt.id)}
                            className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 ${
                              diagnosticChoice === opt.id
                                ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                                : 'border-border/70 bg-card hover:bg-muted/30 text-foreground'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                                diagnosticChoice === opt.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                              }`}>
                                {String.fromCharCode(64 + opt.id)}
                              </span>
                              <div>
                                <p className="font-medium leading-snug">{opt.label}</p>
                                {diagnosticChoice === opt.id && (
                                  <motion.p 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-2 text-xs font-mono font-semibold text-primary"
                                  >
                                    → Archetype Impact: {opt.note}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">
                          Takes 4 minutes • Unlocks your recommended free lesson
                        </span>
                        <Link to="/diagnostic">
                          <Button className="rounded-full font-semibold">
                            Take Free Placement Diagnostic <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="simulator-view"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Character HUD Strip */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3.5 rounded-2xl bg-muted/60 border border-border/60 mb-6">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block">Player</span>
                          <span className="text-xs sm:text-sm font-bold text-foreground">Mwamba (Age 20)</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block">Cash Balance</span>
                          <span className="text-xs sm:text-sm font-mono font-bold text-primary">K 1,420.00</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground block">Stress Level</span>
                          <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">28% (Low)</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 mb-5">
                        <span className="text-[11px] font-mono font-semibold text-primary uppercase tracking-wide block mb-1">
                          Current Event Dilemma
                        </span>
                        <h4 className="font-bold text-foreground text-base sm:text-lg mb-2">
                          A friend offers you a wholesale box of school calculators for K600, with estimated resale of K1,100 at Soweto Market.
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Your K500 room rent is due in 3 days. What is your move?
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <button
                          onClick={() => setSimChoice(1)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                            simChoice === 1
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-border/80 bg-card hover:bg-muted/40'
                          }`}
                        >
                          <span className="font-bold block text-foreground mb-1">A. Buy the stock (K600)</span>
                          <span className="text-muted-foreground">High risk: If sales are slow, you will miss rent and face penalties.</span>
                        </button>
                        <button
                          onClick={() => setSimChoice(2)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                            simChoice === 2
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-border/80 bg-card hover:bg-muted/40'
                          }`}
                        >
                          <span className="font-bold block text-foreground mb-1">B. Lock rent money first</span>
                          <span className="text-muted-foreground">Prudent: Secure housing first, then invest remaining K320 in lower risk.</span>
                        </button>
                      </div>

                      <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">
                          Includes ventures, Kaloba debt negotiation, and life choices
                        </span>
                        <Link to="/sim">
                          <Button variant="secondary" className="rounded-full font-semibold">
                            Enter Yungsta Simulator <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Pathway Breakdown (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-foreground text-base">Free Placement Diagnostic</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                  15 quick scenario questions evaluate your real-world money habits across 6 key traits and instantly unlock your first free tailored lesson.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-foreground text-base">Practical Zambian Lessons</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                  Bite-sized, offline-capable lessons tackling local realities—mobile money fees, managing peer pressure, side-hustle cash flow, and avoiding debt traps.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-foreground text-base">Yungsta Life Simulator</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                  Test your decision-making in a dynamic character simulator where decisions compound, emergencies happen, and good habits unlock ventures.
                </p>
              </div>

              <div className="pt-2 pl-2">
                <Link to="/modules">
                  <Button variant="outline" className="w-full rounded-full py-6 font-semibold justify-between">
                    Browse All Learning Modules <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Who We Are Animated Mini-Carousel (Restored in full) */}
      <WhoWeAreCarousel />

      {/* 4. Priority #2: FinLit Clubs & Schools (30% emphasis) */}
      <section className="py-20 bg-muted/30 border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
            >
              <div>
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-mono">
                  Ground Chapters
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
                  FinLit Clubs & Schools
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl text-sm md:text-base leading-relaxed">
                  Peer-led chapters, school partnerships, and facilitator tools bringing financial literacy to classrooms across Zambia.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clubHighlights.map((club, idx) => {
                const Icon = club.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-foreground text-base mb-2">{club.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{club.description}</p>
                  </motion.div>
                );
              })}
            </div>
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
