import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { evaluateUnlock, type CourseStanding } from '@/lib/learning/engine';
import type { Course } from '@/lib/learning/types';

const LearnCatalog = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [standing, setStanding] = useState<Record<string, CourseStanding>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate('/sandbox/login');
  }, [isLoading, user, navigate]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('courses').select('*').eq('status', 'published').order('level');
      const list = (c ?? []) as unknown as Course[];
      setCourses(list);
      if (user) {
        const { data: e } = await supabase.from('course_enrollments').select('course_id, status').eq('user_id', user.id);
        const s: Record<string, CourseStanding> = {};
        for (const row of (e ?? []) as { course_id: string; status: string }[]) {
          s[row.course_id] = row.status === 'completed' ? 'passed' : 'in_progress';
        }
        setStanding(s);
      }
      setLoading(false);
    })();
  }, [user]);

  const core = courses.filter((c) => c.course_type === 'core');
  const electives = courses.filter((c) => c.course_type === 'elective');

  const card = (c: Course) => {
    const { unlocked, missing } = evaluateUnlock(c, courses, standing);
    const state = standing[c.id];
    return (
      <div key={c.id} className="bg-card rounded-xl overflow-hidden shadow-soft flex flex-col">
        {c.cover_image_url && <img src={c.cover_image_url} alt="" loading="lazy" className="h-36 w-full object-cover" />}
        <div className="p-5 flex flex-col gap-3 flex-1" style={c.accent_color ? { borderTop: `3px solid ${c.accent_color}` } : undefined}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Level {c.level}</Badge>
            {c.track && <Badge variant="outline">{c.track}</Badge>}
            {state === 'passed' && <Badge>Completed</Badge>}
            {state === 'in_progress' && <Badge variant="outline">In progress</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>
          {c.description && <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>}
          <div className="mt-auto pt-2">
            {unlocked ? (
              <Link to={`/sandbox/${c.slug}`}>
                <Button className="w-full">{state ? 'Continue' : 'Start course'}</Button>
              </Link>
            ) : (
              <div className="text-sm text-muted-foreground flex items-start gap-2">
                <Lock size={15} className="mt-0.5 shrink-0" />
                <span>{missing.join(' · ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Courses</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Core courses build the fundamentals. Electives go deeper into a specific area once you have the core level behind you.
        </p>

        {loading ? (
          <p className="mt-10 text-muted-foreground">Loading courses…</p>
        ) : (
          <div className="mt-10 space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Core</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{core.map(card)}</div>
              {core.length === 0 && <p className="text-muted-foreground">No core courses published yet.</p>}
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Electives</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{electives.map(card)}</div>
              {electives.length === 0 && <p className="text-muted-foreground">No elective courses published yet.</p>}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LearnCatalog;
