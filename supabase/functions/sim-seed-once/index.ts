// TEMPORARY one-off content loader. Deleted after use.
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
const TOKEN = "cbee6f516e19d4e4f143026db0295338c2c483c84f168834";
Deno.serve(async (req) => {
  if (req.method !== "POST" || req.headers.get("x-seed-token") !== TOKEN) return new Response("no", { status: 403 });
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1 });
  try {
    const body = await req.text();
    await sql.unsafe(body);
    return new Response("ok");
  } catch (e) { return new Response("ERR " + (e as Error).message, { status: 500 }); }
  finally { await sql.end(); }
});
