import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Mail, Phone, Trash2, User } from 'lucide-react';
import { ApplicationField } from '@/components/programs/ApplicationFieldBuilder';

interface Program {
  id: string;
  title: string;
  application_fields: ApplicationField[];
}

interface Application {
  id: string;
  program_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  responses: Record<string, string>;
  status: string;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const STATUSES = ['pending', 'reviewing', 'accepted', 'rejected'];

const statusColor: Record<string, string> = {
  pending: 'bg-muted text-foreground',
  reviewing: 'bg-blue-100 text-blue-900',
  accepted: 'bg-green-100 text-green-900',
  rejected: 'bg-red-100 text-red-900',
};

const AdminApplications = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    const [{ data: progs }, { data: apps }] = await Promise.all([
      supabase.from('programs').select('id,title,application_fields').order('title'),
      supabase.from('program_applications').select('*').order('created_at', { ascending: false }),
    ]);
    setPrograms(
      ((progs as any[]) || []).map((p) => ({
        ...p,
        application_fields: (p.application_fields as ApplicationField[]) || [],
      })),
    );
    setApplications(
      ((apps as any[]) || []).map((a) => ({
        ...a,
        responses: (a.responses as Record<string, string>) || {},
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = applications.filter((a) => {
    if (selectedProgramId !== 'all' && a.program_id !== selectedProgramId) return false;
    if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;
    return true;
  });

  const openView = (a: Application) => {
    setViewing(a);
    setNotes(a.reviewer_notes || '');
  };

  const updateStatus = async (id: string, status: string) => {
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from('program_applications')
      .update({ status, reviewed_by: userData.user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    toast({ title: `Marked as ${status}` });
    fetchData();
    if (viewing?.id === id) setViewing((v) => (v ? { ...v, status } : v));
  };

  const saveNotes = async () => {
    if (!viewing) return;
    await supabase.from('program_applications').update({ reviewer_notes: notes }).eq('id', viewing.id);
    toast({ title: 'Notes saved' });
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    await supabase.from('program_applications').delete().eq('id', id);
    setViewing(null);
    fetchData();
  };

  const programById = (id: string) => programs.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Program Applications</h1>
        <p className="text-muted-foreground">Review and evaluate applications submitted for each program.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const prog = programById(a.program_id);
            return (
              <button
                key={a.id}
                onClick={() => openView(a)}
                className="w-full bg-card rounded-xl p-4 shadow-soft text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{a.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{prog?.title || 'Unknown program'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail size={12} /> {a.applicant_email}</span>
                        {a.applicant_phone && <span className="flex items-center gap-1"><Phone size={12} /> {a.applicant_phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusColor[a.status] || 'bg-muted'}`}>{a.status}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (() => {
            const prog = programById(viewing.program_id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{viewing.applicant_name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{prog?.title}</p>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Email:</span> {viewing.applicant_email}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {viewing.applicant_phone || '—'}</div>
                    <div><span className="text-muted-foreground">Submitted:</span> {new Date(viewing.created_at).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Status:</span> <span className={`text-xs px-2 py-1 rounded ${statusColor[viewing.status]}`}>{viewing.status}</span></div>
                  </div>

                  {prog && prog.application_fields.length > 0 && (
                    <div className="border-t pt-4 space-y-3">
                      <h3 className="font-semibold">Responses</h3>
                      {prog.application_fields.map((f) => (
                        <div key={f.id}>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-sm whitespace-pre-wrap">{viewing.responses[f.id] || <span className="text-muted-foreground italic">No answer</span>}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <Label>Reviewer notes</Label>
                    <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    <Button variant="outline" size="sm" onClick={saveNotes}>Save notes</Button>
                  </div>

                  <div className="border-t pt-4 flex flex-wrap gap-2 justify-between">
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <Button key={s} size="sm" variant={viewing.status === s ? 'default' : 'outline'} onClick={() => updateStatus(viewing.id, s)}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(viewing.id)}>
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApplications;
