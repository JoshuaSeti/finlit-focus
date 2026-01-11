import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Target, Heart, Award, Lightbulb, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    icon: Users,
    title: 'Community Focused',
    description: 'We work directly with schools and communities across Zambia to create lasting impact through collaborative partnerships.',
    bgGradient: 'from-green-500/10 to-green-600/5',
  },
  {
    icon: Target,
    title: 'Youth Empowerment',
    description: 'We believe every young person deserves the knowledge to build a secure financial future and achieve their dreams.',
    bgGradient: 'from-green-400/10 to-green-500/5',
  },
  {
    icon: Heart,
    title: 'Passion Driven',
    description: 'Our team is dedicated to transforming lives through accessible, engaging financial education programs.',
    bgGradient: 'from-green-600/10 to-green-700/5',
  },
  {
    icon: Award,
    title: 'Excellence in Education',
    description: 'We deliver high-quality, research-backed curriculum tailored specifically for Zambian students.',
    bgGradient: 'from-green-500/10 to-green-400/5',
  },
  {
    icon: Lightbulb,
    title: 'Innovation First',
    description: 'We continuously develop new teaching methods and resources to make financial concepts accessible and memorable.',
    bgGradient: 'from-green-400/10 to-green-600/5',
  },
  {
    icon: Globe,
    title: 'Local Impact, Global Vision',
    description: 'While rooted in Zambia, our vision extends to creating financially empowered youth across Africa.',
    bgGradient: 'from-green-600/10 to-green-500/5',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
};

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 15, delay: 0.2 }
  },
  hover: { 
    scale: 1.1, 
    rotate: [0, -10, 10, 0],
    transition: { duration: 0.4 }
  },
};

const textVariants = {
  initial: { y: 20, opacity: 0 },
  animate: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.5 },
  }),
};

export function WhoWeAreCarousel() {
  const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const paginate = useCallback((newDirection: number) => {
    setCurrentIndex(([prev]) => {
      const nextIndex = prev + newDirection;
      if (nextIndex < 0) return [slides.length - 1, newDirection];
      if (nextIndex >= slides.length) return [0, newDirection];
      return [nextIndex, newDirection];
    });
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => paginate(1), 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, paginate]);

  const goToSlide = (index: number) => {
    const newDirection = index > currentIndex ? 1 : -1;
    setCurrentIndex([index, newDirection]);
  };

  const currentSlide = slides[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
              Who We Are
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Empowering Zambia's Youth Through Financial Literacy
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              FinLit is a non-profit organization founded with a singular mission: to equip young 
              Zambians with the financial knowledge and skills they need to thrive in today's economy. 
              We partner with schools, community organizations, and government institutions to deliver 
              comprehensive financial literacy programs.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our team of dedicated educators and financial experts work tirelessly to ensure that 
              every student we reach gains practical skills in budgeting, saving, investing, and 
              entrepreneurship—skills that will serve them throughout their lives.
            </p>
          </motion.div>

          {/* Carousel */}
          <div 
            className="relative"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Main Carousel Card */}
            <div className="relative h-[320px] flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                  }}
                  className={`absolute w-full bg-gradient-to-br ${currentSlide.bgGradient} bg-card rounded-3xl p-8 shadow-elevated`}
                >
                  <motion.div
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 cursor-pointer"
                  >
                    <IconComponent className="w-8 h-8 text-primary" />
                  </motion.div>
                  
                  <motion.h3 
                    variants={textVariants}
                    initial="initial"
                    animate="animate"
                    custom={0}
                    className="text-2xl font-bold text-foreground mb-4"
                  >
                    {currentSlide.title}
                  </motion.h3>
                  
                  <motion.p 
                    variants={textVariants}
                    initial="initial"
                    animate="animate"
                    custom={1}
                    className="text-muted-foreground leading-relaxed"
                  >
                    {currentSlide.description}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => paginate(-1)}
                className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              {/* Dots */}
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/50'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => paginate(1)}
                className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
