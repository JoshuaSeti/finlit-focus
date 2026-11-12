import type { Database } from "@/integrations/supabase/types";

export type TeamRow = Database["public"]["Tables"]["team_members"]["Row"];

export type Duel = { a: string; b: string; pick: "a" | "b" };

export type MemberGroup = "executive" | "community";

export type GalleryItem = { url: string; alt: string; caption: string };

export type Member = {
  id: string;
  slug: string;
  name: string;
  role: string;
  photo: string | null;
  accent: string;
  accentInk: string;
  tagline: string;
  location: string;
  story: string[];
  aspiration: { quote: string; goals: string[] };
  interests: { label: string; emoji: string }[];
  facts: string[];
  dots: string[];
  secret: string;
  thisOrThat: Duel[];
  gallery: GalleryItem[];
  /** Validated 22-character Spotify track ids. */
  spotifyTracks: string[];
  isActive: boolean;
  group: MemberGroup;
};

function parseDuels(raw: unknown): Duel[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((d) => {
    const x = d as { a?: unknown; b?: unknown; pick?: unknown } | null;
    if (!x || !x.a || !x.b || (x.pick !== "a" && x.pick !== "b")) return [];
    return [{ a: String(x.a), b: String(x.b), pick: x.pick as "a" | "b" }];
  });
}

const SAFE_IMAGE_URL = /^(https?:\/\/|\/(?!\/))/i;
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

/** Accepts a plain URL string or `{ url, alt?, caption? }`; skips anything that isn't an http(s) or site-relative URL. */
function parseGallery(raw: unknown, owner: string): GalleryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .flatMap((g): GalleryItem[] => {
      const x: { url?: unknown; alt?: unknown; caption?: unknown } | null =
        typeof g === "string" ? { url: g } : (g as { url?: unknown; alt?: unknown; caption?: unknown } | null);
      const url = typeof x?.url === "string" ? x.url.trim() : "";
      if (!SAFE_IMAGE_URL.test(url)) return [];
      const caption = typeof x?.caption === "string" ? x.caption.trim() : "";
      const alt = typeof x?.alt === "string" && x.alt.trim() ? x.alt.trim() : caption || `Photo from ${owner}'s world`;
      return [{ url, alt, caption }];
    })
    .slice(0, 12);
}

/** Track id from an open.spotify.com link, a `spotify:track:` URI, or a bare id; null if it isn't a valid track. */
export function parseSpotifyTrackId(input: string): string | null {
  const s = input.trim();
  if (SPOTIFY_ID.test(s)) return s;
  const uri = s.match(/^spotify:track:([A-Za-z0-9]{22})$/);
  if (uri) return uri[1] ?? null;
  try {
    const u = new URL(s);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(/\/track\/([A-Za-z0-9]{22})(?:\/|$)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseSpotifyTracks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw
    .map((t) => (typeof t === "string" ? parseSpotifyTrackId(t) : null))
    .filter((id): id is string => id !== null);
  return Array.from(new Set(ids)).slice(0, 6);
}

export function toMember(r: TeamRow): Member {
  const interests = Array.isArray(r.interests)
    ? (r.interests as { label?: unknown; emoji?: unknown }[]).map((i) => ({
        label: String(i?.label ?? ""),
        emoji: String(i?.emoji ?? "✨"),
      }))
    : [];
  return {
    id: r.id,
    slug: r.slug ?? r.id,
    name: r.full_name,
    role: r.role,
    photo: r.image_url,
    accent: r.accent,
    accentInk: r.accent_ink,
    tagline: r.tagline,
    location: r.location,
    story: r.story,
    aspiration: { quote: r.aspiration_quote, goals: r.goals },
    interests,
    facts: r.facts,
    dots: r.dots,
    secret: r.secret,
    // Optional jsonb column `this_or_that`; ignored until it exists in the database.
    thisOrThat: parseDuels((r as Record<string, unknown>)["this_or_that"]),
    // Optional `gallery` (jsonb) and `spotify_tracks` (text[]) columns; empty until they exist.
    gallery: parseGallery((r as Record<string, unknown>)["gallery"], r.full_name),
    spotifyTracks: parseSpotifyTracks((r as Record<string, unknown>)["spotify_tracks"]),
    isActive: r.is_active ?? true,
    // `member_group` column ('executive' | 'community'); defaults to executive until it exists.
    group: (r as Record<string, unknown>)["member_group"] === "community" ? "community" : "executive",
  };
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

/** Fisher–Yates shuffle; returns a new array so the source order stays intact. */
export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitByGroup(members: readonly Member[]) {
  return {
    executive: members.filter((m) => m.group === "executive"),
    community: members.filter((m) => m.group === "community"),
  };
}

/** Executives first, then community; each group shuffled on its own. */
export function shuffleWithinGroups(members: readonly Member[]): Member[] {
  const { executive, community } = splitByGroup(members);
  return [...shuffle(executive), ...shuffle(community)];
}

/** First word above the photo, the rest below; falls back to `fallback` for single names. */
export function splitName(name: string, fallback = "") {
  const parts = name.trim().split(/\s+/);
  return { top: parts[0] ?? name, bottom: parts.slice(1).join(" ") || fallback };
}
