import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { shuffleWithinGroups, splitByGroup, type Member } from "@/lib/team";
import { MemberPhoto } from "./MemberPhoto";

// Card sizes in px. Friends of FinLit cards are a little smaller than executive cards.
const EXEC = { w: 150, h: 210 };
const COMM = { w: 120, h: 168 };
const GAP = 14; // between the two columns
const PAD_X = 14; // panel side padding
const GUTTER = 24; // strip of page left uncovered when open on a phone, so a tap there closes it
const PEEK = 52; // how much of the stack sticks out of the edge when closed
const HEAD = 36; // room for the column titles
const PAD_Y = 56;
const STEP_RATIO = 0.64; // how far each card overlaps the next one in a column

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function MemberCard({
  m,
  compact,
  onOpen,
}: {
  m: Member;
  compact?: boolean;
  onOpen: (m: Member, el: HTMLElement) => void;
}) {
  return (
    <button
      onClick={(e) => onOpen(m, e.currentTarget)}
      className="group relative h-full w-full overflow-hidden rounded-3xl border border-border bg-card text-left shadow-card [container-type:inline-size]"
      aria-label={`Open ${m.name}'s profile`}
    >
      <MemberPhoto member={m} />
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent pt-10 ${
          compact ? "p-2.5" : "p-3"
        }`}
      >
        <p className={`font-semibold leading-tight text-background ${compact ? "text-[13px]" : "text-sm"}`}>{m.name}</p>
        <p className={`text-background/80 ${compact ? "text-[11px]" : "text-xs"}`}>{m.role}</p>
      </div>
    </button>
  );
}

function SoonCard() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/70 p-4 text-center backdrop-blur-xl">
      <span className="text-2xl">✦</span>
      <p className="mt-2 text-xs font-medium text-muted-foreground">More faces coming soon</p>
    </div>
  );
}

type Item = { key: string; member: Member | null };
type ColDef = { key: string; label: string; base: { w: number; h: number }; items: Item[] };
type Placed = Item & {
  w: number;
  h: number;
  x: number; // open position, relative to the panel's left edge
  y: number;
  rot: number;
  stack: number; // position in the closed, fanned stack
  compact: boolean;
};

const toItem = (m: Member): Item => ({ key: m.id, member: m });

/** Works out where every card goes, closed (one fanned stack on the edge) and open (two columns). */
function buildLayout(ordered: Member[], vw: number, vh: number) {
  const { executive, community } = splitByGroup(ordered);
  const defs: ColDef[] = [
    { key: "community", label: "Friends of FinLit", base: COMM, items: community.map(toItem) },
    { key: "executive", label: "Executive team", base: EXEC, items: executive.map(toItem) },
  ].filter((c) => c.items.length > 0);
  if (defs.length === 0) defs.push({ key: "executive", label: "Executive team", base: EXEC, items: [] });
  // "More faces coming soon" closes the last column.
  defs[defs.length - 1]?.items.push({ key: "soon", member: null });

  // Shrink everything a touch on narrow phones so both columns and the tab fit.
  const baseW = PAD_X * 2 + defs.reduce((n, c) => n + c.base.w, 0) + GAP * (defs.length - 1);
  const s = clamp((vw - GUTTER) / baseW, 0.7, 1);

  let cursor = PAD_X;
  const cols = defs.map((c) => {
    const w = Math.round(c.base.w * s);
    const h = Math.round(c.base.h * s);
    const col = { ...c, w, h, x: cursor, step: Math.round(h * STEP_RATIO) };
    cursor += w + GAP;
    return col;
  });
  const panelW = cursor - GAP + PAD_X;

  const spans = cols.map((c) => (c.items.length - 1) * c.step + c.h);
  const tallest = Math.max(...spans);
  // Centre the columns when they fit, otherwise start at the top and let the panel scroll.
  const startY = Math.max(PAD_Y + HEAD, (vh - tallest) / 2);
  const contentH = Math.max(vh, startY + tallest + PAD_Y);

  const placed: Placed[] = cols.flatMap((c, ci) =>
    c.items.map((it, row) => ({
      ...it,
      w: c.w,
      h: c.h,
      x: c.x,
      y: startY + row * c.step,
      rot: (row + ci) % 2 ? 1.5 : -1.5,
      stack: 0,
      compact: c.base === COMM,
    })),
  );

  // Closed stack order: executives first, then friends, then the "soon" card.
  const rank = (p: Placed) => (p.member ? (p.member.group === "executive" ? 0 : 1) : 2);
  const order = [...placed].sort((a, b) => rank(a) - rank(b) || a.y - b.y);
  order.forEach((p, i) => (p.stack = i));

  return {
    cols,
    placed: order,
    panelW,
    startY,
    contentH,
    stackW: Math.round(EXEC.w * s),
    stackH: Math.round(EXEC.h * s),
  };
}

export function TeamEdgeStack({ members }: { members: Member[] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [expanding, setExpanding] = useState<{ member: Member; rect: DOMRect } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [{ vw, vh }, setSize] = useState({ vw: 1024, vh: 800 });
  // Executives first, then the community; shuffled within each group after load
  // so the server and the browser render the same thing first.
  const [ordered, setOrdered] = useState(() => {
    const g = splitByGroup(members);
    return [...g.executive, ...g.community];
  });
  useEffect(() => setOrdered(shuffleWithinGroups(members)), [members]);

  useEffect(() => {
    const update = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Tap anywhere outside the panel and the tab to close. Esc closes too.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (rootRef.current?.contains(t) || t.closest("[data-edge-hit]")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) rootRef.current?.scrollTo({ top: 0 });
  }, [open]);

  const L = useMemo(() => buildLayout(ordered, vw, vh), [ordered, vw, vh]);
  const total = L.placed.length;
  const mid = (total - 1) / 2;

  const openMember = (m: Member, el: HTMLElement) => {
    if (!open) return setOpen(true);
    setExpanding({ member: m, rect: el.getBoundingClientRect() });
  };

  // Desktop only: hover opens, leaving (after a short grace period) closes.
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  return (
    <>
      {/* Soft panel behind the two columns, only visible when open. */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : 24 }}
        transition={{ duration: 0.25 }}
        className="pointer-events-none fixed inset-y-0 right-0 z-[39] rounded-l-[2rem] border-l border-border bg-background/75 shadow-card backdrop-blur-xl"
        style={{ width: L.panelW }}
      />

      {/* Small close button, only while open. */}
      <button
        data-edge-hit
        aria-label="Close team panel"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className="fixed right-3 z-[41] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-soft backdrop-blur-xl transition-opacity duration-200"
        style={{
          top: "max(0.75rem, env(safe-area-inset-top, 0px))",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <X className="h-4 w-4" />
      </button>

      <div
        ref={rootRef}
        className="fixed inset-y-0 right-0 z-40 overflow-x-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          width: L.panelW,
          overflowY: open ? "auto" : "hidden",
          pointerEvents: open ? "auto" : "none",
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") window.clearTimeout(closeTimer.current);
        }}
        onPointerLeave={hoverLeave}
      >
        <div className="relative" style={{ height: L.contentH, width: L.panelW }}>
          {L.cols.map((c) => (
            <motion.p
              key={c.key}
              initial={false}
              animate={{ opacity: open ? 1 : 0, y: open ? 0 : 8 }}
              transition={{ duration: 0.25, delay: open ? 0.15 : 0 }}
              className="pointer-events-none absolute text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              style={{ left: c.x, top: L.startY - HEAD + 6, width: c.w }}
            >
              {c.label}
            </motion.p>
          ))}

          {L.placed.map((p) => {
            const offset = p.stack - mid;
            return (
              <motion.div
                key={p.key}
                onPointerEnter={hoverOpen}
                className="pointer-events-auto absolute left-0 top-0"
                style={{ zIndex: total - p.stack }}
                initial={false}
                animate={
                  open
                    ? { x: p.x, y: p.y, rotate: p.rot, width: p.w, height: p.h }
                    : {
                        x: L.panelW - PEEK + Math.min(p.stack * 5, 25),
                        y: vh / 2 - L.stackH / 2 + offset * 14,
                        rotate: clamp(offset * -6, -24, 24),
                        width: L.stackW,
                        height: L.stackH,
                      }
                }
                transition={{ type: "spring", stiffness: 240, damping: 24, delay: open ? p.stack * 0.03 : 0 }}
                whileHover={open ? { scale: 1.03 } : {}}
              >
                {p.member ? <MemberCard m={p.member} compact={p.compact} onOpen={openMember} /> : <SoonCard />}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {expanding && (
          <motion.div
            className="fixed z-50 overflow-hidden [container-type:inline-size]"
            initial={{
              top: expanding.rect.top,
              left: expanding.rect.left,
              width: expanding.rect.width,
              height: expanding.rect.height,
              borderRadius: 24,
            }}
            animate={{ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            style={{ background: expanding.member.accent }}
            onAnimationComplete={() =>
              navigate(`/team/${expanding.member.slug}`)
            }
          >
            <motion.div className="h-full w-full" animate={{ opacity: 0.25, scale: 1.1 }} transition={{ duration: 0.7 }}>
              <MemberPhoto member={expanding.member} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
