# Hi Tom Fleet — Full Data & Code Reference

This document describes every file, function, variable, and data structure in the project.
Scope: `apps/web/src/` (frontend) + `supabase/` (backend).

---

## 1. The Mock / Real Switch

### `apps/web/src/lib/supabase.ts`

```
MOCK_MODE  boolean
```
`true` when `VITE_MOCK_MODE=true` **or** when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set.
When `MOCK_MODE` is `true` the Supabase client is `null` and every hook returns static data from `mock.ts` instead of hitting the database.

```
supabase   SupabaseClient | null
```
The real Supabase JS client, created with the env-var credentials. `null` in mock mode. Every hook guards with `if (MOCK_MODE)` before using this.

**To switch from mock to real:** create `apps/web/.env.local` with your Supabase URL and anon key, and do NOT set `VITE_MOCK_MODE=true`.

---

## 2. Mock Data — `apps/web/src/lib/mock.ts`

All static arrays that replace the database when `MOCK_MODE` is `true`.
None of this data is ever sent to Supabase; it is JavaScript-only.

### Arrays

| Export | Type | Contains |
|---|---|---|
| `MOCK_LOCATIONS` | `Location[]` | 18 entries: 16 delivery locations (Amsterdam + Enschede) + 2 hub locations (Hub · Hoofddorp, Hub · Enschede) |
| `MOCK_USERS` | `User[]` | 20 entries: 15 managers (one per location), 2 supervisors, 1 mechanic, 3 drivers |
| `MOCK_VEHICLES` | `Vehicle[]` | ~25 entries: e-bikes (F-001…), scooters (S-001…), cars (A-001…), buses (B-001…) spread across locations |
| `MOCK_FAULTS` | `Fault[]` | 6 faults in various statuses (open, in_progress, ready) across different locations |
| `MOCK_SCHEDULES` | `PickupSchedule[]` | 7 pickup appointments linking drivers, vehicles, from/to locations, and faults |
| `MOCK_LOG` | `VehicleLog[]` | 5 vehicle history events (moved, fault, repaired) |
| `MOCK_RANKING` | `{location_id, fault_count, quality_avg}[]` | 8 ranking entries for the leaderboard |
| `DEMO_PROFILES` | `{id, email, label}[]` | 10 quick-login profiles shown on the Login screen in mock mode |

### Convenience maps (derived from arrays, O(1) lookup)

| Export | Key | Value |
|---|---|---|
| `MOCK_USERS_MAP` | user id (`string`) | `User` object |
| `MOCK_LOC_MAP` | location id (`string`) | `Location` object |

### Inline mock data in hooks (not in mock.ts)

Some hooks have their own small mock datasets defined locally:

- **`useNotifications.ts`** — `MOCK_NOTIFS`: 3 sample notifications for user `'ayoub'`
- **`useFaultEvents.ts`** — `MOCK_EVENTS`: status timeline for fault `'f1'` (3 events: open → in_progress → ready)
- **`useReserves.ts`** — generates reserves dynamically from `MOCK_LOCATIONS` using `DEFAULT_TARGET` (`ebike: 5, scooter: 2, car: 0, bus: 0`)

### Mock messages (`MOCK_MESSAGES`)

```
MOCK_MESSAGES: Record<faultId, ChatMessage[]>
```
Keys: `'f1'` (4 messages), `'f2'` (3 messages), `'f3'` (empty), `'f5'` (1 message).
Faults `'f4'` and `'f6'` have no mock messages.

---

## 3. Types — `apps/web/src/types/index.ts`

### Enums / union types

| Type | Values |
|---|---|
| `Role` | `'supervisor' \| 'manager' \| 'mechanic' \| 'driver'` |
| `VehicleType` | `'ebike' \| 'scooter' \| 'car' \| 'bus'` |
| `VehicleStatus` | `'ok' \| 'fault' \| 'hub' \| 'fix' \| 'ready'` |
| `FaultStatus` | `'open' \| 'in_progress' \| 'ready' \| 'closed'` |
| `PickupStatus` | `'planned' \| 'completed' \| 'cancelled'` |
| `EventType` | `'moved' \| 'fault' \| 'repaired' \| 'assigned'` |

### Interfaces (mirror database tables)

**`Location`**
```
id           string   — text primary key, e.g. 'bilderdijk', 'hub-hfd'
name         string   — display name, e.g. 'Bilderdijkstraat'
city         string
address      string   — street address
is_hub       boolean  — true for Hub locations only
created_at   string   — ISO timestamp
```

**`User`**
```
id           string   — UUID (matches auth.users.id)
full_name    string
role         Role
location_id  string   — which location this user belongs to
avatar_url   string | null
fcm_token    string | null  — Firebase Cloud Messaging token for push notifications
last_seen    string | null  — updated every 60s by usePresence; used to skip FCM push if user is online
created_at   string
location?    Location        — joined via select('*, location:locations(*)')
```

**`Vehicle`**
```
id           string   — e.g. 'F-001', 'S-003', 'A-001', 'B-002'
type         VehicleType
location_id  string
status       VehicleStatus
color        string | null
notes        string | null
created_at   string
updated_at   string
location?    Location
```

**`Fault`**
```
id           string   — UUID
vehicle_id   string
location_id  string
reported_by  string   — UUID of the user who filed it
fault_type   string   — e.g. 'Lekke band', 'Elektrische aandrijving'
notes        string | null  — reporter's free-text description
repair_notes string | null  — mechanic's free-text after repair
status       FaultStatus
photo_count  number   — maintained automatically by DB trigger sync_photo_count
quality_score number | null — calculated by DB trigger calc_quality_score (0–10 scale)
created_at   string
updated_at   string
closed_at    string | null  — set when status → 'closed'
vehicle?     Vehicle
location?    Location
reporter?    User
photos?      FaultPhoto[]
messages?    ChatMessage[]
```

**`FaultPhoto`**
```
id           string
fault_id     string
storage_path string   — path inside the 'fault-photos' Supabase Storage bucket
uploaded_by  string   — UUID
created_at   string
```

**`ChatMessage`**
```
id           string
fault_id     string
sender_id    string
body         string   — max 1000 chars (enforced by DB check constraint)
is_hub_side  boolean  — true = sent by mechanic/supervisor, false = sent by manager
created_at   string
sender?      User
```

**`PickupSchedule`**
```
id                string
fault_id          string | null  — optional link to a fault
driver_id         string
assigned_by       string
from_location_id  string
to_location_id    string
scheduled_date    string   — DATE, e.g. '2026-05-07'
time_from         string   — TIME, e.g. '10:00'
time_to           string   — TIME
vehicle_id        string
notes             string | null
status            PickupStatus
created_at        string
driver?           User
vehicle?          Vehicle
from_location?    Location
to_location?      Location
```

**`Notification`**
```
id                string
recipient_id      string
type              string   — 'fault_new' | 'fault_update' | 'fault_received' | 'pickup' | 'chat' | 'vehicle'
title             string
body              string
related_fault_id  string | null
related_pickup_id string | null
read_at           string | null  — null = unread
sent_at           string | null
created_at        string
```

**`Reserve`**
```
id           string
location_id  string
vehicle_type VehicleType
target_count number   — minimum number of this vehicle type that should be at this location
updated_by   string
updated_at   string
location?    Location
```

**`VehicleLog`**
```
id               string
vehicle_id       string
event_type       EventType
from_location_id string | null
to_location_id   string | null
fault_id         string | null
performed_by     string
created_at       string
notes            string | null
vehicle?         Vehicle
from_location?   Location
to_location?     Location
performer?       User
```

**`FaultEvent`**
```
id           string
fault_id     string
from_status  FaultStatus | null  — null on first event (creation)
to_status    FaultStatus
changed_by   string | null
created_at   string
```

**`AuthSession`**
```
user           User
supabaseUser   { id: string; email: string }
```

---

## 4. Utility Library — `apps/web/src/lib/utils.ts`

### Date formatters (use `date-fns` with Dutch locale)

| Function | Input | Output example |
|---|---|---|
| `fmtDate(d)` | ISO string | `'7 mei 2026'` |
| `fmtDateTime(d)` | ISO string | `'7 mei 2026 · 14:32'` |
| `fmtTime(d)` | ISO string | `'14:32'` |
| `fmtAgo(d)` | ISO string | `'3 uur geleden'` |

### Label maps

| Export | Maps |
|---|---|
| `vehicleTypeLabel` | `'ebike' → 'E-Bike'`, `'scooter' → 'E-Scooter'`, `'car' → 'Auto'`, `'bus' → 'Bus'` |
| `vehicleTypeIcon` | `'ebike' → '🔴'`, `'scooter' → '🔵'`, `'car' → '⚫'`, `'bus' → '🟡'` |
| `faultStatusLabel` | `'open' → 'Storing'`, `'in_progress' → 'Start Fix'`, `'ready' → 'Klaar'`, `'closed' → 'Gesloten'` |
| `roleLabel` | `'manager' → 'Locatie Manager'`, `'supervisor' → 'Supervisor'`, `'mechanic' → 'Hub Monteur'`, `'driver' → 'Chauffeur'` |

### Functions

**`exportCsv(rows, filename)`**
Downloads an array of objects as a UTF-8 CSV file (with BOM for Excel compatibility).
Used in: SupervisorDashboard (faults export), ManagerDashboard (faults export), AdminUsers (users export), AdminVehicles (vehicles export), HubSchedule (schedule export).

**`printChatThread(fault, messages)`**
Opens a new browser tab with a formatted HTML table of all chat messages for a fault, then triggers the browser print dialog. Includes a repair notes section if present.
Used in: FaultDetail (supervisor role only, "↓ PDF" button).

**`computeQualityScore(opts)`**
Pure function that mirrors the `calc_quality_score` database trigger.
Inputs: `photoCount`, `notes` (string), `faultType` (string), `submittedSameDay` (boolean).
Scoring:
- `photoCount >= 2` → +2 pts
- Each additional photo beyond 2, up to 6 extra → +0.5 pts each (max +3)
- Any notes → +2 pts
- Notes longer than 50 chars → +1 pt
- `faultType !== 'Overig'` → +1 pt
- `submittedSameDay` → +1 pt
- Minimum: 0

Used in FaultForm to show a live quality preview before submission, and tested in `src/lib/__tests__/utils.test.ts`.

---

## 5. Image Compression — `apps/web/src/lib/compress.ts`

**`compressImage(file)`** → `Promise<File>`
Skips files already ≤ 2 MB. Otherwise draws the image onto a canvas (capping dimensions at 1920px on the longest side) and re-encodes as JPEG at quality 0.85. Falls back to 0.70 if still over 2 MB.

**`compressAll(files)`** → `Promise<File[]>`
Runs `compressImage` on all files in parallel via `Promise.all`.

Used in: `FaultForm.tsx` `handlePhotoAdd`.

---

## 6. Data Hooks — `apps/web/src/hooks/`

All hooks follow the same pattern:
1. Check `MOCK_MODE` → return filtered static data if true.
2. Fetch from Supabase on mount.
3. Subscribe to a Supabase Realtime `postgres_changes` channel so the UI updates without a page refresh.
4. Clean up the channel on unmount.

---

### `useFaults(opts?)` — `hooks/useFaults.ts`

**Options:**
```
locationId?  string        — filter to one location
status?      FaultStatus | FaultStatus[]  — filter by status(es)
vehicleId?   string        — filter to one vehicle
limit?       number        — max rows returned
```

**Returns:**
```
faults        Fault[]
loading       boolean
error         string | null
reload()      — manually re-fetch
updateStatus(id, status)  — optimistic update + Supabase write
```

Realtime channel: `'faults-changes'` — listens to all changes on the `faults` table, calls `reload()` on any event.

Mock: filters `MOCK_FAULTS` by the provided options.

---

### `useFault(id?)` — `hooks/useFaults.ts`

Single fault by UUID. Different from `useFaults` because it also loads joined `reporter:users(full_name, role)`.

**Returns:**
```
fault    Fault | null
loading  boolean
setFault — React state setter for optimistic local updates (used in FaultDetail status changes)
```

Realtime channel: `'fault-{id}'` — listens to `UPDATE` on `faults` where `id=eq.{id}`, merges `payload.new` into state.

---

### `useVehicles(opts?)` — `hooks/useVehicles.ts`

**Options:**
```
locationId?     string
excludeStatus?  VehicleStatus[]  — e.g. ['hub'] to hide vehicles at the hub
hubOnly?        boolean          — only vehicles at hub-hfd or hub-ens
```

**Returns:**
```
vehicles   Vehicle[]
loading    boolean
assign(vehicleId, targetLocationId, performedBy)
           — moves vehicle to new location (status → 'ok') and writes a vehicle_log 'assigned' entry
reload()
```

Realtime channel: `'vehicles-changes'` — all events on `vehicles` table.

---

### `useVehicle(id?)` — `hooks/useVehicles.ts`

Single vehicle by ID. Realtime channel: `'vehicle-{id}'` — listens to `UPDATE` filtered by `id=eq.{id}`.

**Returns:** `{ vehicle, loading }`

---

### `useMessages(faultId?)` — `hooks/useMessages.ts`

Chat messages for one fault. Appends new messages from realtime without re-fetching all.

**Returns:**
```
messages  ChatMessage[]
loading   boolean
send(body, senderId, isHubSide)  — inserts a new message; in mock mode appends locally
```

Realtime channel: `'messages-{faultId}'` — listens to `INSERT` on `chat_messages` filtered by `fault_id=eq.{faultId}`.
Deduplicates by checking `prev.some((m) => m.id === msg.id)` before appending.

Mock: returns `MOCK_MESSAGES[faultId] ?? []`.

---

### `useNotifications()` — `hooks/useNotifications.ts`

**Returns:**
```
notifs        Notification[]  — last 50, newest first
loading       boolean
unreadCount   number          — derived: notifs.filter(n => !n.read_at).length
markRead(id)  — optimistic update + Supabase write
markAllRead() — marks all unread in one Supabase call
```

Realtime channel: `'notifications-{userId}'` — `INSERT` filtered by `recipient_id=eq.{userId}`. Prepends new notifications to state.

Mock: filters `MOCK_NOTIFS` by `recipient_id === user.id`. Only `'ayoub'` has mock notifications.

---

### `useSchedules(opts?)` — `hooks/useSchedules.ts`

**Options:**
```
driverId?       string
date?           string   — 'YYYY-MM-DD'
fromLocationId? string
faultId?        string
status?         PickupStatus[]
```

**Returns:**
```
schedules  PickupSchedule[]
loading    boolean
complete(id)  — sets status → 'completed' + writes vehicle_log 'moved' entry
cancel(id)    — sets status → 'cancelled'
create(fields) — inserts new schedule; returns {error}
```

Realtime channel: `'schedules-changes'` — all events on `pickup_schedules`.

Select query joins: `driver:users(full_name)`, `vehicle:vehicles(*)`, `from_location:locations!from_location_id(*)`, `to_location:locations!to_location_id(*)`.

---

### `useLocations(opts?)` — `hooks/useLocations.ts`

**Options:**
```
hubOnly?    boolean  — only is_hub=true rows
excludeHub? boolean  — only is_hub=false rows
```

**Returns:** `{ locations, loading, reload }`

Realtime channel: `'locations-changes'`.

---

### `useUsers(opts?)` — `hooks/useUsers.ts`

**Options:**
```
role?       Role
locationId? string
```

**Returns:** `{ users, loading, reload }`

Realtime channel: `'users-changes'`.

---

### `useReserves()` — `hooks/useReserves.ts`

**Returns:**
```
reserves  Reserve[]
loading   boolean
upsert(locationId, vehicleType, targetCount, updatedBy)
         — inserts or updates on (location_id, vehicle_type) conflict key
```

Realtime channel: `'reserves-changes'`.

Mock: generates reserves dynamically from `MOCK_LOCATIONS` (non-hub only) with `DEFAULT_TARGET = { ebike: 5, scooter: 2, car: 0, bus: 0 }`.

---

### `useRanking()` — `hooks/useRanking.ts`

Exports `RankEntry`:
```
location_id    string
location_name  string
fault_count    number
quality_avg    number
```

**Returns:**
```
byFaults   RankEntry[]  — sorted by fault_count descending
byQuality  RankEntry[]  — sorted by quality_avg descending
loading    boolean
```

In real mode: fetches all faults with location names and computes the ranking client-side from the raw data. Realtime channel: `'ranking-faults-changes'` — re-computes on any fault change.

Mock: uses `MOCK_RANKING` array + `MOCK_LOC_MAP` for names.

---

### `useFaultPhotos(faultId?)` — `hooks/useFaultPhotos.ts`

Returns photos with signed URLs (valid for 1 hour) from the `fault-photos` Supabase Storage bucket.

**Returns:**
```
photos   PhotoWithUrl[]  — FaultPhoto + signedUrl: string
loading  boolean
```

Realtime channel: `'fault-photos-{faultId}'` — `INSERT` events trigger a full reload (to generate new signed URLs).

Mock: always returns `[]` (no actual images in demo).

---

### `useFaultEvents(faultId?)` — `hooks/useFaultEvents.ts`

Status timeline for a fault (the `fault_events` table).

Also exports: `STATUS_ICON: Record<FaultStatus, string>` — `{ open: '🔴', in_progress: '🟡', ready: '🟢', closed: '⚫' }`.

**Returns:** `{ events: FaultEvent[], loading }`

Realtime channel: `'fault-events-{faultId}'` — appends `INSERT` events to state.

Mock: only `'f1'` has 3 events; all other faults return `[]`.

---

### `useVehicleLog(vehicleId?)` — `hooks/useVehicleLog.ts`

Movement / event history for one vehicle.

**Returns:** `{ log: VehicleLog[], loading }`

Realtime channel: `'vehicle-log-{vehicleId}'` — `INSERT` events filtered by `vehicle_id=eq.{vehicleId}`.

Mock: filters `MOCK_LOG` by `vehicle_id`.

---

### `usePresence(userId?)` — `hooks/usePresence.ts`

Side-effect only hook — no return value.
Updates `users.last_seen` immediately on mount, then every 60 seconds via `setInterval`.
Called in `Layout.tsx` for all logged-in users.
The `send-notification` edge function reads `last_seen` to decide whether to skip the FCM push (if the user has been active within 2 minutes, they're considered "online" and don't need a push).

---

### `usePushNotifications(userId?)` — `hooks/usePushNotifications.ts`

Side-effect only hook — no return value.
Requests browser Notification permission, registers the Firebase service worker (`/firebase-messaging-sw.js`), subscribes to push, encodes the subscription as a base64 token, and saves it to `users.fcm_token` in Supabase.

Reads: `VITE_FCM_VAPID_KEY` env var. Does nothing in mock mode or if the VAPID key is missing.
Called in `Layout.tsx`.

---

### `useInstallPrompt()` — `hooks/useInstallPrompt.ts`

Captures the browser's `beforeinstallprompt` event (fires when the app is installable as a PWA).

**Returns:**
```
canInstall  boolean  — true when prompt is captured and user hasn't dismissed
install()   — shows the native browser install dialog
dismiss()   — hides the banner for this session (persists to sessionStorage)
```

---

## 7. Context Providers — `apps/web/src/context/`

### `AuthContext.tsx`

**`AuthProvider`** — wraps the app, manages login state.

State:
```
user     User | null  — the currently logged-in user profile (from public.users, not auth.users)
loading  boolean
```

Functions exposed via `useAuth()`:
```
signIn(email, password)  — calls supabase.auth.signInWithPassword
signInMock(userId)       — sets mock user from MOCK_USERS_MAP (mock mode only)
signOut()                — clears session
```

In real mode: calls `supabase.auth.getSession()` on mount and subscribes to `onAuthStateChange`. On each session, loads the user profile from `public.users` with `select('*, location:locations(*)')`.

---

### `I18nContext.tsx`

NL/EN translation system.

**`I18nProvider`** — reads `localStorage['htf_lang']` on mount, defaults to `'nl'`.

Functions exposed via `useI18n()`:
```
lang       'nl' | 'en'
setLang(l) — updates state + localStorage
t(key)     — returns the translated string for a key
```

The full string dictionary (`STRINGS`) covers: nav labels, common words, fault statuses, vehicle types, schedule labels, notification labels, role labels, dashboard titles.

Currently only `DriverSchedule.tsx` uses `t()`. All other views have hardcoded Dutch strings.

---

## 8. Components — `apps/web/src/components/`

### `Layout.tsx`

The shell for all authenticated pages. Rendered by React Router as the parent `<Route element={<Layout />}>`.
- Calls `usePushNotifications(user?.id)` — registers FCM
- Calls `usePresence(user?.id)` — keeps `last_seen` fresh
- Renders: `<Nav />`, `<AdminNav />`, `<Outlet />` (the current page), `<MobileNav />`

### `Nav.tsx`

Top navigation bar. Always visible on desktop.
- Shows role-based quick links (mechanic sees Queue/Voertuigen/Planning; supervisor sees Queue/Planning/Admin)
- Notification bell (`🔔`) with live unread count badge from `useNotifications`
- `roleLabel[user.role] · user.full_name · locName` identity display
- NL/EN toggle button via `useI18n`
- Profiel and Uitloggen links

### `MobileNav.tsx`

Fixed bottom navigation bar — **only renders for the `manager` role**.
4 items: Dashboard, Melding (fault form), Notificaties (with badge), Profiel.
Plus a logout button.

### `AdminNav.tsx`

Secondary navigation strip shown above the page content for `supervisor` role only.
Links: Gebruikers, Locaties, Voertuigen, Reserves.

### `ChatPanel.tsx`

Two-sided chat UI for fault conversations.

Props:
```
faultId   string
messages  ChatMessage[]
readOnly? boolean      — supervisor sees chat but cannot send
onSend?   (faultId, body) => void
```

- Messages align right if sent by the current user's side (hub-side for mechanic/supervisor, location-side for manager)
- Auto-scrolls to bottom when new messages arrive (`useEffect` on `messages`)
- Enter key sends (Shift+Enter for newline)
- Max 1000 chars (enforced client and DB side)
- In `readOnly` mode shows the no-phone-contact policy banner instead of the input

### `InstallBanner.tsx`

Fixed banner at bottom of screen when the browser's PWA install prompt is available.
Uses `useInstallPrompt`. Dismissible for the session via `sessionStorage`.

### `StatusBadge.tsx`

`<FaultBadge status={...} />` and `<VehicleBadge status={...} />` — small coloured `<span>` badges.

### `Toast.tsx`

`<ToastProvider>` wraps the app (inside App.tsx). `useToast()` returns a function `toast(message, variant?)` where variant is `'success'` (default) or `'error'`. Renders a brief notification at top-right.

### `ProtectedRoute.tsx`

Wraps routes requiring authentication. `roles` prop lists which roles are allowed; redirects to `/unauthorized` if the user's role is not in the list.

### `ErrorBoundary.tsx`

React class component that catches render errors and shows a fallback UI instead of a blank screen.

---

## 9. Views — `apps/web/src/views/`

### `Login.tsx`
- In mock mode: shows a dropdown of `DEMO_PROFILES` and calls `signInMock(id)`
- In real mode: email/password form calling `signIn(email, password)`

### `ManagerDashboard.tsx`
Role: `manager`
Three tabs:
- **Dashboard** — stat tiles (e-bikes, scooters, active faults, ranking position), last hub visit card, upcoming pickups panel, last 3 faults
- **Storingen** — full fault list for this location, paginated (15 at a time), CSV export
- **Ranking** — location leaderboard by fault count and quality average

Hooks used: `useFaults({ locationId })`, `useVehicles({ locationId })`, `useSchedules({ fromLocationId, status: ['completed'] })`, `useSchedules({ fromLocationId, status: ['planned'] })`, `useRanking()`

State: `tab`, `visibleFaults` (pagination counter, starts at 15, increments by 15)

### `SupervisorDashboard.tsx`
Role: `supervisor`
Five tabs:
- **Overzicht** — fleet totals by vehicle type, active fault status counts, average resolution time, recent faults list, reserve shortage alerts (clickable → Locaties drill-down), hub inventory
- **Storingen** — searchable/filterable fault list across all locations, paginated (20 at a time, resets on filter/search change), CSV export
- **Ranking** — period selector (this month / previous month / year), fault count leaderboard + quality average leaderboard, computed client-side from period-filtered faults
- **Locaties** — per-location drill-down: fault list + vehicle list, selected by clicking a shortage alert or picking from a list
- **Planning** — all pickup schedules grouped by date, CSV export

Hooks used: `useFaults()`, `useVehicles()`, `useLocations({ excludeHub: true })`, `useReserves()`, `useSchedules({})`

State: `tab`, `rankPeriod`, `drillLoc`, `filterStatus`, `search`, `visibleFaults`

### `HubDashboard.tsx`
Role: `mechanic` (and `supervisor`)
Shows: open fault count, in-progress count, ready count. Quick links to Queue and Hub Vehicles.

### `HubQueue.tsx`
Role: `mechanic`, `supervisor`
Kanban board: Open / Start Fix / Klaar columns.
Each card shows vehicle ID, location, fault type, quality score (★), time elapsed (⏱) with colour-coded urgency (green < 4h, gold < 24h, red ≥ 24h).
Clicking "Start Fix" or "Afsluiten" calls `useFaults.updateStatus`.

Hooks used: `useFaults()`, `useVehicles()`

### `HubVehicles.tsx`
Role: `mechanic`, `supervisor`
Lists all vehicles at the hub. Multi-select + location picker → "Toewijzen" assigns selected vehicles to a destination location, calling `useVehicles.assign()` for each.

### `HubSchedule.tsx`
Role: `mechanic`, `supervisor`
Full pickup planning: schedule list grouped by date, driver filter tabs, CSV export. Create new pickup form: driver, vehicle (auto-populated from from-location), date, time window, from/to location, optional fault link, notes.

Hooks used: `useSchedules({})`, `useUsers({ role: 'driver' })`, `useLocations({})`, `useVehicles({ locationId })`, `useFaults({ status: ['open','in_progress','ready'] })`

### `DriverSchedule.tsx`
Role: `driver`
Shows today's and tomorrow's pickups for the logged-in driver. Each pickup card has a Google Maps deep link for the pickup address. Complete button calls `useSchedules.complete`.
Only view that fully uses `t()` for NL/EN translation.

### `FaultForm.tsx`
Role: `manager`
Four-step fault report form:
1. Select vehicle (from location's vehicles, excluding hub-status)
2. Select fault type (options vary by vehicle type)
3. Upload photos (min 2, max 8, auto-compressed via `compressAll`)
4. Add notes (optional, raises quality score)

Features:
- Draft persistence in `sessionStorage['htf_fault_draft']` (restored on mount)
- Duplicate detection: warns if the selected vehicle already has an active fault
- Live quality score preview via `computeQualityScore`
- Upload progress bar (per photo)
- On submit: inserts fault row → uploads each photo to Storage + inserts `fault_photos` row → DB trigger auto-updates `photo_count` and `quality_score`

### `FaultDetail.tsx`
Role: all (different capabilities per role)
Shows all fault details: vehicle info, fault type, reporter, photo count, quality score, closed_at, notes, repair notes, photo gallery (with lightbox), pickup schedules linked to this fault, status timeline.

Status actions (mechanic / supervisor only, status ≠ closed):
- Open → "▶ Start Fix" → `in_progress`
- In Progress → "✓ Klaar" → opens repair notes textarea → confirm → `ready`
- Ready → "Afsluiten" → `closed`

Supervisor reopen (status = closed):
- "↩ Heropenen" (with confirm dialog) → `open`

Supervisor PDF:
- "↓ PDF" button → `printChatThread(fault, messages)` — opens print dialog

Chat panel is read-only for supervisor, interactive for manager and mechanic.

Hooks used: `useFault(id)`, `useMessages(id)`, `useFaultPhotos(id)`, `useFaultEvents(id)`, `useSchedules({ faultId: id })`

State: `lightbox` (string | null — signed URL of photo to show fullscreen), `repairInput` (string | null — repair notes draft)

### `VehicleHistory.tsx`
Role: all
Shows a vehicle's full history: current status badge, fault list, event log (moved/fault/repaired/assigned). CSV export button.

### `Notifications.tsx`
Role: all
Lists the logged-in user's notifications (last 50). Click to mark read. "Alles gelezen markeren" bulk action. Deep link to fault detail if `related_fault_id` is set.

### `Profile.tsx`
Role: all
Edit display name. Change password (real mode only, min 6 chars). Notification preferences (stored in `localStorage['htf_notif_prefs']` — currently local only, not pushed to DB).

### Admin views (`views/admin/`)

**`Users.tsx`** — Supervisor only.
Table of all users with role filter and name search. CSV export. Invite form (email, name, role, optional location) calls `admin-user` edge function with `action: 'invite'`. Deactivate button calls `admin-user` with `action: 'deactivate'`.

**`Vehicles.tsx`** — Supervisor only.
Table of all vehicles with type/status filters and ID search. CSV export. Add vehicle form. Edit vehicle form (color, notes fields). "Pensioneren" sets status to `'hub'` with note `'Buiten dienst'`.

**`Locations.tsx`** — Supervisor only.
Table of all locations. Add location form.

**`Reserves.tsx`** — Supervisor only.
Grid of reserve targets (minimum vehicle counts per location per type). Inline editing of `target_count` calls `useReserves.upsert`.

---

## 10. Routing — `apps/web/src/App.tsx`

| Path | Component | Roles |
|---|---|---|
| `/login` | `Login` | public |
| `/unauthorized` | `Unauthorized` | public |
| `/` | redirect based on role | authenticated |
| `/dashboard` | `ManagerDashboard` | manager |
| `/report` | `FaultForm` | manager |
| `/supervisor` | `SupervisorDashboard` | supervisor |
| `/admin/users` | `AdminUsers` | supervisor |
| `/admin/locations` | `AdminLocations` | supervisor |
| `/admin/vehicles` | `AdminVehicles` | supervisor |
| `/admin/reserves` | `AdminReserves` | supervisor |
| `/hub` | `HubDashboard` | mechanic, supervisor |
| `/hub/queue` | `HubQueue` | mechanic, supervisor |
| `/hub/vehicles` | `HubVehicles` | mechanic, supervisor |
| `/hub/schedule` | `HubSchedule` | mechanic, supervisor |
| `/driver/schedule` | `DriverSchedule` | driver |
| `/faults/:id` | `FaultDetail` | all |
| `/vehicles/:id` | `VehicleHistory` | all |
| `/notifications` | `Notifications` | all |
| `/profile` | `Profile` | all |

`InstallBanner` is rendered outside the route tree (inside `ToastProvider`, before `<Routes>`), so it appears on all pages.

---

## 11. Supabase Edge Functions — `supabase/functions/`

### `send-notification/index.ts`

Triggered by Supabase Database Webhooks (not called by the frontend directly).
Uses the Supabase service role key so it has full DB access.

**Env vars read:**
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase
- `FIREBASE_SERVICE_ACCOUNT_JSON` — full Firebase service account JSON, for FCM HTTP v1 auth
- `RESEND_API_KEY` — for transactional email

**What it does per event:**

| Table | Event | Action |
|---|---|---|
| `faults` | INSERT | Notifies all mechanics + supervisors of new fault. Notifies the reporter with confirmation. |
| `faults` | UPDATE (→ in_progress) | Notifies all supervisors. |
| `faults` | UPDATE (→ ready) | Notifies all supervisors. Notifies the reporter that vehicle is fixed. |
| `faults` | UPDATE (→ open from closed) | Notifies all mechanics that fault was reopened. |
| `pickup_schedules` | INSERT | Notifies the assigned driver. Notifies location managers. |
| `pickup_schedules` | UPDATE (→ completed) | Notifies managers at the destination if it's a non-hub location. |
| `pickup_schedules` | UPDATE (→ cancelled) | Notifies the driver. Notifies location managers. |
| `chat_messages` | INSERT | If hub-side message: notifies reporter. If location-side message: notifies all mechanics. |

**FCM HTTP v1 flow (`getFcmAccessToken`, `sendFCM`):**
Builds a JWT (RS256, signed with the service account private key via `crypto.subtle`), exchanges it for an OAuth2 access token at `https://oauth2.googleapis.com/token`, then POSTs to `https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`. Token is cached in `_cachedToken` for its lifetime.

**Online check:** reads `users.last_seen` — if within 2 minutes, skips FCM push (user has the app open).

**`notify(payload)`** — internal helper that:
1. Writes a row to `notifications` table
2. Looks up recipient's `fcm_token` and `last_seen`
3. Sends FCM push if token exists and user is offline
4. Sends email via Resend if recipient has an email

---

### `admin-user/index.ts`

Called by the frontend via `supabase.functions.invoke('admin-user', { body: {...} })`.
Requires a valid JWT (user must be authenticated). Checks that the caller's role in `public.users` is `'supervisor'` — returns 403 otherwise.

**`action: 'invite'`**
Fields: `email`, `full_name`, `role`, `location_id` (optional).
Calls `supabase.auth.admin.inviteUserByEmail(email, { data: { full_name, role, location_id }, redirectTo: SITE_URL + '/login' })`.
Then immediately upserts into `public.users` (the DB trigger on `auth.users` may not fire until email confirmation, so the upsert ensures the user appears in the admin list right away).

**`action: 'deactivate'`**
Fields: `user_id`.
Calls `supabase.auth.admin.updateUserById(user_id, { ban_duration: '876000h' })` — effectively permanent ban (~100 years). Reversible in the Supabase dashboard.

---

## 12. Database — `supabase/migrations/`

Migrations run in filename order when you run `supabase db push`.

| File | What it does |
|---|---|
| `20260501000000_tables.sql` | Creates all 10 tables, all enums, all indexes, and 4 triggers |
| `20260501000001_rls.sql` | Row-level security policies for every table |
| `20260501000002_seed.sql` | Inserts 18 locations and ~40 vehicles. User rows are commented out (need real UUIDs). |
| `20260501000003_last_seen.sql` | Adds `last_seen TIMESTAMPTZ` column to `users` |
| `20260507000000_nullable_fault_id_and_webhooks.sql` | Makes `fault_id` in `pickup_schedules` nullable (hub can create pickups not linked to a fault) |
| `20260507000001_webhook_with_old_record.sql` | Configures DB webhooks to include `old_record` in the payload (needed for status transition detection) |
| `20260507000002_fault_closed_at.sql` | Adds `closed_at TIMESTAMPTZ` to `faults`; trigger sets it when status → `'closed'` |
| `20260507000003_schedules_rls_managers.sql` | Adds RLS policy letting managers read pickup schedules for their location |
| `20260508000000_fault_events_and_stats_view.sql` | Creates `fault_events` table + trigger that logs every fault status change. Creates a `location_stats` view. |
| `20260508000001_schedule_complete_moves_vehicle.sql` | Trigger: when a pickup schedule is completed, updates the vehicle's `location_id` to `to_location_id` |
| `20260508000002_schedule_update_webhook.sql` | Registers the DB webhook for `pickup_schedules UPDATE` events |
| `20260508000003_fault_repair_notes.sql` | Adds `repair_notes TEXT` column to `faults` |

### Key database triggers (in `tables.sql`)

| Trigger | Fires on | Does |
|---|---|---|
| `vehicles_updated_at` | `vehicles` BEFORE UPDATE | Sets `updated_at = NOW()` |
| `faults_updated_at` | `faults` BEFORE UPDATE | Sets `updated_at = NOW()` |
| `photos_inserted` | `fault_photos` AFTER INSERT or DELETE | Recounts `fault_photos` and updates `faults.photo_count` |
| `faults_sync_vehicle` | `faults` AFTER INSERT or UPDATE(status) | INSERT → vehicle status `'fault'`; → in_progress → `'fix'`; → ready → `'ready'`; → closed → `'ok'` |
| `faults_quality` | `faults` BEFORE INSERT or UPDATE(photo_count, notes, fault_type) | Calculates and writes `quality_score` using the same formula as `computeQualityScore` |

---

## 13. PWA & Firebase — `apps/web/public/`

| File | Purpose |
|---|---|
| `manifest.json` | PWA manifest: app name "Hi Tom Fleet", theme color `#C41E1E`, display `standalone`, icon references |
| `firebase-messaging-sw.js` | Firebase service worker for background push notifications. Must be updated with real `firebaseConfig` values before deploying. |
| `icon-192.png` | PWA icon (192×192) — **not yet created, needs real image** |
| `icon-512.png` | PWA icon (512×512) — **not yet created, needs real image** |
| `badge-72.png` | Notification badge (72×72) — **not yet created, needs real image** |

---

## 14. Configuration Files

| File | Purpose |
|---|---|
| `apps/web/.env.local.example` | Template for local env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MOCK_MODE` |
| `apps/web/vite.config.ts` | Vite config: React plugin, `@` path alias → `src/`, vitest test config |
| `apps/web/tsconfig.json` | TypeScript: strict mode, `bundler` module resolution, `@/*` alias, excludes `src/**/__tests__/**` |
| `supabase/config.toml` | Local Supabase dev config: ports, auth settings (no email confirmation), storage bucket `fault-photos`, edge function JWT verification |

---

## 15. Tests — `apps/web/src/lib/__tests__/utils.test.ts`

9 unit tests using vitest covering:
- `computeQualityScore` — 8 cases (zero score, photo thresholds, notes bonus, specific type bonus, same-day bonus, full score)
- `faultStatusLabel` — all 4 statuses
- `vehicleTypeLabel` — all 4 types
- `roleLabel` — all 4 roles
- `exportCsv` — empty input doesn't throw

Run with: `npm test` (from `apps/web/`)
