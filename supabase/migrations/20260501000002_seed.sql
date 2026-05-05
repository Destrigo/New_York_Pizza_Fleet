-- ============================================================
-- Hi Tom Fleet — Seed Data
-- Migration: 003 seed
-- Run AFTER creating auth users in the dashboard
-- Replace UUIDs with real auth.users UUIDs before running
-- ============================================================

-- ── LOCATIONS ──────────────────────────────────────────────
INSERT INTO locations (id, name, city, address, is_hub) VALUES
  ('bilderdijk',  'Bilderdijkstraat',         'Amsterdam', 'Bilderdijkstraat 76',           FALSE),
  ('pieter',      'Pieter Calandlaan',         'Amsterdam', 'Pieter Calandlaan 3',           FALSE),
  ('leeuwenlaan', 'Burg. van Leeuwenlaan',     'Amsterdam', 'Burg. van Leeuwenlaan 12',      FALSE),
  ('buitenv',     'Buitenveldertselaan',       'Amsterdam', 'Buitenveldertselaan 4',         FALSE),
  ('limburg',     'Van Limburg Stirumstraat',  'Amsterdam', 'Van Limburg Stirumstraat 10',   FALSE),
  ('buiksloot',   'Buikslotermeerplein',       'Amsterdam', 'Buikslotermeerplein 8',         FALSE),
  ('dotter',      'Dotterbloemstraat',         'Amsterdam', 'Dotterbloemstraat 2',           FALSE),
  ('linnaeus',    'Linnaeustraat',             'Amsterdam', 'Linnaeustraat 35',              FALSE),
  ('jolleman',    'Jollemanhof',               'Amsterdam', 'Jollemanhof 15',                FALSE),
  ('molenwijk',   'Molenwijk',                 'Amsterdam', 'Molenwijk 22',                  FALSE),
  ('midden',      'Middenmolenplein',          'Amsterdam', 'Middenmolenplein 5',            FALSE),
  ('vuurdoorn',   'Vuurdoornlaan',             'Amsterdam', 'Vuurdoornlaan 9',               FALSE),
  ('blokmak',     'Blokmakersplaats',          'Amsterdam', 'Blokmakersplaats 3',            FALSE),
  ('windmolen',   'Windmolenbroeksweg',        'Enschede',  'Windmolenbroeksweg 18',         FALSE),
  ('wesseler',    'Wesseler-nering',           'Enschede',  'Wesseler-nering 7',             FALSE),
  ('deurning',    'Deurningerstraat',          'Enschede',  'Deurningerstraat 14',           FALSE),
  ('hub-hfd',     'Hub · Hoofddorp',           'Hoofddorp', 'Schipholweg 100',               TRUE),
  ('hub-ens',     'Hub · Enschede',            'Enschede',  'Haaksbergerstraat 200',         TRUE)
ON CONFLICT DO NOTHING;

-- ── VEHICLES (E-Bikes F-001 to F-175) ──────────────────────
-- Representative subset — expand to full 255 in production
INSERT INTO vehicles (id, type, location_id, status) VALUES
  -- Bilderdijkstraat (F-001..F-009, S-001..S-005)
  ('F-001', 'ebike',   'bilderdijk', 'fault'),
  ('F-002', 'ebike',   'bilderdijk', 'ok'),
  ('F-003', 'ebike',   'bilderdijk', 'ok'),
  ('F-004', 'ebike',   'bilderdijk', 'ok'),
  ('F-005', 'ebike',   'bilderdijk', 'ok'),
  ('S-001', 'scooter', 'bilderdijk', 'ok'),
  ('S-002', 'scooter', 'bilderdijk', 'fault'),
  ('S-003', 'scooter', 'bilderdijk', 'ok'),
  -- Pieter Calandlaan (F-010..F-019)
  ('F-010', 'ebike',   'pieter',     'ok'),
  ('F-011', 'ebike',   'pieter',     'fault'),
  ('F-012', 'ebike',   'pieter',     'ok'),
  ('F-013', 'ebike',   'pieter',     'ok'),
  ('S-004', 'scooter', 'pieter',     'ok'),
  -- Burg. van Leeuwenlaan (F-020..F-029)
  ('F-020', 'ebike',   'leeuwenlaan','ok'),
  ('F-021', 'ebike',   'leeuwenlaan','ok'),
  -- Linnaeustraat (F-030..F-049)
  ('F-030', 'ebike',   'linnaeus',   'ok'),
  ('F-031', 'ebike',   'linnaeus',   'fault'),
  ('F-032', 'ebike',   'hub-hfd',    'hub'),
  ('F-033', 'ebike',   'hub-hfd',    'fix'),
  ('F-034', 'ebike',   'hub-hfd',    'ready'),
  ('S-010', 'scooter', 'linnaeus',   'ok'),
  ('S-011', 'scooter', 'linnaeus',   'fix'),
  -- Buikslotermeerplein (F-050..F-069)
  ('F-050', 'ebike',   'buiksloot',  'ok'),
  ('F-051', 'ebike',   'buiksloot',  'ok'),
  ('S-020', 'scooter', 'buiksloot',  'ok'),
  -- Molenwijk
  ('F-070', 'ebike',   'molenwijk',  'fault'),
  ('F-071', 'ebike',   'molenwijk',  'ok'),
  -- Others
  ('F-080', 'ebike',   'buitenv',    'ok'),
  ('F-090', 'ebike',   'limburg',    'ok'),
  ('F-100', 'ebike',   'dotter',     'ok'),
  ('F-110', 'ebike',   'jolleman',   'ok'),
  ('F-120', 'ebike',   'midden',     'ok'),
  ('F-130', 'ebike',   'vuurdoorn',  'ok'),
  ('F-140', 'ebike',   'blokmak',    'ok'),
  ('F-150', 'ebike',   'windmolen',  'ok'),
  ('F-160', 'ebike',   'wesseler',   'ok'),
  ('F-170', 'ebike',   'deurning',   'ok'),
  -- Hub vehicles
  ('A-001', 'car',     'hub-hfd',    'ok'),
  ('A-002', 'car',     'hub-hfd',    'fault'),
  ('A-003', 'car',     'hub-ens',    'ok'),
  ('B-001', 'bus',     'hub-hfd',    'ok'),
  ('B-002', 'bus',     'hub-ens',    'ok')
ON CONFLICT DO NOTHING;

-- NOTE: User seed data is handled by Supabase Auth invite flow.
-- After creating auth users, run:
--
-- INSERT INTO users (id, full_name, role, location_id) VALUES
--   ('<auth-uuid-ayoub>',  'Ayoub',  'manager',    'bilderdijk'),
--   ('<auth-uuid-nadir>',  'Nadir',  'manager',    'pieter'),
--   -- ... etc
-- ;
--
-- Reserve targets (example):
-- INSERT INTO reserves (location_id, vehicle_type, target_count, updated_by) VALUES
--   ('bilderdijk', 'ebike',   5, '<supervisor-uuid>'),
--   ('bilderdijk', 'scooter', 2, '<supervisor-uuid>'),
-- ;
