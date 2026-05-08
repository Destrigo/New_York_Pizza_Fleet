// Supabase Edge Function: send-notification
// Triggered by Supabase webhooks on DB changes.
// Sends push (FCM HTTP v1) + email (Resend) + writes to notifications table.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface NotificationPayload {
  recipient_id: string
  type: string
  title: string
  body: string
  related_fault_id?: string
  related_pickup_id?: string
}

// ── FCM HTTP v1 via service account JWT ─────────────────────────────────────

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

let _cachedToken: { token: string; exp: number } | null = null

async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (_cachedToken && _cachedToken.exp > now + 60) return _cachedToken.token

  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:  sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:  'https://oauth2.googleapis.com/token',
    exp:  now + 3600,
    iat:  now,
  }

  const enc   = new TextEncoder()
  const b64u  = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const hdr64 = b64u(JSON.stringify(header))
  const pld64 = b64u(JSON.stringify(payload))
  const input = `${hdr64}.${pld64}`

  const pemBody   = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuffer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig    = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(input))
  const sig64  = b64u(String.fromCharCode(...new Uint8Array(sig)))
  const jwt    = `${input}.${sig64}`

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })
  const { access_token, expires_in } = await res.json()
  _cachedToken = { token: access_token, exp: now + (expires_in ?? 3600) }
  return access_token
}

async function sendFCM(fcmToken: string, title: string, body: string) {
  const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
  if (!saJson || !fcmToken) return

  try {
    const sa: ServiceAccount = JSON.parse(saJson)
    const accessToken = await getFcmAccessToken(sa)

    await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            webpush: {
              notification: { icon: '/icon-192.png', badge: '/badge-72.png' },
              fcm_options: { link: '/' },
            },
          },
        }),
      }
    )
  } catch (e) {
    console.error('FCM error:', e)
  }
}

async function sendEmail(email: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Hi Tom Fleet <noreply@hitomfleet.nl>',
      to: email,
      subject,
      html,
    }),
  })
}

async function notify(payload: NotificationPayload) {
  // Write to notifications table
  await supabase.from('notifications').insert({
    recipient_id: payload.recipient_id,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    related_fault_id: payload.related_fault_id ?? null,
    related_pickup_id: payload.related_pickup_id ?? null,
    sent_at: new Date().toISOString(),
  })

  // Get recipient's fcm_token and last_seen
  const { data: user } = await supabase
    .from('users')
    .select('fcm_token, last_seen')
    .eq('id', payload.recipient_id)
    .single()

  const { data: authUser } = await supabase.auth.admin.getUserById(payload.recipient_id)

  // Skip FCM push if user has the app open (last_seen within 2 minutes)
  const isOnline = user?.last_seen
    ? (Date.now() - new Date(user.last_seen).getTime()) < 2 * 60 * 1000
    : false

  if (user?.fcm_token && !isOnline) {
    await sendFCM(user.fcm_token, payload.title, payload.body)
  }

  if (authUser?.user?.email) {
    await sendEmail(
      authUser.user.email,
      payload.title,
      `<p>${payload.body}</p><p style="color:#78350F;font-size:12px;">Hi Tom Fleet</p>`
    )
  }
}

Deno.serve(async (req) => {
  try {
    const event = await req.json()
    const { type, record, table } = event

    // ── FAULT INSERT: notify Hub staff ──────────────────────────────────────
    if (table === 'faults' && type === 'INSERT') {
      const fault = record
      const { data: loc } = await supabase.from('locations').select('name').eq('id', fault.location_id).single()
      const { data: hubStaff } = await supabase.from('users').select('id').in('role', ['mechanic', 'supervisor'])

      for (const staff of hubStaff ?? []) {
        await notify({
          recipient_id: staff.id,
          type: 'fault_new',
          title: `Storing bij ${loc?.name}: ${fault.vehicle_id}`,
          body: `${fault.vehicle_id} — ${fault.fault_type} · ${loc?.name}`,
          related_fault_id: fault.id,
        })
      }

      await notify({
        recipient_id: fault.reported_by,
        type: 'fault_received',
        title: 'Melding ontvangen',
        body: `Bedankt voor je melding. We bezoeken je locatie zo snel mogelijk. — Hi Tom Fleet`,
        related_fault_id: fault.id,
      })
    }

    // ── FAULT UPDATE: status transitions ────────────────────────────────────
    if (table === 'faults' && type === 'UPDATE') {
      const fault = record
      const old = event.old_record

      if (fault.status === 'in_progress' && old?.status !== 'in_progress') {
        const { data: supervisors } = await supabase.from('users').select('id').eq('role', 'supervisor')
        for (const sup of supervisors ?? []) {
          await notify({
            recipient_id: sup.id,
            type: 'fault_update',
            title: `${fault.vehicle_id} — Start Fix gestart`,
            body: `Reparatie gestart voor voertuig ${fault.vehicle_id}.`,
            related_fault_id: fault.id,
          })
        }
      }

      if (fault.status === 'ready' && old?.status !== 'ready') {
        const { data: supervisors } = await supabase.from('users').select('id').eq('role', 'supervisor')
        for (const sup of supervisors ?? []) {
          await notify({
            recipient_id: sup.id,
            type: 'fault_update',
            title: `${fault.vehicle_id} — Klaar voor ophaling`,
            body: `Voertuig ${fault.vehicle_id} is gerepareerd en klaar voor ophaling.${fault.repair_notes ? ` Notitie: ${fault.repair_notes}` : ''}`,
            related_fault_id: fault.id,
          })
        }
        const repairSuffix = fault.repair_notes ? ` Reparatie: ${fault.repair_notes}` : ''
        await notify({
          recipient_id: fault.reported_by,
          type: 'fault_update',
          title: `${fault.vehicle_id} — Klaar`,
          body: `Je voertuig ${fault.vehicle_id} is gerepareerd en wordt binnenkort afgeleverd.${repairSuffix}`,
          related_fault_id: fault.id,
        })
      }

      if (fault.status === 'open' && old?.status === 'closed') {
        // Fault reopened — notify hub
        const { data: mechanics } = await supabase.from('users').select('id').eq('role', 'mechanic')
        for (const m of mechanics ?? []) {
          await notify({
            recipient_id: m.id,
            type: 'fault_update',
            title: `${fault.vehicle_id} — Heropend`,
            body: `Storing voor ${fault.vehicle_id} is heropend en staat weer in de queue.`,
            related_fault_id: fault.id,
          })
        }
      }
    }

    // ── PICKUP SCHEDULE INSERT: notify driver + location manager ────────────
    if (table === 'pickup_schedules' && type === 'INSERT') {
      const schedule = record
      const { data: loc } = await supabase.from('locations').select('name').eq('id', schedule.from_location_id).single()

      await notify({
        recipient_id: schedule.driver_id,
        type: 'pickup',
        title: 'Nieuw ophaalmoment gepland',
        body: `${schedule.vehicle_id} ophalen bij ${loc?.name} op ${schedule.scheduled_date} tussen ${schedule.time_from}–${schedule.time_to}.`,
        related_pickup_id: schedule.id,
      })

      const managerIds: string[] = []
      if (schedule.fault_id) {
        const { data: fault } = await supabase.from('faults').select('reported_by').eq('id', schedule.fault_id).single()
        if (fault?.reported_by) managerIds.push(fault.reported_by)
      } else {
        const { data: managers } = await supabase.from('users').select('id').eq('role', 'manager').eq('location_id', schedule.from_location_id)
        for (const m of managers ?? []) managerIds.push(m.id)
      }
      for (const managerId of managerIds) {
        await notify({
          recipient_id: managerId,
          type: 'pickup',
          title: 'Ophaalmoment gepland',
          body: `Beste ${loc?.name}, je staat gepland voor een ophaalmoment op ${schedule.scheduled_date} tussen ${schedule.time_from}–${schedule.time_to}. Geef aanvullende informatie snel door via de Hi Tom Fleet app.`,
          related_pickup_id: schedule.id,
        })
      }
    }

    // ── PICKUP SCHEDULE COMPLETE/CANCEL ─────────────────────────────────────
    if (table === 'pickup_schedules' && type === 'UPDATE') {
      const schedule = record
      const old = event.old_record

      if (schedule.status === 'completed' && old?.status !== 'completed') {
        const { data: toLoc } = await supabase
          .from('locations').select('name, is_hub').eq('id', schedule.to_location_id).single()

        if (toLoc && !toLoc.is_hub) {
          const { data: managers } = await supabase
            .from('users').select('id').eq('role', 'manager').eq('location_id', schedule.to_location_id)
          for (const m of managers ?? []) {
            await notify({
              recipient_id: m.id,
              type: 'vehicle',
              title: `${schedule.vehicle_id} afgeleverd`,
              body: `Voertuig ${schedule.vehicle_id} is afgeleverd bij ${toLoc.name}.`,
              related_pickup_id: schedule.id,
              related_fault_id: schedule.fault_id ?? undefined,
            })
          }
        }
      }

      if (schedule.status === 'cancelled' && old?.status !== 'cancelled') {
        const { data: fromLoc } = await supabase
          .from('locations').select('name').eq('id', schedule.from_location_id).single()

        await notify({
          recipient_id: schedule.driver_id,
          type: 'pickup',
          title: 'Ophaalmoment geannuleerd',
          body: `Het ophaalmoment voor ${schedule.vehicle_id} bij ${fromLoc?.name ?? 'onbekende locatie'} op ${schedule.scheduled_date} is geannuleerd.`,
          related_pickup_id: schedule.id,
        })

        const managerIds: string[] = []
        if (schedule.fault_id) {
          const { data: fault } = await supabase.from('faults').select('reported_by').eq('id', schedule.fault_id).single()
          if (fault?.reported_by) managerIds.push(fault.reported_by)
        } else {
          const { data: managers } = await supabase.from('users').select('id').eq('role', 'manager').eq('location_id', schedule.from_location_id)
          for (const m of managers ?? []) managerIds.push(m.id)
        }
        for (const managerId of managerIds) {
          await notify({
            recipient_id: managerId,
            type: 'pickup',
            title: 'Ophaalmoment geannuleerd',
            body: `Het geplande ophaalmoment voor ${schedule.vehicle_id} op ${schedule.scheduled_date} is helaas geannuleerd. We nemen zo snel mogelijk contact op.`,
            related_pickup_id: schedule.id,
          })
        }
      }
    }

    // ── CHAT MESSAGE INSERT: notify other party ─────────────────────────────
    if (table === 'chat_messages' && type === 'INSERT') {
      const msg = record
      const { data: fault } = await supabase.from('faults').select('reported_by, location_id').eq('id', msg.fault_id).single()
      const { data: sender } = await supabase.from('users').select('full_name').eq('id', msg.sender_id).single()

      if (msg.is_hub_side && fault?.reported_by) {
        await notify({
          recipient_id: fault.reported_by,
          type: 'chat',
          title: `Nieuw bericht van Hub`,
          body: `${sender?.full_name}: ${msg.body.substring(0, 100)}${msg.body.length > 100 ? '…' : ''}`,
          related_fault_id: msg.fault_id,
        })
      } else if (!msg.is_hub_side && fault?.location_id) {
        const { data: mechanics } = await supabase.from('users').select('id').eq('role', 'mechanic')
        for (const m of mechanics ?? []) {
          await notify({
            recipient_id: m.id,
            type: 'chat',
            title: `Nieuw bericht`,
            body: `${sender?.full_name}: ${msg.body.substring(0, 100)}${msg.body.length > 100 ? '…' : ''}`,
            related_fault_id: msg.fault_id,
          })
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('send-notification error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
