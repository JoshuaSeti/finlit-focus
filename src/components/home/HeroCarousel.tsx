import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockCarouselSlides, type CarouselSlide } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const slides = mockCarouselSlides.filter(slide => slide.active);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative min-h-[85vh] gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="min-h-[85vh] flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full py-16">
            {/* Content */}
            <div 
              key={slide.id}
              className="space-y-6 animate-fade-up"
            >
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {slide.subtitle}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                {slide.title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to={slide.ctaLink}>
                  <Button variant="hero" size="lg">
                    {slide.ctaText}
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="heroOutline" size="lg">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Element */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-primary/20 to-green-300/20 rounded-full flex items-center justify-center shadow-glow animate-float">
                  <div className="w-60 h-60 bg-card rounded-full shadow-elevated flex items-center justify-center">
                    <div className="text-center px-8">
                      <div className="text-5xl font-bold text-primary mb-2">10K+</div>
                      <div className="text-muted-foreground text-sm">Students Empowered</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center shadow-soft animate-float" style={{ animationDelay: '1s' }}>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">50+</div>
                    <div className="text-xs text-muted-foreground">Schools</div>
                  </div>
                </div>
                <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-green-600/10 rounded-2xl flex items-center justify-center shadow-soft animate-float" style={{ animationDelay: '3s' }}>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">2</div>
                    <div className="text-xs text-muted-foreground">Countries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-soft hover:bg-card transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "carousel-dot",
                index === currentSlide && "active"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-soft hover:bg-card transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={20} className="text-foreground" />
        </button>
      </div>
    </section>
  );
}
