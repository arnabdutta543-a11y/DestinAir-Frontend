'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useSearchStore, useCurrencyStore } from '@/lib/store'
import {
  MapPin, Navigation, ArrowLeftRight, Calendar,
  Users, ChevronDown, Search, Minus, Plus, Building2, PlusCircle, Trash2, Plane, Loader2, Star,
} from 'lucide-react'
import { PriceCalendar } from '@/components/flights/PriceCalendar'

// ── SerpAPI autocomplete suggestion shape ────────────────────────────────────
interface SerpAirport {
  id: string
  name: string
  city: string
  distance: string
}
interface SerpGroup {
  id: string
  name: string
  type: string
  description: string
  airports: SerpAirport[]
}

const CABINS = [
  { value: 'ECONOMY',         label: 'Economy',         icon: '🪑' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', icon: '✨' },
  { value: 'BUSINESS',        label: 'Business',        icon: '💼' },
  { value: 'FIRST',           label: 'First Class',     icon: '👑' },
]

/* ─── AirportInput ──────────────────────────────────────────────────────────── */
function AirportInput({
  id, label, icon: Icon, value, placeholder, onChange, required,
}: {
  id: string; label: string; icon: React.ElementType
  value: string; placeholder: string
  onChange: (val: string) => void; required?: boolean
}) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState(value)
  const [groups, setGroups]   = useState<SerpGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)   // has user typed ≥ 2 chars?
  const wrapRef               = useRef<HTMLDivElement>(null)
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runSearch = useCallback((q: string) => {
    clearTimeout(debounceRef.current)
    if (q.length < 1) { setGroups([]); setSearched(false); return }
    if (q.length < 2) { setGroups([]); return }
    setSearched(true)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/flights/autocomplete?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        setGroups(Array.isArray(json.data) ? json.data as SerpGroup[] : [])
      } catch {
        setGroups([])
      } finally {
        setLoading(false)
      }
    }, 280)
  }, [])

  // Resolve city hint from previously selected value
  const cityHint = value.length === 3 ? value.toUpperCase() : undefined

  const showDropdown = open && (loading || searched)
  const handleSelect = (code: string, label: string) => {
    onChange(code)
    setQuery(label)
    setOpen(false)
    setGroups([])
    setSearched(false)
  }

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        <span className="flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</span>
      </label>
      <div className={`relative flex items-center h-14 rounded-xl border-2 transition-all duration-200 bg-slate-50 dark:bg-slate-800/60
        ${open ? 'border-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
        <input
          id={id} type="text" autoComplete="off" value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); runSearch(e.target.value) }}
          onFocus={() => { setOpen(true); if (query.length >= 2) runSearch(query) }}
          placeholder={placeholder} maxLength={60} required={required}
          className="flex-1 bg-transparent px-4 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:text-slate-400 outline-none"
        />
        {loading
          ? <Loader2 className="w-4 h-4 text-sky-500 animate-spin mr-3 flex-shrink-0" />
          : cityHint && (
            <span className="px-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest border-l border-slate-200 dark:border-slate-700 ml-1 py-3">
              {cityHint}
            </span>
          )
        }
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-3 px-4 py-5 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
              <span className="text-sm">Searching airports…</span>
            </div>
          )}

          {/* Results */}
          {!loading && groups.map((grp) => {
            const isMulti = grp.airports.length > 1
            return (
              <div key={grp.id}>
                {isMulti && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 select-none">
                    <Building2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                        {grp.name}
                        <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-slate-400">{grp.airports.length} airports</span>
                      </p>
                      <p className="text-[10px] text-slate-400">{grp.description}</p>
                    </div>
                  </div>
                )}
                {grp.airports.map((ap, i) => (
                  <button
                    key={ap.id} type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(ap.id, `${ap.city || grp.name} (${ap.id})`) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-800/80 text-left transition-colors group
                      ${isMulti ? 'pl-11' : 'pl-4'}
                      ${i < grp.airports.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/40' : ''}`}
                  >
                    <span className="w-11 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[11px] font-black flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/60 transition-colors tracking-wide">
                      {ap.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{ap.name || grp.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {grp.description}{ap.distance ? ` · ${ap.distance}` : ''}
                      </p>
                    </div>
                    <Plane className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )
          })}

          {/* No results */}
          {!loading && searched && groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-slate-400">
              <MapPin className="w-6 h-6 text-slate-300" />
              <p className="text-sm font-medium">No airports found</p>
              <p className="text-xs text-slate-300">Try a city name, airport name or IATA code</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── SimpleDatePicker ───────────────────────────────────────────────────────── */
const SMONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SFULL   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SDAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su']
function SimpleDatePicker({ value, min, onChange, onClose }: {
  value: string; min?: string; onChange: (v: string) => void; onClose: () => void
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInM = new Date(year, month + 1, 0).getDate()
  const startDow = ((new Date(year, month, 1).getDay() + 6) % 7)
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({length: daysInM}, (_, i) => i + 1)]

  function ds(day: number) {
    return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }
  function isPast(day: number) { return new Date(ds(day) + 'T00:00') < today }

  function prevM() { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  function nextM() { if (month === 11) { setYear(y => y+1); setMonth(0) } else setMonth(m => m+1) }
  const canPrev = year > today.getFullYear() || month > today.getMonth()

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 w-[320px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevM} disabled={!canPrev}
          className={`p-1.5 rounded-lg transition-colors ${canPrev ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'}`}>
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h4 className="text-sm font-bold text-slate-100">{SFULL[month]} {year}</h4>
        <button type="button" onClick={nextM} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors">
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {SDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const dateStr = ds(day)
          const past    = isPast(day)
          const sel     = dateStr === value
          return (
            <button key={dateStr} type="button" disabled={past}
              onClick={() => { onChange(dateStr); onClose() }}
              className={`
                w-9 h-9 mx-auto rounded-full flex items-center justify-center text-[13px] font-semibold
                transition-all duration-150
                ${past ? 'text-slate-600 cursor-not-allowed' : 'cursor-pointer'}
                ${sel ? 'bg-sky-500 text-white ring-2 ring-sky-300 ring-offset-1 ring-offset-slate-900' : ''}
                ${!past && !sel ? 'text-slate-200 hover:bg-slate-700' : ''}
              `}
            >{day}</button>
          )
        })}
      </div>
      <button type="button" onClick={onClose}
        className="w-full mt-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors">
        Done
      </button>
    </div>
  )
}

/* ─── CalendarDateInput ────────────────────────────────────────────────────
   Clicking the input opens a portal-based dropdown (never clipped).         */
function CalendarDateInput({ id, label, value, min, onChange, required,
  origin, destination, returnValue, onReturnChange, mode = 'single',
}: {
  id: string; label: string; value: string; min?: string
  onChange: (v: string) => void; required?: boolean
  origin?: string; destination?: string
  returnValue?: string; onReturnChange?: (v: string) => void
  mode?: 'single' | 'range'
}) {
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, left: 0, width: 700 })
  const triggerRef        = useRef<HTMLDivElement>(null)
  const dropRef           = useRef<HTMLDivElement>(null)
  const showCalendar      = !!(origin && destination && origin !== destination)

  function openDropdown() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const w    = showCalendar ? 700 : 330
      // Try to keep within viewport
      const left = Math.min(rect.left + window.scrollX, window.innerWidth + window.scrollX - w - 16)
      setPos({ top: rect.bottom + window.scrollY + 6, left: Math.max(8, left), width: w })
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (dropRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const display = value
    ? new Date(value + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div className="flex-1 min-w-0">
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{label}</span>
      </label>

      {/* Trigger — matches From/To input style */}
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className={`
          relative flex items-center h-14 rounded-xl border-2 cursor-pointer
          transition-all duration-200
          bg-white/5 dark:bg-white/5 backdrop-blur-sm
          ${open
            ? 'border-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.2)]'
            : 'border-white/10 hover:border-white/20'
          }
        `}
      >
        {/* Hidden native input for form validation */}
        <input id={id} type="date" value={value} min={min}
          onChange={(e) => onChange(e.target.value)} required={required}
          className="sr-only" tabIndex={-1}
        />
        <Calendar className="w-4 h-4 text-slate-400 ml-4 flex-shrink-0" />
        <span className={`flex-1 px-3 text-sm font-semibold truncate ${
          value ? 'text-slate-100' : 'text-slate-500'
        }`}>
          {display || 'Add date'}
        </span>
        {value && (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="mr-3 text-slate-500 hover:text-slate-300 transition-colors text-xs"
          >✕</button>
        )}
      </div>

      {/* Portal dropdown */}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}
        >
          {showCalendar ? (
            <PriceCalendar
              origin={origin!} destination={destination!}
              selectedDate={value} returnDate={returnValue}
              onSelectDate={(d) => { onChange(d); if (mode === 'single') setOpen(false) }}
              onSelectReturn={onReturnChange}
              mode={mode}
              onClose={() => setOpen(false)}
            />
          ) : (
            <SimpleDatePicker value={value} min={min} onChange={onChange} onClose={() => setOpen(false)} />
          )}
        </div>,
        document.body
      )}
    </div>
  )
}


/* ─── PassengerCabinButton ──────────────────────────────────────────────────── */
function PassengerCabinButton({
  adults, cabin, onAdultsChange, onCabinChange,
}: { adults: number; cabin: string; onAdultsChange: (n: number) => void; onCabinChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeCabin = CABINS.find(c => c.value === cabin) || CABINS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="flex-1 min-w-0 relative">
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />Passengers &amp; Cabin</span>
      </label>
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between h-14 rounded-xl border-2 px-4 transition-all duration-200 bg-slate-50 dark:bg-slate-800/60
          ${open ? 'border-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{adults} Adult{adults > 1 ? 's' : ''}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{activeCabin.icon} {activeCabin.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Adults</p>
              <p className="text-xs text-slate-400">Age 12+</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40"
                disabled={adults <= 1}><Minus className="w-3 h-3" /></button>
              <span className="w-6 text-center font-bold text-slate-800 dark:text-slate-100">{adults}</span>
              <button type="button" onClick={() => onAdultsChange(Math.min(9, adults + 1))}
                className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40"
                disabled={adults >= 9}><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Cabin Class</p>
            <div className="grid grid-cols-2 gap-2">
              {CABINS.map((c) => (
                <button key={c.value} type="button" onClick={() => onCabinChange(c.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                    ${cabin === c.value ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                  <span>{c.icon}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors">
            Done
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Helper ────────────────────────────────────────────────────────────────── */
export function scrollToSearch() {
  const el = document.getElementById('hero-search')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

interface MultiCityLeg { origin: string; destination: string; date: string }
const emptyLeg = (): MultiCityLeg => ({ origin: '', destination: '', date: '' })

/* ─── Main form ─────────────────────────────────────────────────────────────── */
export function FlightSearchForm() {
  const router = useRouter()
  const { flightParams, setFlightParams } = useSearchStore()
  const { currency } = useCurrencyStore()
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multicity'>('oneway')
  const today = new Date().toISOString().split('T')[0]

  // Multi-city legs state
  const [mcLegs, setMcLegs] = useState<MultiCityLeg[]>([emptyLeg(), emptyLeg()])
  const updateLeg = (i: number, patch: Partial<MultiCityLeg>) =>
    setMcLegs(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  const addLeg = () => setMcLegs(prev => [...prev, emptyLeg()])
  const removeLeg = (i: number) => setMcLegs(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (tripType === 'multicity') {
      // Encode legs as JSON in URL
      const params = new URLSearchParams({
        tripType: 'multicity',
        legs: JSON.stringify(mcLegs),
        adults: String(flightParams.adults || 1),
        travelClass: flightParams.travelClass || 'ECONOMY',
        currency,
      })
      // Use first leg origin/dest so single-flight fetch still works as leg 1
      params.set('origin', mcLegs[0].origin)
      params.set('destination', mcLegs[0].destination)
      params.set('departureDate', mcLegs[0].date)
      router.push(`/flights/results?${params.toString()}`)
      return
    }

    const params = new URLSearchParams({
      tripType,
      origin:        flightParams.origin || '',
      destination:   flightParams.destination || '',
      departureDate: flightParams.departureDate || '',
      adults:        String(flightParams.adults || 1),
      travelClass:   flightParams.travelClass || 'ECONOMY',
      currency,
      ...(tripType === 'roundtrip' && flightParams.returnDate
        ? { returnDate: flightParams.returnDate } : {}),
    })

    // Save recent search
    try {
      const entry = {
        id: Date.now().toString(),
        origin: flightParams.origin || '', destination: flightParams.destination || '',
        departureDate: flightParams.departureDate || '',
        adults: flightParams.adults || 1, cabin: flightParams.travelClass || 'ECONOMY',
        currency, searchedAt: new Date().toISOString(),
      }
      const raw = localStorage.getItem('skysearch_history')
      const prev = raw ? JSON.parse(raw) : []
      const deduped = prev.filter((h: any) =>
        !(h.origin === entry.origin && h.destination === entry.destination && h.departureDate === entry.departureDate)
      )
      localStorage.setItem('skysearch_history', JSON.stringify([...deduped, entry].slice(-20)))
    } catch {}

    router.push(`/flights/results?${params.toString()}`)
  }

  const swapAirports = () => setFlightParams({ origin: flightParams.destination, destination: flightParams.origin })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Trip type pills */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { id: 'oneway',    label: 'One Way'    },
          { id: 'roundtrip', label: 'Round Trip' },
          { id: 'multicity', label: 'Multi-City' },
        ] as const).map((t) => (
          <button key={t.id} type="button" onClick={() => setTripType(t.id)}
            className={[
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              tripType === t.id
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20',
            ].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ONE WAY / ROUND TRIP ────────────────────────────────────────── */}
      {tripType !== 'multicity' && (
        <>
          <div className="flex items-end gap-2">
            <AirportInput id="fsf-origin" label="From" icon={Navigation}
              value={flightParams.origin || ''} placeholder="City or airport"
              onChange={(v) => setFlightParams({ origin: v })} required />
            <button type="button" onClick={swapAirports} aria-label="Swap airports"
              className="flex-shrink-0 mb-0.5 w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-sky-500 hover:text-sky-600 hover:rotate-180 transition-all duration-300">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <AirportInput id="fsf-destination" label="To" icon={MapPin}
              value={flightParams.destination || ''} placeholder="City or airport"
              onChange={(v) => setFlightParams({ destination: v })} required />
          </div>

          <div className="flex items-end gap-3">
            <CalendarDateInput id="fsf-departure" label="Departure"
              value={flightParams.departureDate || ''} min={today}
              onChange={(v) => setFlightParams({ departureDate: v })} required
              origin={flightParams.origin} destination={flightParams.destination}
              returnValue={flightParams.returnDate}
              onReturnChange={(v) => setFlightParams({ returnDate: v })}
              mode={tripType === 'roundtrip' ? 'range' : 'single'} />
            {tripType === 'roundtrip' && (
              <CalendarDateInput id="fsf-return" label="Return"
                value={flightParams.returnDate || ''} min={flightParams.departureDate || today}
                onChange={(v) => setFlightParams({ returnDate: v })} required
                origin={flightParams.origin} destination={flightParams.destination}
                mode="single" />
            )}
            <PassengerCabinButton
              adults={flightParams.adults || 1} cabin={flightParams.travelClass || 'ECONOMY'}
              onAdultsChange={(n) => setFlightParams({ adults: n })}
              onCabinChange={(c) => setFlightParams({ travelClass: c })} />
          </div>
        </>
      )}

      {/* ── MULTI-CITY ──────────────────────────────────────────────────── */}
      {tripType === 'multicity' && (
        <div className="space-y-3">
          {mcLegs.map((leg, i) => (
            <div key={i} className="relative border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Flight {i + 1}</span>
                {mcLegs.length > 2 && (
                  <button type="button" onClick={() => removeLeg(i)}
                    className="text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-end gap-2 mb-3">
                <AirportInput id={`mc-from-${i}`} label="From" icon={Navigation}
                  value={leg.origin} placeholder="City or airport"
                  onChange={(v) => updateLeg(i, { origin: v })} required />
                <button type="button" onClick={() => updateLeg(i, { origin: leg.destination, destination: leg.origin })}
                  className="flex-shrink-0 mb-0.5 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-sky-500 hover:text-sky-600 hover:rotate-180 transition-all duration-300">
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                <AirportInput id={`mc-to-${i}`} label="To" icon={MapPin}
                  value={leg.destination} placeholder="City or airport"
                  onChange={(v) => updateLeg(i, { destination: v })} required />
                <CalendarDateInput id={`mc-date-${i}`} label="Date"
                  value={leg.date} min={i > 0 ? (mcLegs[i - 1].date || today) : today}
                  onChange={(v: string) => updateLeg(i, { date: v })} required
                  origin={leg.origin} destination={leg.destination} mode="single" />
              </div>
            </div>
          ))}

          {mcLegs.length < 5 && (
            <button type="button" onClick={addLeg}
              className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors px-1">
              <PlusCircle className="w-4 h-4" /> Add another flight
            </button>
          )}

          <PassengerCabinButton
            adults={flightParams.adults || 1} cabin={flightParams.travelClass || 'ECONOMY'}
            onAdultsChange={(n) => setFlightParams({ adults: n })}
            onCabinChange={(c) => setFlightParams({ travelClass: c })} />
        </div>
      )}

      {/* Submit */}
      <button type="submit" id="flight-search-btn"
        className="relative w-full h-14 rounded-xl font-extrabold text-white text-base overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' }}>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative flex items-center justify-center gap-2.5">
          <Search className="w-5 h-5" />
          Search Flights
          <span className="ml-1 text-sky-200 text-sm font-normal hidden sm:inline">— 1000+ airlines</span>
        </span>
      </button>

      {/* Popular routes */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
        <span className="text-[11px] text-slate-400 font-medium">Popular:</span>
        {['JFK → LHR', 'BOM → DXB', 'SIN → NRT', 'BKK → SIN', 'DEL → DXB', 'SYD → MEL'].map((r) => (
          <button key={r} type="button"
            onClick={() => { const [o, d] = r.split(' → '); setFlightParams({ origin: o, destination: d }) }}
            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            {r}
          </button>
        ))}
      </div>
    </form>
  )
}
