// Supabase Edge Function: admin-user
// Supervisor-only: invite new users or deactivate existing ones.
// Called from AdminUsers.tsx via supabase.functions.invoke().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function getCallerRole(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role ?? null
}

Deno.serve(async (req) => {
  const role = await getCallerRole(req.headers.get('Authorization'))
  if (role !== 'supervisor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  if (action === 'invite') {
    const { email, full_name, role: userRole, location_id } = body
    if (!email || !full_name || !userRole) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    // Send Supabase invite email; the user row is created by a DB trigger on auth.users
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: userRole, location_id: location_id || null },
      redirectTo: Deno.env.get('SITE_URL') + '/login',
    })

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

    // Insert into public.users immediately (trigger may not run until confirmation)
    await supabase.from('users').upsert({
      id: data.user.id,
      full_name,
      role: userRole,
      location_id: location_id || null,
    }, { onConflict: 'id', ignoreDuplicates: true })

    return new Response(JSON.stringify({ ok: true, user_id: data.user.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (action === 'deactivate') {
    const { user_id } = body
    if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 })

    // Ban for 100 years (effectively permanent; can be lifted in Supabase dashboard)
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      ban_duration: '876000h',
    })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
})
