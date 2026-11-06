import { useEffect, useState } from 'react';
import { Plus, Upload, Code2, ExternalLink, RotateCcw, Trash2 } from 'lucide-react';
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
const empty = { slug: '', title: '', description: '', category: 'Core', sort_order: 100 };

const AdminModules = () => {
  const { toast } = useToast();
  const [mods, setMods] = useState<LearningModule[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [editing, setEditing] = useState<LearningModule | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<any>(empty);
  const [newFile, setNewFile] = useState<File | null>(null);
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
      x.learners++; if (r.completed_at) x.completed++; if (r.certificate_claimed_at) x.certs++;
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

  const saveMeta = async () => {
    if (!editing) return;
    const { error } = await supabase.from('learning_modules').update({
      title: editing.title, description: editing.description, category: editing.category,
      sort_order: editing.sort_order, is_published: editing.is_published,
    }).eq('id', editing.id);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setEditing(null); load();
  };

  const create = async () => {
    const slug = draft.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug || !draft.title || !newFile) return toast({ title: 'Add a short name, title and an HTML file', variant: 'destructive' });
    setBusy(true);
    try {
      const path = await uploadHtml(slug, newFile);
      const { error } = await supabase.from('learning_modules').insert({ ...draft, slug, storage_path: path });
      if (error) throw error;
      setCreating(false); setDraft(empty); setNewFile(null); load();
      toast({ title: 'Module added' });
    } catch (e: any) { toast({ title: 'Could not add module', description: e.message, variant: 'destructive' }); }
    setBusy(false);
  };

  const replaceFile = async (m: LearningModule, f: File) => {
    try {
      const path = await uploadHtml(m.slug, f);
      await supabase.from('learning_modules').update({ storage_path: path }).eq('id', m.id);
      toast({ title: 'New version is live' }); load();
    } catch (e: any) { toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }); }
  };

  const openCode = async (m: LearningModule) => {
    setCodeFor(m); setCode('Loading…');
    try { setCode(await loadModuleHtml(m)); } catch (e: any) { setCode(''); toast({ title: e.message, variant: 'destructive' }); }
  };
  const saveCode = async () => {
    if (!codeFor) return;
    setBusy(true);
    try {
      const path = await uploadHtml(codeFor.slug, new Blob([code], { type: 'text/html' }));
      await supabase.from('learning_modules').update({ storage_path: path }).eq('id', codeFor.id);
      toast({ title: 'Saved — learners now see this version' }); setCodeFor(null); load();
    } catch (e: any) { toast({ title: 'Could not save', description: e.message, variant: 'destructive' }); }
    setBusy(false);
  };
  const revert = async (m: LearningModule) => {
    if (!m.default_path) return;
    if (!confirm('Go back to the original version of this module?')) return;
    await supabase.from('learning_modules').update({ storage_path: null }).eq('id', m.id); load();
  };
  const remove = async (m: LearningModule) => {
    if (!confirm(`Delete "${m.title}"? Learner progress records are kept.`)) return;
    await supabase.from('learning_modules').delete().eq('id', m.id); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modules</h1>
          <p className="text-muted-foreground text-sm">Upload or edit lesson modules. Changes go live straight away — no site changes needed.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApi(true)}><Code2 className="w-4 h-4 mr-2" />Module API</Button>
          <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" />New module</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {mods.map((m) => {
          const s = stats[m.slug];
          return (
            <div key={m.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <div className="font-medium text-foreground">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {m.category} · {m.slug} · {m.storage_path ? 'Edited version' : 'Original'} {m.is_published ? '' : '· Hidden'}
                  {s ? ` · ${s.learners} started, ${s.completed} finished, ${s.certs} certificates` : ''}
                </div>
              </div>
              <a href={`/modules/${m.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...m })}>Details</Button>
              <Button size="sm" variant="outline" onClick={() => openCode(m)}><Code2 className="w-4 h-4 mr-1" />Edit</Button>
              <label>
                <input type="file" accept=".html,text/html" className="hidden" onChange={(e) => e.target.files?.[0] && replaceFile(m, e.target.files[0])} />
                <span className="inline-flex items-center h-9 px-3 rounded-md border border-input text-sm cursor-pointer hover:bg-accent"><Upload className="w-4 h-4 mr-1" />Replace</span>
              </label>
              {m.storage_path && m.default_path && <Button size="sm" variant="ghost" title="Back to original" onClick={() => revert(m)}><RotateCcw className="w-4 h-4" /></Button>}
              <Button size="sm" variant="ghost" onClick={() => remove(m)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Module details</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Short description</Label><Textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Group</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><Label>Order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} /><Label>Visible to learners</Label></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveMeta}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New module</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div><Label>Short name (used in the link and for progress, e.g. module-5-0)</Label><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Group</Label><Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
              <div><Label>Order</Label><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></div>
            </div>
            <div><Label>HTML file</Label><Input type="file" accept=".html,text/html" onChange={(e) => setNewFile(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter><Button disabled={busy} onClick={create}>Add module</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!codeFor} onOpenChange={(o) => !o && setCodeFor(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Edit {codeFor?.title}</DialogTitle></DialogHeader>
          <Textarea value={code} onChange={(e) => setCode(e.target.value)} className="font-mono text-xs h-[65vh]" spellCheck={false} />
          <DialogFooter><Button disabled={busy} onClick={saveCode}>Save and publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApi} onOpenChange={setShowApi}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>How modules talk to the site</DialogTitle></DialogHeader>
          <div className="text-sm space-y-3 text-foreground">
            <p>Every module runs inside the site with a small helper added automatically. Existing modules need no changes:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><b>Progress</b> — anything saved to <code>localStorage["finlit-progress-&lt;moduleId&gt;"]</code> (set <code>window.FINLIT_MODULE = {'{'} moduleId, sections {'}'}</code>) is saved to the learner's account and restored on any device.</li>
              <li><b>Certificates</b> — calling <code>openCertModal()</code> records the claim (name and score) before opening the certificate.</li>
              <li><b>Yungsta practice</b> — embed <code>/sim/practice.html?embed=1&amp;practice=&lt;lesson&gt;</code>; finishing it is recorded automatically.</li>
              <li><b>Links</b> — links to <code>index.html</code> go back to the lessons list; links to <code>module-x-full.html</code> open that module.</li>
            </ul>
            <p>Modules can also call:</p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`FinLitBridge.track('badge_earned', { badge: 'saver' }) // record any event
FinLitBridge.home()                 // back to lessons
FinLitBridge.open('module-1-1')     // open another module
FinLitBridge.user                   // { id, email } when signed in, else null`}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModules;
