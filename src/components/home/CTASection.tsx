import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 bg-green-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-green-400 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-green-50 mb-6 opacity-0 animate-fade-up">
            Bring Financial Literacy to Your School
          </h2>
          <p className="text-lg text-green-200 mb-8 opacity-0 animate-fade-up stagger-1">
            Partner with FinLit to provide your students with essential financial skills. 
            Our programs are designed to fit seamlessly into your curriculum.
          </p>
          <div className="flex flex-wrap justify-center gap-4 opacity-0 animate-fade-up stagger-2">
            <Link to="/contact">
              <Button 
                size="lg" 
                className="bg-green-50 text-green-800 hover:bg-green-100 hover:scale-[1.02] transition-all duration-300"
              >
                Request Information <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            <Link to="/resources">
              <Button 
                size="lg" 
                variant="outline"
                className="border-green-200 text-green-50 hover:bg-green-700 hover:border-green-300"
              >
                View Resources
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
