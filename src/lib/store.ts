import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurrencyStore {
  currency: string
  rates: Record<string, number>
  source: 'ip' | 'manual' | 'default'
  setFromIP: (currency: string) => void
  setManual: (currency: string) => void
  setRates: (rates: Record<string, number>) => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      rates: {},
      source: 'default',
      setFromIP: (currency) => {
        // Only override if user hasn't set manually
        if (get().source !== 'manual') {
          set({ currency, source: 'ip' })
        }
      },
      setManual: (currency) => set({ currency, source: 'manual' }),
      setRates: (rates) => set({ rates }),
    }),
    { name: 'skysearch-currency', partialize: (s) => ({ currency: s.currency, source: s.source }) }
  )
)

// ── Search Store ──────────────────────────────────────────────────────────────
interface SearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  travelClass: string
  tripType: 'oneway' | 'roundtrip' | 'multicity'
}

interface SearchStore {
  activeTab: 'flights' | 'hotels' | 'cars'
  flightParams: Partial<SearchParams>
  setActiveTab: (tab: 'flights' | 'hotels' | 'cars') => void
  setFlightParams: (params: Partial<SearchParams>) => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  activeTab: 'flights',
  flightParams: { adults: 1, travelClass: 'ECONOMY', tripType: 'oneway' },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFlightParams: (params) => set((s) => ({ flightParams: { ...s.flightParams, ...params } })),
}))

// ── UI Store ──────────────────────────────────────────────────────────────────
interface UIStore {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))
