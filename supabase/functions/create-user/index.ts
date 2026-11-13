import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const callerId = claimsData.claims.sub;

    // Use service role to check caller's role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), { status: 403, headers: corsHeaders });
    }

    const { email, password, fullName, role, schoolName } = await req.json();

    // Validate: only super_admin can create admin/super_admin roles
    if ((role === 'admin' || role === 'super_admin') && callerRole.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only super admins can create admin accounts' }), { status: 403, headers: corsHeaders });
    }

    // Create the user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    let userId: string;
    let existing = false;
    if (createError) {
      const exists = (createError as any).code === 'email_exists' || /already been registered/i.test(createError.message);
      if (!exists) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders });
      }
      // Account already exists (e.g. a learner who signed up) — grant the role instead
      const { data: prof } = await supabaseAdmin
        .from('profiles').select('user_id').ilike('email', String(email).trim()).maybeSingle();
      if (!prof?.user_id) {
        return new Response(JSON.stringify({ error: 'This email already has an account, but it could not be found to upgrade.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = prof.user_id;
      existing = true;
    } else {
      userId = userData.user.id;
    }

    // Update profile
    if (existing) {
      // keep existing name/password; only fill school if given
      if (schoolName) await supabaseAdmin.from('profiles').update({ school_name: schoolName }).eq('user_id', userId);
    } else if (schoolName) {
      await supabaseAdmin.from('profiles').update({ school_name: schoolName, full_name: fullName }).eq('user_id', userId);
    } else {
      await supabaseAdmin.from('profiles').update({ full_name: fullName }).eq('user_id', userId);
    }

    // Assign role (skip if already held)
    const { data: hasRole } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', userId).eq('role', role).maybeSingle();
    const { error: roleError } = hasRole
      ? { error: null }
      : await supabaseAdmin.from('user_roles').insert({ user_id: userId, role });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, userId, existing }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
