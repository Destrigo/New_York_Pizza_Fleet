import type { FaultStatus, VehicleStatus } from '@/types'

const FAULT_MAP: Record<FaultStatus, { cls: string; label: string }> = {
  open:        { cls: 'badge badge-red',   label: 'Storing' },
  in_progress: { cls: 'badge badge-gold',  label: 'Start Fix' },
  ready:       { cls: 'badge badge-green', label: 'Klaar' },
  closed:      { cls: 'badge badge-muted', label: 'Gesloten' },
}

const VEHICLE_MAP: Record<VehicleStatus, { cls: string; label: string }> = {
  ok:    { cls: 'badge badge-green', label: 'OK' },
  fault: { cls: 'badge badge-red',   label: 'Storing' },
  hub:   { cls: 'badge badge-muted', label: 'In Hub' },
  fix:   { cls: 'badge badge-gold',  label: 'In Reparatie' },
  ready: { cls: 'badge badge-green', label: 'Klaar' },
}

export function FaultBadge({ status }: { status: FaultStatus }) {
  const { cls, label } = FAULT_MAP[status] ?? { cls: 'badge badge-muted', label: status }
  return <span className={cls}>{label}</span>
}

export function VehicleBadge({ status }: { status: VehicleStatus }) {
  const { cls, label } = VEHICLE_MAP[status] ?? { cls: 'badge badge-muted', label: status }
  return <span className={cls}>{label}</span>
}
