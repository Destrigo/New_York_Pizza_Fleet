export type Role = 'supervisor' | 'manager' | 'mechanic' | 'driver'

export type VehicleType = 'ebike' | 'scooter' | 'car' | 'bus'

export type VehicleStatus = 'ok' | 'fault' | 'hub' | 'fix' | 'ready'

export type FaultStatus = 'open' | 'in_progress' | 'ready' | 'closed'

export type PickupStatus = 'planned' | 'completed' | 'cancelled'

export type EventType = 'moved' | 'fault' | 'repaired' | 'assigned'

export interface Location {
  id: string
  name: string
  city: string
  address: string
  is_hub: boolean
  created_at: string
}

export interface User {
  id: string
  full_name: string
  role: Role
  location_id: string
  avatar_url: string | null
  fcm_token: string | null
  created_at: string
  // joined
  location?: Location
}

export interface Vehicle {
  id: string
  type: VehicleType
  location_id: string
  status: VehicleStatus
  color: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  location?: Location
}

export interface Fault {
  id: string
  vehicle_id: string
  location_id: string
  reported_by: string
  fault_type: string
  notes: string | null
  status: FaultStatus
  photo_count: number
  quality_score: number | null
  created_at: string
  updated_at: string
  closed_at: string | null
  // joined
  vehicle?: Vehicle
  location?: Location
  reporter?: User
  photos?: FaultPhoto[]
  messages?: ChatMessage[]
}

export interface FaultPhoto {
  id: string
  fault_id: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface ChatMessage {
  id: string
  fault_id: string
  sender_id: string
  body: string
  is_hub_side: boolean
  created_at: string
  // joined
  sender?: User
}

export interface PickupSchedule {
  id: string
  fault_id: string
  driver_id: string
  assigned_by: string
  from_location_id: string
  to_location_id: string
  scheduled_date: string
  time_from: string
  time_to: string
  vehicle_id: string
  notes: string | null
  status: PickupStatus
  created_at: string
  // joined
  driver?: User
  vehicle?: Vehicle
  from_location?: Location
  to_location?: Location
}

export interface Notification {
  id: string
  recipient_id: string
  type: string
  title: string
  body: string
  related_fault_id: string | null
  related_pickup_id: string | null
  read_at: string | null
  sent_at: string | null
  created_at: string
}

export interface Reserve {
  id: string
  location_id: string
  vehicle_type: VehicleType
  target_count: number
  updated_by: string
  updated_at: string
  // joined
  location?: Location
}

export interface VehicleLog {
  id: string
  vehicle_id: string
  event_type: EventType
  from_location_id: string | null
  to_location_id: string | null
  fault_id: string | null
  performed_by: string
  created_at: string
  notes: string | null
  // joined
  vehicle?: Vehicle
  from_location?: Location
  to_location?: Location
  performer?: User
}

// Auth session shape (mirrors Supabase auth.users metadata)
export interface AuthSession {
  user: User
  supabaseUser: { id: string; email: string }
}
