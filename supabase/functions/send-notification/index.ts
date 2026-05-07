// Supabase Edge Function: send-notification
// Triggered by Supabase webhooks on DB changes.
// Sends push (FCM) + email (Resend) + writes to notifications table.

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

async function sendFCM(fcmToken: string, title: string, body: string) {
  const vapidKey = Deno.env.get('FCM_SERVER_KEY')
  if (!vapidKey || !fcmToken) return

  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${vapidKey}`,
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: { title, body },
      webpush: { notification: { icon: '/logo192.png' } },
    }),
  })
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

  // Get recipient's fcm_token, last_seen and email
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

      // Confirmation to reporting manager
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
        // Start Fix — notify supervisors
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
        // Ready — notify supervisors + reporting manager
        const { data: supervisors } = await supabase.from('users').select('id').eq('role', 'supervisor')
        for (const sup of supervisors ?? []) {
          await notify({
            recipient_id: sup.id,
            type: 'fault_update',
            title: `${fault.vehicle_id} — Klaar voor ophaling`,
            body: `Voertuig ${fault.vehicle_id} is gerepareerd en klaar voor ophaling.`,
            related_fault_id: fault.id,
          })
        }
        await notify({
          recipient_id: fault.reported_by,
          type: 'fault_update',
          title: `${fault.vehicle_id} — Klaar`,
          body: `Je voertuig ${fault.vehicle_id} is gerepareerd en wordt binnenkort afgeleverd.`,
          related_fault_id: fault.id,
        })
      }
    }

    // ── PICKUP SCHEDULE INSERT: notify driver + location manager ────────────
    if (table === 'pickup_schedules' && type === 'INSERT') {
      const schedule = record
      const { data: loc } = await supabase.from('locations').select('name').eq('id', schedule.from_location_id).single()

      // Notify driver
      await notify({
        recipient_id: schedule.driver_id,
        type: 'pickup',
        title: 'Nieuw ophaalmoment gepland',
        body: `${schedule.vehicle_id} ophalen bij ${loc?.name} op ${schedule.scheduled_date} tussen ${schedule.time_from}–${schedule.time_to}.`,
        related_pickup_id: schedule.id,
      })

      // Notify location manager
      const { data: fault } = await supabase.from('faults').select('reported_by').eq('id', schedule.fault_id).single()
      if (fault?.reported_by) {
        await notify({
          recipient_id: fault.reported_by,
          type: 'pickup',
          title: 'Ophaalmoment gepland',
          body: `Beste ${loc?.name}, je staat gepland voor een ophaalmoment op ${schedule.scheduled_date} tussen ${schedule.time_from}–${schedule.time_to}. Geef aanvullende informatie snel door via de Hi Tom Fleet app.`,
          related_pickup_id: schedule.id,
        })
      }
    }

    // ── CHAT MESSAGE INSERT: notify other party ─────────────────────────────
    if (table === 'chat_messages' && type === 'INSERT') {
      const msg = record
      const { data: fault } = await supabase.from('faults').select('reported_by, location_id').eq('id', msg.fault_id).single()
      const { data: sender } = await supabase.from('users').select('full_name').eq('id', msg.sender_id).single()

      if (msg.is_hub_side && fault?.reported_by) {
        // Hub → manager
        await notify({
          recipient_id: fault.reported_by,
          type: 'chat',
          title: `Nieuw bericht van Hub`,
          body: `${sender?.full_name}: ${msg.body.substring(0, 100)}${msg.body.length > 100 ? '…' : ''}`,
          related_fault_id: msg.fault_id,
        })
      } else if (!msg.is_hub_side && fault?.location_id) {
        // Manager → Hub: notify all hub mechanics
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
