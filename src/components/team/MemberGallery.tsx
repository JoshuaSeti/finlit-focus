import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { firstName, type GalleryItem, type Member } from "@/lib/team";
import { SectionLabel } from "./WorldSections";

// Each print is tilted a little differently so the set feels scattered on a table, not gridded.
const TILTS = [-2, 1.5, -1, 2, -1.5];

function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 px-4 backdrop-blur-sm"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl"
        style={{ top: "max(1rem, env(safe-area-inset-top, 0px))" }}
      >
        <X className="h-5 w-5" />
      </button>
      <motion.img
        initial={{ scale: 0.94 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.94 }}
        src={item.url}
        alt={item.alt}
        className="max-h-[80svh] max-w-full rounded-2xl object-contain"
      />
      {item.caption && <p className="max-w-md text-center text-white/80">{item.caption}</p>}
    </motion.div>
  );
}

/**
 * Phones: a swipeable row of tilted prints that snap into place.
 * md and up: a scattered masonry collage that straightens on hover.
 * Tap or click any photo to see it in full.
 */
export function MemberGallery({ member }: { member: Member }) {
  const name = firstName(member.name);
  const [active, setActive] = useState<number | null>(null);
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  const close = useCallback(() => setActive(null), []);

  const items = member.gallery.filter((g) => !broken.has(g.url));
  if (items.length === 0) return null;
  const current = active !== null ? items[active] : undefined;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 h-2/3 opacity-60 blur-3xl"
        style={{ background: "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--member) 22%, transparent), transparent)" }}
      />
      <div className="relative mx-auto max-w-5xl">
        <div className="px-5 md:px-6">
          <SectionLabel>Moments</SectionLabel>
          <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
            Snapshots from {name}'s world.
          </h2>
        </div>

        <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mt-8 md:block md:columns-2 md:gap-6 md:overflow-visible md:px-6 lg:columns-3">
          {items.map((g, i) => {
            const tilt = TILTS[i % TILTS.length] ?? 0;
            return (
              <motion.figure
                key={g.url}
                initial={{ opacity: 0, y: 30, rotate: tilt * 2 }}
                whileInView={{ opacity: 1, y: 0, rotate: tilt }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: (i % 3) * 0.06 }}
                className="w-[74%] shrink-0 snap-center rounded-[1.75rem] bg-card p-2 shadow-card md:mb-6 md:w-auto md:break-inside-avoid"
              >
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View photo: ${g.alt}`}
                  className="block w-full overflow-hidden rounded-[1.25rem]"
                >
                  <div className="aspect-[4/5] md:aspect-auto">
                    <img
                      src={g.url}
                      alt={g.alt}
                      loading="lazy"
                      decoding="async"
                      onError={() => setBroken((prev) => new Set(prev).add(g.url))}
                      className="h-full w-full object-cover md:h-auto"
                    />
                  </div>
                </button>
                {g.caption && <figcaption className="px-3 pb-2 pt-3 text-sm text-muted-foreground">{g.caption}</figcaption>}
              </motion.figure>
            );
          })}
        </div>
      </div>

      <AnimatePresence>{current && <Lightbox key="lightbox" item={current} onClose={close} />}</AnimatePresence>
    </div>
  );
}
