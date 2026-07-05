import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RichText, stripHtml } from '@/components/ui/rich-text';
import { ArrowRight, Calendar, GraduationCap } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  is_accepting_applications: boolean;
  close_at: string | null;
}

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('programs')
      .select('id,title,slug,description,hero_image_url,is_accepting_applications,close_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPrograms(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <section className="bg-gradient-to-b from-green-50 to-background py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Programs</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore opportunities to learn, lead, and grow with FinLit. Apply to a program below.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No programs available at the moment. Please check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p) => (
                <div key={p.id} className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-lg transition-shadow flex flex-col">
                  {p.hero_image_url && (
                    <img src={p.hero_image_url} alt={p.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{stripHtml(p.description)}</p>
                    {p.close_at && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Calendar size={12} /> Closes {new Date(p.close_at).toLocaleDateString()}
                      </p>
                    )}
                    <Link to={`/programs/${p.slug}`} className="mt-4">
                      <Button className="w-full">
                        {p.is_accepting_applications ? 'Learn More & Apply' : 'View Program'}
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Programs;
