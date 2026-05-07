import { createContext, useContext, useState, type ReactNode } from 'react'

type Lang = 'nl' | 'en'

const STRINGS = {
  nl: {
    // Nav
    navReport:          'Storing melden',
    navNotifications:   'Notificaties',
    navProfile:         'Profiel',
    navLogout:          'Uitloggen',
    // Common
    loading:            'Laden…',
    cancel:             'Annuleren',
    save:               'Opslaan',
    all:                'Alle',
    noResults:          'Geen resultaten gevonden.',
    // Faults
    fault:              'Storing',
    faults:             'Storingen',
    faultType:          'Type storing',
    faultStatus_open:       'Open',
    faultStatus_in_progress:'Bezig',
    faultStatus_ready:      'Klaar',
    faultStatus_closed:     'Gesloten',
    // Vehicles
    vehicles:           'Voertuigen',
    vehicleType_ebike:  'E-Bike',
    vehicleType_scooter:'Scooter',
    vehicleType_car:    'Auto',
    vehicleType_bus:    'Bus',
    // Schedule
    schedule:           'Ophaalplanning',
    scheduleNew:        'Ophaalmoment aanmaken',
    scheduleDriver:     'Chauffeur',
    scheduleVehicle:    'Voertuig ID',
    scheduleDate:       'Datum',
    scheduleTime:       'Tijdvenster',
    scheduleFrom:       'Van locatie',
    scheduleTo:         'Naar locatie',
    scheduleNotes:      'Notities',
    scheduleFault:      'Gekoppelde storing',
    scheduleStatus_planned:   'Gepland',
    scheduleStatus_completed: 'Voltooid',
    scheduleStatus_cancelled: 'Geannuleerd',
    // Notifications
    noNotifications:    'Geen notificaties',
    markAllRead:        'Alles gelezen markeren',
    // Roles
    role_supervisor:    'Supervisor',
    role_manager:       'Manager',
    role_mechanic:      'Monteur',
    role_driver:        'Chauffeur',
    // Dashboard
    dashTitle_manager:  'Dashboard',
    dashTitle_hub:      'Hub Dashboard',
    dashTitle_driver:   'Mijn Planning',
  },
  en: {
    // Nav
    navReport:          'Report Fault',
    navNotifications:   'Notifications',
    navProfile:         'Profile',
    navLogout:          'Sign out',
    // Common
    loading:            'Loading…',
    cancel:             'Cancel',
    save:               'Save',
    all:                'All',
    noResults:          'No results found.',
    // Faults
    fault:              'Fault',
    faults:             'Faults',
    faultType:          'Fault type',
    faultStatus_open:       'Open',
    faultStatus_in_progress:'In progress',
    faultStatus_ready:      'Ready',
    faultStatus_closed:     'Closed',
    // Vehicles
    vehicles:           'Vehicles',
    vehicleType_ebike:  'E-Bike',
    vehicleType_scooter:'Scooter',
    vehicleType_car:    'Car',
    vehicleType_bus:    'Bus',
    // Schedule
    schedule:           'Pickup Schedule',
    scheduleNew:        'Create pickup',
    scheduleDriver:     'Driver',
    scheduleVehicle:    'Vehicle ID',
    scheduleDate:       'Date',
    scheduleTime:       'Time window',
    scheduleFrom:       'Pick-up location',
    scheduleTo:         'Drop-off location',
    scheduleNotes:      'Notes',
    scheduleFault:      'Linked fault',
    scheduleStatus_planned:   'Planned',
    scheduleStatus_completed: 'Completed',
    scheduleStatus_cancelled: 'Cancelled',
    // Notifications
    noNotifications:    'No notifications',
    markAllRead:        'Mark all as read',
    // Roles
    role_supervisor:    'Supervisor',
    role_manager:       'Manager',
    role_mechanic:      'Mechanic',
    role_driver:        'Driver',
    // Dashboard
    dashTitle_manager:  'Dashboard',
    dashTitle_hub:      'Hub Dashboard',
    dashTitle_driver:   'My Schedule',
  },
} satisfies Record<Lang, Record<string, string>>

type StringKey = keyof typeof STRINGS.nl

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey) => string
}

const I18nContext = createContext<I18nCtx>({
  lang: 'nl',
  setLang: () => {},
  t: (key) => STRINGS.nl[key],
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem('htf_lang') as Lang | null) ?? 'nl'
  const [lang, setLangState] = useState<Lang>(stored)

  const setLang = (l: Lang) => {
    localStorage.setItem('htf_lang', l)
    setLangState(l)
  }

  const t = (key: StringKey) => STRINGS[lang][key] ?? STRINGS.nl[key]

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() { return useContext(I18nContext) }
