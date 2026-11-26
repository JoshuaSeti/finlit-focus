import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { avatarObjectPath } from "../_shared/avatar-source.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const origin = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const payload = await req.json().catch(() => ({}));
    const profileId = typeof payload?.profileId === "string" ? payload.profileId.trim() : "";
    if (!UUID_RE.test(profileId)) return json({ error: "Not found" }, 404);

    let callerId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (token && token !== anonKey) {
      const userClient = createClient(origin, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await userClient.auth.getUser(token);
      callerId = data.user?.id ?? null;
    }

    const db = createClient(origin, serviceKey);
    const { data: profile } = await db
      .from("profiles")
      .select("id,user_id,show_publicly,avatar_url")
      .eq("id", profileId)
      .maybeSingle();

    if (!profile || !profile.avatar_url) return json({ error: "Not found" }, 404);

    if (!profile.show_publicly) {
      if (!callerId) return json({ error: "Forbidden" }, 403);
      if (callerId !== profile.user_id) {
        const [{ data: roles }, { data: friend }] = await Promise.all([
          db.from("user_roles").select("role").eq("user_id", callerId),
          db.from("learner_friends").select("user_id").eq("user_id", profile.user_id).eq("friend_id", callerId).maybeSingle(),
        ]);
        const isAdmin = !!roles?.some((r: { role: string }) => r.role === "admin" || r.role === "super_admin");
        if (!isAdmin && !friend) return json({ error: "Forbidden" }, 403);
      }
    }

    const path = avatarObjectPath(profile.avatar_url, origin, profile.user_id);
    if (!path) return json({ error: "Not found" }, 404);

    const { data: blob, error } = await db.storage.from("avatars").download(path);
    if (error || !blob || blob.size > 3 * 1024 * 1024 || !ALLOWED_TYPES.has(blob.type)) {
      return json({ error: "Not found" }, 404);
    }

    return new Response(blob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": blob.type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("learner-avatar failed", e);
    return json({ error: "Something went wrong." }, 500);
  }
});