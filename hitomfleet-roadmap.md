# Hi Tom Fleet — Full Build Roadmap
> Last updated: May 2026 · Status: Planning

---

## Stack Decision

Before any task begins, the following stack is assumed. Deviate only with explicit approval.

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Already prototyped, fast, Vercel-native |
| Backend / DB | Supabase | Auth + Postgres + Realtime + Storage in one |
| File storage | Supabase Storage | Photo uploads, integrated with DB policies |
| Push notifications | Firebase Cloud Messaging (FCM) | Cross-platform, reliable, free tier |
| Email notifications | Resend | Simple API, good deliverability |
| Deployment | Vercel (frontend) + Supabase (backend) | Both have free tiers, zero-config |
| Styling | Tailwind CSS | Replaces hand-rolled CSS from demo |

---

## Phase 0 — Foundation

Everything else depends on this. Do not start Phase 1 until Phase 0 is complete.

### 0.1 Repository & Project Setup
- [ ] Initialize monorepo: `/apps/web` (React) + `/supabase` (migrations, edge functions)
- [ ] Configure Vite + React + TypeScript
- [ ] Set up Tailwind CSS with Hi Tom Fleet design tokens (red, cream, green, gold)
- [ ] Configure ESLint + Prettier
- [ ] Set up Git branching strategy: `main` → `staging` → feature branches
- [ ] Create `.env.example` with all required env vars documented
- [ ] Connect repo to Vercel, enable preview deployments per branch
- [ ] Connect repo to Supabase project (create two: `prod` and `staging`)

### 0.2 Database Schema
Design and migrate all tables before writing any frontend code.

#### Tables to create:

**`locations`**
```
id, name, city, address, is_hub (bool), created_at
```

**`users`**
```
id (auth.users FK), full_name, role (enum: supervisor | manager | mechanic | driver),
location_id (FK), avatar_url, fcm_token, created_at
```
> Role enum is enforced at DB level via Postgres check constraint.

**`vehicles`**
```
id (e.g. F-001), type (enum: ebike | scooter | car | bus),
location_id (FK), status (enum: ok | fault | hub | fix | ready),
color, notes, created_at, updated_at
```

**`vehicle_log`**
```
id, vehicle_id (FK), event_type (moved | fault | repaired | assigned),
from_location_id, to_location_id, fault_id, performed_by (user FK),
created_at, notes
```

**`faults`**
```
id, vehicle_id (FK), location_id (FK), reported_by (user FK),
fault_type (text), notes (text), status (enum: open | in_progress | ready | closed),
photo_count, created_at, updated_at, closed_at
```

**`fault_photos`**
```
id, fault_id (FK), storage_path (text), uploaded_by (user FK), created_at
```

**`chat_messages`**
```
id, fault_id (FK), sender_id (user FK), body (text),
is_hub_side (bool), created_at
```

**`pickup_schedules`**
```
id, fault_id (FK), driver_id (user FK), assigned_by (user FK),
from_location_id (FK), to_location_id (FK),
scheduled_date (date), time_from (time), time_to (time),
vehicle_id (FK), notes, status (enum: planned | completed | cancelled),
created_at
```

**`notifications`**
```
id, recipient_id (user FK), type (text), title, body,
related_fault_id, related_pickup_id, read_at, sent_at, created_at
```

**`reserves`**
```
id, location_id (FK), vehicle_type (enum), target_count (int),
updated_by (user FK), updated_at
```

- [ ] Write migration files for all tables above
- [ ] Add Row Level Security (RLS) policies — see Phase 0.3
- [ ] Seed database with all 18 locations and ~255 vehicles (F-001…F-175, S-001…S-55, A-001…A-25, B-001, B-002)
- [ ] Add all known users with correct roles and locations

### 0.3 Row Level Security (RLS) Policies
This is the access control layer. Every table must have explicit policies.

| Table | Rule summary |
|---|---|
| `users` | Users see own row. Supervisors see all. |
| `vehicles` | Managers see vehicles at their location. Supervisors/Hub see all. Only Hub/Supervisors can update location_id. |
| `faults` | Managers see own location faults. Supervisors/Hub see all. |
| `fault_photos` | Same as faults. |
| `chat_messages` | Manager sees messages for their location faults. Hub/Supervisors see all. |
| `pickup_schedules` | Drivers see only their own. Hub/Supervisors see all. |
| `notifications` | Users see only their own. |
| `reserves` | Managers see own location. Supervisors see all. Only Supervisors can update. |
| `vehicle_log` | Managers see own location history. Supervisors see all. |

- [ ] Implement and test all RLS policies
- [ ] Write automated policy tests using `pgTAP` or Supabase's built-in test runner

### 0.4 Authentication
- [ ] Enable Supabase Auth with email/password
- [ ] Create accounts for all known users (see locations list in briefing)
- [ ] On first login, user must set their own password via email invite flow
- [ ] Middleware: protect all routes — unauthenticated users redirect to `/login`
- [ ] Store `fcm_token` on login for push notification delivery
- [ ] Session refresh handling (Supabase handles, but test edge cases)

---

## Phase 1 — Core Infrastructure

### 1.1 Global Layout & Navigation
- [ ] Authenticated shell: top nav with role label, location name, logout
- [ ] Checkered stripe header (brand identity from demo)
- [ ] Role-based route guarding: each role sees only their permitted routes
- [ ] Responsive layout (mobile-first — managers will use phones on the floor)
- [ ] Loading states and error boundaries for all data fetches
- [ ] 404 and unauthorized pages

### 1.2 User Profile & Settings
- [ ] Profile page: name, role, location, avatar upload
- [ ] Change password flow
- [ ] Notification preferences (opt in/out of specific notification types)
- [ ] Language toggle: NL / EN (default NL)

---

## Phase 2 — Fault Reporting

This is the most-used feature. Managers use it daily. It must be fast and reliable on mobile.

### 2.1 Fault Report Form
- [ ] Route: `/report` — accessible to managers only
- [ ] Step 1: Select vehicle from dropdown (filtered to own location, excludes vehicles at Hub)
- [ ] Step 2: Select fault type (dynamically changes based on vehicle type):
  - E-bike / Scooter: `Elektrische aandrijving | Pizza Box | Lekke band | Spaken | Sleutel kwijt | Overig`
  - Car: `Start niet | Lekke band | Ongeluk | Onderhoud | Overig`
  - Bus: `Start niet | Lekke band | Ongeluk | Onderhoud | Overig`
- [ ] Step 3: Photo upload — minimum 2 required, maximum 8 allowed
  - Upload directly to Supabase Storage (`fault-photos` bucket, private)
  - Show thumbnail previews before submit
  - Compress images client-side before upload (max 2MB each)
  - Show upload progress bar
- [ ] Step 4: Optional notes text field
- [ ] Step 5: Confirmation screen with auto-notification trigger
- [ ] Prevent duplicate active faults for the same vehicle (warn user, allow override)
- [ ] One fault per form submission — confirmed by UX copy
- [ ] Introductory instruction text shown above form (verbatim from briefing)
- [ ] Form state is persisted in sessionStorage in case of accidental navigation away

### 2.2 Photo Storage
- [ ] Supabase Storage bucket: `fault-photos` with private access
- [ ] Signed URLs for viewing photos (expire after 1 hour)
- [ ] RLS: only fault reporter, Hub staff, and Supervisors can access photos
- [ ] Auto-delete orphaned photos if fault submission fails

---

## Phase 3 — Notifications

### 3.1 Notification Infrastructure
- [ ] Supabase Edge Function: `send-notification` — triggered by DB changes via webhook
- [ ] FCM integration for push notifications (web push via service worker)
- [ ] Resend integration for email fallback
- [ ] Notification log stored in `notifications` table for in-app badge

### 3.2 Notification Triggers

| Event | Recipient | Message template |
|---|---|---|
| Fault submitted | All Hub staff + Supervisors | "Storing bij [locatie]: [voertuig] — [type]" |
| Fault received (confirmation) | Reporting manager | "Beste [naam], bedankt voor je melding. We bezoeken je locatie zo snel mogelijk. — Hi Tom Fleet" |
| Pickup scheduled | Location manager | "Beste [locatie]/[naam], je staat gepland voor een ophaalmoment op [datum] tussen [tijd]. Geef aanvullende informatie snel door via de Hi Tom Fleet app." |
| Repair started (Start Fix) | Supervisors | "[voertuig] — Start Fix gestart" |
| Repair complete (Ready) | Supervisors + reporting manager | "[voertuig] — Klaar voor ophaling" |
| New chat message | Other party in thread | "[naam]: [preview van bericht]" |
| Vehicle reassigned to location | Location manager | "[voertuig] wordt aan jouw locatie toegewezen" |

- [ ] Implement all triggers above as Supabase webhooks → Edge Functions
- [ ] In-app notification bell icon with unread count badge
- [ ] Notification inbox page (`/notifications`) with mark-as-read
- [ ] Do not send push if user has app open (use Supabase Realtime presence instead)

---

## Phase 4 — In-App Chat

### 4.1 Chat Architecture
- [ ] Each fault has exactly one chat thread
- [ ] Messages stored in `chat_messages` table
- [ ] Real-time delivery via Supabase Realtime (Postgres changes subscription)
- [ ] No external chat services (no WhatsApp, no Slack, no phone)

### 4.2 Chat UI — Manager Side
- [ ] Chat panel embedded inside fault detail view
- [ ] Messages displayed as bubbles: manager (left) / Hub (right)
- [ ] Timestamp + sender name on each message
- [ ] Input field + send button (Enter to send)
- [ ] Scroll to latest message on open
- [ ] Unread indicator on fault card if new message since last view
- [ ] Character limit: 1000 characters per message
- [ ] No file/image sharing in chat (photos are submitted through the fault form)

### 4.3 Chat UI — Hub Side
- [ ] Hub staff see all open fault threads
- [ ] Threads sorted by: unread first, then by last message time
- [ ] Thread list shows: vehicle ID, location, fault type, last message preview
- [ ] Hub can reply from the thread detail view

### 4.4 Chat UI — Supervisor Side
- [ ] Supervisors see all threads in read-only mode
- [ ] Filter threads by: location, vehicle, fault status
- [ ] Export thread as PDF (for dispute resolution)
- [ ] Supervisors cannot send messages (view only — maintains accountability)

### 4.5 Policy Enforcement
- [ ] No phone contact policy displayed in UI: persistent banner in fault detail and chat views
- [ ] Policy text: "📵 Communicatie verloopt uitsluitend via Hi Tom Fleet. Geen telefonisch contact."

---

## Phase 5 — Hub Operations

### 5.1 Hub Fault Queue
- [ ] Route: `/hub/queue` — accessible to Hub mechanics and Supervisors
- [ ] List all open faults grouped by status: `Storing | Start Fix | Klaar`
- [ ] Each fault card shows: vehicle ID, type, origin location, fault type, photo count, time since reported
- [ ] One-click status transitions:
  - `Storing` → `Start Fix` (triggers supervisor notification)
  - `Start Fix` → `Klaar` (triggers supervisor + manager notification)
- [ ] Live count of faults per status updates in real-time (Supabase Realtime)
- [ ] Filter queue by: vehicle type, location, days open

### 5.2 Vehicle Reassignment
- [ ] Route: `/hub/vehicles` — Hub mechanics and Supervisors only
- [ ] Table of all vehicles in Hub inventory
- [ ] Action: "Assign to location" — moves vehicle from Hub to selected location
  - Updates `vehicles.location_id` and `vehicles.status`
  - Logs event in `vehicle_log`
  - Sends notification to destination location manager
- [ ] Managers do NOT have access to this feature (enforced by RLS + route guard)
- [ ] Bulk assign: select multiple vehicles, assign to same location in one action

### 5.3 Pickup Scheduling
- [ ] Route: `/hub/schedule` — Hub mechanics and Supervisors
- [ ] Create pickup appointment:
  - Select fault(s) to pick up
  - Set date + time window (from / to)
  - Assign to driver (Mike / Isaac / Hassan)
  - Notes field
- [ ] Bulk scheduling: one appointment can include multiple vehicles from the same route
- [ ] Edit and cancel appointments
- [ ] On create: notify assigned driver + origin location manager
- [ ] Calendar view (week view) showing all scheduled pickups per driver

---

## Phase 6 — Driver Module

### 6.1 Driver Schedule View
- [ ] Route: `/driver/schedule` — drivers only
- [ ] Show today's schedule by default (date picker for other days)
- [ ] Timeline view per appointment:
  - Time window
  - From → To locations
  - Vehicle ID(s) to pick up or deliver
  - Action (Pickup / Drop / Both)
  - Notes from Hub
- [ ] Drivers see ONLY their own appointments (enforced by RLS)
- [ ] Mark appointment as completed (updates `pickup_schedules.status`)
- [ ] No editing or cancelling — only Hub can modify

---

## Phase 7 — Dashboards

### 7.1 Manager Dashboard
- [ ] Route: `/dashboard` — managers
- [ ] Stats row: total e-bikes, total scooters, active faults, ranking position
- [ ] Last Hub visit date and what was picked up / delivered
- [ ] Reserve count for their location (read-only, set by Supervisor)
- [ ] Recent faults list with status badges
- [ ] Quick link: "Storing melden" button always visible
- [ ] Ranking table: all locations sorted by fault count (current month)
- [ ] Ranking table: all locations sorted by report quality score
  - Quality score = weighted average of: photo count (≥2), notes provided (yes/no), report completeness
  - Score calculated server-side, stored or computed on query

### 7.2 Supervisor Dashboard
- [ ] Route: `/supervisor` — supervisors only
- [ ] Fleet summary: total vehicles by type with status breakdown (ok / fault / hub / fix / ready)
- [ ] Total active faults: globally and per location
- [ ] Reserve targets per location (editable inline)
- [ ] Rankings:
  - By fault count: current month / previous month / year-to-date (tab selector)
  - By report quality score
- [ ] Live fault count in Hub (updates in real-time)
- [ ] Location drill-down: click any location to see its full vehicle list and fault history
- [ ] Export: download current dashboard data as CSV

### 7.3 Hub Dashboard
- [ ] Route: `/hub` — Hub mechanics and Supervisors
- [ ] Live fault queue counts (Realtime)
- [ ] Vehicles currently in Hub
- [ ] Today's driver schedules (summary)
- [ ] Quick actions: change fault status, assign vehicle

---

## Phase 8 — Vehicle History Log

- [ ] Route: `/vehicles/:id` — role-based (managers see own, Supervisors see all)
- [ ] Full timeline per vehicle:
  - All location changes (with date, performed by)
  - All faults (with type, resolution, duration)
  - All repairs (with status transitions, mechanic)
  - All pickups and deliveries
- [ ] Filter log by event type or date range
- [ ] Managers can access log for vehicles currently at their location
- [ ] Supervisors can access log for any vehicle

---

## Phase 9 — Admin Panel

For Supervisors only. This is where the system is configured.

### 9.1 User Management
- [ ] Route: `/admin/users`
- [ ] List all users with name, role, location, last login
- [ ] Invite new user: sends email with set-password link
- [ ] Edit user: change role, change assigned location(s)
- [ ] Deactivate user (does not delete — preserves audit trail)
- [ ] Note: some users belong to multiple locations (e.g. Imrane: Buikslotermeerplein + Dotterbloemstraat). Support multi-location assignment.

### 9.2 Location Management
- [ ] Route: `/admin/locations`
- [ ] List all locations with address, managers, vehicle count
- [ ] Add / edit location
- [ ] Assign managers to location

### 9.3 Vehicle Management
- [ ] Route: `/admin/vehicles`
- [ ] List all vehicles with current location and status
- [ ] Add new vehicle (sets ID, type, initial location)
- [ ] Retire vehicle (removes from active fleet, preserves history)
- [ ] Bulk import via CSV

### 9.4 Reserve Targets
- [ ] Route: `/admin/reserves`
- [ ] Set minimum reserve count per vehicle type per location
- [ ] Shown on Manager dashboard as target vs actual
- [ ] Flag locations below target (optional: automated notification)

---

## Phase 10 — Quality Score Engine

The quality score drives competition between locations.

- [ ] Score is calculated per fault report on submission
- [ ] Scoring criteria:

| Criteria | Points |
|---|---|
| 2 photos uploaded | +2 |
| Each additional photo (up to 8) | +0.5 |
| Notes field filled in | +2 |
| Notes > 50 characters | +1 |
| Fault type is specific (not "Overig") | +1 |
| Report submitted within same day as fault occurred | +1 |

- [ ] Score is stored on `faults` table as `quality_score` (float)
- [ ] Location monthly average shown on both dashboards
- [ ] Ranking updates in real-time as reports come in

---

## Phase 11 — Testing

### 11.1 Unit Tests
- [ ] Test all Supabase Edge Functions
- [ ] Test quality score calculation logic
- [ ] Test notification trigger conditions

### 11.2 Integration Tests
- [ ] Test RLS policies for each role combination
- [ ] Test fault submission flow end-to-end
- [ ] Test chat message delivery (real-time)
- [ ] Test notification delivery (FCM + email)

### 11.3 End-to-End Tests (Playwright)
- [ ] Manager: login → report fault → upload photos → submit → receive confirmation
- [ ] Hub: login → see new fault in queue → change status → schedule pickup
- [ ] Driver: login → see schedule → mark completed
- [ ] Supervisor: login → see all faults → read chat thread → check rankings

### 11.4 Manual QA
- [ ] Test on iOS Safari (managers use iPhones)
- [ ] Test on Android Chrome
- [ ] Test photo upload on low-bandwidth (3G simulation)
- [ ] Verify all Dutch copy is correct and consistent
- [ ] Test with real email accounts before go-live

---

## Phase 12 — Deployment & Go-Live

- [ ] Configure production environment variables
- [ ] Set up Supabase production project with backups enabled
- [ ] Configure custom domain (e.g. `fleet.hitom.nl`)
- [ ] Enable Supabase Point-in-Time Recovery
- [ ] Set up Vercel Analytics
- [ ] Create all real user accounts and send invite emails
- [ ] Onboarding session: walk through each role with the actual users
- [ ] Monitor error logs for first 2 weeks post-launch (Sentry recommended)
- [ ] Soft launch: start with 2–3 pilot locations before rolling out to all 18

---

## Phase 13 — Future Features (Backlog)

These are explicitly out of scope for v1.0 but must not be architecturally blocked.

- [ ] **GPS tracking** — Real-time vehicle location on a map. Requires hardware (GPS trackers on vehicles) + integration layer.
- [ ] **In-store display screens** — Delivery personnel tracker visible on a screen at the location. Could use a read-only token-based URL.
- [ ] **Delivery productivity** — Km tracking per delivery, linked to driver + vehicle.
- [ ] **Trip & mileage registration** — Automatic maintenance triggers when mileage threshold is reached.
- [ ] **E-bike theft prevention** — Integration with e-bike lock/alarm hardware.
- [ ] **Airtable migration (if needed)** — If Supabase is eventually replaced, the schema is designed to be portable.

---

## Open Questions

These must be answered before or during Phase 0.

1. **Multi-location users**: Imrane, Hamza, Karim etc. manage multiple locations. When they log in, which location is "active"? Do they switch context, or see a combined view?
2. **Hub as a location**: Should Hub Hoofddorp and Hub Enschede behave like regular locations for fault reporting, or only as operational hubs?
3. **Buses**: Only 2 buses, both at Hub. Who reports faults for buses — drivers or Hub mechanics?
4. **Photo retention**: How long should fault photos be kept? Delete after fault is closed, or retain for audit?
5. **Language**: All UI copy in Dutch, or bilingual? The team seems mixed.
6. **Quality score visibility**: Should managers see their own score, or only supervisors?
7. **Pilot locations for soft launch**: Which 2–3 locations should go live first?

---

## Milestone Summary

| Phase | Description | Depends on |
|---|---|---|
| 0 | Foundation: repo, schema, auth, RLS | — |
| 1 | Layout, navigation, user profiles | 0 |
| 2 | Fault reporting + photo upload | 0, 1 |
| 3 | Notifications | 2 |
| 4 | In-app chat | 2, 3 |
| 5 | Hub operations | 2, 3, 4 |
| 6 | Driver module | 5 |
| 7 | Dashboards | 2, 4, 5, 6 |
| 8 | Vehicle history log | 2, 5 |
| 9 | Admin panel | 0, 1 |
| 10 | Quality score engine | 2, 7 |
| 11 | Testing | all |
| 12 | Deployment & go-live | all |
| 13 | Future features (backlog) | post-launch |
