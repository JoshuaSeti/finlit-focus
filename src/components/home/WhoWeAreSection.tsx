import { Users, Target, Heart, Award } from 'lucide-react';

const values = [
  {
    icon: Users,
    title: 'Community Focused',
    description: 'We work directly with schools and communities across Zambia to create lasting impact.',
  },
  {
    icon: Target,
    title: 'Youth Empowerment',
    description: 'We believe every young person deserves the knowledge to build a secure financial future.',
  },
  {
    icon: Heart,
    title: 'Passion Driven',
    description: 'Our team is dedicated to transforming lives through accessible financial education.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We deliver high-quality, research-backed curriculum tailored for Zambian students.',
  },
];

export function WhoWeAreSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="opacity-0 animate-fade-up">
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
          </div>

          {/* Values Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div 
                key={value.title}
                className={`bg-card rounded-2xl p-6 shadow-soft hover-lift opacity-0 animate-fade-up`}
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
