import { describe, it, expect } from 'vitest'
import { computeQualityScore, faultStatusLabel, vehicleTypeLabel, roleLabel, exportCsv } from '../utils'

describe('computeQualityScore', () => {
  it('returns 0 for empty submission', () => {
    expect(computeQualityScore({ photoCount: 0, notes: '', faultType: 'Overig', submittedSameDay: false })).toBe(0)
  })

  it('awards 2 points for 2+ photos', () => {
    const score = computeQualityScore({ photoCount: 2, notes: '', faultType: 'Overig', submittedSameDay: false })
    expect(score).toBe(2)
  })

  it('awards extra 0.5 per photo beyond 2 (max 6 extra = 3 pts)', () => {
    const score = computeQualityScore({ photoCount: 14, notes: '', faultType: 'Overig', submittedSameDay: false })
    expect(score).toBe(5) // 2 + min(12,6)*0.5 = 2+3 = 5
  })

  it('awards 2 points for any notes', () => {
    const score = computeQualityScore({ photoCount: 0, notes: 'x', faultType: 'Overig', submittedSameDay: false })
    expect(score).toBe(2)
  })

  it('awards extra 1 point for notes > 50 chars', () => {
    const score = computeQualityScore({ photoCount: 0, notes: 'a'.repeat(51), faultType: 'Overig', submittedSameDay: false })
    expect(score).toBe(3)
  })

  it('awards 1 point for specific fault type', () => {
    const score = computeQualityScore({ photoCount: 0, notes: '', faultType: 'Lekke band', submittedSameDay: false })
    expect(score).toBe(1)
  })

  it('awards 1 point for same-day submission', () => {
    const score = computeQualityScore({ photoCount: 0, notes: '', faultType: 'Overig', submittedSameDay: true })
    expect(score).toBe(1)
  })

  it('computes full score correctly', () => {
    // 2 photos=2pts, notes=2pts, notes>50=1pt, specific type=1pt, same day=1pt → 7
    const score = computeQualityScore({
      photoCount: 2,
      notes: 'a'.repeat(60),
      faultType: 'Lekke band',
      submittedSameDay: true,
    })
    expect(score).toBe(7)
  })
})

describe('faultStatusLabel', () => {
  it('maps all status values', () => {
    expect(faultStatusLabel['open']).toBe('Storing')
    expect(faultStatusLabel['in_progress']).toBe('Start Fix')
    expect(faultStatusLabel['ready']).toBe('Klaar')
    expect(faultStatusLabel['closed']).toBe('Gesloten')
  })
})

describe('vehicleTypeLabel', () => {
  it('maps all vehicle types', () => {
    expect(vehicleTypeLabel['ebike']).toBe('E-Bike')
    expect(vehicleTypeLabel['scooter']).toBe('E-Scooter')
    expect(vehicleTypeLabel['car']).toBe('Auto')
    expect(vehicleTypeLabel['bus']).toBe('Bus')
  })
})

describe('roleLabel', () => {
  it('maps all roles', () => {
    expect(roleLabel['manager']).toBe('Locatie Manager')
    expect(roleLabel['supervisor']).toBe('Supervisor')
    expect(roleLabel['mechanic']).toBe('Hub Monteur')
    expect(roleLabel['driver']).toBe('Chauffeur')
  })
})

describe('exportCsv', () => {
  it('does nothing when rows are empty', () => {
    // Should not throw
    expect(() => exportCsv([], 'test.csv')).not.toThrow()
  })
})
