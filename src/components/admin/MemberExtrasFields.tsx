import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { parseSpotifyTrackId, type MemberGroup } from "@/lib/team";
import {
  extrasProblems,
  isSafeImageUrl,
  MAX_DUELS,
  MAX_GALLERY,
  MAX_SPOTIFY,
  type MemberExtras,
} from "@/lib/team.extras";

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-40";
const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground";

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {hint && <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </fieldset>
  );
}

const GROUPS: { value: MemberGroup; label: string; sub: string }[] = [
  { value: "executive", label: "Executive team", sub: "Right column" },
  { value: "community", label: "Friends of FinLit", sub: "Community, left column" },
];

/**
 * Dashboard fields for: team group, gallery, Spotify songs and "this or that".
 * Controlled: pass the `MemberExtras` from your form state and update it in `onChange`.
 * `onUploadImage` is optional. Pass your existing photo uploader (File in, public URL out) to get an Upload button.
 */
export function MemberExtrasFields({
  value,
  onChange,
  onUploadImage,
}: {
  value: MemberExtras;
  onChange: (next: MemberExtras) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const set = (patch: Partial<MemberExtras>) => onChange({ ...value, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const problems = extrasProblems(value);

  const upload = async (files: FileList | null) => {
    if (!files || !onUploadImage) return;
    setUploading(true);
    setUploadError(null);
    try {
      const added = [];
      for (const f of Array.from(files).slice(0, MAX_GALLERY - value.gallery.length)) {
        added.push({ url: await onUploadImage(f), alt: "", caption: "" });
      }
      set({ gallery: [...value.gallery, ...added] });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      {/* Group */}
      <Block title="Where they appear" hint="Executives show in the right column of the edge stack, friends in the left one.">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Team group">
          {GROUPS.map((g) => {
            const on = value.group === g.value;
            return (
              <button
                key={g.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ group: g.value })}
                className={`rounded-xl border px-3 py-3 text-left ${
                  on ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <span className="block text-sm font-semibold">{g.label}</span>
                <span className="block text-xs text-muted-foreground">{g.sub}</span>
              </button>
            );
          })}
        </div>
      </Block>

      {/* Gallery */}
      <Block title={`Gallery (${value.gallery.length}/${MAX_GALLERY})`} hint="Photos from their world. Paste an image link, or upload.">
        {value.gallery.map((g, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {isSafeImageUrl(g.url) && <img src={g.url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <input
                className={input}
                placeholder="Image link (https://…)"
                value={g.url}
                onChange={(e) => set({ gallery: value.gallery.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
              />
              <input
                className={input}
                placeholder="Caption (optional)"
                value={g.caption}
                onChange={(e) => set({ gallery: value.gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })}
              />
              <input
                className={input}
                placeholder="Short description for screen readers (optional)"
                value={g.alt}
                onChange={(e) => set({ gallery: value.gallery.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })}
              />
            </div>
            <button
              type="button"
              aria-label={`Remove gallery photo ${i + 1}`}
              className={iconBtn}
              onClick={() => set({ gallery: value.gallery.filter((_, j) => j !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ghostBtn}
            disabled={value.gallery.length >= MAX_GALLERY}
            onClick={() => set({ gallery: [...value.gallery, { url: "", alt: "", caption: "" }] })}
          >
            <Plus className="h-4 w-4" /> Add by link
          </button>
          {onUploadImage && (
            <>
              <button
                type="button"
                className={ghostBtn}
                disabled={uploading || value.gallery.length >= MAX_GALLERY}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photos"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
            </>
          )}
        </div>
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      </Block>

      {/* Spotify */}
      <Block title={`Spotify songs (${value.spotify.length}/${MAX_SPOTIFY})`} hint="In Spotify: Share → Copy link to song. Paste it here.">
        {value.spotify.map((s, i) => {
          const ok = !s.trim() || parseSpotifyTrackId(s) !== null;
          return (
            <div key={i} className="space-y-1">
              <div className="flex gap-2">
                <input
                  className={`${input} ${ok ? "" : "border-destructive"}`}
                  placeholder="https://open.spotify.com/track/…"
                  inputMode="url"
                  value={s}
                  onChange={(e) => set({ spotify: value.spotify.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                <button
                  type="button"
                  aria-label={`Remove song ${i + 1}`}
                  className={iconBtn}
                  onClick={() => set({ spotify: value.spotify.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!ok && <p className="text-xs text-destructive">That isn't a Spotify track link.</p>}
            </div>
          );
        })}
        <button
          type="button"
          className={ghostBtn}
          disabled={value.spotify.length >= MAX_SPOTIFY}
          onClick={() => set({ spotify: [...value.spotify, ""] })}
        >
          <Plus className="h-4 w-4" /> Add a song
        </button>
      </Block>

      {/* This or that */}
      <Block title={`This or that (${value.thisOrThat.length}/${MAX_DUELS})`} hint="Two options, then tick the one they'd pick.">
        {value.thisOrThat.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              {(["a", "b"] as const).map((side) => (
                <div key={side} className="space-y-1">
                  <input
                    className={input}
                    placeholder={side === "a" ? "This…" : "…or that"}
                    value={d[side]}
                    onChange={(e) =>
                      set({ thisOrThat: value.thisOrThat.map((x, j) => (j === i ? { ...x, [side]: e.target.value } : x)) })
                    }
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="radio"
                      name={`duel-${i}`}
                      checked={d.pick === side}
                      onChange={() => set({ thisOrThat: value.thisOrThat.map((x, j) => (j === i ? { ...x, pick: side } : x)) })}
                    />
                    Their pick
                  </label>
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label={`Remove duel ${i + 1}`}
              className={iconBtn}
              onClick={() => set({ thisOrThat: value.thisOrThat.filter((_, j) => j !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={ghostBtn}
          disabled={value.thisOrThat.length >= MAX_DUELS}
          onClick={() => set({ thisOrThat: [...value.thisOrThat, { a: "", b: "", pick: "a" }] })}
        >
          <Plus className="h-4 w-4" /> Add a duel
        </button>
      </Block>

      {problems.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-destructive">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
