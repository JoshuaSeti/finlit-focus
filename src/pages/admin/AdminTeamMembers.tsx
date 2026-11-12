import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MemberPhoto } from "@/components/team/MemberPhoto";
import { slugify, toMember, type Member } from "@/lib/team";
import { emptyExtras, extrasFromMember, extrasProblems, extrasToRow, type MemberExtras } from "@/lib/team.extras";
import { MemberExtrasFields } from "@/components/admin/MemberExtrasFields";

const ACCENTS = [
  // Greens and blues
  { name: "Forest", accent: "oklch(0.46 0.12 158)", ink: "oklch(0.98 0.01 150)" },
  { name: "Mint", accent: "oklch(0.82 0.12 165)", ink: "oklch(0.22 0.04 165)" },
  { name: "Lime", accent: "oklch(0.8 0.2 125)", ink: "oklch(0.22 0.05 130)" },
  { name: "Teal", accent: "oklch(0.55 0.1 195)", ink: "oklch(0.98 0.01 195)" },
  { name: "Sky", accent: "oklch(0.78 0.12 230)", ink: "oklch(0.2 0.04 240)" },
  { name: "Ocean", accent: "oklch(0.5 0.12 240)", ink: "oklch(0.98 0.01 240)" },
  { name: "Cobalt", accent: "oklch(0.45 0.2 265)", ink: "oklch(0.98 0.01 265)" },
  // Purples and pinks
  { name: "Indigo", accent: "oklch(0.4 0.18 285)", ink: "oklch(0.98 0.01 285)" },
  { name: "Violet", accent: "oklch(0.55 0.22 300)", ink: "oklch(0.98 0.01 300)" },
  { name: "Lavender", accent: "oklch(0.82 0.09 295)", ink: "oklch(0.24 0.05 295)" },
  { name: "Orchid", accent: "oklch(0.6 0.25 330)", ink: "oklch(0.98 0.01 330)" },
  { name: "Plum", accent: "oklch(0.36 0.1 340)", ink: "oklch(0.98 0.01 340)" },
  { name: "Berry", accent: "oklch(0.5 0.17 350)", ink: "oklch(0.98 0.01 350)" },
  { name: "Rose", accent: "oklch(0.85 0.09 10)", ink: "oklch(0.25 0.05 10)" },
  // Reds, oranges and yellows
  { name: "Crimson", accent: "oklch(0.52 0.21 25)", ink: "oklch(0.98 0.01 25)" },
  { name: "Coral", accent: "oklch(0.68 0.17 28)", ink: "oklch(0.22 0.04 28)" },
  { name: "Copper", accent: "oklch(0.6 0.15 50)", ink: "oklch(0.99 0.01 60)" },
  { name: "Tangerine", accent: "oklch(0.74 0.17 55)", ink: "oklch(0.22 0.04 55)" },
  { name: "Peach", accent: "oklch(0.86 0.09 55)", ink: "oklch(0.25 0.04 55)" },
  { name: "Sunrise", accent: "oklch(0.8 0.15 85)", ink: "oklch(0.22 0.03 70)" },
  { name: "Gold", accent: "oklch(0.84 0.15 95)", ink: "oklch(0.24 0.04 90)" },
  // Neutrals
  { name: "Sand", accent: "oklch(0.88 0.04 85)", ink: "oklch(0.28 0.03 70)" },
  { name: "Night", accent: "oklch(0.28 0.03 260)", ink: "oklch(0.97 0.01 260)" },
  { name: "Ink", accent: "oklch(0.18 0 0)", ink: "oklch(0.98 0 0)" },
];

/** Dark or light text for a custom #rrggbb colour, whichever reads better on it. */
function inkForHex(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#1a1a1a" : "#fafafa";
}
const HEX = /^#[0-9a-f]{6}$/i;

type Form = {
  id?: string;
  name: string; role: string; slug: string; photo_url: string; accent: string; accent_ink: string;
  tagline: string; location: string; story: string; aspiration_quote: string; goals: string;
  interests: string; facts: string; dots: string; secret: string; is_active: boolean;
  extras: MemberExtras;
};

const empty: Form = {
  name: "", role: "", slug: "", photo_url: "", accent: ACCENTS[0]!.accent, accent_ink: ACCENTS[0]!.ink,
  tagline: "", location: "", story: "", aspiration_quote: "", goals: "", interests: "", facts: "", dots: "", secret: "", is_active: true,
  extras: emptyExtras,
};

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function toForm(m: Member): Form {
  return {
    id: m.id, name: m.name, role: m.role, slug: m.slug, photo_url: m.photo ?? "", accent: m.accent, accent_ink: m.accentInk,
    tagline: m.tagline, location: m.location, story: m.story.join("\n\n"), aspiration_quote: m.aspiration.quote,
    goals: m.aspiration.goals.join("\n"), interests: m.interests.map((i) => `${i.emoji} ${i.label}`).join("\n"),
    facts: m.facts.join("\n"), dots: m.dots.join("\n"), secret: m.secret, is_active: m.isActive,
    extras: extrasFromMember(m),
  };
}

function parseInterests(s: string) {
  return lines(s).map((l) => {
    const [first, ...rest] = l.split(" ");
    const isEmoji = first && !/^[\p{L}\p{N}]/u.test(first);
    return isEmoji ? { emoji: first, label: rest.join(" ") || first } : { emoji: "✨", label: l };
  });
}

export default function AdminTeamMembers() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [editing, setEditing] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);

  const listQ = useQuery({
    queryKey: ["admin", "team"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("display_order").order("created_at");
      if (error) throw error;
      return (data ?? []).map(toMember);
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "team"] });
    qc.invalidateQueries({ queryKey: ["team"] });
  };

  const save = useMutation({
    mutationFn: async (f: Form) => {
      if (!f.name.trim()) throw new Error("Name is required");
      const problems = extrasProblems(f.extras);
      if (problems.length) throw new Error(problems[0]);
      const row = {
        full_name: f.name.trim().slice(0, 120), role: f.role.trim().slice(0, 120), slug: slugify(f.slug || f.name).slice(0, 80),
        image_url: f.photo_url || null, accent: f.accent, accent_ink: f.accent_ink,
        tagline: f.tagline.trim().slice(0, 300), location: f.location.trim().slice(0, 120),
        story: f.story.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        aspiration_quote: f.aspiration_quote.trim().slice(0, 500), goals: lines(f.goals),
        interests: parseInterests(f.interests), facts: lines(f.facts), dots: lines(f.dots).slice(0, 6),
        secret: f.secret.trim().slice(0, 500), is_active: f.is_active,
        ...extrasToRow(f.extras),
      };
      const res = f.id
        ? await supabase.from("team_members").update(row).eq("id", f.id)
        : await supabase.from("team_members").insert(row);
      if (res.error) throw res.error;
    },
    onSuccess: () => { toast.success("Saved"); setEditing(null); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const toggle = useMutation({
    mutationFn: async (m: Member) => {
      const { error } = await supabase.from("team_members").update({ is_active: !m.isActive }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (m: Member) => {
      const { error } = await supabase.from("team_members").delete().eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); setDeleting(null); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove"),
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="mb-4 h-16 w-16 text-destructive" />
        <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only super admins can manage team members.</p>
      </div>
    );
  }

  return (
    <div>
      <main>
        {(
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Team members</h1>
                <p className="text-muted-foreground">Everyone shown here appears as a card on the About page: executives on the right, friends of FinLit on the left.</p>
              </div>
              <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> Add member</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listQ.data?.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  <div className="h-44 [container-type:inline-size]"><MemberPhoto member={m} /></div>
                  <div className="p-4">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.role}</p>
                    {m.group === "community" && <p className="mt-1 text-xs font-medium text-primary">Friends of FinLit</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={m.isActive} onCheckedChange={() => toggle.mutate(m)} /> {m.isActive ? "Shown" : "Hidden"}
                      </label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(toForm(m))} aria-label={`Edit ${m.name}`}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(m)} aria-label={`Remove ${m.name}`}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {listQ.data?.length === 0 && <p className="text-muted-foreground">No team members yet. Add the first one.</p>}
            </div>
          </>
        )}
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
          {editing && <MemberForm form={editing} setForm={setEditing} onSave={() => save.mutate(editing)} saving={save.isPending} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Their profile will be deleted. To keep it for later, hide it instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Uploads to the same bucket as the profile photo and returns a long-lived link. Used by the gallery. */
async function uploadTeamPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("team-photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("team-photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2) throw e2;
  return data.signedUrl;
}

function MemberForm({ form, setForm, onSave, saving }: { form: Form; setForm: (f: Form) => void; onSave: () => void; saving: boolean }) {
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("team-photos").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data, error: e2 } = await supabase.storage.from("team-photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (e2) throw e2;
      setForm({ ...form, photo_url: data.signedUrl });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const preview = toMember({
    id: "preview", slug: form.slug, name: form.name || "New Member", role: form.role, photo_url: form.photo_url || null,
    accent: form.accent, accent_ink: form.accent_ink, tagline: "", location: "", story: [], aspiration_quote: "", goals: [],
    interests: [], facts: [], dots: [], secret: "", is_active: true, created_at: "", updated_at: "",
  });

  const field = (k: keyof Form, label: string, hint?: string, area?: number) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      {area ? (
        <Textarea id={k} rows={area} value={form[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <Input id={k} value={form[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-28 w-24 overflow-hidden rounded-2xl [container-type:inline-size]"><MemberPhoto member={preview} /></div>
        <div className="space-y-2">
          <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </Label>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button key={a.name} type="button" title={a.name} onClick={() => setForm({ ...form, accent: a.accent, accent_ink: a.ink })}
                className={`h-7 w-7 rounded-full border-2 ${form.accent === a.accent ? "border-foreground" : "border-transparent"}`}
                style={{ background: a.accent }} />
            ))}
            <label
              title="Pick any colour"
              className={`relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 ${ACCENTS.some((a) => a.accent === form.accent) ? "border-transparent" : "border-foreground"}`}
              style={{ background: ACCENTS.some((a) => a.accent === form.accent) ? "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" : form.accent }}
            >
              <input
                type="color"
                aria-label="Custom colour"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={HEX.test(form.accent) ? form.accent : "#4f46e5"}
                onChange={(e) => setForm({ ...form, accent: e.target.value, accent_ink: inkForHex(e.target.value) })}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Their colour sets the mood of their world. The rainbow circle picks any colour.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Full name")}
        {field("role", "Role")}
        {field("location", "Location")}
        {field("slug", "Profile link", "Leave empty to create it from the name.")}
      </div>
      {field("tagline", "Tagline", "One short line about them.")}
      {field("story", "Background", "Separate paragraphs with an empty line.", 5)}
      {field("aspiration_quote", "Aspiration quote")}
      {field("goals", "Goals", "One per line.", 3)}
      {field("interests", "Interests", "One per line, start with an emoji, e.g. ⚽ Football", 4)}
      {field("facts", "Fun facts", "One per line — these drift across the threads.", 4)}
      {field("dots", "Connect-the-dots labels", "Up to 6, one per line.", 4)}
      {field("secret", "Secret revealed after connecting the dots")}
      <MemberExtrasFields value={form.extras} onChange={(extras) => setForm({ ...form, extras })} onUploadImage={uploadTeamPhoto} />
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Show on the About page
      </label>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
