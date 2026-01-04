import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string | null;
  background_image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
}

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching slides:', error);
    } else {
      setSlides(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    
    const timer = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  const nextSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  if (isLoading) {
    return (
      <section className="relative h-[90vh] min-h-[600px] bg-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-[90vh] min-h-[600px] bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to FinLit</h1>
          <p className="text-lg text-white/80">Empowering Youth Through Financial Education</p>
          <Link to="/contact" className="mt-6 inline-block">
            <Button variant="hero" size="lg">Get in Touch</Button>
          </Link>
        </div>
      </section>
    );
  }

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background Images */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: s.background_image_url 
                ? `url(${s.background_image_url})` 
                : 'linear-gradient(135deg, hsl(140 55% 24%) 0%, hsl(145 45% 16%) 100%)'
            }}
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
      ))}

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full">
        <div className="h-full flex items-center">
          <div className="max-w-3xl">
            <div 
              key={slide.id}
              className="space-y-6 animate-fade-up"
            >
              {slide.subtitle && (
                <span className="inline-block px-4 py-2 bg-primary/90 text-primary-foreground rounded-sm text-sm font-semibold uppercase tracking-wider">
                  {slide.subtitle}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {slide.title}
              </h1>
              <div className="flex flex-wrap gap-4 pt-4">
                {slide.cta_text && slide.cta_link && (
                  <Link to={slide.cta_link}>
                    <Button variant="hero" size="lg" className="text-base px-8">
                      {slide.cta_text}
                    </Button>
                  </Link>
                )}
                <Link to="/contact">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-base px-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground"
                  >
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          
          <div className="flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentSlide 
                    ? "w-10 bg-primary" 
                    : "w-2 bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
