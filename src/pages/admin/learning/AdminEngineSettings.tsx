import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_SETTINGS } from '@/lib/learning/engine';
import type { EngineSettings } from '@/lib/learning/types';

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
    <div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const Num = ({
  label,
  hint,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) => (
  <div>
    <Label>{label}</Label>
    <Input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
    <div>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const AdminEngineSettings = () => {
  const [s, setS] = useState<EngineSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('engine_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setS({ ...DEFAULT_SETTINGS, ...(data ?? {}), tier_weights: (data?.tier_weights as Record<string, number>) ?? DEFAULT_SETTINGS.tier_weights } as EngineSettings);
      });
  }, []);

  if (!s) return <p className="text-muted-foreground">Loading…</p>;

  const set = (patch: Partial<EngineSettings>) => setS({ ...s, ...patch });
  const setWeight = (tier: string, n: number) =>
    setS({ ...s, tier_weights: { ...s.tier_weights, [tier]: n } });

  const save = async () => {
    setSaving(true);
    const { id, ...rest } = s;
    const { error } = id
      ? await supabase.from('engine_settings').update(rest as never).eq('id', id)
      : await supabase.from('engine_settings').insert(rest as never);
    setSaving(false);
    toast(
      error
        ? { title: 'Could not save', description: error.message, variant: 'destructive' }
        : { title: 'Settings saved' },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assessment Engine Settings</h1>
          <p className="text-muted-foreground">
            Global defaults. Any course can override these in the Course Builder.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>

      <Section title="Course structure">
        <Num
          label="Number of core levels"
          hint="How many levels the core track has"
          value={s.core_levels}
          onChange={(n) => set({ core_levels: n })}
          min={1}
        />
        <Num
          label="Lessons before a skill check"
          value={s.lessons_before_check}
          onChange={(n) => set({ lessons_before_check: n })}
          min={1}
        />
      </Section>

      <Section title="Question difficulty weights" hint="How much each difficulty tier counts toward the score.">
        <Num label="Tier 1 — recall" value={s.tier_weights['1'] ?? 1} onChange={(n) => setWeight('1', n)} />
        <Num label="Tier 2 — applied" value={s.tier_weights['2'] ?? 2} onChange={(n) => setWeight('2', n)} />
        <Num label="Tier 3 — analytical" value={s.tier_weights['3'] ?? 3} onChange={(n) => setWeight('3', n)} />
      </Section>

      <Section title="Skill checks">
        <Num
          label="Questions per check"
          hint="Between 4 and 10"
          value={s.check_length}
          onChange={(n) => set({ check_length: Math.min(10, Math.max(4, n)) })}
          min={4}
          max={10}
        />
        <Num
          label="Pass mark (stars out of 5)"
          value={s.pass_threshold}
          onChange={(n) => set({ pass_threshold: n })}
          step={0.5}
          min={0}
          max={5}
        />
        <Num
          label="Hardest-tier answers needed to pass"
          hint="0 to 3"
          value={s.ceiling_tier3_correct}
          onChange={(n) => set({ ceiling_tier3_correct: Math.min(3, Math.max(0, n)) })}
          min={0}
          max={3}
        />
        <Num
          label="Minimum questions before a pass counts"
          value={s.min_reliability_questions}
          onChange={(n) => set({ min_reliability_questions: n })}
          min={1}
        />
        <div>
          <Label>Recent-history unit</Label>
          <Select value={s.rolling_window_unit} onValueChange={(v) => set({ rolling_window_unit: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="questions">Most recent questions</SelectItem>
              <SelectItem value="checks">Most recent checks</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Scores use recent history, not lifetime history.</p>
        </div>
        <Num
          label="How many to look back on"
          value={s.rolling_window_size}
          onChange={(n) => set({ rolling_window_size: n })}
          min={1}
        />
        <Num
          label="Avoid repeating a question for this many checks"
          value={s.repeat_avoid_checks}
          onChange={(n) => set({ repeat_avoid_checks: n })}
          min={0}
        />
      </Section>

      <Section title="Placement diagnostic">
        <Num
          label="Questions per skill"
          value={s.diagnostic_questions_per_field}
          onChange={(n) => set({ diagnostic_questions_per_field: n })}
          min={1}
        />
      </Section>

      <Section title="End-of-course refresher">
        <Num
          label="Questions per skill"
          value={s.refresher_questions_per_field}
          onChange={(n) => set({ refresher_questions_per_field: n })}
          min={1}
        />
        <Toggle
          label="Block completion on a failed skill"
          hint="Off = the skill is marked 'needs review' on the certificate instead."
          checked={s.refresher_blocking}
          onChange={(b) => set({ refresher_blocking: b })}
        />
      </Section>

      <Section title="Lesson comprehension checks">
        <Toggle
          label="Enabled by default"
          checked={s.lesson_checks_enabled}
          onChange={(b) => set({ lesson_checks_enabled: b })}
        />
        <Num
          label="Questions per lesson"
          value={s.lesson_check_count}
          onChange={(n) => set({ lesson_check_count: n })}
          min={1}
          max={5}
        />
        <Toggle
          label="Count toward skill mastery"
          hint="Off means they are practice only."
          checked={s.lesson_checks_count_toward_mastery}
          onChange={(b) => set({ lesson_checks_count_toward_mastery: b })}
        />
      </Section>

      <Section title="Retention spot-checks">
        <Toggle
          label="Enabled"
          hint="A single mid-difficulty question after a skill has been passed for a while."
          checked={s.retention_enabled}
          onChange={(b) => set({ retention_enabled: b })}
        />
        <Num
          label="Days between spot-checks"
          value={s.retention_interval_days}
          onChange={(n) => set({ retention_interval_days: n })}
          min={1}
        />
      </Section>
    </div>
  );
};

export default AdminEngineSettings;
