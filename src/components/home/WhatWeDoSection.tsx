import { GraduationCap, BookOpen, Presentation, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const programs = [
  {
    icon: GraduationCap,
    title: 'School Programs',
    description: 'We deliver curriculum-aligned financial literacy lessons in primary and secondary schools throughout Zambia.',
    stats: '50+ Schools',
  },
  {
    icon: BookOpen,
    title: 'Educational Resources',
    description: 'We create workbooks, guides, and interactive materials that make learning about money engaging and fun.',
    stats: '1,000+ Resources',
  },
  {
    icon: Presentation,
    title: 'Teacher Training',
    description: 'We train educators to effectively integrate financial literacy into their teaching practice.',
    stats: '200+ Teachers',
  },
  {
    icon: Users,
    title: 'Club Facilitation',
    description: 'We support student-led FinLit clubs where young people practice and share financial skills.',
    stats: '30+ Clubs',
  },
];

export function WhatWeDoSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 opacity-0 animate-fade-up">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            What We Do
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Building Financial Literacy Across Zambia
          </h2>
          <p className="text-muted-foreground text-lg">
            Through our comprehensive programs, we're creating a generation of financially 
            literate young Zambians who can make informed decisions about their money.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {programs.map((program, index) => (
            <div 
              key={program.title}
              className={`bg-card rounded-2xl p-6 shadow-soft hover-lift text-center opacity-0 animate-fade-up`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <program.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{program.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
              <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
                {program.stats}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center opacity-0 animate-fade-up stagger-4">
          <Link to="/contact">
            <Button variant="hero" size="lg">
              Partner With Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
