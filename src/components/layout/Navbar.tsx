'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/app/providers'
import { Sun, Moon, Globe, Bell, Menu, X, Plane } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useCurrencyStore } from '@/lib/store'
import { useAuth, useClerk, UserButton } from '@clerk/nextjs'

const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar',          symbol: '$'   },
  { code: 'EUR', label: 'Euro',               symbol: '€'   },
  { code: 'GBP', label: 'British Pound',      symbol: '£'   },
  { code: 'INR', label: 'Indian Rupee',       symbol: '₹'   },
  { code: 'AED', label: 'UAE Dirham',         symbol: 'د.إ' },
  { code: 'SGD', label: 'Singapore Dollar',   symbol: 'S$'  },
  { code: 'AUD', label: 'Australian Dollar',  symbol: 'A$'  },
  { code: 'CAD', label: 'Canadian Dollar',    symbol: 'C$'  },
  { code: 'JPY', label: 'Japanese Yen',       symbol: '¥'   },
  { code: 'CHF', label: 'Swiss Franc',        symbol: 'Fr'  },
  { code: 'HKD', label: 'HK Dollar',          symbol: 'HK$' },
  { code: 'NZD', label: 'NZ Dollar',          symbol: 'NZ$' },
  { code: 'SEK', label: 'Swedish Krona',      symbol: 'kr'  },
  { code: 'NOK', label: 'Norwegian Krone',    symbol: 'kr'  },
  { code: 'DKK', label: 'Danish Krone',       symbol: 'kr'  },
  { code: 'MXN', label: 'Mexican Peso',       symbol: '$'   },
  { code: 'BRL', label: 'Brazilian Real',     symbol: 'R$'  },
  { code: 'THB', label: 'Thai Baht',          symbol: '฿'   },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R'   },
  { code: 'SAR', label: 'Saudi Riyal',        symbol: '﷼'  },
]


export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { currency, setManual, source } = useCurrencyStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  useEffect(() => { setMounted(true) }, [])

  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo — PNG is 1024×1024 square; overflow-hidden crops top/bottom whitespace */}
        <Link href="/" className="flex items-center shrink-0 group" aria-label="DestinAir home">
          <div className="relative h-12 w-[155px] overflow-hidden">
            {/* Light mode */}
            <Image
              src="/destinair-logo.png"
              alt="DestinAir"
              fill
              quality={100}
              sizes="310px"
              className="object-cover object-center dark:hidden transition-opacity group-hover:opacity-85"
              priority
            />
            {/* Dark mode */}
            <Image
              src="/destinair-logo white.png"
              alt="DestinAir"
              fill
              quality={100}
              sizes="310px"
              className="object-cover object-center hidden dark:block transition-opacity group-hover:opacity-85"
            />
          </div>
        </Link>


        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Currency selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id="currency-selector"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-300 dark:hover:border-sky-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all duration-150 shadow-sm hover:shadow"
              >
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>{currency}</span>
                {source === 'ip' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Auto-detected" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              {/* Header — stays fixed, never scrolls */}
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {source === 'ip' ? '🌍 Auto-detected' : 'Select Currency'}
              </div>
              <DropdownMenuSeparator className="my-1" />
              {/* Inner scroll wrapper — scrollbar stays inside the rounded container */}
              <div className="max-h-[280px] overflow-y-auto">
                {CURRENCIES.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setManual(c.code)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-100 outline-none
                      ${ currency === c.code
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800'
                      }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`font-mono text-[11px] w-8 shrink-0 font-bold ${ currency === c.code ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400' }`}>{c.code}</span>
                      <span className="text-xs">{c.label}</span>
                    </span>
                    {currency === c.code && (
                      <span className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button
            variant="ghost" size="icon" className="btn-touch"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            id="theme-toggle" aria-label="Toggle theme"
          >
            {mounted
              ? (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)
              : <Moon className="w-4 h-4" />}
          </Button>

          {/* ── Clerk Auth ──────────────────────────────────── */}
          {!isSignedIn ? (
            <Button size="sm"
              onClick={() => openSignIn()}
              className="btn-touch bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white hidden sm:flex shadow-sm">
              Sign In
            </Button>
          ) : (
            <>
              {/* Bell icon → price alerts */}
              <Link href="/dashboard/alerts">
                <Button variant="ghost" size="icon" className="btn-touch relative" title="Price Alerts">
                  <Bell className="w-4 h-4" />
                </Button>
              </Link>
              {/* Clerk UserButton — avatar, profile, sign out */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 ring-2 ring-sky-400 ring-offset-1',
                    userButtonPopoverCard: 'shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl',
                    userButtonPopoverActionButton: 'rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800',
                  },
                }}
              />
            </>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost" size="icon" className="md:hidden btn-touch"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t px-4 py-4 flex flex-col gap-2">
          {!isSignedIn && (
            <Button onClick={() => openSignIn()} className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white mt-2">
              Sign In
            </Button>
          )}
          {isSignedIn && (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 btn-touch">
              My Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
