'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { useCurrencyStore } from '@/lib/store'

/* ── Minimal theme context (replaces next-themes to avoid React 19 script error) ── */
type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'dark', setTheme: () => {},
})
export const useTheme = () => useContext(ThemeCtx)

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // On mount: read saved preference or default to dark
  useEffect(() => {
    const saved = (localStorage.getItem('destinair-theme') as Theme) || 'dark'
    setThemeState(saved)
    document.documentElement.classList.toggle('dark', saved === 'dark')
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('destinair-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>
}

function CurrencyDetector() {
  const { setFromIP, setRates, source } = useCurrencyStore()

  useEffect(() => {
    fetch('/api/geo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { currency?: string; country?: string; flag?: string; city?: string }) => {
        if (d.currency && source !== 'manual') {
          setFromIP(d.currency)
          const label = [d.flag, d.country].filter(Boolean).join(' ')
          const msg = label ? `${label} — prices in ${d.currency}` : `Prices set to ${d.currency}`
          import('sonner').then(({ toast }) => {
            toast.success(msg, {
              id: 'geo-currency', duration: 5000,
              description: 'You can change currency anytime from the top bar.',
              icon: d.flag ?? '🌍',
            })
          })
        }
      })
      .catch(() => {})

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${backendUrl}/api/v1/currency/rates`)
      .then((r) => r.json())
      .then((d) => { if (d.rates) setRates(d.rates) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } } })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyDetector />
        {children}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

