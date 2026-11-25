import { createClient } from "npm:@supabase/supabase-js@2";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import { avatarObjectPath } from "./avatar-source.ts";
import { isPreviewCrawler } from "./preview-crawler.ts";

const SITE = "https://finlit-zm.org";
const FALLBACK_IMG = `${SITE}/og-image.png`;
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/** Convert oklch()/hex colours into hex the image renderer understands. */
function toHex(c: string, fallback: string): string {
  const t = (c || "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return t;
  const m = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i.exec(t);
  if (!m) return fallback;
  const L = m[2] ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[3]), h = (parseFloat(m[4]) * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return "#" + lin.map((v) => {
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, g)) * 255).toString(16).padStart(2, "0");
  }).join("");
}

let fontCache: ArrayBuffer | null = null;
async function blackFont() {
  if (fontCache) return fontCache;
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@900", { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30" } })).text();
  const url = /src:\s*url\(([^)]+)\)/.exec(css)?.[1];
  fontCache = await (await fetch(url!)).arrayBuffer();
  return fontCache;
}

function page(o: { title: string; desc: string; image: string; url: string; self: string; type: string }) {
  const t = esc(o.title), d = esc(o.desc), i = esc(o.image), u = esc(o.url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${t}</title>
<meta name="description" content="${d}"><link rel="canonical" href="${u}">
<meta property="og:site_name" content="FinLit Zambia"><meta property="og:type" content="${o.type}">
<meta property="og:title" content="${t}"><meta property="og:description" content="${d}">
<meta property="og:url" content="${esc(o.self)}"><meta property="og:image" content="${i}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}"><meta name="twitter:image" content="${i}">
<meta http-equiv="refresh" content="0;url=${u}"></head>
<body><script>location.replace(${JSON.stringify(o.url)})</script><a href="${u}">Continue to FinLit</a></body></html>`;
}

const h = React.createElement;

async function learnerPhoto(profile: { id: string; avatar_url?: string | null }): Promise<string | null> {
  const origin = Deno.env.get("SUPABASE_URL");
  if (!origin) return null;
  const { data: owner } = await db.from("profiles").select("user_id").eq("id", profile.id).maybeSingle();
  if (!owner) return null;
  const path = avatarObjectPath(profile.avatar_url, origin, owner.user_id);
  if (!path) return null;
  // Download through the trusted storage client, never fetch a profile-provided address.
  const { data: blob, error } = await db.storage.from("avatars").download(path);
  if (error || !blob || blob.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) return null;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

Deno.serve(async (req) => {
  const q = new URL(req.url).searchParams;
  const self = `${Deno.env.get("SUPABASE_URL")}/functions/v1/share?${q.toString()}`;
  const crawler = isPreviewCrawler(req.headers.get("user-agent"));
  try {
    // Rendered card for a team world
    if (q.get("img") === "team") {
      const slug = q.get("slug") ?? "";
      const { data: m } = await db.from("team_members").select("full_name,role,image_url,accent,accent_ink").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (!m) return Response.redirect(FALLBACK_IMG, 302);
      const bg = toHex(m.accent, "#064e3b"), ink = toHex(m.accent_ink, "#ffffff");
      const first = m.full_name.split(/\s+/)[0].toUpperCase();
      const size = Math.min(420, Math.floor(1900 / Math.max(first.length, 3)));
      return new ImageResponse(
        h("div", { style: { width: "100%", height: "100%", display: "flex", position: "relative", background: bg, color: ink, fontFamily: "Inter", overflow: "hidden" } },
          h("div", { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.85, opacity: 0.95 } }, first),
          m.image_url ? h("img", { src: m.image_url, width: 420, height: 520, style: { position: "absolute", left: 390, bottom: 0, width: 420, height: 520, objectFit: "cover", borderRadius: "28px 28px 0 0", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" } }) : null,
          h("div", { style: { position: "absolute", left: 48, bottom: 40, display: "flex", flexDirection: "column", fontSize: 30, fontWeight: 900 } },
            h("div", { style: { display: "flex" } }, m.full_name), h("div", { style: { display: "flex", fontSize: 22, opacity: 0.8 } }, m.role || "FinLit Team")),
          h("div", { style: { position: "absolute", right: 48, top: 40, display: "flex", fontSize: 28, fontWeight: 900, padding: "8px 18px", border: `3px solid ${ink}`, borderRadius: 999 } }, "FinLit"),
        ),
        { width: 1200, height: 630, fonts: [{ name: "Inter", data: await blackFont(), weight: 900, style: "normal" }], headers: { "Cache-Control": "public, max-age=3600" } },
      );
    }

    // Rendered card for a learner profile
    if (q.get("img") === "u") {
      const id = q.get("id") ?? "";
      const { data: p } = /^[0-9a-f-]{36}$/i.test(id)
        ? await db.rpc("learner_card", { p_profile: id })
        : { data: null };
      if (!p) return Response.redirect(FALLBACK_IMG, 302);
      const photo = await learnerPhoto(p);
      const bg = "#064e3b", ink = "#f0fdf4";
      const first = (p.name || "LEARNER").split(/\s+/)[0].toUpperCase();
      const size = Math.min(380, Math.floor(1800 / Math.max(first.length, 3)));
      return new ImageResponse(
        h("div", { style: { width: "100%", height: "100%", display: "flex", position: "relative", background: bg, color: ink, fontFamily: "Inter", overflow: "hidden" } },
          h("div", { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.85, opacity: 0.25 } }, first),
          photo
            ? h("img", { src: photo, width: 400, height: 490, style: { position: "absolute", left: 400, bottom: 0, width: 400, height: 490, objectFit: "cover", borderRadius: "32px 32px 0 0", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" } })
            : h("div", { style: { position: "absolute", left: 440, bottom: 60, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 160 } }, p.avatar || "🦁"),
          h("div", { style: { position: "absolute", left: 48, bottom: 44, display: "flex", flexDirection: "column", fontSize: 32, fontWeight: 900 } },
            h("div", { style: { display: "flex" } }, p.name),
            h("div", { style: { display: "flex", fontSize: 20, opacity: 0.75, marginTop: 4 } }, p.town ? `FinLit Learner · ${p.town}` : "FinLit Learner"),
          ),
          h("div", { style: { position: "absolute", right: 48, top: 40, display: "flex", fontSize: 26, fontWeight: 900, padding: "8px 18px", border: `3px solid ${ink}`, borderRadius: 999 } }, "FinLit"),
        ),
        { width: 1200, height: 630, fonts: [{ name: "Inter", data: await blackFont(), weight: 900, style: "normal" }], headers: { "Cache-Control": "public, max-age=3600" } },
      );
    }

    if (q.get("t") === "blog") {
      const id = q.get("id") ?? "";
      const url = `${SITE}/blog/${encodeURIComponent(id)}`;
      if (!crawler) return redirect(url);
      const { data: p } = /^[0-9a-f-]{36}$/i.test(id) ? await db.from("blog_posts").select("title,excerpt,content,image_url").eq("id", id).eq("is_published", true).maybeSingle() : { data: null };
      if (!p) return redirect(url);
      return html(page({ title: p.title, desc: clip(strip(p.excerpt || p.content || "Read on FinLit Zambia."), 180), image: p.image_url || FALLBACK_IMG, url, self, type: "article" }));
    }

    if (q.get("t") === "team") {
      const slug = q.get("slug") ?? "";
      const url = `${SITE}/team/${encodeURIComponent(slug)}`;
      if (!crawler) return redirect(url);
      const { data: m } = await db.from("team_members").select("full_name,role,tagline").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (!m) return redirect(url);
      const img = `${Deno.env.get("SUPABASE_URL")}/functions/v1/share?img=team&slug=${encodeURIComponent(slug)}`;
      return html(page({ title: `Step into ${m.full_name}'s world · FinLit`, desc: clip(m.tagline || `${m.role} at FinLit Zambia.`, 180), image: img, url, self, type: "profile" }));
    }

    if (q.get("t") === "u") {
      const id = q.get("id") ?? "";
      const url = `${SITE}/u/${encodeURIComponent(id)}`;
      if (!crawler) return redirect(url);
      const { data: p } = /^[0-9a-f-]{36}$/i.test(id)
        ? await db.rpc("learner_card", { p_profile: id })
        : { data: null };
      if (!p) return redirect(url);

      const title = `${p.name} · FinLit Learner`;
      const desc = p.bio || `Learn money skills with ${p.name} in Zambia on FinLit. Free placement diagnostic and lessons.`;
      
      // Dynamic lightweight social preview card (under 50KB for WhatsApp)
      const img = `${Deno.env.get("SUPABASE_URL")}/functions/v1/share?img=u&id=${encodeURIComponent(id)}`;

      return html(page({ title, desc, image: img, url, self, type: "profile" }));
    }
  } catch (e) {
    console.error("share failed", e);
  }
  return redirect(SITE);
});

function redirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store", Vary: "User-Agent" },
  });
}

function html(body: string) {
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", Vary: "User-Agent" },
  });
}
