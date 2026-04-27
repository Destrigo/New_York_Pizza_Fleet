export const locations = [
  { id: "bilderdijk",   name: "Bilderdijkstraat",        managers: ["Ayoub"] },
  { id: "pieter",       name: "Pieter Calandlaan",        managers: ["Nadir"] },
  { id: "leeuwenlaan",  name: "Burg. van Leeuwenlaan",    managers: ["Ajay"] },
  { id: "buitenv",      name: "Buitenveldertselaan",      managers: ["Mohamed"] },
  { id: "limburg",      name: "Van Limburg Stirumstraat", managers: ["Karim"] },
  { id: "buiksloot",    name: "Buikslotermeerplein",      managers: ["Imrane", "Amine", "Marco"] },
  { id: "dotter",       name: "Dotterbloemstraat",        managers: ["Imrane"] },
  { id: "linnaeus",     name: "Linnaeustraat",            managers: ["Bryan", "Hamza", "Halim"] },
  { id: "jolleman",     name: "Jollemanhof",              managers: ["Hamza"] },
  { id: "molenwijk",    name: "Molenwijk",                managers: ["Alex", "Hamza"] },
  { id: "midden",       name: "Middenmolenplein",         managers: ["Anouar"] },
  { id: "vuurdoorn",    name: "Vuurdoornlaan",            managers: ["Salah"] },
  { id: "blokmak",      name: "Blokmakersplaats",         managers: ["Luciano", "Hamza", "Lizha"] },
  { id: "windmolen",    name: "Windmolenbroeksweg",       managers: ["Dylan"] },
  { id: "wesseler",     name: "Wesseler-nering",          managers: ["Andriy", "Lokhmane"] },
  { id: "deurning",     name: "Deurningerstraat",         managers: ["Ziad", "Lokhmane"] },
  { id: "hub-hfd",      name: "Hub · Hoofddorp",          managers: ["Karim", "Isaac", "Mike", "Arjen", "Amine"] },
  { id: "hub-ens",      name: "Hub · Enschede",           managers: ["Karim", "Isaac", "Mike", "Arjen", "Amine"] },
];

export const vehicles = [
  // E-Bikes at Bilderdijkstraat
  { id: "F-001", type: "ebike",   location: "bilderdijk", status: "fault" },
  { id: "F-002", type: "ebike",   location: "bilderdijk", status: "ok" },
  { id: "F-003", type: "ebike",   location: "bilderdijk", status: "ok" },
  { id: "F-004", type: "ebike",   location: "bilderdijk", status: "ok" },
  // E-Bikes at Pieter
  { id: "F-010", type: "ebike",   location: "pieter",     status: "ok" },
  { id: "F-011", type: "ebike",   location: "pieter",     status: "fault" },
  { id: "F-012", type: "ebike",   location: "pieter",     status: "ok" },
  // E-Bikes at Linnaeus
  { id: "F-020", type: "ebike",   location: "linnaeus",   status: "ok" },
  { id: "F-021", type: "ebike",   location: "linnaeus",   status: "fault" },
  { id: "F-022", type: "ebike",   location: "linnaeus",   status: "hub" },
  { id: "F-023", type: "ebike",   location: "hub-hfd",    status: "fix" },
  { id: "F-024", type: "ebike",   location: "hub-hfd",    status: "ready" },
  // More
  { id: "F-030", type: "ebike",   location: "buiksloot",  status: "ok" },
  { id: "F-031", type: "ebike",   location: "buiksloot",  status: "ok" },
  { id: "F-040", type: "ebike",   location: "molenwijk",  status: "fault" },
  // Scooters
  { id: "S-001", type: "scooter", location: "bilderdijk", status: "ok" },
  { id: "S-002", type: "scooter", location: "bilderdijk", status: "fault" },
  { id: "S-003", type: "scooter", location: "pieter",     status: "ok" },
  { id: "S-010", type: "scooter", location: "linnaeus",   status: "ok" },
  { id: "S-011", type: "scooter", location: "linnaeus",   status: "fix" },
  { id: "S-020", type: "scooter", location: "buiksloot",  status: "ok" },
  // Cars
  { id: "A-001", type: "car",     location: "hub-hfd",    status: "ok" },
  { id: "A-002", type: "car",     location: "hub-hfd",    status: "fault" },
  { id: "A-003", type: "car",     location: "hub-ens",    status: "ok" },
  // Buses
  { id: "B-001", type: "bus",     location: "hub-hfd",    status: "ok" },
  { id: "B-002", type: "bus",     location: "hub-ens",    status: "ok" },
];

export const faults = [
  {
    id: 1, vehicle: "F-001", type: "ebike",  location: "bilderdijk",
    locationName: "Bilderdijkstraat", manager: "Ayoub",
    faultType: "Flat Tire",
    notes: "Front tire is completely flat. Happened this morning during the first delivery.",
    photos: 2, status: "Fault",
    reported: "2026-04-25 08:14",
  },
  {
    id: 2, vehicle: "S-002", type: "scooter", location: "bilderdijk",
    locationName: "Bilderdijkstraat", manager: "Ayoub",
    faultType: "Electrical Drive",
    notes: "Motor cuts out at low speed.",
    photos: 3, status: "Start Fix",
    reported: "2026-04-24 17:33",
  },
  {
    id: 3, vehicle: "F-011", type: "ebike",  location: "pieter",
    locationName: "Pieter Calandlaan", manager: "Nadir",
    faultType: "Lost Key",
    notes: "",
    photos: 2, status: "Fault",
    reported: "2026-04-26 09:01",
  },
  {
    id: 4, vehicle: "F-021", type: "ebike",  location: "linnaeus",
    locationName: "Linnaeustraat", manager: "Bryan",
    faultType: "Spokes",
    notes: "Multiple broken spokes on rear wheel.",
    photos: 4, status: "Ready",
    reported: "2026-04-23 11:20",
  },
  {
    id: 5, vehicle: "A-002", type: "car",    location: "hub-hfd",
    locationName: "Hub · Hoofddorp", manager: "Karim",
    faultType: "Flat Tire",
    notes: "Rear right tire punctured.",
    photos: 2, status: "Fault",
    reported: "2026-04-26 07:45",
  },
  {
    id: 6, vehicle: "F-040", type: "ebike",  location: "molenwijk",
    locationName: "Molenwijk", manager: "Alex",
    faultType: "Pizza Box",
    notes: "Box holder completely broken off.",
    photos: 2, status: "Fault",
    reported: "2026-04-26 10:22",
  },
];

export const chatThreads = {
  1: [
    { id: 1, from: "hub",     sender: "Hub",   text: "Bedankt Ayoub, we hebben je melding ontvangen. Kunnen we een foto van het ventiel krijgen?", time: "08:18" },
    { id: 2, from: "loc",     sender: "Ayoub", text: "Foto is al geüpload. Het is de voorband, volledig plat.", time: "08:22" },
    { id: 3, from: "hub",     sender: "Hub",   text: "Duidelijk. We plannen ophaalmoment voor 25/04 tussen 13:00–15:00.", time: "08:35" },
    { id: 4, from: "loc",     sender: "Ayoub", text: "Prima, de fiets staat klaar bij de deur.", time: "08:38" },
  ],
  2: [
    { id: 1, from: "hub",     sender: "Hub",   text: "Motor probleem ontvangen. Is de accu volledig opgeladen geweest?", time: "17:40" },
    { id: 2, from: "loc",     sender: "Ayoub", text: "Ja, volledig opgeladen. Begon gisteren al.", time: "17:45" },
    { id: 3, from: "hub",     sender: "Hub",   text: "We starten morgen met de reparatie. Verwachte klaar: 27/04.", time: "17:50" },
  ],
  3: [],
  5: [
    { id: 1, from: "hub",     sender: "Hub",   text: "Eigen melding – A-002 band lek. Isaac pakt dit op.", time: "07:50" },
  ],
};

export const driverSchedule = {
  mike: [
    { id: 1, time: "10:00–11:30", from: "Hub · Hoofddorp", to: "Bilderdijkstraat", vehicle: "F-001", action: "Pickup + Drop F-024", note: "Ayoub is aanwezig" },
    { id: 2, time: "13:00–14:30", from: "Hub · Hoofddorp", to: "Pieter Calandlaan",  vehicle: "F-011", action: "Pickup", note: "" },
    { id: 3, time: "15:30–16:30", from: "Hub · Hoofddorp", to: "Molenwijk",          vehicle: "F-040", action: "Pickup", note: "Alex aanwezig na 15:00" },
  ],
  isaac: [
    { id: 1, time: "09:00–10:00", from: "Hub · Hoofddorp", to: "Hub · Hoofddorp", vehicle: "A-002",  action: "Intern – band verwisselen", note: "" },
    { id: 2, time: "11:00–12:30", from: "Hub · Hoofddorp", to: "Linnaeustraat",    vehicle: "F-021", action: "Drop Ready", note: "Bryan ontvangt" },
  ],
  hassan: [
    { id: 1, time: "09:30–11:00", from: "Hub · Enschede",  to: "Wesseler-nering", vehicle: "S-011",  action: "Pickup scooter", note: "" },
    { id: 2, time: "13:00–14:00", from: "Hub · Enschede",  to: "Deurningerstraat", vehicle: "F-030", action: "Drop replacement", note: "" },
  ],
};

export const supervisorRanking = [
  { location: "Bilderdijkstraat", manager: "Ayoub",   faults: 7, qualityScore: 4.2 },
  { location: "Linnaeustraat",    manager: "Bryan",   faults: 5, qualityScore: 3.8 },
  { location: "Molenwijk",        manager: "Alex",    faults: 4, qualityScore: 4.7 },
  { location: "Pieter Calandlaan",manager: "Nadir",   faults: 3, qualityScore: 3.1 },
  { location: "Buikslotermeerplein",manager:"Marco",  faults: 3, qualityScore: 4.5 },
  { location: "Vuurdoornlaan",    manager: "Salah",   faults: 2, qualityScore: 3.9 },
  { location: "Jollemanhof",      manager: "Hamza",   faults: 2, qualityScore: 4.1 },
  { location: "Middenmolenplein", manager: "Anouar",  faults: 1, qualityScore: 4.8 },
];

export const userProfiles = {
  // Managers
  ayoub:   { name: "Ayoub",   role: "manager",    location: "bilderdijk", locationName: "Bilderdijkstraat" },
  nadir:   { name: "Nadir",   role: "manager",    location: "pieter",     locationName: "Pieter Calandlaan" },
  bryan:   { name: "Bryan",   role: "manager",    location: "linnaeus",   locationName: "Linnaeustraat" },
  alex:    { name: "Alex",    role: "manager",    location: "molenwijk",  locationName: "Molenwijk" },
  marco:   { name: "Marco",   role: "manager",    location: "buiksloot",  locationName: "Buikslotermeerplein" },
  // Supervisors
  karim:   { name: "Karim",   role: "supervisor", location: "hub-hfd" },
  arjen:   { name: "Arjen",   role: "supervisor", location: "hub-hfd" },
  amine:   { name: "Amine",   role: "supervisor", location: "hub-hfd" },
  // Hub mechanics
  mechanic:{ name: "Hub Mechanic", role: "mechanic", location: "hub-hfd" },
  // Drivers
  mike:    { name: "Mike",    role: "driver",     location: "hub-hfd" },
  isaac:   { name: "Isaac",   role: "driver",     location: "hub-hfd" },
  hassan:  { name: "Hassan",  role: "driver",     location: "hub-ens" },
};
