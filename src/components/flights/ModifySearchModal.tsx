'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftRight, MapPin, Navigation, Calendar, Users,
  ChevronDown, Search, Minus, Plus, PlusCircle, Trash2, X,
} from 'lucide-react'
import { searchAirports, findAirport, type CityGroup } from '@/data/airports'
import { Building2 } from 'lucide-react'

type TripType = 'oneway' | 'roundtrip' | 'multicity'
interface Leg { origin: string; destination: string; date: string }

const CABINS = [
  { value: 'ECONOMY',         label: 'Economy',         icon: '🪑' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', icon: '✨' },
  { value: 'BUSINESS',        label: 'Business',        icon: '💼' },
  { value: 'FIRST',           label: 'First Class',     icon: '👑' },
]

/* ── AirportInput ─────────────────────────────────────────────────────────── */
function AirportInput({ id, label, icon: Icon, value, placeholder, onChange }: {
  id: string; label: string; icon: React.ElementType
  value: string; placeholder: string; onChange: (v: string) => void
}) {
  const [open, setOpen]     = useState(false)
  const [groups, setGroups] = useState<CityGroup[]>([])
  const wrapRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const ap = findAirport(value)

  const handleInput = useCallback((q: string) => {
    onChange(q)
    setOpen(true)
    setGroups(q.length >= 1 ? searchAirports(q, 8) : [])
  }, [onChange])

  const pick = (code: string) => { onChange(code); setOpen(false); setGroups([]) }

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <label htmlFor={id} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        <Icon className="w-3 h-3" />{label}
      </label>
      <div className={`flex items-center rounded-xl border-2 transition-all bg-slate-50 dark:bg-slate-800/70
        ${open ? 'border-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
        <input
          id={id} type="text" autoComplete="off" value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { setOpen(true); setGroups(value.length >= 1 ? searchAirports(value, 8) : []) }}
          placeholder={placeholder}
          className="flex-1 w-0 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:text-slate-400 outline-none uppercase"
        />
        {ap && (
          <span className="pr-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap hidden sm:block">
            {ap.city.split(' ')[0]}
          </span>
        )}
      </div>

      {open && groups.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
          {groups.map(grp => (
            <div key={grp.cityCode}>
              {grp.airports.length > 1 ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800">
                    <Building2 className="w-3 h-3 text-sky-500 shrink-0" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{grp.city}</p>
                    <span className="ml-auto text-[10px] text-slate-400">{grp.country}</span>
                  </div>
                  {grp.airports.map(ap => (
                    <button key={ap.code} type="button" onMouseDown={e => { e.preventDefault(); pick(ap.code) }}
                      className="w-full flex items-center gap-2 pl-7 pr-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-left">
                      <span className="text-xs font-black text-sky-600 w-8 shrink-0">{ap.code}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{ap.name}</span>
                    </button>
                  ))}
                </>
              ) : (
                <button type="button" onMouseDown={e => { e.preventDefault(); pick(grp.airports[0].code) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-left">
                  <span className="w-10 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/40 text-sky-600 text-xs font-black flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900">
                    {grp.airports[0].code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{grp.city}</p>
                    <p className="text-[11px] text-slate-400 truncate">{grp.airports[0].name} · {grp.country}</p>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── DateInput ────────────────────────────────────────────────────────────── */
function DateInput({ id, label, value, min, onChange }: {
  id: string; label: string; value: string; min?: string; onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex-1 min-w-0">
      <label htmlFor={id} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        <Calendar className="w-3 h-3" />{label}
      </label>
      <div className={`rounded-xl border-2 transition-all bg-slate-50 dark:bg-slate-800/70
        ${focused ? 'border-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
        <input id={id} type="date" value={value} min={min}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>
    </div>
  )
}

/* ── PassengerCabinPicker ─────────────────────────────────────────────────── */
function PassengerCabinPicker({ adults, cabin, onAdultsChange, onCabinChange }: {
  adults: number; cabin: string; onAdultsChange: (n: number) => void; onCabinChange: (c: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = CABINS.find(c => c.value === cabin) ?? CABINS[0]

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="flex-1 min-w-0 relative">
      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        <Users className="w-3 h-3" />Passengers &amp; Cabin
      </label>
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border-2 px-3 py-2.5 transition-all bg-slate-50 dark:bg-slate-800/70
          ${open ? 'border-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.12)]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
          {adults} Adult{adults > 1 ? 's' : ''} · {active.icon} {active.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Adults</p>
              <p className="text-xs text-slate-400">Age 12+</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onAdultsChange(Math.max(1, adults - 1))} disabled={adults <= 1}
                className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center font-bold text-slate-800 dark:text-slate-100">{adults}</span>
              <button type="button" onClick={() => onAdultsChange(Math.min(9, adults + 1))} disabled={adults >= 9}
                className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-sky-500 hover:text-sky-600 transition-all disabled:opacity-40">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cabin Class</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CABINS.map(c => (
                <button key={c.value} type="button" onClick={() => onCabinChange(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all
                    ${cabin === c.value ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors">
            Done
          </button>
        </div>
      )}
    </div>
  )
}

/* ── SwapBtn ──────────────────────────────────────────────────────────────── */
function SwapBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Swap"
      className="shrink-0 self-end mb-0.5 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-sky-500 hover:text-sky-600 hover:rotate-180 transition-all duration-300 shadow-sm">
      <ArrowLeftRight className="w-3.5 h-3.5" />
    </button>
  )
}

/* ── ModifySearchPanel ────────────────────────────────────────────────────── */
export interface ModifySearchPanelProps {
  initialOrigin: string; initialDestination: string; initialDate: string
  initialReturn?: string; initialAdults: number; initialCabin: string
  initialTripType: TripType; initialMcLegs?: Leg[]
  onClose: () => void
}

export function ModifySearchPanel({
  initialOrigin, initialDestination, initialDate, initialReturn,
  initialAdults, initialCabin, initialTripType, initialMcLegs,
  onClose,
}: ModifySearchPanelProps) {
  const router = useRouter()
  const today  = new Date().toISOString().split('T')[0]

  const [tripType, setTripType]       = useState<TripType>(initialTripType)
  const [origin, setOrigin]           = useState(initialOrigin)
  const [destination, setDestination] = useState(initialDestination)
  const [departDate, setDepartDate]   = useState(initialDate)
  const [returnDate, setReturnDate]   = useState(initialReturn ?? '')
  const [adults, setAdults]           = useState(initialAdults)
  const [cabin, setCabin]             = useState(initialCabin)
  const [mcLegs, setMcLegs]           = useState<Leg[]>(
    initialMcLegs?.length
      ? initialMcLegs
      : [{ origin: '', destination: '', date: '' }, { origin: '', destination: '', date: '' }]
  )

  const updateLeg = (i: number, patch: Partial<Leg>) =>
    setMcLegs(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tripType === 'multicity') {
      const params = new URLSearchParams({
        tripType: 'multicity', legs: JSON.stringify(mcLegs),
        adults: String(adults), travelClass: cabin,
        origin: mcLegs[0]?.origin ?? '', destination: mcLegs[0]?.destination ?? '',
        departureDate: mcLegs[0]?.date ?? '',
      })
      router.push(`/flights/results?${params}`)
    } else {
      const params = new URLSearchParams({
        tripType, origin, destination, departureDate: departDate,
        adults: String(adults), travelClass: cabin,
        ...(tripType === 'roundtrip' && returnDate ? { returnDate } : {}),
      })
      router.push(`/flights/results?${params}`)
    }
    onClose()
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-lg shadow-sky-100/40 dark:shadow-sky-950/30 overflow-visible">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Edit your search</span>
        </div>
        <button type="button" onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">

        {/* Trip type pills */}
        <div className="flex gap-2 flex-wrap">
          {(['oneway', 'roundtrip', 'multicity'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
              className={[
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all border',
                tripType === t
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600',
              ].join(' ')}>
              {t === 'oneway' ? '→ One Way' : t === 'roundtrip' ? '⇄ Round Trip' : '✦ Multi-City'}
            </button>
          ))}
        </div>

        {/* ── ONE WAY / ROUND TRIP ── */}
        {tripType !== 'multicity' && (
          <>
            <div className="flex items-end gap-2">
              <AirportInput id="msp-org" label="From" icon={Navigation}
                value={origin} placeholder="City / airport" onChange={setOrigin} />
              <SwapBtn onClick={() => { const t = origin; setOrigin(destination); setDestination(t) }} />
              <AirportInput id="msp-dst" label="To" icon={MapPin}
                value={destination} placeholder="City / airport" onChange={setDestination} />
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <DateInput id="msp-dep" label="Departure"
                value={departDate} min={today} onChange={setDepartDate} />
              {tripType === 'roundtrip' && (
                <DateInput id="msp-ret" label="Return"
                  value={returnDate} min={departDate || today} onChange={setReturnDate} />
              )}
              <PassengerCabinPicker adults={adults} cabin={cabin}
                onAdultsChange={setAdults} onCabinChange={setCabin} />
            </div>
          </>
        )}

        {/* ── MULTI-CITY ── */}
        {tripType === 'multicity' && (
          <div className="space-y-3">
            {mcLegs.map((leg, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Flight {i + 1}</span>
                  {mcLegs.length > 2 && (
                    <button type="button" onClick={() => setMcLegs(p => p.filter((_, idx) => idx !== i))}
                      className="text-rose-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <AirportInput id={`msp-mc-f${i}`} label="From" icon={Navigation}
                    value={leg.origin} placeholder="City / airport" onChange={v => updateLeg(i, { origin: v })} />
                  <SwapBtn onClick={() => updateLeg(i, { origin: leg.destination, destination: leg.origin })} />
                  <AirportInput id={`msp-mc-t${i}`} label="To" icon={MapPin}
                    value={leg.destination} placeholder="City / airport" onChange={v => updateLeg(i, { destination: v })} />
                </div>
                <DateInput id={`msp-mc-d${i}`} label="Date"
                  value={leg.date} min={i > 0 ? (mcLegs[i - 1].date || today) : today}
                  onChange={v => updateLeg(i, { date: v })} />
              </div>
            ))}
            {mcLegs.length < 5 && (
              <button type="button"
                onClick={() => setMcLegs(p => [...p, { origin: '', destination: '', date: '' }])}
                className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                <PlusCircle className="w-4 h-4" /> Add another flight
              </button>
            )}
            <PassengerCabinPicker adults={adults} cabin={cabin}
              onAdultsChange={setAdults} onCabinChange={setCabin} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="relative flex-1 h-11 rounded-xl font-extrabold text-white text-sm overflow-hidden group"
            style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#4f46e5 100%)' }}>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Search Flights
            </span>
          </button>
        </div>

      </form>
    </div>
  )
}
