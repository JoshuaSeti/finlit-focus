import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { firstName, splitName } from "@/lib/team";
import { memberQuery, teamQuery } from "@/lib/team.queries";
import { MemberPhoto } from "@/components/team/MemberPhoto";
import { FitName } from "@/components/team/FitName";
import { VisitorWall } from "@/components/team/VisitorWall";
import { MemberGallery } from "@/components/team/MemberGallery";
import { SpotifyTracks } from "@/components/team/SpotifyTracks";
import { Aspiration, ConnectTheDots, FactThreads, Interests, ScrollRevealParagraph, SectionLabel, ThisOrThat } from "@/components/team/WorldSections";

const EASE = [0.32, 0.72, 0, 1] as [number, number, number, number];

const nameClass =
  "relative z-0 block max-w-full select-none whitespace-nowrap text-center font-black uppercase leading-[0.85] tracking-tighter text-[length:clamp(3.5rem,27vw,22rem)]";

/** True when the text colour that goes with an accent is light, i.e. the accent itself is dark. */
function inkIsLight(ink: string) {
  const ok = /oklch\(\s*([\d.]+)(%?)/i.exec(ink);
  if (ok) {
    const l = parseFloat(ok[1] ?? "0");
    return (ok[2] ? l / 100 : l) > 0.6;
  }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(ink.trim());
  if (hex) {
    let h = hex[1] ?? "000";
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }
  return false;
}

// One type system for every world: Apple's system font, a notch heavier than the defaults,
// with headings the heaviest and tightest. Scoped to .world-type so the rest of the site is untouched.
const WORLD_TYPE_CSS = `
div.world-type{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Inter,system-ui,sans-serif;font-weight:500;letter-spacing:-0.011em;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-feature-settings:"kern","liga","calt"}
.world-type .font-medium{font-weight:600}
.world-type .font-semibold{font-weight:700}
.world-type h2.font-semibold,.world-type blockquote.font-semibold,.world-type p.font-semibold.leading-snug{font-weight:800}
.world-type .font-black{font-weight:900}
.world-type h1,.world-type h2,.world-type blockquote{letter-spacing:-0.035em}
.world-type h2{line-height:1.04}
`;

export default function MemberWorld() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery(memberQuery(slug));
  const { data: team = [] } = useQuery(teamQuery());
  useEffect(() => {
    if (data) document.title = `${data.name} — FinLit team`;
  }, [data]);
  const reduce = useReducedMotion();

  // The opening scene reacts to scrolling: the name splits apart, the photo drifts and shrinks,
  // everything fades out, and the bottom of the scene melts into the page.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const enterTop = useMotionValue(-40);
  const enterBottom = useMotionValue(40);
  useEffect(() => {
    const a = animate(enterTop, 0, { duration: 0.9, ease: EASE });
    const b = animate(enterBottom, 0, { duration: 0.9, ease: EASE });
    return () => {
      a.stop();
      b.stop();
    };
  }, [enterTop, enterBottom]);
  const scrollTop = useTransform(p, [0, 1], [0, -120]);
  const scrollBottom = useTransform(p, [0, 1], [0, 120]);
  const topY = useTransform([enterTop, scrollTop], ([a, b]) => Number(a ?? 0) + Number(b ?? 0));
  const bottomY = useTransform([enterBottom, scrollBottom], ([a, b]) => Number(a ?? 0) + Number(b ?? 0));
  const photoY = useTransform(p, [0, 1], [0, 70]);
  const photoScale = useTransform(p, [0, 1], [1, 0.86]);
  const groupOpacity = useTransform(p, [0.1, 0.8], [1, 0]);
  const metaOpacity = useTransform(p, [0, 0.35], [1, 0]);
  const metaY = useTransform(p, [0, 0.5], [0, -50]);
  const hintOpacity = useTransform(p, [0, 0.12], [1, 0]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  if (!data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-lg">This team member isn't here.</p>
      <Link to="/about" className="rounded-full bg-foreground px-5 py-2 text-sm text-background">Back to About</Link>
    </div>
  );
  const member = data;
  const idx = team.findIndex((m) => m.slug === member.slug);
  const nameParts = splitName(member.name, member.role);
  const next = team.length > 1 ? team[(idx + 1) % team.length] : null;

  // Dark, tinted ink on light colours; light ink on dark colours so the name never disappears.
  const nameInk = inkIsLight(member.accentInk)
    ? `color-mix(in oklab, ${member.accentInk} 94%, var(--member))`
    : "color-mix(in oklab, black 85%, var(--member))";
  const nameStyle = { color: nameInk, WebkitTextStroke: `0.045em ${nameInk}` };

  return (
    <div style={{ ["--member" as string]: member.accent }} className="world-type bg-background font-apple text-foreground">
      <style>{WORLD_TYPE_CSS}</style>
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col overflow-hidden" style={{ background: member.accent, color: member.accentInk }}>
        <Link to="/about" className="absolute left-6 top-[max(1.5rem,env(safe-area-inset-top,0px))] z-20 inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-2 text-sm font-medium backdrop-blur-xl">
          <ArrowLeft className="h-4 w-4" /> About
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-[calc(6rem+env(safe-area-inset-top,0px))]">
          <h1 className="sr-only">{member.name}</h1>
          <motion.div style={reduce ? undefined : { opacity: groupOpacity }} className="relative flex w-full flex-col items-center">
            <FitName
              aria-hidden
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE }}
              className={nameClass + " -mb-[0.3em]"} style={reduce ? nameStyle : { ...nameStyle, y: topY }}
            >
              {nameParts.top}
            </FitName>
            <motion.div style={reduce ? undefined : { y: photoY, scale: photoScale }} className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE }}
                className="aspect-[4/5] w-[min(62vw,340px)] overflow-hidden rounded-[2.5rem] shadow-card [container-type:inline-size]"
              >
                <MemberPhoto member={member} />
              </motion.div>
            </motion.div>
            <FitName
              aria-hidden
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE }}
              className={nameClass + " -mt-[0.3em]"} style={reduce ? nameStyle : { ...nameStyle, y: bottomY }}
            >
              {nameParts.bottom}
            </FitName>
          </motion.div>
          <motion.div style={reduce ? undefined : { opacity: metaOpacity, y: metaY }} className="flex flex-col items-center">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.85, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 text-lg font-medium">{member.role}</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.5 }} className="mt-3 max-w-md text-center text-xl">{member.tagline}</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.6 }} className="mt-4 inline-flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{member.location}</motion.p>
          </motion.div>
        </div>
        {/* The bottom of the scene melts into the page colour instead of ending on a hard line. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[42svh] bg-gradient-to-b from-transparent to-background" />
        <motion.div style={reduce ? undefined : { opacity: hintOpacity }} className="relative z-10">
          <motion.p animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="pb-8 text-center text-sm font-medium opacity-70">Scroll into their world ↓</motion.p>
        </motion.div>
      </section>

      <div className="relative">
        {/* A wash of their colour carries on past the fade, then dissolves. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-80"
          style={{ background: "radial-gradient(70% 100% at 50% 0%, color-mix(in oklab, var(--member) 28%, transparent), transparent 75%)" }}
        />
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 56 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative mx-auto max-w-5xl space-y-12 px-6 py-20 md:space-y-16 md:py-32"
        >
          <SectionLabel>Background</SectionLabel>
          {member.story.map((p) => <ScrollRevealParagraph key={p} text={p} />)}
        </motion.section>
      </div>

      <section className="px-6 py-20 md:py-32"><Aspiration member={member} /></section>
      <section className="px-6 py-16 md:py-24"><Interests member={member} /></section>
      {member.gallery.length > 0 && (
        <section className="py-16 md:py-24"><MemberGallery member={member} /></section>
      )}
      <section className="py-16 md:py-24"><FactThreads member={member} /></section>
      <section className="py-16 md:py-24"><ThisOrThat member={member} /></section>
      <section className="py-16 md:py-24"><ConnectTheDots member={member} /></section>
      {member.spotifyTracks.length > 0 && (
        <section className="py-16 md:py-24"><SpotifyTracks member={member} /></section>
      )}

      <section className="py-20 md:py-32"><VisitorWall member={member} /></section>

      <section className="px-6 py-20 text-center md:py-32">
        <p className="text-muted-foreground">Thanks for visiting {firstName(member.name)}'s world.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/about" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">Back to the team</Link>
          {next && (
            <Link to={`/team/${next.slug}`} className="rounded-full border border-border px-6 py-3 text-sm font-medium">
              Next: {next.name} →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
