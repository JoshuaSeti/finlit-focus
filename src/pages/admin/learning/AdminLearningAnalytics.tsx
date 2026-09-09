import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface Row { user_id: string; course_id: string; field_id: string; state: string; star_rating: number | null; lessons_completed: number }

const AdminLearningAnalytics = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [fields, setFields] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [answers, setAnswers] = useState<{ question_id: string; is_correct: boolean }[]>([]);
  const [questions, setQuestions] = useState<{ id: string; tier: number; prompt: string; field_id: string }[]>([]);
  const [enrollments, setEnrollments] = useState<{ course_id: string; status: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [p, f, c, pr, a, q, e] = await Promise.all([
        supabase.from('field_progress').select('user_id, course_id, field_id, state, star_rating, lessons_completed'),
        supabase.from('skill_fields').select('id, name'),
        supabase.from('courses').select('id, title'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('question_answers').select('question_id, is_correct'),
        supabase.from('questions').select('id, tier, prompt, field_id'),
        supabase.from('course_enrollments').select('course_id, status'),
      ]);
      setRows((p.data ?? []) as unknown as Row[]);
      setFields((f.data ?? []) as { id: string; name: string }[]);
      setCourses((c.data ?? []) as { id: string; title: string }[]);
      setProfiles((pr.data ?? []) as { user_id: string; full_name: string; email: string }[]);
      setAnswers((a.data ?? []) as { question_id: string; is_correct: boolean }[]);
      setQuestions((q.data ?? []) as { id: string; tier: number; prompt: string; field_id: string }[]);
      setEnrollments((e.data ?? []) as { course_id: string; status: string }[]);
    })();
  }, []);

  const flags = useMemo(() => {
    const stats: Record<string, { asked: number; correct: number }> = {};
    for (const a of answers) {
      stats[a.question_id] ??= { asked: 0, correct: 0 };
      stats[a.question_id].asked += 1;
      if (a.is_correct) stats[a.question_id].correct += 1;
    }
    return questions
      .map((q) => ({ q, st: stats[q.id] }))
      .filter(({ q, st }) => st && st.asked >= 5 && ((q.tier === 1 && st.correct / st.asked < 0.5) || (q.tier === 3 && st.correct / st.asked > 0.9)))
      .map(({ q, st }) => ({ ...q, rate: Math.round((st!.correct / st!.asked) * 100), asked: st!.asked }));
  }, [answers, questions]);

  const usedFields = fields.filter((f) => rows.some((r) => r.field_id === f.id));
  const learners = profiles.filter((p) => rows.some((r) => r.user_id === p.user_id));

  const cell = (userId: string, fieldId: string) => {
    const r = rows.find((x) => x.user_id === userId && x.field_id === fieldId);
    if (!r) return { label: '—', cls: 'bg-muted text-muted-foreground' };
    const s = Number(r.star_rating ?? 0);
    const cls = r.state === 'passed' ? 'bg-primary text-primary-foreground' : s >= 2.5 ? 'bg-primary/40 text-foreground' : s > 0 ? 'bg-primary/15 text-foreground' : 'bg-muted text-muted-foreground';
    return { label: r.star_rating != null ? s.toFixed(1) : '·', cls };
  };

  const stalls = useMemo(() => {
    const map: Record<string, { open: number; passed: number; lessons: number }> = {};
    for (const r of rows) {
      const key = `${r.course_id}|${r.field_id}`;
      map[key] ??= { open: 0, passed: 0, lessons: 0 };
      if (r.state === 'passed') map[key].passed += 1;
      else map[key].open += 1;
      map[key].lessons += r.lessons_completed ?? 0;
    }
    return Object.entries(map)
      .map(([k, v]) => {
        const [courseId, fieldId] = k.split('|');
        return {
          course: courses.find((c) => c.id === courseId)?.title ?? '—',
          field: fields.find((f) => f.id === fieldId)?.name ?? '—',
          ...v,
        };
      })
      .sort((a, b) => b.open - a.open)
      .slice(0, 10);
  }, [rows, courses, fields]);

  const totals = {
    learners: learners.length,
    enrolments: enrollments.length,
    completions: enrollments.filter((e) => e.status === 'completed').length,
    skillsPassed: rows.filter((r) => r.state === 'passed').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning analytics</h1>
        <p className="text-muted-foreground">Mastery, stalling points and question quality — suitable for funder reporting.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active learners', value: totals.learners },
          { label: 'Course enrolments', value: totals.enrolments },
          { label: 'Courses completed', value: totals.completions },
          { label: 'Skills mastered', value: totals.skillsPassed },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-6 shadow-soft">
            <div className="text-3xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-soft overflow-x-auto">
        <h2 className="font-semibold text-foreground mb-4">Skill mastery heatmap</h2>
        {learners.length === 0 ? (
          <p className="text-sm text-muted-foreground">No learner activity yet.</p>
        ) : (
          <table className="text-sm">
            <thead>
              <tr>
                <th className="text-left pr-4 pb-2">Learner</th>
                {usedFields.map((f) => <th key={f.id} className="px-2 pb-2 text-left whitespace-nowrap">{f.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {learners.map((p) => (
                <tr key={p.user_id}>
                  <td className="pr-4 py-1 whitespace-nowrap">{p.full_name || p.email}</td>
                  {usedFields.map((f) => {
                    const c = cell(p.user_id, f.id);
                    return (
                      <td key={f.id} className="px-1 py-1">
                        <div className={`w-12 h-8 rounded flex items-center justify-center text-xs ${c.cls}`}>{c.label}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-soft space-y-2">
        <h2 className="font-semibold text-foreground mb-2">Where learners stall</h2>
        {stalls.length === 0 && <p className="text-sm text-muted-foreground">Not enough data yet.</p>}
        {stalls.map((s, i) => (
          <div key={i} className="flex justify-between text-sm border-b border-border pb-2">
            <span>{s.course} — {s.field}</span>
            <span className="text-muted-foreground">{s.open} still working · {s.passed} passed</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-soft space-y-2">
        <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Questions to review</h2>
        {flags.length === 0 && <p className="text-sm text-muted-foreground">No unusual question performance detected.</p>}
        {flags.map((f) => (
          <div key={f.id} className="text-sm border-b border-border pb-2">
            <p className="text-foreground">{f.prompt}</p>
            <p className="text-muted-foreground">
              <Badge variant="outline" className="mr-2">Tier {f.tier}</Badge>
              {f.rate}% correct across {f.asked} answers — the tier may be wrong.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLearningAnalytics;
