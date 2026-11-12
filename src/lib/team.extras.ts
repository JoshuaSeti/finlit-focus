import { parseSpotifyTrackId, toMember, type Duel, type GalleryItem, type Member, type MemberGroup, type TeamRow } from "@/lib/team";

/**
 * The newer per-member fields, in the shape the dashboard form edits them.
 * Keep this in your form state and turn it into database columns with `extrasToRow` on save.
 */
export type MemberExtras = {
  group: MemberGroup;
  gallery: GalleryItem[];
  /** Whatever was typed or pasted (links, spotify: URIs or bare ids). Validated on save. */
  spotify: string[];
  thisOrThat: Duel[];
};

export const MAX_GALLERY = 12;
export const MAX_SPOTIFY = 6;
export const MAX_DUELS = 10;

export const emptyExtras: MemberExtras = { group: "executive", gallery: [], spotify: [], thisOrThat: [] };

export function extrasFromMember(m: Pick<Member, "group" | "gallery" | "spotifyTracks" | "thisOrThat">): MemberExtras {
  return {
    group: m.group,
    gallery: m.gallery.map((g) => ({ ...g })),
    spotify: [...m.spotifyTracks],
    thisOrThat: m.thisOrThat.map((d) => ({ ...d })),
  };
}

export const extrasFromRow = (row: TeamRow): MemberExtras => extrasFromMember(toMember(row));

const SAFE_IMAGE_URL = /^(https?:\/\/|\/(?!\/))/i;
export const isSafeImageUrl = (u: string) => SAFE_IMAGE_URL.test(u.trim());

/** Human-readable problems that would make some of the input get dropped on save. Empty array = good to go. */
export function extrasProblems(e: MemberExtras): string[] {
  const out: string[] = [];
  e.gallery.forEach((g, i) => {
    if (g.url.trim() && !isSafeImageUrl(g.url)) out.push(`Gallery photo ${i + 1}: the link must start with http(s)://`);
  });
  e.spotify.forEach((s, i) => {
    if (s.trim() && !parseSpotifyTrackId(s)) out.push(`Spotify song ${i + 1}: that isn't a Spotify track link`);
  });
  e.thisOrThat.forEach((d, i) => {
    const a = d.a.trim();
    const b = d.b.trim();
    if ((a && !b) || (!a && b)) out.push(`This or that ${i + 1}: fill in both options`);
  });
  return out;
}

/** Column values for `team_members`. Spread these into your insert/update payload. */
export function extrasToRow(e: MemberExtras) {
  const gallery = e.gallery
    .map((g) => ({ url: g.url.trim(), alt: g.alt.trim(), caption: g.caption.trim() }))
    .filter((g) => isSafeImageUrl(g.url))
    .slice(0, MAX_GALLERY)
    .map((g) => ({ url: g.url, ...(g.alt ? { alt: g.alt } : {}), ...(g.caption ? { caption: g.caption } : {}) }));

  const spotify_tracks = Array.from(
    new Set(e.spotify.map((s) => parseSpotifyTrackId(s)).filter((id): id is string => id !== null)),
  ).slice(0, MAX_SPOTIFY);

  const this_or_that = e.thisOrThat
    .map((d) => ({ a: d.a.trim(), b: d.b.trim(), pick: d.pick }))
    .filter((d) => d.a && d.b)
    .slice(0, MAX_DUELS);

  return {
    member_group: e.group,
    gallery,
    spotify_tracks,
    this_or_that,
  };
}
