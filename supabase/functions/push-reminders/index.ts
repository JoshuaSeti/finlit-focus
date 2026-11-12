// Hourly: sends a streak reminder to learners whose usual study hour is now (Lusaka) and who haven't studied today.
// Safe to call publicly: each device gets at most one reminder per day.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function lusakaNow() {
  const d = new Date(Date.now() + 2 * 3600_000);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

function message(streak: number) {
  const s = streak > 0;
  const pool = s ? [
    { title: `🪙 Your ${streak}-day streak is in danger!`, body: "Just 3 minutes saves it. Don't let your coins slip away." },
    { title: "😟 Your yungsta is waiting for you…", body: `${streak} days strong — one quick lesson keeps the streak alive.` },
    { title: `⏰ ${streak} days. Don't break it now.`, body: "Your future self is counting on you. Tap to keep going." },
    { title: "💸 You're about to lose your coins!", body: `Protect your ${streak}-day streak before midnight.` },
  ] : [
    { title: "👋 Your yungsta misses you", body: "Start a new coin streak today — it only takes 3 minutes." },
    { title: "🪙 Today could be Day 1", body: "Learn one money skill now and start stacking coins." },
    { title: "💡 Smart money moves start small", body: "One quick lesson today. Your yungsta is ready." },
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  webpush.setVapidDetails("mailto:info@finlit-zm.org", Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { date, hour } = lusakaNow();

  const { data: streaks } = await db.from("learner_streaks").select("user_id,current_streak,last_active_date,usual_hour");
  const due = new Map<string, number>();
  for (const r of streaks ?? []) {
    if (r.last_active_date === date) continue;
    const h = r.usual_hour ?? 18;
    // Streak-at-risk learners also get a last-chance nudge at 20:00.
    if (h === hour || (hour === 20 && r.current_streak > 0 && h < 20)) due.set(r.user_id, r.current_streak);
  }
  if (!due.size) return new Response(JSON.stringify({ sent: 0 }), { headers: cors });

  const { data: subs } = await db.from("push_subscriptions").select("*").in("user_id", [...due.keys()]);
  let sent = 0;
  for (const s of subs ?? []) {
    if (s.last_sent_date === date && hour !== 20) continue;
    const streak = due.get(s.user_id) ?? 0;
    const payload = JSON.stringify({ ...message(streak), url: "/modules", tag: "finlit-streak" });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { urgency: "high", TTL: 3600 });
      await db.from("push_subscriptions").update({ last_sent_date: date }).eq("endpoint", s.endpoint);
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { ...cors, "Content-Type": "application/json" } });
});
