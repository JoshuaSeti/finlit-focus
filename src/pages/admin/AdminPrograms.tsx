import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GraduationCap, ExternalLink, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ApplicationField, ApplicationFieldBuilder } from '@/components/programs/ApplicationFieldBuilder';

interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  is_accepting_applications: boolean;
  application_fields: ApplicationField[];
  open_at: string | null;
  close_at: string | null;
  created_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  hero_image_url: '',
  is_active: true,
  is_accepting_applications: true,
  application_fields: [] as ApplicationField[],
  open_at: '',
  close_at: '',
};

const AdminPrograms = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState(emptyForm);

  const fetchPrograms = async () => {
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    const mapped = (data || []).map((p: any) => ({
      ...p,
      application_fields: (p.application_fields as ApplicationField[]) || [],
    }));
    setPrograms(mapped);

    if (mapped.length) {
      const { data: apps } = await supabase.from('program_applications').select('program_id');
      const counts: Record<string, number> = {};
      (apps || []).forEach((a: any) => {
        counts[a.program_id] = (counts[a.program_id] || 0) + 1;
      });
      setApplicationCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description || '',
      hero_image_url: p.hero_image_url || '',
      is_active: p.is_active,
      is_accepting_applications: p.is_accepting_applications,
      application_fields: p.application_fields || [],
      open_at: p.open_at ? p.open_at.slice(0, 16) : '',
      close_at: p.close_at ? p.close_at.slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title.trim(),
      slug: (form.slug || slugify(form.title)).trim(),
      description: form.description || null,
      hero_image_url: form.hero_image_url || null,
      is_active: form.is_active,
      is_accepting_applications: form.is_accepting_applications,
      application_fields: form.application_fields as any,
      open_at: form.open_at ? new Date(form.open_at).toISOString() : null,
      close_at: form.close_at ? new Date(form.close_at).toISOString() : null,
    };

    const { error } = editing
      ? await supabase.from('programs').update(payload).eq('id', editing.id)
      : await supabase.from('programs').insert(payload);

    if (error) {
      toast({ title: 'Failed to save program', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Program ${editing ? 'updated' : 'created'}` });
      setDialogOpen(false);
      fetchPrograms();
    }
  };

  const toggleActive = async (p: Program) => {
    await supabase.from('programs').update({ is_active: !p.is_active }).eq('id', p.id);
    fetchPrograms();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this program? All applications will also be deleted.')) return;
    await supabase.from('programs').delete().eq('id', id);
    fetchPrograms();
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Only super admins can manage programs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-muted-foreground">Create programs and design their application portals.</p>
        </div>
        <Button onClick={openNew}><Plus size={18} className="mr-2" /> New Program</Button>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No programs yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map((p) => (
            <div key={p.id} className="bg-card rounded-xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    {!p.is_active && <span className="text-xs bg-muted px-2 py-0.5 rounded">Hidden</span>}
                    {!p.is_accepting_applications && <span className="text-xs bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded">Applications closed</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">/programs/{p.slug}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><ClipboardList size={14} /> {applicationCounts[p.id] || 0} applications</span>
                    <span>{p.application_fields.length} custom fields</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/programs/${p.slug}`} target="_blank">
                    <Button variant="ghost" size="icon"><ExternalLink size={16} /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(p)}>
                    {p.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit2 size={18} /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(p.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Program' : 'New Program'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>URL slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} placeholder="youth-leadership-2026" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hero image URL (optional)</Label>
              <Input value={form.hero_image_url} onChange={(e) => setForm((f) => ({ ...f, hero_image_url: e.target.value }))} placeholder="https://…" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} minHeight={200} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opens (optional)</Label>
                <Input type="datetime-local" value={form.open_at} onChange={(e) => setForm((f) => ({ ...f, open_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Closes (optional)</Label>
                <Input type="datetime-local" value={form.close_at} onChange={(e) => setForm((f) => ({ ...f, close_at: e.target.value }))} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
                <Label>Visible on site</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_accepting_applications} onCheckedChange={(c) => setForm((f) => ({ ...f, is_accepting_applications: c }))} />
                <Label>Accepting applications</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <ApplicationFieldBuilder
                fields={form.application_fields}
                onChange={(fields) => setForm((f) => ({ ...f, application_fields: fields }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'} Program</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPrograms;
