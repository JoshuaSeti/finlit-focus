import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, GraduationCap, Trash2 } from 'lucide-react';

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  course_type: 'core' | 'elective';
  level: number;
  track: string | null;
  status: 'draft' | 'published';
  accent_color: string | null;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const AdminCourses = () => {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', course_type: 'core', level: '1', track: '' });
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id,title,slug,course_type,level,track,status,accent_color')
      .order('course_type')
      .order('level');
    setRows((data ?? []) as CourseRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title.trim()) return;
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: form.title.trim(),
        slug: slugify(`${form.title}-l${form.level}`),
        course_type: form.course_type as 'core' | 'elective',
        level: Number(form.level),
        track: form.track || null,
      })
      .select('id')
      .single();
    if (error) return toast({ title: 'Could not create', description: error.message, variant: 'destructive' });
    setOpen(false);
    setForm({ title: '', course_type: 'core', level: '1', track: '' });
    navigate(`/admin/learning/courses/${data.id}`);
  };

  const remove = async (row: CourseRow) => {
    if (!confirm(`Delete "${row.title}" and all of its lessons and learner progress?`)) return;
    const { error } = await supabase.from('courses').delete().eq('id', row.id);
    if (error) return toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
    load();
  };

  const core = rows.filter((r) => r.course_type === 'core');
  const elective = rows.filter((r) => r.course_type === 'elective');

  const Group = ({ title, items }: { title: string; items: CourseRow[] }) => (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((c) => (
          <div key={c.id} className="bg-card rounded-xl p-5 shadow-soft flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Link to={`/admin/learning/courses/${c.id}`} className="font-semibold text-foreground hover:text-primary">
                {c.title}
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Level {c.level}</Badge>
                {c.track && <Badge variant="secondary">{c.track}</Badge>}
                <Badge variant={c.status === 'published' ? 'default' : 'secondary'}>
                  {c.status === 'published' ? 'Live' : 'Draft'}
                </Badge>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(c)}>
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap size={22} /> Course Builder
          </h1>
          <p className="text-muted-foreground">Core and elective courses, their skills, lessons and unlock rules.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} className="mr-2" /> New course
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-8">
          <Group title="Core courses" items={core} />
          <Group title="Elective courses" items={elective} />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Financial Literacy Core" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.course_type} onValueChange={(v) => setForm({ ...form, course_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Input type="number" min={1} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Track (electives)</Label>
              <Input value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} placeholder="Agriculture Finance" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create &amp; edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
