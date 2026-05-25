'use client'

import { useState } from 'react'
import { Plane, Building2, Car, Sparkles, MapPin, Calendar, Search } from 'lucide-react'
import { FlightSearchForm } from './FlightSearchForm'

type Tab = 'flights' | 'hotels' | 'cars'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrencyStore } from '@/lib/store'
import { Users, Minus, Plus, ChevronDown, Loader2 } from 'lucide-react'

interface Suggestion {
  value: string
  type: string
  location: string
  thumbnail?: string
  property_token?: string
}

function HotelForm() {
  const router = useRouter()
  const { currency } = useCurrencyStore()
  
  // Form states
  const [destination, setDestination] = useState('')
  const [selectedDest, setSelectedDest] = useState<Suggestion | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(2)
  const [rooms, setRooms] = useState(1)
  
  // Autocomplete UI states
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [guestOpen, setGuestOpen] = useState(false)
  
  const autoRef = useRef<HTMLDivElement>(null)
  const guestRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const today = new Date().toISOString().split('T')[0]
  
  // Default dates: tomorrow and day after tomorrow
  useEffect(() => {
    const tmr = new Date()
    tmr.setDate(tmr.getDate() + 1)
    const checkInStr = tmr.toISOString().split('T')[0]
    setCheckIn(checkInStr)
    
    const dat = new Date()
    dat.setDate(dat.getDate() + 2)
    setCheckOut(dat.toISOString().split('T')[0])
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autoRef.current && !autoRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setGuestOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runAutocomplete = (query: string) => {
    clearTimeout(debounceTimer.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/airports/search?q=`) // Wake up backend or other check
        const response = await fetch(`/api/airports/search?q=`) // dummy to keep route alive
        
        // Call our actual hotels autocomplete API
        const hotelRes = await fetch(`/api/hotels/autocomplete?q=${encodeURIComponent(query)}`)
        const json = await hotelRes.json()
        if (json.data && Array.isArray(json.data.suggestions)) {
          setSuggestions(json.data.suggestions)
        }
      } catch (err) {
        console.error("Autocomplete failed:", err)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (s: Suggestion) => {
    setDestination(s.value)
    setSelectedDest(s)
    setOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination.trim()) return

    // Date validations
    if (new Date(checkOut) <= new Date(checkIn)) {
      alert("Check-out date must be after check-in date.")
      return
    }

    // Direct details navigation if a specific hotel was selected
    if (selectedDest && selectedDest.type === 'accommodation' && selectedDest.property_token) {
      const params = new URLSearchParams({
        property_token: selectedDest.property_token,
        check_in: checkIn,
        check_out: checkOut,
        adults: String(adults),
        currency: currency,
      })
      router.push(`/hotels/details?${params.toString()}`)
      return
    }

    // Standard search results navigation
    const params = new URLSearchParams({
      q: destination,
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      rooms: String(rooms),
      currency: currency,
    })
    router.push(`/hotels/results?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        {/* Destination Autocomplete */}
        <div ref={autoRef} className="md:col-span-2 relative min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />Destination / Hotel</span>
          </label>
          <div className={`relative h-14 rounded-xl border-2 transition-all duration-200 bg-slate-50 dark:bg-slate-800/60 flex items-center px-4 gap-3
            ${open ? 'border-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
            <input 
              placeholder="City, region, or hotel name" 
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setSelectedDest(null)
                setOpen(true)
                runAutocomplete(e.target.value)
              }}
              onFocus={() => setOpen(true)}
              className="flex-1 bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:text-slate-400 outline-none" 
              required
            />
            {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>

          {/* Autocomplete Dropdown */}
          {open && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelect(s)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 group"
                >
                  {s.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={s.thumbnail} 
                      alt="" 
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      {s.type === 'accommodation' ? <Building2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {s.location || (s.type === 'accommodation' ? 'Hotel Property' : 'Location Region')}
                    </p>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border 
                    ${s.type === 'accommodation' 
                      ? 'border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' 
                      : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                    {s.type === 'accommodation' ? 'Hotel' : 'Location'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-in Date */}
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Check-in</span>
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center px-4">
            <input 
              type="date" 
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value)
                // Auto adjust checkout if it is before or equal
                if (new Date(checkOut) <= new Date(e.target.value)) {
                  const nxt = new Date(e.target.value)
                  nxt.setDate(nxt.getDate() + 1)
                  setCheckOut(nxt.toISOString().split('T')[0])
                }
              }}
              className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]" 
              required
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Check-out</span>
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center px-4">
            <input 
              type="date" 
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]" 
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        {/* Guest and Room Selector */}
        <div ref={guestRef} className="md:col-span-3 relative min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />Guests &amp; Rooms</span>
          </label>
          <button 
            type="button" 
            onClick={() => setGuestOpen(!guestOpen)}
            className={`w-full flex items-center justify-between h-14 rounded-xl border-2 px-4 transition-all duration-200 bg-slate-50 dark:bg-slate-800/60
              ${guestOpen ? 'border-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{adults} Adult{adults > 1 ? 's' : ''}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{rooms} Room{rooms > 1 ? 's' : ''}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${guestOpen ? 'rotate-180' : ''}`} />
          </button>

          {guestOpen && (
            <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-5 space-y-5">
              {/* Adults Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Adults</p>
                  <p className="text-xs text-slate-400">Age 18+</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40"
                    disabled={adults <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800 dark:text-slate-100">{adults}</span>
                  <button 
                    type="button" 
                    onClick={() => setAdults(Math.min(9, adults + 1))}
                    className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40"
                    disabled={adults >= 9}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Rooms Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Rooms</p>
                  <p className="text-xs text-slate-400">Number of rooms required</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                    className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40"
                    disabled={rooms <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800 dark:text-slate-100">{rooms}</span>
                  <button 
                    type="button" 
                    onClick={() => setRooms(Math.min(9, rooms + 1))}
                    className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40"
                    disabled={rooms >= 9}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setGuestOpen(false)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Submit Search Button */}
        <div className="min-w-0">
          <button 
            type="submit" 
            className="w-full h-14 rounded-xl font-extrabold text-white text-base overflow-hidden group relative flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Search className="w-5 h-5" />
            <span>Search Hotels</span>
          </button>
        </div>
      </div>
    </form>
  )
}

function CarForm() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-[2] min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />Pick-up Location</span>
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center px-4">
            <input placeholder="Airport or city" className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:text-slate-400 outline-none" readOnly />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Pick-up</span>
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center px-4">
            <input type="date" className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]" readOnly />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Drop-off</span>
          </label>
          <div className="h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center px-4">
            <input type="date" className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]" readOnly />
          </div>
        </div>
      </div>

      <div className="relative">
        <button disabled className="relative w-full h-14 rounded-xl font-extrabold text-white text-base cursor-not-allowed opacity-60"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' }}>
          <span className="flex items-center justify-center gap-2.5"><Search className="w-5 h-5" />Search Cars</span>
        </button>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab config ──────────────────────────────────────────────────────────── */
const TABS: { id: Tab; label: string; Icon: React.ElementType; accent: string }[] = [
  { id: 'flights', label: 'Flights',   Icon: Plane,     accent: 'sky' },
  { id: 'hotels',  label: 'Hotels',    Icon: Building2, accent: 'violet' },
  { id: 'cars',    label: 'Car Hire',  Icon: Car,       accent: 'emerald' },
]

/* ─── HeroSearch ─────────────────────────────────────────────────────────── */
export function HeroSearch() {
  const [active, setActive] = useState<Tab>('flights')

  return (
    <div>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-row gap-0 mb-6 border-b border-slate-100 dark:border-slate-800">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            onClick={() => setActive(id)}
            className={[
              'relative flex items-center justify-center gap-2 flex-1 py-3 px-2 text-sm font-bold transition-all duration-200',
              active === id
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>

            {/* Active indicator bar */}
            {active === id && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div key={active} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        {active === 'flights' && <FlightSearchForm />}
        {active === 'hotels'  && <HotelForm />}
        {active === 'cars'    && <CarForm />}
      </div>
    </div>
  )
}
