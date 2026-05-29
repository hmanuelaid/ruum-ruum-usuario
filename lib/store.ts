// ─── lib/store.ts ─────────────────────────────────────────────────────────────
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip, SolicitudDraft, User } from './types'

// ── Auth ──────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  firstLaunch: boolean
  onboardingComplete: boolean
  setUser: (user: User) => void
  logout: () => void
  completeOnboarding: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      firstLaunch: true,
      onboardingComplete: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      completeOnboarding: () => set({ firstLaunch: false, onboardingComplete: true }),
    }),
    { name: 'ruum-user-auth' }
  )
)

// ── Wizard de solicitud ───────────────────────────────────────────────────────
const EMPTY_DRAFT: SolicitudDraft = {
  step: 1,
  vehicle: {},
  origin: {},
  destination: {},
  originContact: {},
  destinationContact: {},
  asap: true,
}

interface WizardState {
  draft: SolicitudDraft
  setStep: (step: number) => void
  updateDraft: (partial: Partial<SolicitudDraft>) => void
  resetDraft: () => void
}

export const useWizardStore = create<WizardState>()((set) => ({
  draft: EMPTY_DRAFT,
  setStep: (step) => set((s) => ({ draft: { ...s.draft, step } })),
  updateDraft: (partial) => set((s) => ({ draft: { ...s.draft, ...partial } })),
  resetDraft: () => set({ draft: EMPTY_DRAFT }),
}))

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