import { BookOpen, Users, Heart, Target } from 'lucide-react';

const highlights = [
  { icon: Users, label: 'Student-Centered Learning' },
  { icon: BookOpen, label: 'Partner Schools' },
  { icon: Heart, label: 'Community Impact' },
  { icon: Target, label: 'Goal-Oriented Programs' },
];

const features = [
  {
    title: 'Comprehensive Curriculum',
    description: 'Age-appropriate lessons covering budgeting, saving, investing, and entrepreneurship.',
  },
  {
    title: 'Trained Educators',
    description: 'Our team of certified trainers brings financial concepts to life in the classroom.',
  },
  {
    title: 'Real-World Application',
    description: 'Students practice their skills through simulations and hands-on activities.',
  },
  {
    title: 'Ongoing Support',
    description: 'We provide continuous resources and support to schools and students.',
  },
];

export function MissionSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission Statement */}
        <div className="text-center mb-16 opacity-0 animate-fade-up">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Our Mission
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Building Financially Literate Communities
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            FinLit empowers young people with the knowledge and skills they need to make informed 
            financial decisions, creating a foundation for lifelong financial wellness.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {highlights.map((highlight, index) => (
            <div 
              key={highlight.label}
              className={`bg-card rounded-2xl p-6 text-center shadow-soft hover-lift opacity-0 animate-fade-up stagger-${index + 1}`}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <highlight.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">{highlight.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`bg-card rounded-2xl p-8 shadow-soft hover-lift opacity-0 animate-fade-up stagger-${index + 1}`}
            >
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
