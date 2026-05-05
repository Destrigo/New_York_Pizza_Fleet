import type { Location, User, Vehicle, Fault, ChatMessage, PickupSchedule, VehicleLog } from '@/types'

export const MOCK_LOCATIONS: Location[] = [
  { id: 'bilderdijk', name: 'Bilderdijkstraat',         city: 'Amsterdam', address: 'Bilderdijkstraat 1',         is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'pieter',     name: 'Pieter Calandlaan',        city: 'Amsterdam', address: 'Pieter Calandlaan 1',        is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'leeuwenlaan',name: 'Burg. van Leeuwenlaan',    city: 'Amsterdam', address: 'Burg. van Leeuwenlaan 1',    is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'buitenv',    name: 'Buitenveldertselaan',      city: 'Amsterdam', address: 'Buitenveldertselaan 1',      is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'limburg',    name: 'Van Limburg Stirumstraat', city: 'Amsterdam', address: 'Van Limburg Stirumstraat 1', is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'buiksloot',  name: 'Buikslotermeerplein',      city: 'Amsterdam', address: 'Buikslotermeerplein 1',      is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'dotter',     name: 'Dotterbloemstraat',        city: 'Amsterdam', address: 'Dotterbloemstraat 1',        is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'linnaeus',   name: 'Linnaeustraat',            city: 'Amsterdam', address: 'Linnaeustraat 1',            is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'jolleman',   name: 'Jollemanhof',              city: 'Amsterdam', address: 'Jollemanhof 1',              is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'molenwijk',  name: 'Molenwijk',                city: 'Amsterdam', address: 'Molenwijk 1',                is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'midden',     name: 'Middenmolenplein',         city: 'Amsterdam', address: 'Middenmolenplein 1',         is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'vuurdoorn',  name: 'Vuurdoornlaan',            city: 'Amsterdam', address: 'Vuurdoornlaan 1',            is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'blokmak',    name: 'Blokmakersplaats',         city: 'Amsterdam', address: 'Blokmakersplaats 1',         is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'windmolen',  name: 'Windmolenbroeksweg',       city: 'Enschede',  address: 'Windmolenbroeksweg 1',       is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'wesseler',   name: 'Wesseler-nering',          city: 'Enschede',  address: 'Wesseler-nering 1',          is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'deurning',   name: 'Deurningerstraat',         city: 'Enschede',  address: 'Deurningerstraat 1',         is_hub: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'hub-hfd',    name: 'Hub · Hoofddorp',          city: 'Hoofddorp', address: 'Hub Hoofddorp 1',            is_hub: true,  created_at: '2026-01-01T00:00:00Z' },
  { id: 'hub-ens',    name: 'Hub · Enschede',           city: 'Enschede',  address: 'Hub Enschede 1',             is_hub: true,  created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_USERS: User[] = [
  { id: 'ayoub',    full_name: 'Ayoub',    role: 'manager',    location_id: 'bilderdijk', avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'nadir',    full_name: 'Nadir',    role: 'manager',    location_id: 'pieter',     avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ajay',     full_name: 'Ajay',     role: 'manager',    location_id: 'leeuwenlaan',avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'mohamed',  full_name: 'Mohamed',  role: 'manager',    location_id: 'buitenv',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'karim',    full_name: 'Karim',    role: 'supervisor', location_id: 'hub-hfd',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'imrane',   full_name: 'Imrane',   role: 'manager',    location_id: 'buiksloot',  avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'bryan',    full_name: 'Bryan',    role: 'manager',    location_id: 'linnaeus',   avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'hamza',    full_name: 'Hamza',    role: 'manager',    location_id: 'jolleman',   avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'alex',     full_name: 'Alex',     role: 'manager',    location_id: 'molenwijk',  avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'anouar',   full_name: 'Anouar',   role: 'manager',    location_id: 'midden',     avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'salah',    full_name: 'Salah',    role: 'manager',    location_id: 'vuurdoorn',  avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'luciano',  full_name: 'Luciano',  role: 'manager',    location_id: 'blokmak',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'dylan',    full_name: 'Dylan',    role: 'manager',    location_id: 'windmolen',  avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'andriy',   full_name: 'Andriy',   role: 'manager',    location_id: 'wesseler',   avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'ziad',     full_name: 'Ziad',     role: 'manager',    location_id: 'deurning',   avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'arjen',    full_name: 'Arjen',    role: 'supervisor', location_id: 'hub-hfd',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'amine',    full_name: 'Amine',    role: 'mechanic',   location_id: 'hub-hfd',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'mike',     full_name: 'Mike',     role: 'driver',     location_id: 'hub-hfd',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'isaac',    full_name: 'Isaac',    role: 'driver',     location_id: 'hub-hfd',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'hassan',   full_name: 'Hassan',   role: 'driver',     location_id: 'hub-ens',    avatar_url: null, fcm_token: null, created_at: '2026-01-01T00:00:00Z' },
]

// Convenience map for quick lookup
export const MOCK_USERS_MAP = Object.fromEntries(MOCK_USERS.map((u) => [u.id, u]))
export const MOCK_LOC_MAP = Object.fromEntries(MOCK_LOCATIONS.map((l) => [l.id, l]))

export const MOCK_VEHICLES: Vehicle[] = [
  // Bilderdijkstraat
  { id: 'F-001', type: 'ebike',   location_id: 'bilderdijk', status: 'fault', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-25T08:00:00Z' },
  { id: 'F-002', type: 'ebike',   location_id: 'bilderdijk', status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'F-003', type: 'ebike',   location_id: 'bilderdijk', status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'F-004', type: 'ebike',   location_id: 'bilderdijk', status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'S-001', type: 'scooter', location_id: 'bilderdijk', status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'S-002', type: 'scooter', location_id: 'bilderdijk', status: 'fault', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-24T17:00:00Z' },
  // Pieter Calandlaan
  { id: 'F-010', type: 'ebike',   location_id: 'pieter',     status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'F-011', type: 'ebike',   location_id: 'pieter',     status: 'fault', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-26T09:00:00Z' },
  { id: 'F-012', type: 'ebike',   location_id: 'pieter',     status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'S-003', type: 'scooter', location_id: 'pieter',     status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  // Linnaeustraat
  { id: 'F-020', type: 'ebike',   location_id: 'linnaeus',   status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'F-021', type: 'ebike',   location_id: 'linnaeus',   status: 'fault', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-23T11:00:00Z' },
  { id: 'F-022', type: 'ebike',   location_id: 'hub-hfd',    status: 'hub',   color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-20T00:00:00Z' },
  { id: 'F-023', type: 'ebike',   location_id: 'hub-hfd',    status: 'fix',   color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-22T00:00:00Z' },
  { id: 'F-024', type: 'ebike',   location_id: 'hub-hfd',    status: 'ready', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-24T00:00:00Z' },
  { id: 'S-010', type: 'scooter', location_id: 'linnaeus',   status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'S-011', type: 'scooter', location_id: 'linnaeus',   status: 'fix',   color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-21T00:00:00Z' },
  // Buikslotermeerplein
  { id: 'F-030', type: 'ebike',   location_id: 'buiksloot',  status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'F-031', type: 'ebike',   location_id: 'buiksloot',  status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'S-020', type: 'scooter', location_id: 'buiksloot',  status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  // Molenwijk
  { id: 'F-040', type: 'ebike',   location_id: 'molenwijk',  status: 'fault', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-26T10:00:00Z' },
  // Hub vehicles
  { id: 'A-001', type: 'car',     location_id: 'hub-hfd',    status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'A-002', type: 'car',     location_id: 'hub-hfd',    status: 'fault', color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-26T07:00:00Z' },
  { id: 'A-003', type: 'car',     location_id: 'hub-ens',    status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'B-001', type: 'bus',     location_id: 'hub-hfd',    status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'B-002', type: 'bus',     location_id: 'hub-ens',    status: 'ok',    color: null, notes: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_FAULTS: Fault[] = [
  {
    id: 'f1', vehicle_id: 'F-001', location_id: 'bilderdijk', reported_by: 'ayoub',
    fault_type: 'Lekke band', notes: 'Voorband volledig plat, ochtend eerste rit.',
    status: 'open', photo_count: 2, quality_score: 5.5,
    created_at: '2026-04-25T08:14:00Z', updated_at: '2026-04-25T08:14:00Z', closed_at: null,
  },
  {
    id: 'f2', vehicle_id: 'S-002', location_id: 'bilderdijk', reported_by: 'ayoub',
    fault_type: 'Elektrische aandrijving', notes: 'Motor valt uit op lage snelheid.',
    status: 'in_progress', photo_count: 3, quality_score: 6.0,
    created_at: '2026-04-24T17:33:00Z', updated_at: '2026-04-25T09:00:00Z', closed_at: null,
  },
  {
    id: 'f3', vehicle_id: 'F-011', location_id: 'pieter', reported_by: 'nadir',
    fault_type: 'Sleutel kwijt', notes: '',
    status: 'open', photo_count: 2, quality_score: 4.0,
    created_at: '2026-04-26T09:01:00Z', updated_at: '2026-04-26T09:01:00Z', closed_at: null,
  },
  {
    id: 'f4', vehicle_id: 'F-021', location_id: 'linnaeus', reported_by: 'bryan',
    fault_type: 'Spaken', notes: 'Meerdere gebroken spaken op achterwiel.',
    status: 'ready', photo_count: 4, quality_score: 7.0,
    created_at: '2026-04-23T11:20:00Z', updated_at: '2026-04-26T10:00:00Z', closed_at: null,
  },
  {
    id: 'f5', vehicle_id: 'A-002', location_id: 'hub-hfd', reported_by: 'karim',
    fault_type: 'Lekke band', notes: 'Achterrechter band lek.',
    status: 'open', photo_count: 2, quality_score: 5.0,
    created_at: '2026-04-26T07:45:00Z', updated_at: '2026-04-26T07:45:00Z', closed_at: null,
  },
  {
    id: 'f6', vehicle_id: 'F-040', location_id: 'molenwijk', reported_by: 'alex',
    fault_type: 'Pizza Box houder', notes: 'Houder volledig losgeraakt.',
    status: 'open', photo_count: 2, quality_score: 5.0,
    created_at: '2026-04-26T10:22:00Z', updated_at: '2026-04-26T10:22:00Z', closed_at: null,
  },
]

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  f1: [
    { id: 'm1', fault_id: 'f1', sender_id: 'amine', body: 'Bedankt Ayoub, we hebben je melding ontvangen. Kunnen we een foto van het ventiel krijgen?', is_hub_side: true, created_at: '2026-04-25T08:18:00Z' },
    { id: 'm2', fault_id: 'f1', sender_id: 'ayoub', body: 'Foto is al geüpload. Het is de voorband, volledig plat.', is_hub_side: false, created_at: '2026-04-25T08:22:00Z' },
    { id: 'm3', fault_id: 'f1', sender_id: 'amine', body: 'Duidelijk. We plannen ophaalmoment voor 25/04 tussen 13:00–15:00.', is_hub_side: true, created_at: '2026-04-25T08:35:00Z' },
    { id: 'm4', fault_id: 'f1', sender_id: 'ayoub', body: 'Prima, de fiets staat klaar bij de deur.', is_hub_side: false, created_at: '2026-04-25T08:38:00Z' },
  ],
  f2: [
    { id: 'm5', fault_id: 'f2', sender_id: 'amine', body: 'Motor probleem ontvangen. Is de accu volledig opgeladen geweest?', is_hub_side: true, created_at: '2026-04-24T17:40:00Z' },
    { id: 'm6', fault_id: 'f2', sender_id: 'ayoub', body: 'Ja, volledig opgeladen. Begon gisteren al.', is_hub_side: false, created_at: '2026-04-24T17:45:00Z' },
    { id: 'm7', fault_id: 'f2', sender_id: 'amine', body: 'We starten morgen met de reparatie. Verwachte klaar: 27/04.', is_hub_side: true, created_at: '2026-04-24T17:50:00Z' },
  ],
  f3: [],
  f5: [
    { id: 'm8', fault_id: 'f5', sender_id: 'amine', body: 'Eigen melding – A-002 band lek. Isaac pakt dit op.', is_hub_side: true, created_at: '2026-04-26T07:50:00Z' },
  ],
}

export const MOCK_SCHEDULES: PickupSchedule[] = [
  { id: 'p1', fault_id: 'f1', driver_id: 'mike',   assigned_by: 'karim', from_location_id: 'bilderdijk', to_location_id: 'hub-hfd', scheduled_date: '2026-04-25', time_from: '10:00', time_to: '11:30', vehicle_id: 'F-001', notes: 'Ayoub is aanwezig', status: 'planned', created_at: '2026-04-25T09:00:00Z' },
  { id: 'p2', fault_id: 'f3', driver_id: 'mike',   assigned_by: 'karim', from_location_id: 'pieter',     to_location_id: 'hub-hfd', scheduled_date: '2026-04-26', time_from: '13:00', time_to: '14:30', vehicle_id: 'F-011', notes: '',              status: 'planned', created_at: '2026-04-25T09:10:00Z' },
  { id: 'p3', fault_id: 'f6', driver_id: 'mike',   assigned_by: 'karim', from_location_id: 'molenwijk',  to_location_id: 'hub-hfd', scheduled_date: '2026-04-26', time_from: '15:30', time_to: '16:30', vehicle_id: 'F-040', notes: 'Alex aanwezig na 15:00', status: 'planned', created_at: '2026-04-25T09:20:00Z' },
  { id: 'p4', fault_id: 'f5', driver_id: 'isaac',  assigned_by: 'karim', from_location_id: 'hub-hfd',    to_location_id: 'hub-hfd', scheduled_date: '2026-04-26', time_from: '09:00', time_to: '10:00', vehicle_id: 'A-002', notes: 'Intern – band verwisselen', status: 'planned', created_at: '2026-04-25T09:30:00Z' },
  { id: 'p5', fault_id: 'f4', driver_id: 'isaac',  assigned_by: 'karim', from_location_id: 'hub-hfd',    to_location_id: 'linnaeus', scheduled_date: '2026-04-26', time_from: '11:00', time_to: '12:30', vehicle_id: 'F-021', notes: 'Bryan ontvangt', status: 'planned', created_at: '2026-04-25T09:40:00Z' },
  { id: 'p6', fault_id: 'f2', driver_id: 'hassan', assigned_by: 'karim', from_location_id: 'hub-ens',    to_location_id: 'wesseler', scheduled_date: '2026-04-26', time_from: '09:30', time_to: '11:00', vehicle_id: 'S-011', notes: '',              status: 'planned', created_at: '2026-04-25T09:50:00Z' },
]

export const MOCK_LOG: VehicleLog[] = [
  { id: 'l1', vehicle_id: 'F-022', event_type: 'moved', from_location_id: 'linnaeus', to_location_id: 'hub-hfd', fault_id: null, performed_by: 'mike', created_at: '2026-04-20T10:00:00Z', notes: 'Opgehaald voor reparatie' },
  { id: 'l2', vehicle_id: 'F-001', event_type: 'fault', from_location_id: null, to_location_id: null, fault_id: 'f1', performed_by: 'ayoub', created_at: '2026-04-25T08:14:00Z', notes: 'Lekke band gemeld' },
  { id: 'l3', vehicle_id: 'S-002', event_type: 'fault', from_location_id: null, to_location_id: null, fault_id: 'f2', performed_by: 'ayoub', created_at: '2026-04-24T17:33:00Z', notes: 'Elektrische storing gemeld' },
  { id: 'l4', vehicle_id: 'F-023', event_type: 'repaired', from_location_id: null, to_location_id: null, fault_id: null, performed_by: 'amine', created_at: '2026-04-22T14:00:00Z', notes: 'Reparatie gestart' },
  { id: 'l5', vehicle_id: 'F-024', event_type: 'repaired', from_location_id: null, to_location_id: null, fault_id: null, performed_by: 'amine', created_at: '2026-04-24T11:00:00Z', notes: 'Klaar voor ophaling' },
]

export const MOCK_RANKING = [
  { location_id: 'bilderdijk', fault_count: 7, quality_avg: 4.2 },
  { location_id: 'linnaeus',   fault_count: 5, quality_avg: 3.8 },
  { location_id: 'molenwijk',  fault_count: 4, quality_avg: 4.7 },
  { location_id: 'pieter',     fault_count: 3, quality_avg: 3.1 },
  { location_id: 'buiksloot',  fault_count: 3, quality_avg: 4.5 },
  { location_id: 'vuurdoorn',  fault_count: 2, quality_avg: 3.9 },
  { location_id: 'jolleman',   fault_count: 2, quality_avg: 4.1 },
  { location_id: 'midden',     fault_count: 1, quality_avg: 4.8 },
]

/** Demo login profiles for mock mode */
export const DEMO_PROFILES: Array<{ id: string; email: string; label: string }> = [
  { id: 'ayoub',   email: 'ayoub@demo',    label: 'Ayoub — Manager Bilderdijkstraat' },
  { id: 'nadir',   email: 'nadir@demo',    label: 'Nadir — Manager Pieter Calandlaan' },
  { id: 'bryan',   email: 'bryan@demo',    label: 'Bryan — Manager Linnaeustraat' },
  { id: 'alex',    email: 'alex@demo',     label: 'Alex — Manager Molenwijk' },
  { id: 'karim',   email: 'karim@demo',    label: 'Karim — Supervisor' },
  { id: 'arjen',   email: 'arjen@demo',    label: 'Arjen — Supervisor' },
  { id: 'amine',   email: 'amine@demo',    label: 'Amine — Hub Monteur' },
  { id: 'mike',    email: 'mike@demo',     label: 'Mike — Chauffeur' },
  { id: 'isaac',   email: 'isaac@demo',    label: 'Isaac — Chauffeur' },
  { id: 'hassan',  email: 'hassan@demo',   label: 'Hassan — Chauffeur Enschede' },
]
