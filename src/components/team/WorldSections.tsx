import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { firstName, shuffle, type Duel, type Member } from "@/lib/team";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">{word}</motion.span>;
}

export function ScrollRevealParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className="text-3xl font-semibold leading-snug tracking-tight md:text-5xl">
      {words.map((w, i) => (
        <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
      ))}
    </p>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--member)]">{children}</p>;
}

export function Aspiration({ member }: { member: Member }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} className="mx-auto max-w-5xl">
      <SectionLabel>Aspirations</SectionLabel>
      <motion.blockquote style={{ scale, opacity }} className="text-4xl font-semibold leading-tight tracking-tight md:text-7xl">
        “{member.aspiration.quote}”
      </motion.blockquote>
      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {member.aspiration.goals.map((g, i) => (
          <motion.li
            key={g}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <span className="text-sm font-semibold text-[var(--member)]">0{i + 1}</span>
            <p className="mt-2 text-lg font-medium">{g}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function Interests({ member }: { member: Member }) {
  return (
    <div className="mx-auto max-w-5xl">
      <SectionLabel>Interests</SectionLabel>
      <div className="flex flex-wrap gap-4">
        {member.interests.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3 rounded-full border border-border bg-card px-6 py-4 text-lg font-medium shadow-soft"
            >
              <span className="text-2xl">{it.emoji}</span>
              {it.label}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const THREADS = [
  "M -200 90 C 150 10, 450 170, 750 80 S 1150 20, 1500 110",
  "M -200 200 C 200 260, 500 130, 800 210 S 1200 280, 1500 190",
  "M -200 300 C 120 240, 520 360, 820 290 S 1180 230, 1500 320",
  "M -200 410 C 250 470, 480 350, 780 420 S 1150 480, 1500 400",
  "M -200 500 C 180 450, 560 540, 860 480 S 1220 440, 1500 510",
];

export function FactThreads({ member }: { member: Member }) {
  if (member.facts.length === 0) return null;
  return (
    <div>
      <div className="mx-auto max-w-5xl px-6">
        <SectionLabel>Threads of facts</SectionLabel>
        <p className="max-w-xl text-lg text-muted-foreground">Little things that make {firstName(member.name)} who they are, drifting by.</p>
      </div>
      <svg viewBox="0 0 1200 580" preserveAspectRatio="xMidYMid slice" className="mt-6 h-[520px] w-full text-[var(--member)]">
        {THREADS.map((d, i) => {
          // Shorter loops, and each thread starts part-way along its path so facts
          // are already on screen when the section scrolls into view.
          const dur = 13 + i * 2;
          return (
            <g key={i} className="thread-sway" style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${6 + i}s` }}>
              <path id={`thread-${i}`} d={d} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />
              <text className="fill-foreground text-[19px] font-medium">
                <textPath href={`#thread-${i}`} startOffset="100%">
                  {member.facts[i % member.facts.length]}
                  <animate attributeName="startOffset" from="100%" to="-60%" dur={`${dur}s`} begin={`${-dur * (0.25 + (i % 3) * 0.2)}s`} repeatCount="indefinite" />
                </textPath>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ThisOrThat({ member }: { member: Member }) {
  const [deck, setDeck] = useState<Duel[]>(member.thisOrThat);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<"a" | "b" | null>(null);
  const [matches, setMatches] = useState(0);
  // Random order each visit; shuffled after mount so server and browser render the same first.
  useEffect(() => setDeck(shuffle(member.thisOrThat)), [member.thisOrThat]);
  if (deck.length === 0) return null;

  const done = step >= deck.length;
  const duel = deck[step];
  const pct = Math.round((matches / deck.length) * 100);
  const name = firstName(member.name);

  const choose = (side: "a" | "b") => {
    if (chosen || !duel) return;
    setChosen(side);
    if (side === duel.pick) setMatches((m) => m + 1);
    window.setTimeout(() => {
      setChosen(null);
      setStep((n) => n + 1);
    }, 1100);
  };

  const restart = () => {
    setDeck(shuffle(member.thisOrThat));
    setStep(0);
    setMatches(0);
    setChosen(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-6">
      <SectionLabel>This or that</SectionLabel>
      <p className="max-w-xl text-lg text-muted-foreground">Pick one each time. How much do you and {name} have in common?</p>
      <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-card md:p-10">
        <div className="mb-6 flex gap-1.5" aria-hidden>
          {deck.map((_, i) => (
            <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < step ? "var(--member)" : "color-mix(in oklab, var(--member) 18%, transparent)" }} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          {!done && duel ? (
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-2 gap-4">
                {(["a", "b"] as const).map((side) => {
                  const picked = chosen === side;
                  const theirs = chosen !== null && duel.pick === side;
                  return (
                    <motion.button
                      key={side}
                      onClick={() => choose(side)}
                      whileTap={{ scale: 0.96 }}
                      animate={{ scale: picked ? 1.04 : chosen ? 0.96 : 1, opacity: chosen && !picked && !theirs ? 0.45 : 1 }}
                      className="relative flex min-h-40 items-center justify-center rounded-3xl border-2 p-4 text-center text-xl font-semibold md:min-h-52 md:text-2xl"
                      style={{ borderColor: theirs ? "var(--member)" : "hsl(var(--border))", background: picked ? "color-mix(in oklab, var(--member) 14%, transparent)" : undefined }}
                    >
                      {duel[side]}
                      {theirs && (
                        <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 bottom-3 text-xs font-semibold uppercase tracking-widest text-[var(--member)]">
                          {name}'s pick
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <p className="mt-5 h-5 text-center text-sm font-medium text-muted-foreground">
                {chosen ? (chosen === duel.pick ? `Same as ${name}! ✓` : `${name} went the other way`) : `${step + 1} of ${deck.length}`}
              </p>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--member)]">You and {name}</p>
              <p className="mt-2 text-7xl font-semibold tracking-tighter md:text-8xl">{pct}%</p>
              <p className="mt-3 text-lg text-muted-foreground">
                {pct >= 80 ? "Basically twins." : pct >= 50 ? "More alike than you'd think." : pct >= 25 ? "Different tastes, great conversation." : "Total opposites — the best kind of team."}
              </p>
              <button onClick={restart} className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">Play again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const pos = (i: number): [number, number] => (DOT_POS[i] as [number, number] | undefined) ?? [50, 50];
const DOT_POS: [number, number][] = [
  [12, 30], [34, 14], [58, 32], [82, 18], [70, 70], [30, 74],
];

export function ConnectTheDots({ member }: { member: Member }) {
  const [count, setCount] = useState(0);
  const dots = member.dots.slice(0, DOT_POS.length);
  const done = count >= dots.length;
  return (
    <div className="mx-auto max-w-5xl px-6">
      <SectionLabel>Connect the dots</SectionLabel>
      <p className="max-w-xl text-lg text-muted-foreground">Tap the glowing dots in order to uncover something about {firstName(member.name)}.</p>
      <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
        <svg viewBox="0 0 160 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {dots.slice(0, Math.max(0, count - 1)).map((_, i) => (
            <motion.line
              key={i}
              x1={pos(i)[0] * 1.6} y1={pos(i)[1]} x2={pos(i + 1)[0] * 1.6} y2={pos(i + 1)[1]}
              stroke={member.accent}
              strokeWidth={0.4} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
            />
          ))}
          {done && (
            <motion.line
              x1={pos(dots.length - 1)[0] * 1.6} y1={pos(dots.length - 1)[1]} x2={pos(0)[0] * 1.6} y2={pos(0)[1]}
              stroke={member.accent} strokeWidth={0.4} strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
            />
          )}
        </svg>
        {dots.map((label, i) => {
          const active = i < count;
          const next = i === count;
          return (
            <button
              key={label}
              onClick={() => next && setCount((c) => c + 1)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos(i)[0]}%`, top: `${pos(i)[1]}%` }}
              aria-label={next ? `Connect dot ${i + 1}` : label}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-[var(--member)] ${next ? "glow-dot" : ""}`}
                style={{ opacity: active || next ? 1 : 0.35 }}
              />
              {active && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow-soft"
                >
                  {label}
                </motion.span>
              )}
            </button>
          );
        })}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="absolute left-1/2 top-1/2 w-[80%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-background/90 p-6 text-center shadow-card backdrop-blur-xl"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--member)]">Unlocked</p>
            <p className="mt-2 text-xl font-semibold">{member.secret}</p>
            <button onClick={() => setCount(0)} className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline">Play again</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
