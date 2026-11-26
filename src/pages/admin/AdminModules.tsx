import { useEffect, useState } from 'react';
import { Plus, Upload, Code2, ExternalLink, RotateCcw, Trash2, Image as ImageIcon, Users, CheckCircle2, Award, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LearningModule, loadModuleHtml } from '@/lib/modules';

type Stats = Record<string, { learners: number; completed: number; certs: number }>;
const empty = { slug: '', title: '', description: '', category: 'Core', sort_order: 100, cover_image_url: '', theme_color: '' };

const COLOR_PRESETS = [
  { name: 'Emerald', value: 'from-emerald-950 via-teal-950 to-slate-950', dot: 'bg-emerald-500' },
  { name: 'Forest', value: 'from-green-950 via-emerald-950 to-slate-950', dot: 'bg-green-600' },
  { name: 'Navy', value: 'from-slate-950 via-blue-950 to-slate-950', dot: 'bg-blue-500' },
  { name: 'Indigo', value: 'from-indigo-950 via-slate-950 to-black', dot: 'bg-indigo-500' },
  { name: 'Amber', value: 'from-amber-950 via-stone-900 to-slate-950', dot: 'bg-amber-500' },
  { name: 'Rose', value: 'from-rose-950 via-slate-950 to-black', dot: 'bg-rose-500' },
];

const AdminModules = () => {
  const { toast } = useToast();
  const [mods, setMods] = useState<LearningModule[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [editing, setEditing] = useState<LearningModule | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>(empty);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [codeFor, setCodeFor] = useState<LearningModule | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [showApi, setShowApi] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('learning_modules').select('*').order('sort_order');
    setMods((data as LearningModule[]) || []);
    const { data: p } = await supabase.from('module_progress').select('module_slug,completed_at,certificate_claimed_at');
    const s: Stats = {};
    (p || []).forEach((r: any) => {
      const x = (s[r.module_slug] = s[r.module_slug] || { learners: 0, completed: 0, certs: 0 });
      x.learners++;
      if (r.completed_at) x.completed++;
      if (r.certificate_claimed_at) x.certs++;
    });
    setStats(s);
  };

  useEffect(() => { load(); }, []);

  const uploadHtml = async (slug: string, body: Blob) => {
    const path = `${slug}/${Date.now()}.html`;
    const { error } = await supabase.storage.from('modules').upload(path, body, { contentType: 'text/html', upsert: true });
    if (error) throw error;
    return path;
  };

  const uploadCoverImage = async (file: File): Promise<string> => {
    setCoverUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('modules').upload(path, file, {
        contentType: file.type || 'image/png',
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('modules').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setCoverUploading(false);
    }
  };

  const saveMeta = async () => {
    if (!editing) return;
    const { error } = await supabase.from('learning_modules').update({
      title: editing.title,
      description: editing.description,
      category: editing.category,
      sort_order: editing.sort_order,
      is_published: editing.is_published,
      cover_image_url: editing.cover_image_url || null,
      theme_color: editing.theme_color || null,
    }).eq('id', editing.id);

    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    toast({ title: 'Module updated' });
    setEditing(null);
    load();
  };

  const create = async () => {
    const slug = draft.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug || !draft.title || !newFile) return toast({ title: 'Add a short name, title and an HTML file', variant: 'destructive' });
    setBusy(true);
    try {
      const path = await uploadHtml(slug, newFile);
      const { error } = await supabase.from('learning_modules').insert({
        ...draft,
        slug,
        storage_path: path,
        cover_image_url: draft.cover_image_url || null,
        theme_color: draft.theme_color || null,
      });
      if (error) throw error;
      setCreating(false);
      setDraft(empty);
      setNewFile(null);
      load();
      toast({ title: 'Module added' });
    } catch (e: any) {
      toast({ title: 'Could not add module', description: e.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  const replaceFile = async (m: LearningModule, f: File) => {
    try {
      const path = await uploadHtml(m.slug, f);
      await supabase.from('learning_modules').update({ storage_path: path }).eq('id', m.id);
      toast({ title: 'New version is live' });
      load();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  const openCode = async (m: LearningModule) => {
    setCodeFor(m);
    setCode('Loading…');
    try {
      setCode(await loadModuleHtml(m));
    } catch (e: any) {
      setCode('');
      toast({ title: e.message, variant: 'destructive' });
    }
  };

  const saveCode = async () => {
    if (!codeFor) return;
    setBusy(true);
    try {
      const path = await uploadHtml(codeFor.slug, new Blob([code], { type: 'text/html' }));
      await supabase.from('learning_modules').update({ storage_path: path }).eq('id', codeFor.id);
      toast({ title: 'Saved — learners now see this version' });
      setCodeFor(null);
      load();
    } catch (e: any) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  const revert = async (m: LearningModule) => {
    if (!m.default_path) return;
    if (!confirm('Go back to the original version of this module?')) return;
    await supabase.from('learning_modules').update({ storage_path: null }).eq('id', m.id);
    load();
  };

  const remove = async (m: LearningModule) => {
    if (!confirm(`Delete "${m.title}"? Learner progress records are kept.`)) return;
    await supabase.from('learning_modules').delete().eq('id', m.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modules & Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Customize cover visuals, theme palettes, and track real learner completion metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApi(true)}>
            <Code2 className="w-4 h-4 mr-2" />Module API
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />New module
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {mods.map((m) => {
          const s = stats[m.slug] || { learners: 0, completed: 0, certs: 0 };
          const completionRate = s.learners > 0 ? Math.round((s.completed / s.learners) * 100) : 0;

          return (
            <div key={m.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Module Header & Visual Thumbnail */}
              <div className="flex items-start gap-4 flex-1 min-w-[280px]">
                <div className="w-16 h-12 rounded-lg bg-slate-900 border border-border overflow-hidden shrink-0 relative">
                  {m.cover_image_url ? (
                    <img src={m.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-[10px] font-mono font-bold text-white/50">
                      ART
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {m.title}
                    {!m.is_published && (
                      <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.category} · <code className="text-foreground/80">{m.slug}</code> · Order #{m.sort_order}
                  </div>
                </div>
              </div>

              {/* Real Learner Metrics Display */}
              <div className="grid grid-cols-4 gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/60 text-center min-w-[280px]">
                <div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Started
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{s.learners}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Done
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{s.completed}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Percent className="w-3 h-3 text-primary" /> Rate
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{completionRate}%</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Award className="w-3 h-3 text-amber-500" /> Certs
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{s.certs}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <a href={`/modules/${m.slug}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost" title="Preview module">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => setEditing({ ...m })}>
                  Details & Art
                </Button>
                <Button size="sm" variant="outline" onClick={() => openCode(m)}>
                  <Code2 className="w-4 h-4 mr-1" />HTML
                </Button>
                <label>
                  <input
                    type="file"
                    accept=".html,text/html"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && replaceFile(m, e.target.files[0])}
                  />
                  <span className="inline-flex items-center h-8 px-2.5 rounded-md border border-input text-xs font-medium cursor-pointer hover:bg-accent">
                    <Upload className="w-3.5 h-3.5 mr-1" />Replace
                  </span>
                </label>
                {m.storage_path && m.default_path && (
                  <Button size="sm" variant="ghost" title="Revert to original" onClick={() => revert(m)}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(m)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog with Cover Image & Palette selection */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Module Customizer</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>

              <div>
                <Label>Short description</Label>
                <Textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Group / Category</Label>
                  <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>

              {/* Cover Art Settings */}
              <div className="space-y-2 p-3 rounded-xl border border-border bg-card/60">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Cover Artwork
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... or upload image"
                    value={editing.cover_image_url || ''}
                    onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })}
                  />
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadCoverImage(file);
                          setEditing({ ...editing, cover_image_url: url });
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={coverUploading} asChild>
                      <span className="cursor-pointer">
                        {coverUploading ? 'Uploading…' : 'Upload'}
                      </span>
                    </Button>
                  </label>
                </div>
                {editing.cover_image_url && (
                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-border mt-2 relative">
                    <img src={editing.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 text-xs"
                      onClick={() => setEditing({ ...editing, cover_image_url: '' })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Theme Palette Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Cover Theme Gradient</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setEditing({ ...editing, theme_color: p.value })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all ${
                        editing.theme_color === p.value
                          ? 'border-primary ring-2 ring-primary/30 font-semibold'
                          : 'border-border hover:border-foreground/40'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                      {p.name}
                    </button>
                  ))}
                  {editing.theme_color && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2 text-muted-foreground"
                      onClick={() => setEditing({ ...editing, theme_color: '' })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>Visible to learners</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveMeta}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Module Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New module</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <Label>Slug / short identifier (e.g. module-5-0)</Label>
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </div>
            <div>
              <Label>Short description</Label>
              <Textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Group / Category</Label>
                <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Cover image URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={draft.cover_image_url || ''}
                onChange={(e) => setDraft({ ...draft, cover_image_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Lesson HTML file</Label>
              <Input type="file" accept=".html,text/html" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={busy} onClick={create}>Add module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Editor Dialog */}
      <Dialog open={!!codeFor} onOpenChange={(o) => !o && setCodeFor(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit {codeFor?.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-xs h-[500px]"
          />
          <DialogFooter>
            <Button disabled={busy} onClick={saveCode}>Save HTML</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModules;
