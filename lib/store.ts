// ─── lib/store.ts ─────────────────────────────────────────────────────────────
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Trip, SolicitudDraft, User } from './types'

// ── Auth ──────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null
  firstLaunch: boolean
  onboardingComplete: boolean
  setUser: (user: User) => void
  logout: () => void
  completeOnboarding: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  firstLaunch: true,
  onboardingComplete: false,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
  completeOnboarding: () => set({ firstLaunch: false, onboardingComplete: true }),
}))

// ── Wizard de solicitud ───────────────────────────────────────────────────────
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

const EMPTY_DRAFT: SolicitudDraft & { savedAt?: number } = {
  step: 1,
  vehicle: {},
  origin: {},
  destination: {},
  originContact: {},
  destinationContact: {},
  asap: true,
}

interface WizardState {
  draft: SolicitudDraft & { savedAt?: number }
  // true una vez que Zustand termina de rehidratar desde sessionStorage.
  // Úsalo en componentes para evitar renders en falso con estado vacío.
  _hasHydrated: boolean
  setStep: (step: number) => void
  updateDraft: (partial: Partial<SolicitudDraft>) => void
  resetDraft: () => void
  checkDraftExpiry: () => void
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      draft: EMPTY_DRAFT,
      _hasHydrated: false,
      setStep: (step) =>
        set((s) => ({ draft: { ...s.draft, step, savedAt: Date.now() } })),
      updateDraft: (partial) =>
        set((s) => ({ draft: { ...s.draft, ...partial, savedAt: Date.now() } })),
      resetDraft: () => set({ draft: EMPTY_DRAFT }),
      checkDraftExpiry: () => {
        const { draft, resetDraft } = get()
        if (draft.savedAt && Date.now() - draft.savedAt > DRAFT_TTL_MS) {
          resetDraft()
        }
      },
    }),
    {
      name: 'ruum-solicitud-draft',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true
      },
    }
  )
)

// ── App global ────────────────────────────────────────────────────────────────
interface AppState {
  activeTrip: Trip | null
  settingsOpen: boolean
  toastMsg: string | null
  setActiveTrip: (t: Trip | null) => void
  setSettingsOpen: (v: boolean) => void
  showToast: (msg: string) => void
  clearToast: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  activeTrip: null,
  settingsOpen: false,
  toastMsg: null,
  setActiveTrip: (t) => set({ activeTrip: t }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  showToast: (msg) => {
    set({ toastMsg: msg })
    setTimeout(() => set({ toastMsg: null }), 3500)
  },
  clearToast: () => set({ toastMsg: null }),
}))