'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Plane, Clock, ExternalLink, AlertCircle,
  Loader2, CheckCircle2, Globe, ChevronRight, Star, Shield, Tag
} from 'lucide-react'
import type { FlightOffer } from '@/lib/mock-flights'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  AED: 'د.إ', SGD: 'S$', AUD: 'A$', JPY: '¥', CAD: 'C$',
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function fmtTime(iso: string) {
  if (!iso) return '—'
  try {
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
    if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      const datePart = iso.split('T')[0]
      const [year, month, day] = datePart.split('-').map(Number)
      const d = new Date(year, month - 1, day)
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

function fmtDuration(mins: number) {
  if (!mins) return ''
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function isoToDate(iso: string): string {
  return iso?.slice(0, 10) ?? ''
}

/** Returns true if the URL is a pre-resolved OTA booking page (not a proxy path) */
function isDirectBookingUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://')
}

/** Escape HTML special chars for safe injection into document.write() */
function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}


/** Returns true if the booking link points to a pre-filtered or exact booking page */
function isExactBookingPage(url: string): boolean {
  if (!isDirectBookingUrl(url)) return false
  // Exact booking page patterns
  const exactPatterns = [
    'reviewDetails',      // MakeMyTrip exact booking
    'booking/confirm',
    'book/flights',
    '/checkout',
    '/booking/',
    'tfs=',               // Google Flights exact flight
    'flightTokens=',
    'bookFlights',
    '/flights/book',
  ]
  // Pre-filtered search patterns (not exact, but flight-specific)
  const filteredPatterns = [
    'itinerary=',         // MakeMyTrip search filtered to this route+date
    'itineraryId=',
    'trips=',
    'flightId=',
  ]
  if (exactPatterns.some(p => url.includes(p))) return true
  if (filteredPatterns.some(p => url.includes(p))) return true
  return false
}

/** Returns true if the URL is a pure generic search (no flight-specific params) */
function isGenericSearch(url: string): boolean {
  if (!isDirectBookingUrl(url)) return false
  if (isExactBookingPage(url)) return false
  return true
}

interface BookingOption {
  agent: string
  price: number
  bookingUrl: string
  directUrl?: string
  redirectUrl?: string
  postData?: string
  logo?: string
  isAirline?: boolean
  isExact?: boolean   // true for Google Flights tfs= link (opens exact flight)
  note?: string
}

interface BookingRedirectModalProps {
  offer: FlightOffer
  currency: string
  bookingUrl: string
  onClose: () => void
  searchParams?: {
    returnDate?: string
    adults?: number
    travelClass?: string
  }
  legInfo?: {
    current: number
    total: number
    label: string
    hasNext: boolean
    nextLabel: string
    onSkipToNext: () => void
  }
}

export function BookingRedirectModal({
  offer,
  currency,
  bookingUrl,
  onClose,
  searchParams,
  legInfo,
}: BookingRedirectModalProps) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency

  const [options, setOptions]           = useState<BookingOption[]>([])
  const [fetchState, setFetchState]     = useState<'loading' | 'ready' | 'error'>('loading')
  const [openedIdx, setOpenedIdx]       = useState<number | null>(null)
  const [resolvingIdx, setResolvingIdx] = useState<number | null>(null)
  const [mounted, setMounted]           = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // ── Fetch booking options ────────────────────────────────────────────────────
  const fetchOptions = useCallback(async () => {
    setFetchState('loading')
    const bookingToken = (offer as any).bookingToken as string | undefined
    const airlineCode  = (offer as any).airlineCode  as string | undefined

    console.log('[BookingModal] offer:', offer.id, offer.origin, '→', offer.destination)
    console.log('[BookingModal] bookingToken:', bookingToken ?? '(none)')
    console.log('[BookingModal] airlineCode:', airlineCode)

    try {
      const departureDate = isoToDate(offer.departureAt)
      const params = new URLSearchParams({
        currency,
        origin:         offer.origin,
        destination:    offer.destination,
        departure_date: departureDate,
        adults:         String(searchParams?.adults ?? 1),
        travel_class:   searchParams?.travelClass ?? 'ECONOMY',
        ...(bookingToken             ? { booking_token: bookingToken }                   : {}),
        ...(airlineCode              ? { airline_code: airlineCode }                     : {}),
        ...(offer.price              ? { flight_price: String(Math.round(offer.price)) } : {}),
        ...(searchParams?.returnDate ? { return_date: searchParams.returnDate }          : {}),
      })

      console.log('[BookingModal] Fetching:', `${API_BASE}/api/v1/flights/booking-options?${params}`)
      const res  = await fetch(`${API_BASE}/api/v1/flights/booking-options?${params}`)
      const data = await res.json()
      console.log('[BookingModal] booking-options response:', data)

      if (res.ok) {
        const opts: BookingOption[] = (data.bookingOptions ?? []).map((o: any) => ({
          agent:       o.agent      || 'Unknown Provider',
          price:       o.price      || 0,
          bookingUrl:  o.bookingUrl || bookingUrl,
          directUrl:   o.directUrl  || '',
          redirectUrl: o.redirectUrl || '',
          postData:    o.postData   || '',
          logo:        o.logo       || '',
          isAirline:   o.isAirline  || false,
          isExact:     o.isExact    || false,
          note:        o.note       || undefined,
        }))

        if (opts.length > 0) {
          setOptions(opts)
          setFetchState('ready')
          return
        }
      }

      // Absolute last resort
      console.warn('[BookingModal] No providers returned — using Google Flights fallback')
      setOptions([{
        agent:      'Google Flights',
        price:      offer.price,
        bookingUrl: bookingUrl || `https://www.google.com/travel/flights?q=${offer.origin}+to+${offer.destination}`,
        logo:       '',
      }])
      setFetchState('ready')

    } catch (err) {
      console.error('[BookingModal] Failed to fetch booking options:', err)
      setOptions([{
        agent:      'Google Flights',
        price:      offer.price,
        bookingUrl: bookingUrl || `https://www.google.com/travel/flights?q=${offer.origin}+to+${offer.destination}`,
        logo:       '',
      }])
      setFetchState('error')
    }
  }, [offer, bookingUrl, currency, searchParams])

  useEffect(() => { fetchOptions() }, [fetchOptions])

  // ── Handle booking click ─────────────────────────────────────────────────
  const handleBook = (opt: BookingOption, idx: number) => {
    setOpenedIdx(idx)

    // Priority 1: directUrl — pre-resolved OTA deep-link (GET-navigable, most reliable)
    // The backend always sets this to a pre-filtered OTA search results page.
    const target = opt.directUrl || opt.bookingUrl
    if (target && isDirectBookingUrl(target)) {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }

    // Priority 2: API proxy path — prepend backend base URL
    if (opt.bookingUrl?.startsWith('/api/v1/')) {
      window.open(`${API_BASE}${opt.bookingUrl}`, '_blank', 'noopener,noreferrer')
      return
    }

    // Final fallback: Google Flights
    window.open(
      `https://www.google.com/travel/flights?q=flights+from+${offer.origin}+to+${offer.destination}`,
      '_blank', 'noopener,noreferrer'
    )
  }


  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-lg bg-white dark:bg-[#0f1923] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '95vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-[#05203c] dark:bg-[#05203c] px-5 py-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-[#00a5e0] hover:text-white text-sm font-medium transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to results
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Multi-leg progress indicator */}
          {legInfo && legInfo.total > 1 && (
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: legInfo.total }).map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                  i < legInfo.current ? 'bg-[#00a5e0]' : 'bg-white/15'
                }`} />
              ))}
              <span className="text-[10px] text-white/60 shrink-0">
                {legInfo.label} ({legInfo.current}/{legInfo.total})
              </span>
            </div>
          )}

          {/* Flight summary */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5">
            {/* Airline logo placeholder */}
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5 text-[#00a5e0]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm">
                  {offer.origin} → {offer.destination}
                </p>
                <span className="text-white/40 text-xs">·</span>
                <p className="text-white/60 text-xs">{offer.flightNo}</p>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-white/50 text-xs">
                <span>{fmtTime(offer.departureAt)}</span>
                <span>–</span>
                <span>{fmtTime(offer.arrivalAt)}</span>
                {offer.duration > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {fmtDuration(offer.duration)}
                    </span>
                  </>
                )}
                <span>·</span>
                <span className={offer.stops === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {offer.stops === 0 ? 'Non-stop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
                </span>
              </div>
              <p className="text-white/40 text-[10px] mt-0.5">
                {offer.airline} · {fmtDate(offer.departureAt)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Optional filter bar (visual, like Skyscanner) ── */}
        <div className="bg-[#0a1929] dark:bg-[#0a1929] px-5 py-1.5 flex items-center gap-2 shrink-0 border-b border-white/5">
          {['Cabin bag', 'Checked bag'].map(label => (
            <button
              key={label}
              className="px-3 py-1 rounded-full border border-white/20 text-white/60 text-xs font-medium hover:border-[#00a5e0] hover:text-[#00a5e0] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Provider list ── */}
        <div className="flex-1 overflow-y-auto bg-[#f2f4f7] dark:bg-[#111c27]">
          {/* Loading */}
          {fetchState === 'loading' && (
            <div className="py-14 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#00a5e0] animate-spin" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Finding booking options…
              </p>
              <p className="text-xs text-slate-400">Checking MakeMyTrip, Skyscanner & more</p>
            </div>
          )}

          {/* Error notice */}
          {fetchState === 'error' && (
            <div className="mx-4 mt-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Could not load all providers — showing available options.
              </p>
            </div>
          )}

          {/* Provider cards — Skyscanner style */}
          {(fetchState === 'ready' || fetchState === 'error') && options.length > 0 && (
            <div className="p-3 space-y-2">
              {options.map((opt, idx) => {
                const isOpened    = openedIdx === idx
                const isResolving = resolvingIdx === idx
                const displayPrice = opt.price > 0 ? opt.price : offer.price
                const isGF        = opt.agent === 'Google Flights'
                const isExact     = opt.isExact || isGF

                // Badge — honest, clear labels
                let badge: { label: string; color: string } | null = null
                if (isGF)
                  badge = { label: 'External Search', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
                else if (opt.isAirline)
                  badge = { label: 'Direct Booking', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
                else
                  badge = { label: 'OTA Partner', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' }

                // Sub-text — honest about what will happen
                const subText = isGF
                  ? `View search results for ${offer.origin} → ${offer.destination} on Google Flights`
                  : opt.isAirline
                    ? `Continue to ${opt.agent} to book this flight directly`
                    : `Continue to ${opt.agent} to view their current price`

                return (
                  <div
                    key={idx}
                    className={`bg-white dark:bg-[#0f1f2e] rounded-xl shadow-sm border transition-all cursor-pointer ${
                      isExact
                        ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800/50'
                        : isOpened
                          ? 'border-emerald-400 dark:border-emerald-600'
                          : 'border-slate-200 dark:border-white/10 hover:border-[#00a5e0] dark:hover:border-[#00a5e0]/60 hover:shadow-md'
                    }`}
                    onClick={() => !isResolving && handleBook(opt, idx)}
                  >
                    <div className="px-3 py-2.5">
                      {/* Single row: logo + name + badge + price + button */}
                      <div className="flex items-center gap-2.5">
                        {/* Logo */}
                        <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {opt.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={opt.logo}
                              alt={opt.agent}
                              className="w-6 h-6 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          ) : (
                            <Globe className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Name + badge + sub-text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-none">
                              {opt.agent}
                            </p>
                            {badge && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {subText}
                          </p>
                        </div>

                        {/* Price + Select button */}
                        <div className="flex items-center gap-2 shrink-0">
                          {displayPrice > 0 && (
                            <div className="text-right">
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
                                {sym}{Number(displayPrice).toLocaleString()}
                              </p>
                              <p className="text-[9px] text-slate-400">per person</p>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); !isResolving && handleBook(opt, idx) }}
                            disabled={isResolving}
                            className={`h-8 px-4 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                              isOpened
                                ? 'bg-emerald-500 text-white'
                                : isResolving
                                  ? 'bg-[#00a5e0]/60 text-white cursor-wait'
                                  : 'bg-[#05203c] hover:bg-[#00a5e0] text-white dark:bg-[#00a5e0] dark:hover:bg-[#0090c0]'
                            }`}
                          >
                            {isResolving ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Loading…</>
                            ) : isOpened ? (
                              <><CheckCircle2 className="w-3 h-3" /> Opened</>
                            ) : (
                              <>Search <ChevronRight className="w-3 h-3" /></>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Airline perks row — only for airline direct */}
                      {opt.isAirline && (
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-emerald-500" />
                            Book directly with airline
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-sky-500" />
                            Best price guarantee
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 pb-1">
                Opens provider's website pre-filtered to this route · Final booking on their site
              </p>
            </div>
          )}

          {/* Empty */}
          {(fetchState === 'ready' || fetchState === 'error') && options.length === 0 && (
            <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No booking options found</p>
              <a
                href={`https://www.google.com/travel/flights?q=flights+from+${offer.origin}+to+${offer.destination}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 px-4 py-2 bg-[#05203c] hover:bg-[#00a5e0] text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Search on Google Flights
              </a>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1923] shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-xl border-2 border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/travel/flights?q=flights+from+${offer.origin}+to+${offer.destination}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00a5e0] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Google Flights
              </a>
              {legInfo?.hasNext && (
                <button
                  onClick={legInfo.onSkipToNext}
                  className="h-10 px-4 rounded-xl bg-[#00a5e0] hover:bg-[#0090c0] text-white font-bold text-sm flex items-center gap-1.5 transition-colors"
                >
                  Book {legInfo.nextLabel} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
