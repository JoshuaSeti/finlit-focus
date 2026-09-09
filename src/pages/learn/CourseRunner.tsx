import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichText } from '@/components/ui/rich-text';
import { ArrowLeft, CheckCircle2, Star, WifiOff } from 'lucide-react';
import {
  DEFAULT_SETTINGS,
  START_TIER,
  evaluatePass,
  nextTier,
  pickQuestion,
  resolveSettings,
  scoreAnswers,
} from '@/lib/learning/engine';
import type { AnsweredItem, Course, EngineSettings, Question, SkillField } from '@/lib/learning/types';
import { flushQueue, pendingCount, saveRow } from '@/lib/learning/offlineQueue';

interface Lesson {
  id: string;
  title: string;
  field_id: string;
  template: string;
  blocks: { type: string; value: string }[];
  position: number;
  comprehension_enabled: boolean | null;
  comprehension_count: number | null;
}
interface Progress {
  id: string;
  field_id: string;
  state: string;
  star_rating: number | null;
  lessons_since_check: number;
  lessons_completed: number;
  queue_position: number;
}

type Phase = 'loading' | 'intro' | 'diagnostic' | 'lesson' | 'check' | 'summary' | 'complete';

interface CheckSession {
  kind: 'diagnostic' | 'field_check' | 'lesson_check' | 'refresher';
  fieldIds: string[];
  fieldIdx: number;
  perField: number;
  askedInField: number;
  tier: number;
  current: Question | null;
  usedIds: Set<string>;
  items: Record<string, AnsweredItem[]>;
  lessonId?: string;
  checkId?: string;
  picked: number | null;
}

const CourseRunner = () => {
  const { slug } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [course, setCourse] = useState<Course | null>(null);
  const [fields, setFields] = useState<SkillField[]>([]);
  const [courseFields, setCourseFields] = useState<{ field_id: string; position: number }[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<EngineSettings | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; diagnostic_done: boolean; status: string; field_queue: string[] } | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [session, setSession] = useState<CheckSession | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [summary, setSummary] = useState<{ title: string; lines: string[] } | null>(null);
  const [offline, setOffline] = useState(pendingCount() > 0);

  const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? 'Skill';

  const load = useCallback(async () => {
    if (!user) return;
    const { data: c } = await supabase.from('courses').select('*').eq('slug', slug!).maybeSingle();
    if (!c) return setPhase('complete');
    const courseRow = c as unknown as Course;
    const [f, cf, ls, gs] = await Promise.all([
      supabase.from('skill_fields').select('*'),
      supabase.from('course_fields').select('field_id, position').eq('course_id', courseRow.id).order('position'),
      supabase.from('course_lessons').select('*').eq('course_id', courseRow.id).eq('status', 'published').order('position'),
      supabase.from('engine_settings').select('*').limit(1).maybeSingle(),
    ]);
    const cfRows = (cf.data ?? []) as { field_id: string; position: number }[];
    const fieldIds = cfRows.map((r) => r.field_id);
    const { data: qs } = fieldIds.length
      ? await supabase.from('questions').select('*').in('field_id', fieldIds).eq('status', 'published')
      : { data: [] };

    let { data: enr } = await supabase
      .from('course_enrollments')
      .select('id, diagnostic_done, status, field_queue')
      .eq('course_id', courseRow.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!enr) {
      const ins = await supabase
        .from('course_enrollments')
        .insert({ user_id: user.id, course_id: courseRow.id, status: 'in_progress', field_queue: fieldIds as never })
        .select('id, diagnostic_done, status, field_queue')
        .maybeSingle();
      enr = ins.data;
      if (enr) {
        await supabase.from('field_progress').insert(
          cfRows.map((r, i) => ({
            user_id: user.id,
            course_id: courseRow.id,
            field_id: r.field_id,
            state: 'open',
            queue_position: i,
          })) as never,
        );
      }
    }

    const [pg, lc] = await Promise.all([
      supabase.from('field_progress').select('*').eq('course_id', courseRow.id).eq('user_id', user.id).order('queue_position'),
      supabase.from('lesson_completions').select('lesson_id').eq('course_id', courseRow.id).eq('user_id', user.id),
    ]);

    setCourse(courseRow);
    setFields((f.data ?? []) as SkillField[]);
    setCourseFields(cfRows);
    setLessons((ls.data ?? []) as unknown as Lesson[]);
    setQuestions((qs ?? []) as unknown as Question[]);
    setSettings(resolveSettings({ ...DEFAULT_SETTINGS, ...(gs.data ?? {}) } as EngineSettings, courseRow.settings_override));
    setEnrollment(enr as never);
    setProgress((pg.data ?? []) as unknown as Progress[]);
    setCompleted(((lc.data ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id));
    setPhase('intro');
  }, [slug, user]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/sandbox/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    flushQueue().then(() => setOffline(pendingCount() > 0));
    load();
  }, [load]);

  /* --------------------------- recent answers --------------------------- */
  const recentSeen = useCallback(
    async (fieldId: string) => {
      if (!user || !course || !settings) return new Set<string>();
      const { data } = await supabase
        .from('question_answers')
        .select('question_id, check_id')
        .eq('user_id', user.id)
        .eq('field_id', fieldId)
        .order('created_at', { ascending: false })
        .limit(settings.repeat_avoid_checks * settings.check_length);
      return new Set(((data ?? []) as { question_id: string }[]).map((r) => r.question_id));
    },
    [user, course, settings],
  );

  /* ------------------------------ sessions ------------------------------ */
  const startSession = async (
    kind: CheckSession['kind'],
    fieldIds: string[],
    perField: number,
    lessonId?: string,
  ) => {
    if (!user || !course || !settings) return;
    const { data } = await supabase
      .from('assessment_checks')
      .insert({
        user_id: user.id,
        course_id: course.id,
        field_id: fieldIds.length === 1 ? fieldIds[0] : null,
        lesson_id: lessonId ?? null,
        kind,
        length: perField * fieldIds.length,
        results: {} as never,
      })
      .select('id')
      .maybeSingle();

    const exclude = await recentSeen(fieldIds[0]);
    const pool = lessonId ? questions.filter((q) => q.lesson_id === lessonId) : questions;
    const first = pickQuestion(pool, fieldIds[0], START_TIER, exclude, new Set());
    if (!first) {
      setSummary({ title: 'Not ready yet', lines: ['There are no questions for this skill yet. Please check back soon.'] });
      return setPhase('summary');
    }
    setSession({
      kind,
      fieldIds,
      fieldIdx: 0,
      perField,
      askedInField: 0,
      tier: START_TIER,
      current: first,
      usedIds: new Set([first.id]),
      items: {},
      lessonId,
      checkId: data?.id,
      picked: null,
    });
    setPhase(kind === 'diagnostic' ? 'diagnostic' : 'check');
  };

  const answer = async (index: number) => {
    if (!session?.current || session.picked !== null || !user || !course || !settings) return;
    const q = session.current;
    const isCorrect = index === q.correct_index;
    setSession({ ...session, picked: index });
    await saveRow('question_answers', {
      user_id: user.id,
      question_id: q.id,
      check_id: session.checkId ?? null,
      course_id: course.id,
      field_id: q.field_id,
      kind: session.kind,
      tier: q.tier,
      selected_index: index,
      is_correct: isCorrect,
      counts_toward_mastery: session.kind === 'lesson_check' ? settings.lesson_checks_count_toward_mastery : true,
    });
    setOffline(pendingCount() > 0);
  };

  const advance = async () => {
    if (!session?.current || session.picked === null || !settings) return;
    const q = session.current;
    const isCorrect = session.picked === q.correct_index;
    const fieldId = session.fieldIds[session.fieldIdx];
    const items = { ...session.items, [fieldId]: [...(session.items[fieldId] ?? []), { tier: q.tier, is_correct: isCorrect }] };
    const askedInField = session.askedInField + 1;

    if (askedInField >= session.perField) {
      const nextIdx = session.fieldIdx + 1;
      if (nextIdx >= session.fieldIds.length) return finishSession({ ...session, items });
      const exclude = await recentSeen(session.fieldIds[nextIdx]);
      const nq = pickQuestion(questions, session.fieldIds[nextIdx], START_TIER, exclude, new Set());
      if (!nq) return finishSession({ ...session, items });
      return setSession({
        ...session,
        items,
        fieldIdx: nextIdx,
        askedInField: 0,
        tier: START_TIER,
        current: nq,
        usedIds: new Set([...session.usedIds, nq.id]),
        picked: null,
      });
    }

    const tier = nextTier(q.tier, isCorrect);
    const exclude = await recentSeen(fieldId);
    const pool = session.lessonId ? questions.filter((x) => x.lesson_id === session.lessonId) : questions;
    const nq = pickQuestion(pool, fieldId, tier, exclude, session.usedIds);
    if (!nq) return finishSession({ ...session, items });
    setSession({
      ...session,
      items,
      askedInField,
      tier,
      current: nq,
      usedIds: new Set([...session.usedIds, nq.id]),
      picked: null,
    });
  };

  const rollingItems = async (fieldId: string): Promise<AnsweredItem[]> => {
    if (!user || !settings) return [];
    const { data } = await supabase
      .from('question_answers')
      .select('tier, is_correct, counts_toward_mastery')
      .eq('user_id', user.id)
      .eq('field_id', fieldId)
      .eq('counts_toward_mastery', true)
      .order('created_at', { ascending: false })
      .limit(settings.rolling_window_size);
    return ((data ?? []) as AnsweredItem[]).map((r) => ({ tier: r.tier, is_correct: r.is_correct }));
  };

  const finishSession = async (s: CheckSession) => {
    if (!user || !course || !settings) return;
    const lines: string[] = [];
    const results: Record<string, unknown> = {};
    let anyFail = false;

    for (const fieldId of s.fieldIds) {
      const sessionItems = s.items[fieldId] ?? [];
      if (!sessionItems.length) continue;
      const basis = s.kind === 'field_check' ? await rollingItems(fieldId) : sessionItems;
      const evalResult = evaluatePass(basis, settings);
      results[fieldId] = { stars: evalResult.stars, passed: evalResult.passed };
      const row = progress.find((p) => p.field_id === fieldId);
      if (s.kind === 'lesson_check') {
        lines.push(`${fieldName(fieldId)}: ${scoreAnswers(sessionItems, settings.tier_weights).stars} / 5 on this lesson`);
        continue;
      }
      if (row) {
        await supabase
          .from('field_progress')
          .update({
            star_rating: evalResult.stars,
            state: evalResult.passed ? 'passed' : s.kind === 'refresher' ? 'needs_review' : 'open',
            lessons_since_check: 0,
            passed_at: evalResult.passed ? new Date().toISOString() : null,
          })
          .eq('id', row.id);
      }
      if (!evalResult.passed) anyFail = true;
      lines.push(
        `${fieldName(fieldId)}: ${evalResult.stars} / 5 — ${evalResult.passed ? 'passed' : evalResult.reasons[0] ?? 'keep going'}`,
      );
    }

    if (s.checkId) {
      await supabase.from('assessment_checks').update({ completed: true, results: results as never, passed: !anyFail }).eq('id', s.checkId);
    }

    if (s.kind === 'diagnostic') {
      const stars: Record<string, number> = {};
      for (const [fid, r] of Object.entries(results)) stars[fid] = (r as { stars: number }).stars;
      const ordered =
        course.field_order_mode === 'fixed'
          ? courseFields.map((c) => c.field_id)
          : [...courseFields.map((c) => c.field_id)].sort((a, b) => (stars[a] ?? 0) - (stars[b] ?? 0));
      await supabase.from('course_enrollments').update({ diagnostic_done: true, field_queue: ordered as never }).eq('id', enrollment!.id);
      await Promise.all(
        ordered.map((fid, i) =>
          supabase.from('field_progress').update({ queue_position: i }).eq('course_id', course.id).eq('user_id', user.id).eq('field_id', fid),
        ),
      );
    }

    if (s.kind === 'refresher' && !anyFail) {
      await supabase.from('course_enrollments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', enrollment!.id);
    }

    setSummary({
      title:
        s.kind === 'diagnostic'
          ? 'Placement results'
          : s.kind === 'refresher'
            ? anyFail && settings.refresher_blocking
              ? 'Almost there'
              : 'Course refresher results'
            : s.kind === 'lesson_check'
              ? 'Lesson check'
              : 'Skill check results',
      lines,
    });
    setSession(null);
    setPhase('summary');
    await load();
  };

  /* ------------------------------ navigation ------------------------------ */
  const activeField = useMemo(() => {
    const open = [...progress].sort((a, b) => a.queue_position - b.queue_position).find((p) => p.state !== 'passed');
    return open ?? null;
  }, [progress]);

  const nextLesson = useMemo(() => {
    if (!activeField) return null;
    return lessons.find((l) => l.field_id === activeField.field_id && !completed.includes(l.id)) ?? null;
  }, [activeField, lessons, completed]);

  const continueCourse = async () => {
    if (!enrollment || !settings || !course) return;
    if (!enrollment.diagnostic_done && courseFields.length) {
      return startSession('diagnostic', courseFields.map((c) => c.field_id), settings.diagnostic_questions_per_field);
    }
    if (!activeField) {
      if (enrollment.status === 'completed') return setPhase('complete');
      return startSession('refresher', courseFields.map((c) => c.field_id), settings.refresher_questions_per_field);
    }
    if (activeField.lessons_since_check >= settings.lessons_before_check || !nextLesson) {
      return startSession('field_check', [activeField.field_id], settings.check_length);
    }
    setActiveLesson(nextLesson);
    setPhase('lesson');
  };

  const finishLesson = async () => {
    if (!activeLesson || !user || !course || !activeField) return;
    await saveRow('lesson_completions', {
      user_id: user.id,
      lesson_id: activeLesson.id,
      course_id: course.id,
      field_id: activeLesson.field_id,
    });
    await supabase
      .from('field_progress')
      .update({
        lessons_since_check: activeField.lessons_since_check + 1,
        lessons_completed: activeField.lessons_completed + 1,
      })
      .eq('id', activeField.id);
    const lessonCheck = activeLesson.comprehension_enabled ?? settings?.lesson_checks_enabled;
    const lessonQs = questions.filter((q) => q.lesson_id === activeLesson.id);
    const lesson = activeLesson;
    setActiveLesson(null);
    await load();
    if (lessonCheck && lessonQs.length) {
      return startSession('lesson_check', [lesson.field_id], Math.min(settings?.lesson_check_count ?? 2, lessonQs.length), lesson.id);
    }
    setPhase('intro');
  };

  /* -------------------------------- render -------------------------------- */
  if (phase === 'loading' || !course || !settings) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Loading your course…</div>
      </Layout>
    );
  }

  const passedCount = progress.filter((p) => p.state === 'passed').length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/sandbox" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground">
          <ArrowLeft size={14} /> All courses
        </Link>
        <h1 className="text-3xl font-bold text-foreground mt-2">{course.title}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary">{course.course_type === 'core' ? 'Core' : course.track ?? 'Elective'} · Level {course.level}</Badge>
          <Badge variant="outline">{passedCount} of {courseFields.length} skills mastered</Badge>
          {offline && (
            <Badge variant="outline" className="gap-1"><WifiOff size={12} /> Saved answers will sync when you reconnect</Badge>
          )}
        </div>

        {/* Intro / dashboard */}
        {phase === 'intro' && (
          <div className="mt-8 space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-3">
              {progress
                .slice()
                .sort((a, b) => a.queue_position - b.queue_position)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <span className="text-foreground">{fieldName(p.field_id)}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {p.star_rating != null && <><Star size={14} className="text-primary" /> {Number(p.star_rating).toFixed(1)}</>}
                      {p.state === 'passed' && <CheckCircle2 size={16} className="text-primary" />}
                      {p.state === 'needs_review' && <Badge variant="outline">Needs review</Badge>}
                    </span>
                  </div>
                ))}
              {progress.length === 0 && <p className="text-sm text-muted-foreground">This course has no skills set up yet.</p>}
            </div>
            <Button size="lg" onClick={continueCourse} disabled={!courseFields.length}>
              {!enrollment?.diagnostic_done
                ? 'Start the placement check'
                : enrollment?.status === 'completed'
                  ? 'Review course'
                  : !activeField
                    ? 'Take the final refresher'
                    : 'Continue learning'}
            </Button>
            {!enrollment?.diagnostic_done && (
              <p className="text-sm text-muted-foreground">
                A few quick questions per skill so we skip anything you already know.
              </p>
            )}
          </div>
        )}

        {/* Lesson */}
        {phase === 'lesson' && activeLesson && (
          <div className="mt-8 space-y-6">
            <Badge variant="secondary">{fieldName(activeLesson.field_id)}</Badge>
            <h2 className="text-2xl font-semibold text-foreground">{activeLesson.title}</h2>
            <div className="space-y-4">
              {(activeLesson.blocks ?? []).map((b, i) => {
                if (b.type === 'image') return <img key={i} src={b.value} alt="" loading="lazy" className="rounded-lg w-full" />;
                if (b.type === 'video')
                  return (
                    <div key={i} className="aspect-video">
                      <iframe src={b.value} title={`Video ${i + 1}`} className="w-full h-full rounded-lg" allowFullScreen loading="lazy" />
                    </div>
                  );
                return <RichText key={i} html={b.value} />;
              })}
            </div>
            <Button size="lg" onClick={finishLesson}>Mark as done</Button>
          </div>
        )}

        {/* Question */}
        {(phase === 'check' || phase === 'diagnostic') && session?.current && (
          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{fieldName(session.fieldIds[session.fieldIdx])}</Badge>
              <Badge variant="outline">
                Question {session.askedInField + 1} of {session.perField}
                {session.fieldIds.length > 1 ? ` · skill ${session.fieldIdx + 1} of ${session.fieldIds.length}` : ''}
              </Badge>
            </div>
            <p className="text-xl font-medium text-foreground">{session.current.prompt}</p>
            <div className="space-y-2">
              {session.current.options.map((o, i) => {
                const picked = session.picked;
                const correct = session.current!.correct_index;
                const cls =
                  picked === null
                    ? 'border-border hover:border-primary'
                    : i === correct
                      ? 'border-primary bg-primary/10'
                      : picked === i
                        ? 'border-destructive bg-destructive/10'
                        : 'border-border opacity-60';
                return (
                  <button key={i} onClick={() => answer(i)} className={`w-full text-left rounded-lg border p-4 transition-colors ${cls}`}>
                    {o}
                  </button>
                );
              })}
            </div>
            {session.picked !== null && (
              <div className="space-y-4">
                {session.current.explanation && <p className="text-muted-foreground border-t border-border pt-4">{session.current.explanation}</p>}
                <Button onClick={advance}>Next</Button>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {phase === 'summary' && summary && (
          <div className="mt-8 space-y-5">
            <h2 className="text-2xl font-semibold text-foreground">{summary.title}</h2>
            <div className="bg-card rounded-xl p-6 shadow-soft space-y-2">
              {summary.lines.map((l, i) => <p key={i} className="text-foreground">{l}</p>)}
            </div>
            <Button size="lg" onClick={() => { setSummary(null); setPhase('intro'); }}>Continue</Button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Course complete</h2>
            <p className="text-muted-foreground">Every skill in this course has been checked and passed.</p>
            <Link to="/sandbox"><Button size="lg">Back to courses</Button></Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseRunner;
