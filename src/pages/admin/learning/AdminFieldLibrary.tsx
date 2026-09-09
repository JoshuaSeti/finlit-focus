import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface Row {
  id: string;
  name: string;
  description: string | null;
  courses: string[];
  tier3: number;
  total: number;
}

const AdminFieldLibrary = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = async () => {
    const [fieldsRes, linkRes, qRes] = await Promise.all([
      supabase.from('skill_fields').select('*').order('name'),
      supabase.from('course_fields').select('field_id, courses(title)'),
      supabase.from('questions').select('field_id, tier'),
    ]);
    const links = (linkRes.data ?? []) as { field_id: string; courses: { title: string } | null }[];
    const qs = (qRes.data ?? []) as { field_id: string; tier: number }[];
    setRows(
      (fieldsRes.data ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        courses: links.filter((l) => l.field_id === f.id).map((l) => l.courses?.title ?? '—'),
        tier3: qs.filter((q) => q.field_id === f.id && q.tier === 3).length,
        total: qs.filter((q) => q.field_id === f.id).length,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), description: form.description || null };
    const { error } = editing
      ? await supabase.from('skill_fields').update(payload).eq('id', editing.id)
      : await supabase.from('skill_fields').insert(payload);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '' });
    load();
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete the skill "${row.name}"? Courses using it will lose it.`)) return;
    const { error } = await supabase.from('skill_fields').delete().eq('id', row.id);
    if (error) return toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Library</h1>
          <p className="text-muted-foreground">
            One shared list of skills. Courses attach existing skills instead of recreating them.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', description: '' });
            setOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" /> New skill
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No skills yet. Add your first one.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-card rounded-xl p-5 shadow-soft space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{r.name}</h3>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(r);
                      setForm({ name: r.name, description: r.description ?? '' });
                      setOpen(true);
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.courses.length ? (
                  r.courses.map((c, i) => (
                    <Badge key={i} variant="secondary">
                      {c}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Not used in any course yet</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.total} question{r.total === 1 ? '' : 's'} · {r.tier3} at the hardest tier
              </div>
              {r.tier3 === 0 && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle size={14} />
                  No Tier 3 questions — nobody can pass this skill yet.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit skill' : 'New skill'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Budgeting"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFieldLibrary;
