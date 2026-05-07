import { format, formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

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
