import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { starsLabel } from '@/lib/learning/engine';

interface Profile { user_id: string; full_name: string; email: string }
interface Progress { id: string; user_id: string; course_id: string; field_id: string; state: string; star_rating: number | null }
interface Enrollment { id: string; user_id: string; course_id: string; status: string }

const AdminLearners = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string; level: number }[]>([]);
  const [fields, setFields] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [openUser, setOpenUser] = useState<string | null>(null);

  const load = async () => {
    const [p, pr, e, c, f] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email'),
      supabase.from('field_progress').select('id, user_id, course_id, field_id, state, star_rating'),
      supabase.from('course_enrollments').select('id, user_id, course_id, status'),
      supabase.from('courses').select('id, title, level'),
      supabase.from('skill_fields').select('id, name'),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setProgress((pr.data ?? []) as unknown as Progress[]);
    setEnrollments((e.data ?? []) as Enrollment[]);
    setCourses((c.data ?? []) as { id: string; title: string; level: number }[]);
    setFields((f.data ?? []) as { id: string; name: string }[]);
  };

  useEffect(() => { load(); }, []);

  const markPassed = async (row: Progress) => {
    await supabase.from('field_progress').update({ state: 'passed', star_rating: 5, passed_at: new Date().toISOString() }).eq('id', row.id);
    toast({ title: 'Skill marked as passed' });
    load();
  };

  const resetField = async (row: Progress) => {
    await supabase.from('question_answers').delete().eq('user_id', row.user_id).eq('field_id', row.field_id).eq('course_id', row.course_id);
    await supabase.from('field_progress').update({ state: 'open', star_rating: null, lessons_since_check: 0, passed_at: null }).eq('id', row.id);
    toast({ title: 'Skill history reset' });
    load();
  };

  const unlockCourse = async (userId: string, courseId: string) => {
    const { error } = await supabase.from('course_enrollments').insert({ user_id: userId, course_id: courseId, status: 'in_progress' } as never);
    toast(error ? { title: 'Could not unlock', description: error.message, variant: 'destructive' } : { title: 'Course unlocked' });
    load();
  };

  const shown = profiles.filter(
    (p) => !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learners</h1>
        <p className="text-muted-foreground">Progress per course and skill, with manual overrides for support cases.</p>
      </div>
      <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="space-y-3">
        {shown.map((p) => {
          const mine = enrollments.filter((e) => e.user_id === p.user_id);
          const isOpen = openUser === p.user_id;
          return (
            <div key={p.user_id} className="bg-card rounded-xl p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-foreground">{p.full_name || p.email}</p>
                  <p className="text-sm text-muted-foreground">{p.email} · {mine.length} course(s)</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpenUser(isOpen ? null : p.user_id)}>
                  {isOpen ? 'Hide' : 'View progress'}
                </Button>
              </div>

              {isOpen && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  {mine.map((e) => {
                    const course = courses.find((c) => c.id === e.course_id);
                    const rows = progress.filter((r) => r.user_id === p.user_id && r.course_id === e.course_id);
                    return (
                      <div key={e.id} className="space-y-2">
                        <p className="font-medium text-foreground">
                          {course?.title ?? 'Course'} <Badge variant="secondary">{e.status === 'completed' ? 'Completed' : 'In progress'}</Badge>
                        </p>
                        {rows.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 flex-wrap text-sm rounded-lg border border-border p-2">
                            <span className="flex-1">{fields.find((f) => f.id === r.field_id)?.name}</span>
                            <Badge variant={r.state === 'passed' ? 'default' : 'secondary'}>{r.state}</Badge>
                            <span className="text-muted-foreground">{r.star_rating != null ? starsLabel(Number(r.star_rating)) : '—'}</span>
                            <Button size="sm" variant="ghost" onClick={() => markPassed(r)}>Mark passed</Button>
                            <Button size="sm" variant="ghost" onClick={() => resetField(r)}>Reset</Button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {courses
                      .filter((c) => !mine.some((e) => e.course_id === c.id))
                      .map((c) => (
                        <Button key={c.id} size="sm" variant="outline" onClick={() => unlockCourse(p.user_id, c.id)}>
                          Unlock {c.title}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-muted-foreground">No learners found.</p>}
      </div>
    </div>
  );
};

export default AdminLearners;
