import { useI18n } from '@/context/I18nContext'
import type { FaultStatus, VehicleStatus } from '@/types'

const FAULT_CLS: Record<FaultStatus, string> = {
  open:        'badge badge-red',
  in_progress: 'badge badge-gold',
  ready:       'badge badge-green',
  closed:      'badge badge-muted',
}

const VEHICLE_CLS: Record<VehicleStatus, string> = {
  ok:    'badge badge-green',
  fault: 'badge badge-red',
  hub:   'badge badge-muted',
  fix:   'badge badge-gold',
  ready: 'badge badge-green',
}

export function FaultBadge({ status }: { status: FaultStatus }) {
  const { t } = useI18n()
  const cls = FAULT_CLS[status] ?? 'badge badge-muted'
  return <span className={cls}>{t(`badgeFault_${status}` as Parameters<typeof t>[0])}</span>
}

export function VehicleBadge({ status }: { status: VehicleStatus }) {
  const { t } = useI18n()
  const cls = VEHICLE_CLS[status] ?? 'badge badge-muted'
  return <span className={cls}>{t(`badgeVehicle_${status}` as Parameters<typeof t>[0])}</span>
}
