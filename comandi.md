# Comandi Supabase — Hi Tom Fleet

**Legenda:** `[UI]` = fattibile dalla webapp · `[SQL]` = solo via SQL editor / service role · `[AUTO]` = gestito da trigger

---

## Entità dello schema

| Tabella | Descrizione |
|---|---|
| `locations` | Sedi / hub fisici |
| `users` | Utenti applicazione (estende `auth.users`) |
| `vehicles` | Mezzi (ebike, scooter, auto, bus) |
| `faults` | Segnalazioni di guasto |
| `fault_photos` | Foto allegate a una segnalazione |
| `fault_events` | Audit trail dei cambi di stato di una segnalazione |
| `chat_messages` | Chat tra sede e hub su una segnalazione |
| `pickup_schedules` | Pianificazione ritiri/trasporti mezzi |
| `notifications` | Notifiche push per gli utenti |
| `reserves` | Target di riserva mezzi per sede |
| `vehicle_log` | Log storico degli eventi su un mezzo |

**View:**
| View | Descrizione |
|---|---|
| `fault_stats` | KPI aggregati per sede (totale guasti, attivi, media qualità, ore risoluzione) |

---

## Enum

| Tipo | Valori |
|---|---|
| `vehicle_type` | `ebike`, `scooter`, `car`, `bus` |
| `vehicle_status` | `ok`, `fault`, `hub`, `fix`, `ready` |
| `fault_status` | `open`, `in_progress`, `ready`, `closed` |
| `pickup_status` | `planned`, `completed`, `cancelled` |
| `event_type` | `moved`, `fault`, `repaired`, `assigned` |
| `user_role` | `supervisor`, `manager`, `mechanic`, `driver` |

---

## Utenti

### Creare un nuovo utente

La creazione richiede due passi: prima creare l'utente in `auth.users` (via dashboard o invite), poi inserire il profilo nella tabella `users`.

**Passo 1 — `[UI]` invito dalla webapp** (solo supervisor)
Admin → Utenti → "Invite user": inserire email, nome, ruolo e sede. La Edge Function `admin-user` crea l'account auth e il profilo automaticamente — l'utente riceve un'email di accesso.

**Passo 1 alternativo — `[SQL]`** via API di amministrazione (service role):

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/admin/users' \
  -H 'apikey: <service-role-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "nome@esempio.com",
    "password": "passwordsicura",
    "email_confirm": true
  }'
```

**Passo 2 — `[SQL]`** inserire il profilo utente (necessario solo se non si usa il flusso invite della webapp):

```sql
INSERT INTO users (id, full_name, role, location_id)
VALUES (
  '<uuid-da-auth>',
  'Nome Cognome',
  'manager',           -- supervisor | manager | mechanic | driver
  'bilderdijk'         -- id della sede; NULL per supervisor/mechanic (hub)
);
```

> **Nota:** `supervisor` e `mechanic` possono avere `location_id = NULL` perché operano dall'hub.

### Ruoli disponibili

| Ruolo | Permessi principali |
|---|---|
| `supervisor` | Accesso totale a tutte le sedi e tutte le entità |
| `manager` | Vede sede propria, segnala guasti, chat con hub |
| `mechanic` | Vede tutto (hub), aggiorna guasti, schedula ritiri |
| `driver` | Vede solo i propri ritiri assegnati |

### Leggere utenti

**`[UI]`** Admin → Utenti: lista con filtro per ruolo e ricerca per nome.

```sql
-- Tutti gli utenti (solo supervisor)
SELECT * FROM users;

-- Utente specifico
SELECT * FROM users WHERE id = '<uuid>';

-- Utenti per sede
SELECT * FROM users WHERE location_id = 'bilderdijk';

-- Utenti per ruolo
SELECT * FROM users WHERE role = 'manager';
```

### Aggiornare un utente

**`[UI]`** — solo `full_name` modificabile dalla pagina Profilo personale.
Ruolo e sede **non sono modificabili dalla webapp** — usare SQL:

```sql
-- Cambiare nome — [UI] disponibile (profilo personale)
UPDATE users SET full_name = 'Nuovo Nome' WHERE id = '<uuid>';

-- Cambiare ruolo — [SQL] solo
UPDATE users SET role = 'supervisor' WHERE id = '<uuid>';

-- Cambiare sede — [SQL] solo
UPDATE users SET location_id = 'pieter' WHERE id = '<uuid>';

-- Aggiornare avatar — [SQL] solo (non c'è upload UI)
UPDATE users SET avatar_url = 'https://...' WHERE id = '<uuid>';

-- Aggiornare FCM token — [AUTO] gestito dall'app al login
UPDATE users SET fcm_token = '<token>' WHERE id = '<uuid>';
```

### Disattivare / eliminare un utente

**`[UI]`** Admin → Utenti → "Deactivate" (solo supervisor): revoca l'accesso tramite la Edge Function `admin-user`. Non è un'eliminazione permanente.

```sql
-- Eliminazione permanente — [SQL] solo
-- L'eliminazione da auth.users rimuove automaticamente anche il record in users (CASCADE)
DELETE FROM auth.users WHERE id = '<uuid>';
```

### Vedere ultimo accesso

```sql
-- [SQL] solo — last_seen viene aggiornato automaticamente dall'app
SELECT id, full_name, last_seen FROM users ORDER BY last_seen DESC;
```

---

## Mezzi (Vehicles)

### Creare un nuovo mezzo

**`[UI]`** Admin → Mezzi → "Aggiungi mezzo" (solo supervisor/mechanic): ID, tipo e sede iniziale.
> Color e note non sono impostabili in fase di creazione dalla UI, solo in modifica.

```sql
-- [SQL] — permette di impostare anche color e notes subito
INSERT INTO vehicles (id, type, location_id, status, color, notes)
VALUES (
  'F-200',         -- ID univoco (convenzione: F-xxx ebike, S-xxx scooter, A-xxx auto, B-xxx bus)
  'ebike',         -- ebike | scooter | car | bus
  'bilderdijk',
  'ok',
  'rosso',
  'Note libere'
);
```

### Leggere mezzi

**`[UI]`** Admin → Mezzi: filtro per tipo, stato e ricerca per ID. I manager vedono solo i mezzi della propria sede.

```sql
-- Tutti i mezzi
SELECT * FROM vehicles;

-- Per sede
SELECT * FROM vehicles WHERE location_id = 'bilderdijk';

-- Per stato
SELECT * FROM vehicles WHERE status = 'fault';

-- Per tipo
SELECT * FROM vehicles WHERE type = 'ebike';

-- In guasto per sede
SELECT * FROM vehicles WHERE location_id = 'bilderdijk' AND status = 'fault';

-- All'hub
SELECT * FROM vehicles WHERE location_id IN ('hub-hfd', 'hub-ens');
```

### Aggiornare un mezzo

**`[UI]`** Admin → Mezzi → "Edit": modifica `color` e `notes`.

```sql
-- Colore e note — [UI] disponibile
UPDATE vehicles SET color = 'blu', notes = 'Batteria sostituita' WHERE id = 'F-001';

-- Spostare sede — [UI] disponibile (tramite completamento ritiro)
UPDATE vehicles SET location_id = 'pieter' WHERE id = 'F-001';

-- Cambiare stato — [UI] parziale: "Retire" imposta → hub; gli altri stati sono [AUTO]
UPDATE vehicles SET status = 'ok' WHERE id = 'F-001';
```

> **Attenzione:** lo stato del mezzo viene aggiornato automaticamente `[AUTO]` dai trigger al cambio di stato delle segnalazioni:
> - fault INSERT → mezzo `fault`
> - fault → `in_progress` → mezzo `fix`
> - fault → `ready` → mezzo `ready`
> - fault → `closed` → mezzo `ok`
> - ritiro completato → mezzo si sposta alla sede di destinazione

### Stati del mezzo

| Stato | Significato |
|---|---|
| `ok` | Operativo |
| `fault` | Segnalazione aperta |
| `hub` | Presente all'hub / fuori servizio |
| `fix` | In riparazione |
| `ready` | Riparato, pronto per il ritiro |

### Eliminare un mezzo

**Non disponibile dalla UI.** `[SQL]` solo, e solo se non ha segnalazioni/ritiri collegati.

```sql
DELETE FROM vehicles WHERE id = 'F-200';
```

### Log del mezzo

**`[AUTO]`** — scritto automaticamente su assegnazione mezzo e completamento ritiro. Non c'è vista dedicata nella webapp.

```sql
-- [SQL] — consultare lo storico di un mezzo
SELECT vl.event_type, vl.from_location_id, vl.to_location_id, u.full_name AS operatore, vl.created_at, vl.notes
FROM vehicle_log vl
JOIN users u ON u.id = vl.performed_by
WHERE vl.vehicle_id = 'F-001'
ORDER BY vl.created_at DESC;
```

---

## Segnalazioni (Faults)

**`[UI]`** — Apertura: solo manager (form guasto con foto).
**`[UI]`** — Aggiornamento stato: solo supervisor/mechanic (dettaglio segnalazione).

```sql
-- Aprire una segnalazione — [UI] disponibile (manager)
INSERT INTO faults (vehicle_id, location_id, reported_by, fault_type, notes)
VALUES ('F-001', 'bilderdijk', '<uuid-manager>', 'Freni', 'Freno anteriore non funziona');

-- Aggiornare stato — [UI] disponibile (supervisor/mechanic)
UPDATE faults SET status = 'in_progress' WHERE id = '<uuid-fault>';
UPDATE faults SET status = 'ready', repair_notes = 'Freno sostituito' WHERE id = '<uuid-fault>';
UPDATE faults SET status = 'closed' WHERE id = '<uuid-fault>';

-- Segnalazioni aperte per sede
SELECT * FROM faults WHERE location_id = 'bilderdijk' AND status != 'closed';

-- Eliminare una segnalazione — [SQL] solo (cascade su foto, chat, eventi)
DELETE FROM faults WHERE id = '<uuid-fault>';
```

---

## Ritiri (Pickup Schedules)

**`[UI]`** — Creazione: supervisor/mechanic. Completamento: driver. Cancellazione: supervisor/mechanic.

```sql
-- Pianificare un ritiro — [UI] disponibile (supervisor/mechanic)
INSERT INTO pickup_schedules (fault_id, driver_id, assigned_by, from_location_id, to_location_id, scheduled_date, time_from, time_to, vehicle_id)
VALUES (
  '<uuid-fault>',      -- NULL se non legato a segnalazione
  '<uuid-driver>',
  '<uuid-mechanic>',
  'bilderdijk',
  'hub-hfd',
  '2026-05-20',
  '09:00',
  '10:00',
  'F-001'
);

-- Completare un ritiro — [UI] disponibile (driver)
-- Aggiorna anche location_id del mezzo e scrive in vehicle_log [AUTO]
UPDATE pickup_schedules SET status = 'completed' WHERE id = '<uuid-schedule>';

-- Cancellare un ritiro — [UI] disponibile (supervisor/mechanic)
UPDATE pickup_schedules SET status = 'cancelled' WHERE id = '<uuid-schedule>';
```

---

## Statistiche

**`[UI]`** — Vista KPI disponibile nel pannello supervisor/mechanic.

```sql
-- KPI per tutte le sedi
SELECT * FROM fault_stats ORDER BY active_faults DESC;

-- KPI per sede specifica
SELECT * FROM fault_stats WHERE location_id = 'bilderdijk';
```

---

## Riserve (targets mezzi per sede)

**`[UI]`** — Admin → Reserves: modifica target per tipo e sede (solo supervisor).

```sql
-- Impostare/aggiornare target — [UI] disponibile (supervisor)
INSERT INTO reserves (location_id, vehicle_type, target_count, updated_by)
VALUES ('bilderdijk', 'ebike', 5, '<uuid-supervisor>')
ON CONFLICT (location_id, vehicle_type)
DO UPDATE SET target_count = 5, updated_by = '<uuid-supervisor>', updated_at = NOW();

-- Leggere riserve — [UI] disponibile
SELECT r.*, l.name FROM reserves r JOIN locations l ON l.id = r.location_id;
```
