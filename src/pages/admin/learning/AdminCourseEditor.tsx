import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, History } from 'lucide-react';
import { autoPrerequisites, DEFAULT_SETTINGS, resolveSettings } from '@/lib/learning/engine';
import { LESSON_TEMPLATES } from '@/lib/learning/types';
import type { Course, EngineSettings, LessonTemplate, PrerequisiteRule, SkillField } from '@/lib/learning/types';

interface LessonRow {
  id: string;
  title: string;
  field_id: string;
  template: LessonTemplate;
  blocks: { type: string; value: string }[];
  position: number;
  status: 'draft' | 'published';
  comprehension_enabled: boolean | null;
  comprehension_count: number | null;
}

const AdminCourseEditor = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [fields, setFields] = useState<SkillField[]>([]);
  const [courseFields, setCourseFields] = useState<{ id: string; field_id: string; position: number }[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [globalSettings, setGlobalSettings] = useState<EngineSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonDraft, setLessonDraft] = useState<Partial<LessonRow> | null>(null);
  const [versions, setVersions] = useState<{ id: string; created_at: string; note: string | null }[]>([]);

  const load = async () => {
    const [c, cs, f, cf, ls, gs, vs] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id!).maybeSingle(),
      supabase.from('courses').select('*'),
      supabase.from('skill_fields').select('*').order('name'),
      supabase.from('course_fields').select('id, field_id, position').eq('course_id', id!).order('position'),
      supabase.from('course_lessons').select('*').eq('course_id', id!).order('position'),
      supabase.from('engine_settings').select('*').limit(1).maybeSingle(),
      supabase.from('content_versions').select('id, created_at, note').eq('entity_id', id!).order('created_at', { ascending: false }).limit(10),
    ]);
    setCourse(c.data as unknown as Course);
    setAllCourses((cs.data ?? []) as unknown as Course[]);
    setFields((f.data ?? []) as SkillField[]);
    setCourseFields(cf.data ?? []);
    setLessons((ls.data ?? []) as unknown as LessonRow[]);
    setGlobalSettings({ ...DEFAULT_SETTINGS, ...(gs.data ?? {}) } as EngineSettings);
    setVersions(vs.data ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const effective = useMemo(
    () => (globalSettings ? resolveSettings(globalSettings, course?.settings_override) : null),
    [globalSettings, course],
  );

  if (!course || !globalSettings || !effective) return <p className="text-muted-foreground">Loading…</p>;

  const patch = (p: Partial<Course>) => setCourse({ ...course, ...p } as Course);

  const saveCourse = async () => {
    setSaving(true);
    await supabase.from('content_versions').insert({
      entity_type: 'course',
      entity_id: course.id,
      snapshot: course as unknown as Record<string, unknown>,
      note: 'Saved from Course Builder',
    } as never);
    const { error } = await supabase
      .from('courses')
      .update({
        title: course.title,
        slug: course.slug,
        course_type: course.course_type,
        track: course.track,
        level: course.level,
        description: course.description,
        cover_image_url: course.cover_image_url,
        accent_color: course.accent_color,
        status: course.status,
        field_order_mode: course.field_order_mode,
        prerequisite_rule: course.prerequisite_rule as never,
        settings_override: course.settings_override as never,
      })
      .eq('id', course.id);
    setSaving(false);
    toast(error ? { title: 'Could not save', description: error.message, variant: 'destructive' } : { title: 'Course saved' });
    load();
  };

  /* ----- fields ----- */
  const attachField = async (fieldId: string) => {
    if (courseFields.length >= 7) return toast({ title: 'A course can hold at most 7 skills', variant: 'destructive' });
    const { error } = await supabase
      .from('course_fields')
      .insert({ course_id: course.id, field_id: fieldId, position: courseFields.length });
    if (error) return toast({ title: 'Could not attach', description: error.message, variant: 'destructive' });
    load();
  };

  const detachField = async (rowId: string) => {
    await supabase.from('course_fields').delete().eq('id', rowId);
    load();
  };

  const moveField = async (index: number, dir: -1 | 1) => {
    const next = [...courseFields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCourseFields(next);
    await Promise.all(next.map((r, i) => supabase.from('course_fields').update({ position: i }).eq('id', r.id)));
  };

  /* ----- prerequisites ----- */
  const rule: PrerequisiteRule = course.prerequisite_rule?.mode
    ? course.prerequisite_rule
    : { mode: 'auto', conditions: [] };
  const autoRule = autoPrerequisites(course, allCourses);
  const shownRule = rule.mode === 'custom' ? rule : autoRule;

  const setCustom = (on: boolean) =>
    patch({ prerequisite_rule: on ? { mode: 'custom', conditions: autoRule.conditions } : { mode: 'auto', conditions: [] } });

  const updateCondition = (i: number, p: Partial<PrerequisiteRule['conditions'][number]>) => {
    const conditions = shownRule.conditions.map((c, idx) => (idx === i ? { ...c, ...p } : c));
    patch({ prerequisite_rule: { mode: 'custom', conditions } });
  };

  /* ----- lessons ----- */
  const openLesson = (l?: LessonRow) =>
    setLessonDraft(
      l ?? {
        title: '',
        field_id: courseFields[0]?.field_id ?? '',
        template: 'reading',
        blocks: [{ type: 'text', value: '' }],
        status: 'draft',
        comprehension_enabled: null,
        comprehension_count: null,
      },
    ) || setLessonOpen(true);

  const saveLesson = async () => {
    if (!lessonDraft?.title || !lessonDraft.field_id) return;
    const payload = {
      course_id: course.id,
      field_id: lessonDraft.field_id,
      title: lessonDraft.title,
      template: lessonDraft.template as LessonTemplate,
      blocks: (lessonDraft.blocks ?? []) as never,
      status: (lessonDraft.status ?? 'draft') as 'draft' | 'published',
      comprehension_enabled: lessonDraft.comprehension_enabled,
      comprehension_count: lessonDraft.comprehension_count,
      position: lessonDraft.position ?? lessons.length,
    };
    const { error } = lessonDraft.id
      ? await supabase.from('course_lessons').update(payload).eq('id', lessonDraft.id)
      : await supabase.from('course_lessons').insert(payload);
    if (error) return toast({ title: 'Could not save lesson', description: error.message, variant: 'destructive' });
    setLessonOpen(false);
    setLessonDraft(null);
    load();
  };

  const moveLesson = async (index: number, dir: -1 | 1) => {
    const next = [...lessons];
    const t = index + dir;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t], next[index]];
    setLessons(next);
    await Promise.all(next.map((l, i) => supabase.from('course_lessons').update({ position: i }).eq('id', l.id)));
  };

  const fieldName = (fid: string) => fields.find((f) => f.id === fid)?.name ?? 'Unassigned';
  const attachedIds = courseFields.map((c) => c.field_id);

  const overrideNum = (key: keyof EngineSettings, label: string) => (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        placeholder={`Global: ${String(globalSettings[key])}`}
        value={(course.settings_override?.[key] as number | undefined) ?? ''}
        onChange={(e) => {
          const o = { ...(course.settings_override ?? {}) } as Record<string, unknown>;
          if (e.target.value === '') delete o[key];
          else o[key] = Number(e.target.value);
          patch({ settings_override: o as Partial<EngineSettings> });
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/admin/learning/courses" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <ArrowLeft size={14} /> All courses
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">{course.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
            {course.status === 'published' ? 'Live' : 'Draft'}
          </Badge>
          <Button onClick={saveCourse} disabled={saving}>{saving ? 'Saving…' : 'Save course'}</Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="skills">Skills &amp; order</TabsTrigger>
          <TabsTrigger value="prereq">Unlock rules</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="bg-card rounded-xl p-6 shadow-soft space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={course.title} onChange={(e) => patch({ title: e.target.value })} /></div>
            <div><Label>Web address name</Label><Input value={course.slug} onChange={(e) => patch({ slug: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={course.course_type} onValueChange={(v) => patch({ course_type: v as Course['course_type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Level</Label><Input type="number" min={1} value={course.level} onChange={(e) => patch({ level: Number(e.target.value) })} /></div>
            <div><Label>Track</Label><Input value={course.track ?? ''} onChange={(e) => patch({ track: e.target.value })} placeholder="Agriculture Finance" /></div>
            <div><Label>Cover image link</Label><Input value={course.cover_image_url ?? ''} onChange={(e) => patch({ cover_image_url: e.target.value })} /></div>
            <div><Label>Accent colour</Label><Input value={course.accent_color ?? ''} onChange={(e) => patch({ accent_color: e.target.value })} placeholder="#1f7a53" /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Live for learners</Label>
              <Switch checked={course.status === 'published'} onCheckedChange={(b) => patch({ status: b ? 'published' : 'draft' })} />
            </div>
          </div>
          <div><Label>Description</Label><Textarea rows={4} value={course.description ?? ''} onChange={(e) => patch({ description: e.target.value })} /></div>
        </TabsContent>

        <TabsContent value="skills" className="bg-card rounded-xl p-6 shadow-soft space-y-4 mt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">Attach 1–7 skills from the shared library ({courseFields.length}/7).</p>
            <Select value="" onValueChange={attachField}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Attach a skill…" /></SelectTrigger>
              <SelectContent>
                {fields.filter((f) => !attachedIds.includes(f.id)).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {courseFields.map((cf, i) => (
              <div key={cf.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
                <span className="flex-1 font-medium text-foreground">{fieldName(cf.field_id)}</span>
                <Button size="icon" variant="ghost" onClick={() => moveField(i, -1)}><ArrowUp size={15} /></Button>
                <Button size="icon" variant="ghost" onClick={() => moveField(i, 1)}><ArrowDown size={15} /></Button>
                <Button size="icon" variant="ghost" onClick={() => detachField(cf.id)}><Trash2 size={15} /></Button>
              </div>
            ))}
            {courseFields.length === 0 && <p className="text-sm text-muted-foreground">No skills attached yet.</p>}
          </div>
          <div>
            <Label>Delivery order</Label>
            <Select value={course.field_order_mode} onValueChange={(v) => patch({ field_order_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diagnostic">Weakest first, based on the placement diagnostic</SelectItem>
                <SelectItem value="fixed">Fixed — use the order above</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="prereq" className="bg-card rounded-xl p-6 shadow-soft space-y-4 mt-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label>Use a custom unlock rule</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Off = the standard pattern: the previous core level must be complete{course.course_type === 'elective' ? ', and the matching core level must be started or complete' : ''}.
              </p>
            </div>
            <Switch checked={rule.mode === 'custom'} onCheckedChange={setCustom} />
          </div>
          <div className="space-y-2">
            {shownRule.conditions.length === 0 && <p className="text-sm text-muted-foreground">No requirements — this course is open to everyone.</p>}
            {shownRule.conditions.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
                <Select value={c.course_id} disabled={rule.mode !== 'custom'} onValueChange={(v) => updateCondition(i, { course_id: v })}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCourses.map((ac) => (
                      <SelectItem key={ac.id} value={ac.id}>{ac.title} · L{ac.level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={c.requirement} disabled={rule.mode !== 'custom'} onValueChange={(v) => updateCondition(i, { requirement: v as 'passed' | 'in_progress_or_passed' })}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">must be completed</SelectItem>
                    <SelectItem value="in_progress_or_passed">must be started or completed</SelectItem>
                  </SelectContent>
                </Select>
                {rule.mode === 'custom' && (
                  <Button size="icon" variant="ghost" onClick={() => patch({ prerequisite_rule: { mode: 'custom', conditions: shownRule.conditions.filter((_, idx) => idx !== i) } })}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {rule.mode === 'custom' && (
            <Button variant="outline" onClick={() => patch({ prerequisite_rule: { mode: 'custom', conditions: [...shownRule.conditions, { course_id: allCourses[0]?.id ?? '', requirement: 'passed' }] } })}>
              <Plus size={15} className="mr-2" /> Add requirement
            </Button>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="bg-card rounded-xl p-6 shadow-soft space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">Each lesson belongs to exactly one skill. Learners work through one skill at a time.</p>
            <Button onClick={() => { openLesson(); }} disabled={courseFields.length === 0}>
              <Plus size={16} className="mr-2" /> New lesson
            </Button>
          </div>
          <div className="space-y-2">
            {lessons.map((l, i) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
                <div className="flex-1 min-w-0">
                  <button className="font-medium text-foreground hover:text-primary text-left" onClick={() => { setLessonDraft(l); setLessonOpen(true); }}>
                    {l.title}
                  </button>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="secondary">{fieldName(l.field_id)}</Badge>
                    <Badge variant="outline">{LESSON_TEMPLATES.find((t) => t.value === l.template)?.label}</Badge>
                    <Badge variant={l.status === 'published' ? 'default' : 'secondary'}>{l.status === 'published' ? 'Live' : 'Draft'}</Badge>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => moveLesson(i, -1)}><ArrowUp size={15} /></Button>
                <Button size="icon" variant="ghost" onClick={() => moveLesson(i, 1)}><ArrowDown size={15} /></Button>
                <Button size="icon" variant="ghost" onClick={async () => { await supabase.from('course_lessons').delete().eq('id', l.id); load(); }}>
                  <Trash2 size={15} />
                </Button>
              </div>
            ))}
            {lessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="overrides" className="bg-card rounded-xl p-6 shadow-soft space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Leave a box empty to use the global setting.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {overrideNum('lessons_before_check', 'Lessons before a skill check')}
            {overrideNum('check_length', 'Questions per check')}
            {overrideNum('pass_threshold', 'Pass mark (stars)')}
            {overrideNum('ceiling_tier3_correct', 'Hardest-tier answers needed')}
            {overrideNum('min_reliability_questions', 'Minimum questions before a pass')}
            {overrideNum('rolling_window_size', 'Recent history size')}
            {overrideNum('diagnostic_questions_per_field', 'Diagnostic questions per skill')}
            {overrideNum('refresher_questions_per_field', 'Refresher questions per skill')}
            {overrideNum('lesson_check_count', 'Lesson questions per lesson')}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Lesson comprehension checks on for this course</Label>
            <Switch
              checked={(course.settings_override?.lesson_checks_enabled ?? globalSettings.lesson_checks_enabled) as boolean}
              onCheckedChange={(b) => patch({ settings_override: { ...(course.settings_override ?? {}), lesson_checks_enabled: b } })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Refresher blocks completion when a skill fails</Label>
            <Switch
              checked={(course.settings_override?.refresher_blocking ?? globalSettings.refresher_blocking) as boolean}
              onCheckedChange={(b) => patch({ settings_override: { ...(course.settings_override ?? {}), refresher_blocking: b } })}
            />
          </div>
        </TabsContent>

        <TabsContent value="history" className="bg-card rounded-xl p-6 shadow-soft space-y-3 mt-4">
          <h3 className="font-semibold flex items-center gap-2"><History size={16} /> Recent saves</h3>
          {versions.length === 0 && <p className="text-sm text-muted-foreground">No saved versions yet.</p>}
          {versions.map((v) => (
            <div key={v.id} className="text-sm text-muted-foreground border-b border-border pb-2">
              {new Date(v.created_at).toLocaleString()} — {v.note ?? 'Edit'}
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{lessonDraft?.id ? 'Edit lesson' : 'New lesson'}</DialogTitle></DialogHeader>
          {lessonDraft && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={lessonDraft.title ?? ''} onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Skill</Label>
                  <Select value={lessonDraft.field_id} onValueChange={(v) => setLessonDraft({ ...lessonDraft, field_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick a skill" /></SelectTrigger>
                    <SelectContent>
                      {courseFields.map((cf) => <SelectItem key={cf.field_id} value={cf.field_id}>{fieldName(cf.field_id)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Format</Label>
                  <Select value={lessonDraft.template} onValueChange={(v) => setLessonDraft({ ...lessonDraft, template: v as LessonTemplate })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LESSON_TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Content blocks</Label>
                {(lessonDraft.blocks ?? []).map((b, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={b.type}
                        onValueChange={(v) => {
                          const blocks = [...(lessonDraft.blocks ?? [])];
                          blocks[i] = { ...blocks[i], type: v };
                          setLessonDraft({ ...lessonDraft, blocks });
                        }}
                      >
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text (HTML)</SelectItem>
                          <SelectItem value="image">Image link</SelectItem>
                          <SelectItem value="video">Video embed link</SelectItem>
                          <SelectItem value="scenario">Interactive scenario</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setLessonDraft({ ...lessonDraft, blocks: (lessonDraft.blocks ?? []).filter((_, idx) => idx !== i) })}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                    <Textarea
                      rows={b.type === 'text' ? 5 : 2}
                      value={b.value}
                      onChange={(e) => {
                        const blocks = [...(lessonDraft.blocks ?? [])];
                        blocks[i] = { ...blocks[i], value: e.target.value };
                        setLessonDraft({ ...lessonDraft, blocks });
                      }}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setLessonDraft({ ...lessonDraft, blocks: [...(lessonDraft.blocks ?? []), { type: 'text', value: '' }] })}>
                  <Plus size={14} className="mr-2" /> Add block
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>Questions right after this lesson</Label>
                  <p className="text-xs text-muted-foreground mt-1">Leave off to follow the course setting.</p>
                </div>
                <Switch
                  checked={lessonDraft.comprehension_enabled ?? (effective.lesson_checks_enabled as boolean)}
                  onCheckedChange={(b) => setLessonDraft({ ...lessonDraft, comprehension_enabled: b })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Live for learners</Label>
                <Switch checked={lessonDraft.status === 'published'} onCheckedChange={(b) => setLessonDraft({ ...lessonDraft, status: b ? 'published' : 'draft' })} />
              </div>
              {lessonDraft.id && (
                <p className="text-xs text-muted-foreground">
                  Add questions for this lesson in the Question Bank and tag them to this lesson.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonOpen(false)}>Cancel</Button>
            <Button onClick={saveLesson}>Save lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseEditor;
