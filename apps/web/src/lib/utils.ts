import { format, formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Fault, ChatMessage } from '@/types'

export const fmtDate = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: nl })
export const fmtDateTime = (d: string) => format(new Date(d), 'd MMM yyyy · HH:mm', { locale: nl })
export const fmtTime = (d: string) => format(new Date(d), 'HH:mm', { locale: nl })
export const fmtAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: nl })

export const vehicleTypeLabel: Record<string, string> = {
  ebike: 'E-Bike',
  scooter: 'E-Scooter',
  car: 'Auto',
  bus: 'Bus',
}

export const vehicleTypeIcon: Record<string, string> = {
  ebike: '🔴',
  scooter: '🔵',
  car: '⚫',
  bus: '🟡',
}

export const faultStatusLabel: Record<string, string> = {
  open: 'Storing',
  in_progress: 'Start Fix',
  ready: 'Klaar',
  closed: 'Gesloten',
}

export const roleLabel: Record<string, string> = {
  manager: 'Locatie Manager',
  supervisor: 'Supervisor',
  mechanic: 'Hub Monteur',
  driver: 'Chauffeur',
}

/** Download an array of objects as a CSV file */
export function exportCsv(rows: Record<string, string | number | null | undefined>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape  = (v: string | number | null | undefined) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/** Print a fault's chat thread as a PDF via the browser print dialog */
export function printChatThread(fault: Fault, messages: ChatMessage[]) {
  const rows = messages.map((m) => {
    const side = m.is_hub_side ? 'Hub' : 'Locatie'
    const time = format(new Date(m.created_at), 'd MMM yyyy HH:mm', { locale: nl })
    return `<tr style="border-bottom:1px solid #eee">
      <td style="padding:6px 10px;color:#78350F;white-space:nowrap;vertical-align:top">${time}</td>
      <td style="padding:6px 10px;font-weight:600;white-space:nowrap;vertical-align:top">${side}</td>
      <td style="padding:6px 10px;line-height:1.5">${m.body.replace(/</g, '&lt;')}</td>
    </tr>`
  }).join('')

  const repairSection = fault.repair_notes
    ? `<div style="margin:16px 0;padding:10px 14px;background:#F0FDF4;border-left:3px solid #16A34A;font-size:12px"><strong>Reparatie notitie:</strong> ${fault.repair_notes.replace(/</g, '&lt;')}</div>`
    : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Chat ${fault.vehicle_id} — Hi Tom Fleet</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; margin: 24px; color: #1A0800; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .sub { color: #78350F; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 6px 10px; background: #FFFBF2; border-bottom: 2px solid #B91C1C; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    @media print { @page { margin: 1.5cm; } }
  </style></head><body>
  <h1>Chatlogboek — ${fault.vehicle_id}</h1>
  <div class="sub">${fault.fault_type} · ${format(new Date(fault.created_at), 'd MMM yyyy', { locale: nl })} · Hi Tom Fleet</div>
  ${repairSection}
  <table><thead><tr><th>Tijdstip</th><th>Partij</th><th>Bericht</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div style="margin-top:24px;font-size:11px;color:#999">Gegenereerd door Hi Tom Fleet op ${format(new Date(), 'd MMM yyyy HH:mm', { locale: nl })}</div>
  </body></html>`

  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

/** Compute quality score client-side (mirrors DB trigger logic) */
export function computeQualityScore(opts: {
  photoCount: number
  notes: string
  faultType: string
  submittedSameDay: boolean
}): number {
  let score = 0
  if (opts.photoCount >= 2) score += 2
  score += Math.min(opts.photoCount - 2, 6) * 0.5
  if (opts.notes.length > 0) score += 2
  if (opts.notes.length > 50) score += 1
  if (opts.faultType !== 'Overig') score += 1
  if (opts.submittedSameDay) score += 1
  return Math.max(0, score)
}
