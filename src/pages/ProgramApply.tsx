import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichText } from '@/components/ui/rich-text';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ApplicationField } from '@/components/programs/ApplicationFieldBuilder';
import { ApplicationFormRenderer } from '@/components/programs/ApplicationFormRenderer';

interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  is_accepting_applications: boolean;
  application_fields: ApplicationField[];
  close_at: string | null;
}

const ProgramApply = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProgram({
            ...data,
            application_fields: (data.application_fields as unknown as ApplicationField[]) || [],
          });
        }
        setLoading(false);
      });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;

    for (const f of program.application_fields) {
      if (f.required && !responses[f.id]?.trim()) {
        toast({ title: `Please answer: ${f.label}`, variant: 'destructive' });
        return;
      }
    }

    setSubmitting(true);
    const { error } = await supabase.from('program_applications').insert({
      program_id: program.id,
      applicant_name: name,
      applicant_email: email,
      applicant_phone: phone || null,
      responses,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: 'Failed to submit application', description: error.message, variant: 'destructive' });
    } else {
      setSubmitted(true);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Program not found</h1>
          <Link to="/programs"><Button>Back to Programs</Button></Link>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3">Application received!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for applying to <strong>{program.title}</strong>. Our team will review your application and be in touch via email.
          </p>
          <Link to="/programs"><Button variant="outline">Back to Programs</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Link to="/programs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} /> All programs
          </Link>

          {program.hero_image_url && (
            <img src={program.hero_image_url} alt={program.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-8" />
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{program.title}</h1>
          {program.description && <RichText html={program.description} className="mb-10" />}

          <div className="border-t pt-10">
            {!program.is_accepting_applications ? (
              <div className="bg-muted/40 rounded-xl p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Applications are currently closed</h2>
                <p className="text-muted-foreground">Please check back later or contact us for more information.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-xl p-6 md:p-8 shadow-soft">
                <div>
                  <h2 className="text-2xl font-semibold mb-1">Apply now</h2>
                  <p className="text-sm text-muted-foreground">Fields marked with * are required.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Full name <span className="text-destructive">*</span></Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} />
                  </div>
                </div>

                <ApplicationFormRenderer
                  fields={program.application_fields}
                  values={responses}
                  onChange={setResponses}
                />

                <Button type="submit" disabled={submitting} size="lg" className="w-full">
                  {submitting ? 'Submitting…' : 'Submit application'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ProgramApply;
