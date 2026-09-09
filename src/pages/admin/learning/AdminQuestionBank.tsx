import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, AlertTriangle, Upload, Eye } from 'lucide-react';
import type { Question, SkillField } from '@/lib/learning/types';

interface LessonOpt { id: string; title: string; field_id: string }

const emptyQ = (fieldId: string): Partial<Question> => ({
  field_id: fieldId,
  tier: 2,
  prompt: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
  status: 'published',
  lesson_id: null,
});

const AdminQuestionBank = () => {
  const [fields, setFields] = useState<SkillField[]>([]);
  const [lessons, setLessons] = useState<LessonOpt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Record<string, { asked: number; correct: number }>>({});
  const [filterField, setFilterField] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [draft, setDraft] = useState<Partial<Question> | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Question | null>(null);
  const [previewPick, setPreviewPick] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState('');

  const load = async () => {
    const [f, l, q, a] = await Promise.all([
      supabase.from('skill_fields').select('*').order('name'),
      supabase.from('course_lessons').select('id, title, field_id').order('title'),
      supabase.from('questions').select('*').order('created_at', { ascending: false }),
      supabase.from('question_answers').select('question_id, is_correct'),
    ]);
    setFields((f.data ?? []) as SkillField[]);
    setLessons((l.data ?? []) as LessonOpt[]);
    setQuestions((q.data ?? []) as unknown as Question[]);
    const s: Record<string, { asked: number; correct: number }> = {};
    for (const row of (a.data ?? []) as { question_id: string; is_correct: boolean }[]) {
      s[row.question_id] ??= { asked: 0, correct: 0 };
      s[row.question_id].asked += 1;
      if (row.is_correct) s[row.question_id].correct += 1;
    }
    setStats(s);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (filterField === 'all' || q.field_id === filterField) &&
          (filterTier === 'all' || q.tier === Number(filterTier)),
      ),
    [questions, filterField, filterTier],
  );

  const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? '—';

  const tier3Gaps = fields.filter((f) => !questions.some((q) => q.field_id === f.id && q.tier === 3));

  const flagged = (q: Question) => {
    const st = stats[q.id];
    if (!st || st.asked < 5) return null;
    const rate = st.correct / st.asked;
    if (q.tier === 1 && rate < 0.5) return 'Tier 1 but rarely answered right — maybe it belongs at a higher tier';
    if (q.tier === 3 && rate > 0.9) return 'Tier 3 but nearly always right — maybe it belongs at a lower tier';
    return null;
  };

  const save = async () => {
    if (!draft?.prompt || !draft.field_id) return;
    const payload = {
      field_id: draft.field_id,
      lesson_id: draft.lesson_id || null,
      tier: draft.tier ?? 2,
      prompt: draft.prompt,
      options: (draft.options ?? []).filter((o) => o.trim() !== '') as never,
      correct_index: draft.correct_index ?? 0,
      explanation: draft.explanation || null,
      status: (draft.status ?? 'published') as 'draft' | 'published',
    };
    const { error } = draft.id
      ? await supabase.from('questions').update(payload).eq('id', draft.id)
      : await supabase.from('questions').insert(payload);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setOpen(false);
    setDraft(null);
    load();
  };

  const importCsv = async () => {
    const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
    const rows: Record<string, unknown>[] = [];
    for (const line of lines) {
      const [fieldNameCell, tier, prompt, o1, o2, o3, o4, correct, explanation] = line.split(',').map((c) => c?.trim() ?? '');
      const field = fields.find((f) => f.name.toLowerCase() === fieldNameCell.toLowerCase());
      if (!field || !prompt) continue;
      rows.push({
        field_id: field.id,
        tier: Number(tier) || 1,
        prompt,
        options: [o1, o2, o3, o4].filter(Boolean),
        correct_index: Math.max(0, (Number(correct) || 1) - 1),
        explanation: explanation || null,
        status: 'published',
      });
    }
    if (!rows.length) return toast({ title: 'Nothing to import', description: 'Check the skill names and format.', variant: 'destructive' });
    const { error } = await supabase.from('questions').insert(rows as never);
    if (error) return toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    toast({ title: `Imported ${rows.length} questions` });
    setImportOpen(false);
    setCsv('');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
          <p className="text-muted-foreground">Shared across diagnostics, skill checks, lesson checks and the final refresher.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload size={16} className="mr-2" /> Bulk import</Button>
          <Button onClick={() => { setDraft(emptyQ(fields[0]?.id ?? '')); setOpen(true); }} disabled={!fields.length}>
            <Plus size={16} className="mr-2" /> New question
          </Button>
        </div>
      </div>

      {tier3Gaps.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm flex gap-3">
          <AlertTriangle size={18} className="text-destructive shrink-0" />
          <div>
            <p className="font-medium text-foreground">These skills have no hardest-tier questions, so no learner can pass them:</p>
            <p className="text-muted-foreground">{tier3Gaps.map((f) => f.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Select value={filterField} onValueChange={setFilterField}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            {fields.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="1">Tier 1 — recall</SelectItem>
            <SelectItem value="2">Tier 2 — applied</SelectItem>
            <SelectItem value="3">Tier 3 — analytical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((q) => {
          const flag = flagged(q);
          const st = stats[q.id];
          return (
            <div key={q.id} className="bg-card rounded-xl p-4 shadow-soft space-y-2">
              <div className="flex items-start justify-between gap-3">
                <button className="text-left font-medium text-foreground hover:text-primary" onClick={() => { setDraft(q); setOpen(true); }}>
                  {q.prompt}
                </button>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setPreview(q); setPreviewPick(null); }}><Eye size={15} /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { await supabase.from('questions').delete().eq('id', q.id); load(); }}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{fieldName(q.field_id)}</Badge>
                <Badge variant="outline">Tier {q.tier}</Badge>
                {q.lesson_id && <Badge variant="outline">{lessons.find((l) => l.id === q.lesson_id)?.title ?? 'Lesson'}</Badge>}
                {q.status !== 'published' && <Badge variant="secondary">Draft</Badge>}
                {st && <Badge variant="outline">{Math.round((st.correct / st.asked) * 100)}% correct · {st.asked} asked</Badge>}
              </div>
              {flag && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle size={13} /> {flag}</p>}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground">No questions match.</p>}
      </div>

      {/* Editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? 'Edit question' : 'New question'}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Skill</Label>
                  <Select value={draft.field_id} onValueChange={(v) => setDraft({ ...draft, field_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{fields.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty tier</Label>
                  <Select value={String(draft.tier)} onValueChange={(v) => setDraft({ ...draft, tier: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1 — recall</SelectItem>
                      <SelectItem value="2">Tier 2 — applied</SelectItem>
                      <SelectItem value="3">Tier 3 — analytical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Attach to a lesson (optional)</Label>
                <Select value={draft.lesson_id ?? 'none'} onValueChange={(v) => setDraft({ ...draft, lesson_id: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not lesson-specific</SelectItem>
                    {lessons.filter((l) => l.field_id === draft.field_id).map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Question</Label><Textarea rows={3} value={draft.prompt ?? ''} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Answer options (tick the correct one)</Label>
                {(draft.options ?? []).map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" checked={draft.correct_index === i} onChange={() => setDraft({ ...draft, correct_index: i })} />
                    <Input
                      value={o}
                      onChange={(e) => {
                        const options = [...(draft.options ?? [])];
                        options[i] = e.target.value;
                        setDraft({ ...draft, options });
                      }}
                    />
                    <Button size="icon" variant="ghost" onClick={() => setDraft({ ...draft, options: (draft.options ?? []).filter((_, idx) => idx !== i) })}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, options: [...(draft.options ?? []), ''] })}>
                  <Plus size={14} className="mr-2" /> Add option
                </Button>
              </div>
              <div><Label>Explanation shown after answering</Label><Textarea rows={3} value={draft.explanation ?? ''} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Published</Label>
                <Switch checked={draft.status === 'published'} onCheckedChange={(b) => setDraft({ ...draft, status: b ? 'published' : 'draft' })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview as learner */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Preview as a learner</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              <p className="font-medium text-foreground">{preview.prompt}</p>
              {preview.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewPick(i)}
                  className={`w-full text-left rounded-lg border p-3 text-sm ${
                    previewPick === null
                      ? 'border-border hover:border-primary'
                      : i === preview.correct_index
                        ? 'border-primary bg-primary/10'
                        : previewPick === i
                          ? 'border-destructive bg-destructive/10'
                          : 'border-border opacity-60'
                  }`}
                >
                  {o}
                </button>
              ))}
              {previewPick !== null && preview.explanation && (
                <p className="text-sm text-muted-foreground border-t border-border pt-3">{preview.explanation}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk import */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Bulk import questions</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste one question per line, comma separated:<br />
            <code>Skill name, tier, question, option 1, option 2, option 3, option 4, correct option number, explanation</code>
          </p>
          <Textarea rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Budgeting,1,What is a budget?,A plan for money,A loan,A tax,A bank,1,A budget plans income against spending." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={importCsv}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQuestionBank;
