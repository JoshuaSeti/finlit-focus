import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichText, stripHtml } from '@/components/ui/rich-text';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit2, Trash2, Eye, EyeOff, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { message: '', link_url: '', link_label: '', is_active: true };

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const { isAdmin: isSuperAdmin } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      message: a.message,
      link_url: a.link_url || '',
      link_label: a.link_label || '',
      is_active: a.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!stripHtml(form.message).trim()) {
      toast({ title: 'Message is required', variant: 'destructive' });
      return;
    }
    const payload = {
      message: form.message,
      link_url: form.link_url || null,
      link_label: form.link_label || null,
      is_active: form.is_active,
    };

    // If activating this one, deactivate others so only one shows.
    if (form.is_active) {
      await supabase.from('announcements').update({ is_active: false }).neq('id', editing?.id || '00000000-0000-0000-0000-000000000000');
    }

    const { error } = editing
      ? await supabase.from('announcements').update(payload).eq('id', editing.id)
      : await supabase.from('announcements').insert(payload);

    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Announcement ${editing ? 'updated' : 'created'}` });
      setDialogOpen(false);
      fetchItems();
    }
  };

  const toggleActive = async (a: Announcement) => {
    if (!a.is_active) {
      await supabase.from('announcements').update({ is_active: false }).neq('id', a.id);
    }
    await supabase.from('announcements').update({ is_active: !a.is_active }).eq('id', a.id);
    fetchItems();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchItems();
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Only admins can manage announcements.</p>
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
          <h1 className="text-2xl font-bold">Announcement Bar</h1>
          <p className="text-muted-foreground">The active announcement shows as a bar across the top of every page.</p>
        </div>
        <Button onClick={openNew}><Plus size={18} className="mr-2" /> New Announcement</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-card rounded-xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Megaphone size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <RichText html={a.message} className="text-sm" />
                    {a.link_url && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Link: <span className="font-mono">{a.link_url}</span> {a.link_label && `(${a.link_label})`}
                      </p>
                    )}
                    {a.is_active && <span className="inline-block mt-2 text-xs bg-green-100 text-green-900 px-2 py-0.5 rounded">Active</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(a)}>
                    {a.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit2 size={18} /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(a.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Message</Label>
              <RichTextEditor value={form.message} onChange={(v) => setForm((f) => ({ ...f, message: v }))} minHeight={120} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Link URL (optional)</Label>
                <Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="/programs or https://…" />
              </div>
              <div className="space-y-2">
                <Label>Link label</Label>
                <Input value={form.link_label} onChange={(e) => setForm((f) => ({ ...f, link_label: e.target.value }))} placeholder="Learn more" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
              <Label>Active (activating will hide any other active announcement)</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
