// js/supabase-client.js
// One shared Supabase client instance — every page includes this script
// FIRST, before its own page-specific script, and uses the global
// `supabase` object it creates.

const SUPABASE_URL = 'https://jznoczszgcvusizcpzhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bm9jenN6Z2N2dXNpemNwemhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjE4MzcsImV4cCI6MjA4MzA5NzgzN30.6O4eWKXckKHbPz4MDZZK6PryB2nWIUhLi0B2GglzSxU';

// Loaded via <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">
// on every page before this file. That CDN script itself creates a global
// named `supabase` (that's where `.createClient` comes from), so we must
// overwrite it with a plain assignment here — NOT `const`/`let` — or the
// browser throws "Identifier 'supabase' has already been declared" and
// the whole script aborts before anything on the page can run.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Embedded in a lesson (?embed=1): the learner should never see a sign-in screen. If there is no session,
// make an anonymous one (Supabase: Authentication > Providers > "Allow anonymous sign-ins" must be ON).
// If that is switched off, window.__anonFailed is set and the lesson is told practice is unavailable.
window.__EMBED = new URLSearchParams(window.location.search).has('embed');
window.__authReady = (async function () {
  if (!window.__EMBED) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) window.__anonFailed = true;
  } catch (e) { window.__anonFailed = true; }
})();

// ── Session guard ──────────────────────────────────────────────
// Call this at the top of every page except login.html. Redirects to
// login if there's no valid session; otherwise returns the user object.
async function requireAuth() {
  if (window.__authReady) await window.__authReady;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    if (window.__EMBED) { window.__anonFailed = true; return null; }   // never show a sign-in screen inside a lesson
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

async function logOut() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user.is_anonymous && !confirm('You have not saved your progress yet. If you log out, this yungsta is lost for good. Log out anyway?')) return;
  } catch (e) {}
  await supabase.auth.signOut();
  window.localStorage.removeItem('finlit-sim-session');
  window.sessionStorage.removeItem('finlit-sim-session');
  window.location.href = 'login.html';
}
