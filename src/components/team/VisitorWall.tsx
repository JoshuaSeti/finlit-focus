import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { firstName, type Member } from "@/lib/team";
import { postNote, wallQuery } from "@/lib/wall.queries";
import { SectionLabel } from "./WorldSections";

const MAX = 280;
const COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = "finlit-wall-last-post";

function onCooldown() {
  try {
    return Date.now() - Number(localStorage.getItem(COOLDOWN_KEY) ?? 0) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function VisitorWall({ member }: { member: Member }) {
  const qc = useQueryClient();
  const name = firstName(member.name);
  const { data: notes = [] } = useQuery(wallQuery(member.id));
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => postNote(member.id, author, message),
    onSuccess: () => {
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch {
        /* storage unavailable */
      }
      setMessage("");
      setSent(true);
      setError(null);
      qc.invalidateQueries({ queryKey: ["wall", member.id] });
    },
    onError: () => setError("Couldn't send your note. Please try again."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) return; // honeypot: bots fill hidden fields
    if (!message.trim()) return;
    if (onCooldown()) return setError("Please wait a moment before sending another note.");
    setSent(false);
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-6">
      <SectionLabel>Visitor wall</SectionLabel>
      <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
        Leave a note for {name}.
      </h2>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Say thanks, share a memory, or send some encouragement.
      </p>

      <form onSubmit={submit} className="relative mt-8 overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-card md:mt-10 md:p-8">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={40}
          placeholder="Your name (optional)"
          aria-label="Your name (optional)"
          className="w-full border-0 border-b border-border bg-transparent pb-3 text-lg outline-none placeholder:text-muted-foreground focus:border-[var(--member)]"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
          rows={4}
          placeholder={`Write something for ${name}…`}
          aria-label={`Your note for ${name}`}
          className="mt-5 w-full resize-none border-0 bg-transparent text-lg md:text-xl outline-none placeholder:text-muted-foreground"
        />
        {/* Honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden
          name="website"
        />
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{message.length}/{MAX}</span>
          <button
            type="submit"
            disabled={mutation.isPending || !message.trim()}
            className="rounded-full px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: member.accent, color: member.accentInk }}
          >
            {mutation.isPending ? "Sending…" : "Post to the wall"}
          </button>
        </div>
        <AnimatePresence>
          {(sent || error) && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              className={`mt-4 text-sm font-medium ${error ? "text-destructive" : "text-[var(--member)]"}`}
            >
              {error ?? `Thank you! Your note for ${name} is on the wall.`}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {notes.length === 0 ? (
        <p className="mt-14 text-center text-muted-foreground">Be the first to leave a note for {name}.</p>
      ) : (
        <div className="mt-12 gap-4 md:mt-14 md:columns-2 lg:columns-3">
          {notes.map((n, i) => (
            <motion.figure
              key={n.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="mb-4 break-inside-avoid rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <blockquote className="text-lg leading-snug">{n.message}</blockquote>
              <figcaption className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--member)]" />
                <span className="font-medium text-foreground">{n.author}</span>
                <span>·</span>
                <time dateTime={n.createdAt}>
                  {new Date(n.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </time>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      )}
    </div>
  );
}
