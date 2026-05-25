'use client'

import { useState } from 'react'
import { X, Plane, Clock, ArrowRight, Wifi, Briefcase, ChevronRight, Tag, Zap, Star, Info } from 'lucide-react'
import type { FlightOffer } from '@/lib/mock-flights'
import { BookingRedirectModal } from '@/components/flights/BookingRedirectModal'

/* ─── helpers ─────────────────────────────────────────────────────────────── */
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

/** Build a Google Flights URL pre-filled from offer data */
function googleFlightsUrl(offer: FlightOffer, currency = 'USD'): string {
  const dep = offer.departureAt ? offer.departureAt.split('T')[0] : ''
  const cabin = (offer.cabin || 'ECONOMY').replace('_', ' ').toLowerCase()
  const cabinLabel = cabin.charAt(0).toUpperCase() + cabin.slice(1)
  const q = `Flights from ${offer.origin} to ${offer.destination}${dep ? ` on ${dep}` : ''} in ${cabinLabel}`
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=${currency}`
}

/** Resolve a booking URL — prefer backend deep-link, fall back to Google Flights */
function resolveBookingUrl(offer: FlightOffer, currency = 'USD'): string {
  if (offer.bookingUrl) {
    return offer.bookingUrl
  }
  return googleFlightsUrl(offer, currency)
}

function fmtTime(iso: string) {
  if (!iso) return '—'
  try {
    // SerpAPI times are local-time strings ("YYYY-MM-DDTHH:MM"). Extract HH:MM directly.
    if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      const [, timePart] = iso.split('T')
      const [hh, mm] = timePart.split(':')
      return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
    }
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '—' }
}

function fmtDate(iso: string) {
  if (!iso) return ''
  try {
    // SerpAPI times are local-time strings ("YYYY-MM-DDTHH:MM"). Parse date part directly.
    if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      const datePart = iso.split('T')[0]
      const [year, month, day] = datePart.split('-').map(Number)
      const d = new Date(year, month - 1, day)
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    }
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

function fmtDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

/* ─── Single leg row (inside the combined card) ────────────────────────────── */
function LegRow({ offer }: { offer: FlightOffer; label?: string; labelColor?: string }) {
  const logo = AIRLINE_LOGOS[offer.airlineCode] ?? '✈️'
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {/* Airline logo + flight number */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-16">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-50 to-slate-100 dark:from-sky-900/30 dark:to-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(offer as any).airlineIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(offer as any).airlineIcon} alt={offer.airline} className="w-7 h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <span className="text-lg">{logo}</span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-mono text-center leading-tight">{offer.flightNo}</p>
      </div>

      {/* Times + route */}
      <div className="flex-1 flex items-center gap-2">
        {/* Depart */}
        <div className="text-center shrink-0">
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
            {fmtTime(offer.departureAt)}
          </p>
          <p className="text-xs font-bold text-sky-600 mt-0.5">{offer.origin}</p>
          <p className="text-[10px] text-slate-400">{fmtDate(offer.departureAt)}</p>
        </div>

        {/* Middle bar */}
        <div className="flex-1 flex flex-col items-center gap-1 px-1">
          <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {fmtDuration(offer.duration)}
          </p>
          <div className="relative w-full flex items-center">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-200 via-sky-400 to-slate-200 dark:from-slate-700 dark:via-sky-500 dark:to-slate-700 rounded-full" />
            <Plane className="absolute left-1/2 -translate-x-1/2 w-3 h-3 text-sky-500 bg-white dark:bg-slate-900 rounded-full" />
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            offer.stops === 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}${offer.layovers?.length ? ` · ${offer.layovers[0]}` : ''}`}
          </span>
        </div>

        {/* Arrive */}
        <div className="text-center shrink-0">
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
            {fmtTime(offer.arrivalAt)}
          </p>
          <p className="text-xs font-bold text-sky-600 mt-0.5">{offer.destination}</p>
          <p className="text-[10px] text-slate-400">{fmtDate(offer.arrivalAt)}</p>
        </div>
      </div>

      {/* Amenities */}
      <div className="hidden sm:flex flex-col gap-1 shrink-0 w-16">
        {offer.wifi && <span className="flex items-center gap-1 text-[10px] text-slate-400"><Wifi className="w-2.5 h-2.5" /> Wi-Fi</span>}
        {offer.baggage && <span className="flex items-center gap-1 text-[10px] text-slate-400"><Briefcase className="w-2.5 h-2.5" /> Bag</span>}
        {offer.refundable && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">↩ Refund</span>}
      </div>
    </div>
  )
}

/* ─── Full itinerary popup (triggered by plane icon) ────────────────────── */
function PlanePopup({ offer, sym, onClose }: { offer: FlightOffer; sym: string; onClose: () => void }) {
  const segments = offer.segments && offer.segments.length > 0
    ? offer.segments
    : [{
        origin: offer.origin,
        destination: offer.destination,
        departureAt: offer.departureAt,
        arrivalAt: offer.arrivalAt,
        duration: offer.duration,
        airline: offer.airline,
        airlineCode: offer.airlineCode,
        airlineIcon: (offer as any).airlineIcon,
        flightNo: offer.flightNo,
        cabin: offer.cabin,
        layoverMins: null,
      }]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-5 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {offer.origin} → {offer.destination}
            </h2>
            <p className="text-sky-100 text-xs mt-1">
              {fmtDate(offer.departureAt)} · {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`} · {fmtDuration(offer.duration)}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0 mt-0.5">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Segments */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {segments.map((seg, idx) => {
            const logo = AIRLINE_LOGOS[seg.airlineCode] ?? '✈️'
            return (
              <div key={idx}>
                {/* Segment card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                  {/* Airline row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        {seg.airlineIcon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={seg.airlineIcon} alt={seg.airline} className="w-7 h-7 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : <span className="text-xl">{logo}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{seg.airline}</p>
                        <p className="text-xs text-slate-400 font-mono">{seg.flightNo} · {seg.cabin}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 rounded-lg">
                      {fmtDuration(seg.duration)}
                    </span>
                  </div>

                  {/* Route with dots + line */}
                  <div className="flex items-center gap-3">
                    {/* Depart */}
                    <div className="shrink-0 text-center min-w-[52px]">
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{fmtTime(seg.departureAt)}</p>
                      <p className="text-sm font-bold text-sky-600 mt-0.5">{seg.origin}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{fmtDate(seg.departureAt)}</p>
                    </div>

                    {/* Line + plane icon */}
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="relative w-full flex items-center">
                        <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-sky-400 to-indigo-400" />
                        <Plane className="w-4 h-4 text-sky-500 mx-1 shrink-0" />
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-indigo-400 to-sky-400" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{fmtDuration(seg.duration)}</p>
                    </div>

                    {/* Arrive */}
                    <div className="shrink-0 text-center min-w-[52px]">
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{fmtTime(seg.arrivalAt)}</p>
                      <p className="text-sm font-bold text-indigo-600 mt-0.5">{seg.destination}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{fmtDate(seg.arrivalAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Layover banner */}
                {seg.layoverMins != null && idx < segments.length - 1 && (
                  <div className="flex items-center gap-3 my-3 px-2">
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {fmtDuration(seg.layoverMins)} layover in {seg.destination}
                    </span>
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer — price + Close only */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Total price per person</p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 leading-none">{sym}{offer.price.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">incl. taxes &amp; fees</p>
          </div>
          <button onClick={onClose}
            className="h-11 px-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail dialog ────────────────────────────────────────────────────────── */
function TripDetailDialog({
  legs, labels, currency, sym, totalPrice,
  onClose, onBook,
}: {
  legs: FlightOffer[]
  labels: string[]
  currency: string
  sym: string
  totalPrice: number
  onClose: () => void
  onBook: () => void
}) {
  const [planePopup, setPlanePopup] = useState<string | null>(null)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Plane icon mini popup */}
      {planePopup && (
        <PlanePopup
          sym={sym}
          offer={legs.find(l => l.id === planePopup)!}
          onClose={() => setPlanePopup(null)}
        />
      )}

      {/* Panel */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Trip Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">{legs.length} flight{legs.length > 1 ? 's' : ''} · {currency}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Leg sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {legs.map((offer, i) => {
            const logo = AIRLINE_LOGOS[offer.airlineCode] ?? '✈️'
            const isLast = i === legs.length - 1
            return (
              <div key={offer.id}>
                {/* Leg label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{labels[i]}</p>
                </div>

                {/* Leg card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                  {/* Airline header */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {(offer as any).airlineIcon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(offer as any).airlineIcon} alt={offer.airline} className="w-8 h-8 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : <span className="text-2xl">{logo}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{offer.airline}</p>
                      <p className="text-xs text-slate-400 font-mono">{offer.flightNo} · {offer.cabin}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      {offer.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Route timeline */}
                  <div className="flex items-center gap-4">
                    <div className="text-center shrink-0">
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{fmtTime(offer.departureAt)}</p>
                      <p className="text-sm font-bold text-sky-600">{offer.origin}</p>
                      <p className="text-xs text-slate-400">{fmtDate(offer.departureAt)}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(offer.duration)}</p>
                      <div className="relative w-full flex items-center">
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-200 via-sky-400 to-slate-200 dark:from-slate-700 dark:via-sky-500 dark:to-slate-700 rounded-full" />
                        <button
                          onClick={e => { e.stopPropagation(); setPlanePopup(offer.id) }}
                          title="View segment price"
                          className="absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-400 flex items-center justify-center hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:scale-125 transition-all shadow-sm cursor-pointer z-10"
                        >
                          <Plane className="w-3.5 h-3.5 text-sky-500" />
                        </button>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        offer.stops === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {offer.stops === 0 ? '✓ Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}${offer.layovers?.length ? ` via ${offer.layovers.join(', ')}` : ''}`}
                      </span>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{fmtTime(offer.arrivalAt)}</p>
                      <p className="text-sm font-bold text-sky-600">{offer.destination}</p>
                      <p className="text-xs text-slate-400">{fmtDate(offer.arrivalAt)}</p>
                    </div>
                  </div>

                  {/* Amenities row */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {offer.wifi && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Wifi className="w-3.5 h-3.5 text-sky-500" /> Wi-Fi included</span>}
                    {offer.baggage && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Briefcase className="w-3.5 h-3.5 text-sky-500" /> Checked bag</span>}
                    {offer.refundable && <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">↩ Refundable</span>}
                    {offer.seatsLeft != null && offer.seatsLeft > 0 && offer.seatsLeft <= 5 && (
                      <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold">⚡ {offer.seatsLeft} seats left</span>
                    )}
                  </div>
                </div>

                {/* Divider between legs */}
                {!isLast && (
                  <div className="flex items-center gap-3 my-1 px-2">
                    <div className="flex-1 h-px border-t border-dashed border-slate-200 dark:border-slate-700" />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Next leg</span>
                    <div className="flex-1 h-px border-t border-dashed border-slate-200 dark:border-slate-700" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 rounded-b-3xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">Total for all flights</p>
              <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 leading-none">{sym}{totalPrice.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">per person · incl. taxes</p>
            </div>
            <button onClick={onBook}
              className="h-12 px-8 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20">
              Book All Flights <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── CombinedTripCard ─────────────────────────────────────────────────────── */
export interface CombinedTripCardProps {
  legs: FlightOffer[]         // [outbound, return] or [leg1, leg2, leg3…]
  labels: string[]            // ['Outbound', 'Return'] or ['Flight 1', 'Flight 2'…]
  labelColors: string[]       // tailwind class strings for each badge
  currency: string
  sym: string
  badge?: string              // 'Best Value' | 'Fastest' | undefined
  adults?: number
  travelClass?: string
}

export function CombinedTripCard({ legs, labels, labelColors, currency, sym, badge, adults = 1, travelClass = 'ECONOMY' }: CombinedTripCardProps) {
  const [open, setOpen] = useState(false)
  const [bookingLegIdx, setBookingLegIdx] = useState<number | null>(null)
  const totalPrice = legs.reduce((sum, l) => sum + l.price, 0)

  const handleBookLeg = (idx: number) => {
    setOpen(false)
    setBookingLegIdx(idx)
  }

  const currentBookingLeg = bookingLegIdx !== null ? legs[bookingLegIdx] : null

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800
          hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xl hover:shadow-sky-100/30 dark:hover:shadow-sky-950/30
          transition-all duration-300 overflow-hidden cursor-pointer"
      >
        {/* Badge row — always rendered to keep card heights equal */}
        <div className="px-5 pt-3 pb-0 flex gap-2 min-h-[28px] items-center">
          {badge && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 ${
              badge === 'Best Value' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : badge === 'Fastest'  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
            }`}>
              {badge === 'Best Value' && <Tag className="w-2.5 h-2.5" />}
              {badge === 'Fastest'    && <Zap className="w-2.5 h-2.5" />}
              {badge === 'Recommended' && <Star className="w-2.5 h-2.5" />}
              {badge}
            </span>
          )}
        </div>

        <div className="p-5 flex flex-col lg:flex-row gap-5 lg:items-center">
          {/* Legs column */}
          <div className="flex-1 min-w-0 space-y-0">
            {legs.map((offer, i) => (
              <div key={offer.id}>
                <LegRow offer={offer} />
                {i < legs.length - 1 && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="lg:shrink-0 lg:w-44 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="lg:text-right">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {legs.length > 1 ? 'Total price' : 'per person'}
              </p>
              <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 leading-none">
                {sym}{totalPrice.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">incl. taxes</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(true) }}
              className="flex items-center gap-1.5 h-10 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm group-hover:shadow-md group-hover:shadow-sky-500/20"
            >
              View Details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      {open && (
        <TripDetailDialog
          legs={legs}
          labels={labels}
          currency={currency}
          sym={sym}
          totalPrice={totalPrice}
          onClose={() => setOpen(false)}
          onBook={() => handleBookLeg(0)}
        />
      )}

      {/* BookingRedirectModal — cycles through each leg */}
      {currentBookingLeg && (
        <BookingRedirectModal
          key={`booking-leg-${bookingLegIdx}`}
          offer={currentBookingLeg}
          currency={currency}
          bookingUrl={(currentBookingLeg as any).bookingUrl ||
            `https://www.google.com/travel/flights?q=flights+from+${currentBookingLeg.origin}+to+${currentBookingLeg.destination}`
          }
          searchParams={{ adults, travelClass }}
          onClose={() => {
            const next = (bookingLegIdx ?? 0) + 1
            if (next < legs.length) {
              // Move to next leg automatically
              setBookingLegIdx(next)
            } else {
              setBookingLegIdx(null)
            }
          }}
          legInfo={{
            current: (bookingLegIdx ?? 0) + 1,
            total: legs.length,
            label: labels[bookingLegIdx ?? 0] ?? `Flight ${(bookingLegIdx ?? 0) + 1}`,
            hasNext: (bookingLegIdx ?? 0) + 1 < legs.length,
            nextLabel: labels[(bookingLegIdx ?? 0) + 1] ?? `Flight ${(bookingLegIdx ?? 0) + 2}`,
            onSkipToNext: () => {
              const next = (bookingLegIdx ?? 0) + 1
              if (next < legs.length) setBookingLegIdx(next)
              else setBookingLegIdx(null)
            },
          }}
        />
      )}
    </>
  )
}
