import { motion } from "framer-motion";
import { firstName, type Member } from "@/lib/team";
import { SectionLabel } from "./WorldSections";

/** Spotify's compact player. `member.spotifyTracks` only holds validated ids, so the iframe src is always a Spotify track embed. */
export function SpotifyTracks({ member }: { member: Member }) {
  const name = firstName(member.name);

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-6">
      <SectionLabel>On repeat</SectionLabel>
      <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
        {name}'s soundtrack.
      </h2>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">The songs {name} can't stop playing.</p>

      <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
        {member.spotifyTracks.map((id, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: (i % 2) * 0.08 }}
            className="overflow-hidden rounded-3xl shadow-soft"
          >
            <iframe
              title={`${name}'s track ${i + 1} on Spotify`}
              src={`https://open.spotify.com/embed/track/${id}?utm_source=generator`}
              width="100%"
              height="152"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="block border-0"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
