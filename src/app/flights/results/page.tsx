'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useMemo } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import {
  Plane, Clock, ArrowRight, ArrowLeft, Bell, Wifi, X,
  Briefcase, Search, TrendingDown, AlertCircle, Zap, Tag, Info
} from 'lucide-react'
import { useCurrencyStore } from '@/lib/store'
import Link from 'next/link'
import type { FlightOffer } from '@/lib/mock-flights'
import { ItineraryModal } from '@/components/flights/ItineraryModal'
import { FilterSidebar, DEFAULT_FILTERS } from '@/components/flights/FilterSidebar'
import type { FilterState } from '@/components/flights/FilterSidebar'
import { CombinedTripCard } from '@/components/flights/CombinedTripCard'
import { ModifySearchPanel } from '@/components/flights/ModifySearchModal'
import { BookingRedirectModal } from '@/components/flights/BookingRedirectModal'

/* ─── Departure time bucket → hour range ────────────────────────────────────── */
const DEP_HOURS: Record<string, [number, number]> = {
  morning:   [5,  11],
  afternoon: [12, 17],
  evening:   [18, 22],
  night:     [23, 4],
}

/** Convert FilterState into URLSearchParams additions for the API */
function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (f.stops.length)        p.set('filterStops',    f.stops.join(','))
  if (f.maxPrice > 0)        p.set('filterMaxPrice', String(f.maxPrice))
  if (f.maxDuration > 0)     p.set('filterMaxDuration', String(f.maxDuration))
  if (f.airlines.length)     p.set('filterAirlines', f.airlines.join(','))
  if (f.baggageOnly)         p.set('filterBaggage',  'true')
  if (f.wifiOnly)            p.set('filterWifi',     'true')
  if (f.refundableOnly)      p.set('filterRefundable','true')
  // Departure time: union of all selected buckets → min start / max end
  if (f.depTimes.length) {
    const starts = f.depTimes.map(t => DEP_HOURS[t]?.[0] ?? 0)
    const ends   = f.depTimes.map(t => DEP_HOURS[t]?.[1] ?? 23)
    p.set('filterDepStart', String(Math.min(...starts)))
    p.set('filterDepEnd',   String(Math.max(...ends)))
  }
  return p
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function fmtDuration(mins: number) {
  if (!mins) return '—'
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function fmtTime(iso: string) {
  if (!iso) return '—'
  try {
    // SerpAPI returns times as "YYYY-MM-DD HH:MM" which we convert to "YYYY-MM-DDTHH:MM".
    // These are local-time strings with no timezone offset. Extract HH:MM directly
    // to avoid any UTC conversion shift.
    if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      const [, timePart] = iso.split('T')
      const [hh, mm] = timePart.split(':')
      return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
    }
    // For proper UTC/offset strings, use locale formatting
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '—' }
}

function fmtDate(iso: string) {
  if (!iso) return ''
  try {
    // SerpAPI returns local-time strings with no timezone offset.
    // Parse the date part directly to avoid UTC shift.
    if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      const datePart = iso.split('T')[0]  // YYYY-MM-DD
      const [year, month, day] = datePart.split('-').map(Number)
      const d = new Date(year, month - 1, day)  // local date constructor — no UTC shift
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    }
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

const AIRLINE_LOGOS: Record<string, string> = {
  EK: '🇦🇪', SQ: '🇸🇬', BA: '🇬🇧', AI: '🇮🇳',
  '6E': '🫐', QR: '🇶🇦', LH: '🇩🇪', AF: '🇫🇷',
  TK: '🇹🇷', AK: '🇲🇾', AA: '🇺🇸', UA: '🇺🇸',
  NH: '🇯🇵', CX: '🇭🇰', MS: '🇪🇬',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  AED: 'د.إ', SGD: 'S$', AUD: 'A$', JPY: '¥', CAD: 'C$',
}

/** Build a Google Flights search URL pre-filled with the offer's route & date */
function googleFlightsUrl(offer: FlightOffer, currency = 'USD'): string {
  const dep = offer.departureAt
    ? offer.departureAt.split('T')[0]  // YYYY-MM-DD
    : ''
  const cabin = (offer.cabin || 'ECONOMY').replace('_', ' ').toLowerCase()
  const cabinLabel = cabin.charAt(0).toUpperCase() + cabin.slice(1)
  const q = `Flights from ${offer.origin} to ${offer.destination}${
    dep ? ` on ${dep}` : ''
  } in ${cabinLabel}`
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=${currency}`
}

/* ─── FlightCard ─────────────────────────────────────────────────────────── */
function FlightCard({
  offer,
  currency,
  searchParams,
}: {
  offer: FlightOffer
  currency: string
  searchParams?: { returnDate?: string; adults?: number; travelClass?: string }
}) {
  const [expanded, setExpanded] = useState(false)
  const [showItinerary, setShowItinerary] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const sym = CURRENCY_SYMBOLS[currency] ?? currency
  const logo = AIRLINE_LOGOS[offer.airlineCode] ?? '✈️'
  const hasSegments = offer.stops > 0 || (offer.segments && offer.segments.length > 0)
  // Always have a valid booking link.
  // Backend provides either:
  //   a) google.com/travel/flights?tfs=...  (direct deep-link via booking_token)
  //   b) google.com/travel/flights/search?  (search fallback if token missing)
  // Only fall back to Google Flights search if the backend sent nothing at all.
  const resolvedBookingUrl = offer.bookingUrl ?? googleFlightsUrl(offer, currency)

  const saveAlert = () => {
    if (!alertPrice) return
    try {
      const alert = {
        id: Date.now().toString(),
        origin: offer.origin, destination: offer.destination,
        targetPrice: Number(alertPrice), currency,
        cabin: offer.cabin, createdAt: new Date().toISOString(),
      }
      const raw = localStorage.getItem('skysearch_alerts')
      const prev = raw ? JSON.parse(raw) : []
      localStorage.setItem('skysearch_alerts', JSON.stringify([...prev, alert]))
      setShowAlert(false)
      setAlertPrice('')
      import('sonner').then(({ toast }) => toast.success(
        `Alert set for ${offer.origin} → ${offer.destination}`,
        { description: `Notify when below ${sym}${alertPrice}`, icon: '🔔', duration: 4000 }
      ))
    } catch {}
  }

  const trackBooking = () => {
    try {
      const booking = {
        id: Date.now().toString(),
        airline: offer.airline, airlineCode: offer.airlineCode,
        flightNo: offer.flightNo,
        origin: offer.origin, destination: offer.destination,
        departureAt: offer.departureAt, arrivalAt: offer.arrivalAt,
        price: offer.price, currency,
        cabin: offer.cabin,
        bookingUrl: resolvedBookingUrl,
        bookedAt: new Date().toISOString(),
      }
      const raw = localStorage.getItem('skysearch_bookings')
      const prev = raw ? JSON.parse(raw) : []
      localStorage.setItem('skysearch_bookings', JSON.stringify([...prev, booking].slice(-50)))
    } catch {}
  }

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xl hover:shadow-sky-100/30 dark:hover:shadow-sky-950/30 transition-all duration-300 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Airline */}
          <div className="shrink-0 flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1 sm:w-24">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-slate-100 dark:from-sky-900/30 dark:to-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
              {(offer as any).airlineIcon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(offer as any).airlineIcon}
                  alt={offer.airline}
                  className="w-9 h-9 object-contain"
                  suppressHydrationWarning
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="text-2xl">{logo}</span>
              )}
            </div>
            <div className="sm:text-center">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">{offer.airline}</p>
              <p className="text-xs text-slate-400 font-mono">{offer.flightNo}</p>
            </div>
          </div>

          {/* Route */}
          <div className="flex-1 flex items-center gap-3">
            <div className="text-center shrink-0">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{fmtTime(offer.departureAt)}</p>
              <p className="text-sm font-bold text-sky-600">{offer.origin}</p>
              <p className="text-[11px] text-slate-400">{fmtDate(offer.departureAt)}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1.5 px-1">
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {fmtDuration(offer.duration)}
              </p>
              <div className="relative w-full flex items-center">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-200 via-sky-400 to-slate-200 dark:from-slate-700 dark:via-sky-500 dark:to-slate-700 rounded-full" />
                {/* Clickable plane icon — opens itinerary modal */}
                <button
                  type="button"
                  title="View full itinerary"
                  onClick={() => setShowItinerary(true)}
                  className="absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-sky-400 hover:border-indigo-500 hover:scale-125 flex items-center justify-center transition-all duration-200 group/plane shadow-sm hover:shadow-md"
                >
                  <Plane className="w-3.5 h-3.5 text-sky-500 group-hover/plane:text-indigo-500 transition-colors" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowItinerary(true)}
                className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105 ${
                  offer.stops === 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 cursor-pointer'
                }`}
              >
                {offer.stops === 0
                  ? '✓ Direct'
                  : <span className="flex items-center gap-1">
                      {offer.stops} stop{offer.stops > 1 ? 's' : ''}
                      {offer.layovers?.length ? ` via ${offer.layovers.join(', ')}` : ''}
                      <Info className="w-3 h-3" />
                    </span>
                }
              </button>
            </div>

            <div className="text-center shrink-0">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{fmtTime(offer.arrivalAt)}</p>
              <p className="text-sm font-bold text-sky-600">{offer.destination}</p>
              <p className="text-[11px] text-slate-400">{fmtDate(offer.arrivalAt)}</p>
            </div>
          </div>

          {/* Amenities */}
          <div className="hidden lg:flex flex-col gap-1.5 shrink-0 min-w-[100px]">
            {offer.wifi && <span className="flex items-center gap-1 text-xs text-slate-400"><Wifi className="w-3 h-3" /> Wi-Fi</span>}
            {offer.baggage && <span className="flex items-center gap-1 text-xs text-slate-400"><Briefcase className="w-3 h-3" /> Baggage</span>}
            {offer.refundable && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">↩️ Refundable</span>}
            {offer.seatsLeft != null && offer.seatsLeft > 0 && offer.seatsLeft <= 5 && (
              <span className="text-xs font-bold text-red-500">{offer.seatsLeft} left!</span>
            )}
          </div>

          {/* Tags */}
          {offer.tags.length > 0 && (
            <div className="hidden sm:flex flex-col gap-1 shrink-0">
              {offer.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 flex items-center gap-1">
                  {tag === 'cheapest' && <Tag className="w-2.5 h-2.5" />}
                  {tag === 'fastest' && <Zap className="w-2.5 h-2.5" />}
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price + CTA */}
          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="sm:text-right">
              <p className="text-xs text-slate-400">per person</p>
              <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 leading-none">
                {sym}{Number(offer.price).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">incl. taxes</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                title="Set price alert"
                onClick={() => setShowAlert(!showAlert)}
                className={`h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                  showAlert
                    ? 'border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button
                  type="button"
                  onClick={() => { trackBooking(); setShowBookingModal(true) }}
                  className="h-10 px-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  Book <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert price input */}
      {showAlert && (
        <div className="px-5 sm:px-6 pb-4 pt-2 border-t border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
            <Bell className="w-3 h-3" /> Set price alert for {offer.origin} → {offer.destination}
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <span className="px-3 text-sm font-bold text-amber-600">{sym}</span>
              <input
                type="number" min={1} placeholder={`e.g. ${Math.round(offer.price * 0.85).toLocaleString()}`}
                value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
                className="flex-1 py-2 pr-3 text-sm bg-transparent focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
            <button onClick={saveAlert} disabled={!alertPrice}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
              Save
            </button>
            <button onClick={() => setShowAlert(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Duration: {fmtDuration(offer.duration)}</span>
            <span className="flex items-center gap-1"><Plane className="w-3 h-3" /> {offer.cabin}</span>
            {offer.wifi && <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Wi-Fi included</span>}
            {offer.baggage && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Checked bag included</span>}
          </div>
          <button
            onClick={() => setShowItinerary(true)}
            className="mt-3 text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            <Info className="w-3 h-3" /> View full itinerary details
          </button>
          <p className="text-xs text-slate-400 mt-2 italic">Prices powered by Google Flights via SerpAPI. Clicking Book shows available booking providers for this flight.</p>
        </div>
      )}

      {/* Itinerary modal */}
      {showItinerary && (
        <ItineraryModal
          offer={offer}
          currency={currency}
          symbol={sym}
          onClose={() => setShowItinerary(false)}
        />
      )}

      {/* Booking redirect interstitial */}
      {showBookingModal && (
        <BookingRedirectModal
          offer={offer}
          currency={currency}
          bookingUrl={resolvedBookingUrl}
          searchParams={searchParams}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse ${className}`} />
}

function FlightResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
        >
          {/* Airline row */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>

          {/* Route row: time — line — time */}
          <div className="flex items-center gap-3 mb-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-20" />
              <div className="w-full flex items-center gap-1">
                <Skeleton className="h-0.5 flex-1" />
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-0.5 flex-1" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1.5 items-end flex flex-col">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>

          {/* Bottom row: stops pill + price */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1.5 items-end flex flex-col">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Sort + Filter bar ─────────────────────────────────────────────────────── */
type SortKey = 'price' | 'duration' | 'stops'

function SortBar({ sort, onSort, count, source, message }: { sort: SortKey; onSort: (s: SortKey) => void; count: number; source?: string; message?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Sort:</span>
        {(['price', 'duration', 'stops'] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sort === s
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {count > 0 && (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
            {count} flights found
          </span>
        )}
        {source && (
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            source === 'live'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200'
              : source === 'cache'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border border-blue-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 border border-red-200'
          }`}>
            {source === 'live' ? '🟢 Live · Google Flights' : source === 'cache' ? '💾 Cached' : '🔴 API Error'}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function depTimeBucket(iso: string): string {
  try {
    // SerpAPI times are local-time strings (\"YYYY-MM-DDTHH:MM\"). Extract hour directly.
    let h: number
    if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      h = parseInt(iso.split('T')[1].split(':')[0], 10)
    } else {
      h = new Date(iso).getHours()
    }
    if (h >= 5 && h < 12) return 'morning'
    if (h >= 12 && h < 18) return 'afternoon'
    if (h >= 18 && h < 23) return 'evening'
    return 'night'
  } catch { return 'night' }
}

/* ─── Main results ──────────────────────────────────────────────────────────── */
function ResultsContent() {
  const sp = useSearchParams()
  const router = useRouter()
  const { currency } = useCurrencyStore()
  const [sort, setSort] = useState<SortKey>('price')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [showModify, setShowModify] = useState(false)

  const tripType    = sp.get('tripType')      ?? 'oneway'
  const origin      = sp.get('origin')        ?? ''
  const destination = sp.get('destination')   ?? ''
  const departDate  = sp.get('departureDate') ?? ''
  const returnDate  = sp.get('returnDate')    ?? ''
  const adults      = sp.get('adults')        ?? '1'
  const cabin       = sp.get('travelClass')   ?? 'ECONOMY'
  const legsRaw     = sp.get('legs')          ?? ''

  // Parse multi-city legs
  const mcLegs = useMemo(() => {
    if (tripType !== 'multicity' || !legsRaw) return []
    try { return JSON.parse(legsRaw) as { origin: string; destination: string; date: string }[] }
    catch { return [] }
  }, [tripType, legsRaw])

  const hasParams: boolean = tripType === 'multicity'
    ? mcLegs.length >= 2 && !!(mcLegs[0].origin && mcLegs[0].destination)
    : !!(origin && destination && departDate)

  // Outbound (also used for one-way)
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['flights-v2', origin, destination, departDate, adults, cabin, currency, filters],
    queryFn: async () => {
      const q = new URLSearchParams({ origin, destination, departureDate: departDate, adults, cabin, currency })
      filtersToParams(filters).forEach((v, k) => q.set(k, v))
      const res = await fetch(`/api/flights/search?${q}`)
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      return res.json() as Promise<{ source: string; currency: string; offers: FlightOffer[]; message?: string }>
    },
    enabled: hasParams && tripType !== 'multicity',
    staleTime: 5 * 60 * 1000,
  })

  // Return leg (round trip)
  const { data: returnData, isLoading: returnLoading, isFetching: returnFetching } = useQuery({
    queryKey: ['flights-v2-return', destination, origin, returnDate, adults, cabin, currency, filters],
    queryFn: async () => {
      const q = new URLSearchParams({ origin: destination, destination: origin, departureDate: returnDate, adults, cabin, currency })
      filtersToParams(filters).forEach((v, k) => q.set(k, v))
      const res = await fetch(`/api/flights/search?${q}`)
      if (!res.ok) throw new Error(`Return search failed: ${res.status}`)
      return res.json() as Promise<{ source: string; currency: string; offers: FlightOffer[] }>
    },
    enabled: tripType === 'roundtrip' && !!(destination && origin && returnDate),
    staleTime: 5 * 60 * 1000,
  })

  // Multi-city legs queries (one per leg)
  const mcQuery0 = useQuery({
    queryKey: ['mc-leg-0', mcLegs[0]?.origin, mcLegs[0]?.destination, mcLegs[0]?.date, adults, cabin, currency, filters],
    queryFn: async () => {
      const l = mcLegs[0]
      const q = new URLSearchParams({ origin: l.origin, destination: l.destination, departureDate: l.date, adults, cabin, currency })
      filtersToParams(filters).forEach((v, k) => q.set(k, v))
      const res = await fetch(`/api/flights/search?${q}`)
      return res.json() as Promise<{ source: string; currency: string; offers: FlightOffer[] }>
    },
    enabled: tripType === 'multicity' && mcLegs.length > 0,
    staleTime: 5 * 60 * 1000,
  })
  const mcQuery1 = useQuery({
    queryKey: ['mc-leg-1', mcLegs[1]?.origin, mcLegs[1]?.destination, mcLegs[1]?.date, adults, cabin, currency, filters],
    queryFn: async () => {
      const l = mcLegs[1]
      const q = new URLSearchParams({ origin: l.origin, destination: l.destination, departureDate: l.date, adults, cabin, currency })
      filtersToParams(filters).forEach((v, k) => q.set(k, v))
      const res = await fetch(`/api/flights/search?${q}`)
      return res.json() as Promise<{ source: string; currency: string; offers: FlightOffer[] }>
    },
    enabled: tripType === 'multicity' && mcLegs.length > 1,
    staleTime: 5 * 60 * 1000,
  })
  const mcQuery2 = useQuery({
    queryKey: ['mc-leg-2', mcLegs[2]?.origin, mcLegs[2]?.destination, mcLegs[2]?.date, adults, cabin, currency, filters],
    queryFn: async () => {
      const l = mcLegs[2]
      const q = new URLSearchParams({ origin: l.origin, destination: l.destination, departureDate: l.date, adults, cabin, currency })
      filtersToParams(filters).forEach((v, k) => q.set(k, v))
      const res = await fetch(`/api/flights/search?${q}`)
      return res.json() as Promise<{ source: string; currency: string; offers: FlightOffer[] }>
    },
    enabled: tripType === 'multicity' && mcLegs.length > 2,
    staleTime: 5 * 60 * 1000,
  })
  const mcQuery3 = useQuery({
    queryKey: ['mc-leg-3', mcLegs[3]?.origin, mcLegs[3]?.destination, mcLegs[3]?.date, adults, cabin, currency, filters],
    queryFn: async () => {
      const l = mcLegs[3]
      const q = new URLSearchParams({ origin: l.origin, destination: l.destination, departureDate: l.date, adults, cabin, currency })
      filtersToParams(filters).forEach((v, k) => q.set(k, v))
      const res = await fetch(`/api/flights/search?${q}`)
      return res.json() as Promise<{ source: string; currency: string; offers: FlightOffer[] }>
    },
    enabled: tripType === 'multicity' && mcLegs.length > 3,
    staleTime: 5 * 60 * 1000,
  })

  const mcQueries = [mcQuery0, mcQuery1, mcQuery2, mcQuery3].slice(0, mcLegs.length)

  // Per-leg selection state — must be before early return
  const [selectedOutbound, setSelectedOutbound] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn]     = useState<string | null>(null)
  const [selectedMc, setSelectedMc]             = useState<(string | null)[]>([])

  const allOffers = data?.offers ?? []

  // Derived filter metadata
  const priceRange = useMemo(() => ({
    min: allOffers.length ? Math.floor(Math.min(...allOffers.map(o => o.price))) : 0,
    max: allOffers.length ? Math.ceil(Math.max(...allOffers.map(o => o.price))) : 50000,
  }), [allOffers])

  const maxDurationAvail = useMemo(() =>
    allOffers.length ? Math.max(...allOffers.map(o => o.duration)) : 1440
  , [allOffers])

  const availableAirlines = useMemo(() => {
    const seen = new Map<string, string>()
    allOffers.forEach(o => { if (!seen.has(o.airlineCode)) seen.set(o.airlineCode, o.airline) })
    return Array.from(seen.entries()).map(([code, name]) => ({ code, name }))
  }, [allOffers])

  // Active filter count
  const activeCount = useMemo(() => {
    let n = 0
    if (filters.stops.length) n++
    if (filters.maxPrice > 0) n++
    if (filters.depTimes.length) n++
    if (filters.maxDuration > 0) n++
    if (filters.airlines.length) n++
    if (filters.baggageOnly) n++
    if (filters.wifiOnly) n++
    if (filters.refundableOnly) n++
    return n
  }, [filters])

  // Server already applied filters → use offers directly, just sort client-side
  const sym = CURRENCY_SYMBOLS[data?.currency ?? currency] ?? (data?.currency ?? currency)

  const sortedOffers = useMemo(() => [...allOffers].sort((a, b) => {
    if (sort === 'price')    return a.price - b.price
    if (sort === 'duration') return a.duration - b.duration
    if (sort === 'stops')    return a.stops - b.stops
    return 0
  }), [allOffers, sort])

  if (!hasParams) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-28 h-28 rounded-full bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center mb-6">
          <Plane className="w-14 h-14 text-sky-300 dark:text-sky-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Where are you flying?</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Use the search on the home page to find flights.</p>
        <Link href="/" className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
          <Search className="w-4 h-4" /> Go to search
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header breadcrumb */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/" className="hover:text-sky-600 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Home
              </Link>
              <span>/</span><span>Flights</span>
            </div>
            {tripType === 'multicity' ? (
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                {mcLegs.map((l, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                    <span className="text-sky-600">{l.origin}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-sky-600">{l.destination}</span>
                  </span>
                ))}
              </h1>
            ) : (
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-sky-600">{origin}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-sky-600">{destination}</span>
                {tripType === 'roundtrip' && (
                  <><ArrowLeft className="w-4 h-4 text-slate-300" /><span className="text-sky-600">{origin}</span></>
                )}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                tripType === 'roundtrip' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : tripType === 'multicity' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'}`}>
                {tripType === 'roundtrip' ? '⇄ Round Trip' : tripType === 'multicity' ? '✦ Multi-City' : '→ One Way'}
              </span>
              <span className="text-sm text-slate-400">
                {tripType === 'multicity' ? mcLegs[0]?.date : departDate}
                {tripType === 'roundtrip' && returnDate && ` → ${returnDate}`}
                {' · '}{adults} passenger · {cabin.charAt(0) + cabin.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModify(true)}
            className="text-sm text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1.5 border-2 border-sky-200 dark:border-sky-800 hover:border-sky-500 px-4 py-2 rounded-xl transition-all hover:bg-sky-50 dark:hover:bg-sky-950/30"
          >
            <Search className="w-3.5 h-3.5" /> Modify search
          </button>
        </div>
      </div>

      {/* ── Modify Search inline panel ─────────────────────────────────── */}
      {showModify && (
        <ModifySearchPanel
          initialTripType={(tripType as 'oneway' | 'roundtrip' | 'multicity')}
          initialOrigin={origin}
          initialDestination={destination}
          initialDate={departDate}
          initialReturn={returnDate}
          initialAdults={Number(adults) || 1}
          initialCabin={cabin}
          initialMcLegs={mcLegs}
          onClose={() => setShowModify(false)}
        />
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">Search failed</h3>
          <p className="text-sm text-red-600 dark:text-red-500">{String((error as Error)?.message)}</p>
        </div>
      )}

      {/* ── MULTI-CITY ─────────────────────────────────────────────────────── */}
      {tripType === 'multicity' && (() => {
        // Build combined cards: pair best offer from each leg
        const allLegOffers = mcQueries.map((q) => ((q?.data as any)?.offers ?? []) as FlightOffer[])
        const loading = mcQueries.some(q => q?.isLoading)
        const legCurrency = (mcQueries[0]?.data as any)?.currency ?? currency

        // Build N top-5 offers per leg, then create cross-product top combos (max 8)
        const top5PerLeg = allLegOffers.map(offs => offs.slice(0, 5))
        const hasSomething = top5PerLeg.some(l => l.length > 0)

        // Pivot: for each "combo index" i, pick the i-th offer from each leg (if available)
        const maxCards = Math.min(8, Math.max(...top5PerLeg.map(l => l.length), 0) || 0)
        const combos: FlightOffer[][] = []
        for (let i = 0; i < maxCards; i++) {
          const combo = top5PerLeg.map(legOffers => legOffers[Math.min(i, legOffers.length - 1)]).filter(Boolean)
          if (combo.length === mcLegs.length) combos.push(combo)
        }

        const legLabels = mcLegs.map((l, i) => `Flight ${i + 1}: ${l.origin} → ${l.destination}`)
        const badgeMap: Record<number, string> = { 0: 'Best Value', 1: 'Recommended', 2: 'Fastest' }
        const colorPairs = [
          'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        ]

        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                ✦ Multi-City Combinations
              </span>
              <p className="text-xs text-slate-400">{combos.length} itineraries · click a card to view full details</p>
            </div>

            {loading ? <FlightResultsSkeleton /> : !hasSomething ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <TrendingDown className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No flights found for one or more legs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {combos.map((legs, idx) => (
                  <CombinedTripCard
                    key={idx}
                    legs={legs}
                    labels={legLabels}
                    labelColors={legs.map((_, i) => colorPairs[i % colorPairs.length])}
                    currency={legCurrency}
                    sym={sym}
                    badge={badgeMap[idx]}
                    adults={Number(adults)}
                    travelClass={cabin}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── ROUND TRIP (combined cards) ─────────────────────────────────────── */}
      {tripType === 'roundtrip' && !isError && (() => {
        const outOffers = sortedOffers
        const retOffers: FlightOffer[] = returnData?.offers ?? []
        const retCurrency = returnData?.currency ?? currency

        // Cross-pair: best 5 outbound × best 5 return = up to 8 combined cards
        const maxCards = Math.min(8, Math.max(outOffers.length, 0))
        const badgeMap: Record<number, string> = { 0: 'Best Value', 1: 'Fastest', 2: 'Recommended' }

        const combos: Array<{ out: FlightOffer; ret: FlightOffer }> = []
        for (let i = 0; i < Math.min(maxCards, outOffers.length); i++) {
          const retIdx = Math.min(i, retOffers.length - 1)
          if (outOffers[i] && retOffers[retIdx]) {
            combos.push({ out: outOffers[i], ret: retOffers[retIdx] })
          }
        }

        return (
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              availableAirlines={availableAirlines}
              priceRange={priceRange}
              maxDurationAvail={maxDurationAvail}
              activeCount={activeCount}
              symbol={sym}
            />
            <div className="flex-1 min-w-0 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  ⇄ Round Trip Pairs
                </span>
                {(returnFetching || isFetching) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    Searching return flights…
                  </div>
                )}
                {!returnFetching && !isFetching && (
                  <p className="text-xs text-slate-400">{combos.length} combinations · click a card for details</p>
                )}
              </div>

              {/* Loading skeleton — show while either query is in-flight (isLoading=first load, isFetching=refetch) */}
              {(isFetching || returnFetching) ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    {isFetching ? 'Searching 1000+ airlines…' : 'Searching return flights…'}
                  </div>
                  <FlightResultsSkeleton />
                </>
              ) : (
                <>
                  <SortBar sort={sort} onSort={setSort} count={combos.length} source={data?.source} message={data?.message} />

                  {combos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                      <TrendingDown className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                        {activeCount > 0 ? 'No flights match your filters' : 'No flights found'}
                      </h3>
                      <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                        {activeCount > 0 ? 'Try relaxing some filters.' : (data?.message ?? 'No flights available for this route and date.')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {activeCount > 0 && (
                          <button onClick={() => setFilters(DEFAULT_FILTERS)} className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Clear filters</button>
                        )}
                        <Link href="/" className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                          <Search className="w-4 h-4" /> New search
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {combos.map(({ out, ret }, idx) => (
                        <CombinedTripCard
                          key={idx}
                          legs={[out, ret]}
                          labels={[
                            `Outbound · ${origin} → ${destination}`,
                            `Return · ${destination} → ${origin}`,
                          ]}
                          labelColors={[
                            'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
                            'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                          ]}
                          currency={retCurrency}
                          sym={sym}
                          badge={badgeMap[idx]}
                          adults={Number(adults)}
                          travelClass={cabin}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── ONE WAY ───────────────────────────────────────────────────────────── */}
      {tripType === 'oneway' && !isError && (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            availableAirlines={availableAirlines}
            priceRange={priceRange}
            maxDurationAvail={maxDurationAvail}
            activeCount={activeCount}
            symbol={sym}
          />
          <div className="flex-1 min-w-0 space-y-3">
            {isFetching ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  Searching 1000+ airlines…
                </div>
                <FlightResultsSkeleton />
              </>
            ) : (
              <>
                <SortBar sort={sort} onSort={setSort} count={sortedOffers.length} source={data?.source} message={data?.message} />
                {sortedOffers.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <TrendingDown className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                      {activeCount > 0 ? 'No flights match your filters' : 'No flights found'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                      {activeCount > 0 ? 'Try relaxing some filters.' : (data?.message ?? 'No flights available for this route and date.')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {activeCount > 0 && (
                        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Clear filters</button>
                      )}
                      <Link href="/" className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Search className="w-4 h-4" /> New search
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedOffers.map((offer) => (
                      <FlightCard
                        key={offer.id}
                        offer={offer}
                        currency={data?.currency ?? currency}
                        searchParams={{
                          returnDate: returnDate || undefined,
                          adults: Number(adults),
                          travelClass: cabin,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FlightResultsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080f1a]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Suspense fallback={<FlightResultsSkeleton />}>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}
