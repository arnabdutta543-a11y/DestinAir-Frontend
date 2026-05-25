'use client'

import { useEffect } from 'react'
import { X, Plane, Clock, ArrowRight } from 'lucide-react'
import type { FlightOffer, SegmentDetail } from '@/lib/mock-flights'

function fmtDuration(mins: number) {
  if (!mins) return '—'
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function fmtTime(iso: string) {
  if (!iso) return '—'
  // SerpAPI times are local-time strings ("YYYY-MM-DDTHH:MM"). Extract HH:MM directly.
  if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
    const [, timePart] = iso.split('T')
    const [hh, mm] = timePart.split(':')
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
  }
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDateTime(iso: string) {
  if (!iso) return '—'
  // SerpAPI times are local-time strings ("YYYY-MM-DDTHH:MM"). Parse date part directly.
  if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
    const datePart = iso.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const AIRLINE_EMOJI: Record<string, string> = {
  EK:'🇦🇪',SQ:'🇸🇬',BA:'🇬🇧',AI:'🇮🇳','6E':'🫐',QR:'🇶🇦',
  LH:'🇩🇪',AF:'🇫🇷',TK:'🇹🇷',AK:'🇲🇾',AA:'🇺🇸',UA:'🇺🇸',
  NH:'🇯🇵',CX:'🇭🇰',MS:'🇪🇬',
}

interface Props {
  offer: FlightOffer
  currency: string
  symbol: string
  onClose: () => void
}

export function ItineraryModal({ offer, currency, symbol, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Build segments — fall back to a single-segment dummy from the offer itself
  const segments: SegmentDetail[] = offer.segments?.length
    ? offer.segments
    : [{
        origin: offer.origin,
        destination: offer.destination,
        departureAt: offer.departureAt,
        arrivalAt: offer.arrivalAt,
        duration: offer.duration,
        airline: offer.airline,
        airlineCode: offer.airlineCode,
        airlineIcon: offer.airlineIcon,
        flightNo: offer.flightNo,
        cabin: offer.cabin,
        layoverMins: null,
      }]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — sticky at top, never scrolls */}
        <div className="shrink-0 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-t-3xl px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-1">
              <span className="font-bold text-lg">{offer.origin}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-bold text-lg">{offer.destination}</span>
            </div>
            <p className="text-white/70 text-xs">
              {fmtDateTime(offer.departureAt)} · {offer.stops === 0 ? 'Non-stop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`} · {fmtDuration(offer.duration)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Segments — only this section scrolls */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {segments.map((seg, idx) => (
            <div key={idx}>
              {/* Segment card */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5">
                {/* Airline row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                    {seg.airlineIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={seg.airlineIcon} alt={seg.airline} className="w-8 h-8 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <span className="text-xl">{AIRLINE_EMOJI[seg.airlineCode] ?? '✈️'}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{seg.airline}</p>
                    <p className="text-xs text-slate-400 font-mono">{seg.flightNo} · {seg.cabin}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-semibold px-2 py-1 rounded-lg">
                      {fmtDuration(seg.duration)}
                    </span>
                  </div>
                </div>

                {/* Route timeline */}
                <div className="flex items-stretch gap-4">
                  {/* Departure */}
                  <div className="text-center shrink-0 w-16">
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{fmtTime(seg.departureAt)}</p>
                    <p className="text-sm font-bold text-sky-600">{seg.origin}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtDateTime(seg.departureAt)}</p>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-1 py-1">
                    <div className="w-full relative flex items-center">
                      <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 mx-1" />
                      <Plane className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 mx-1" />
                      <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{fmtDuration(seg.duration)}</span>
                  </div>

                  {/* Arrival */}
                  <div className="text-center shrink-0 w-16">
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{fmtTime(seg.arrivalAt)}</p>
                    <p className="text-sm font-bold text-sky-600">{seg.destination}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtDateTime(seg.arrivalAt)}</p>
                  </div>
                </div>
              </div>

              {/* Layover bar between segments */}
              {idx < segments.length - 1 && (
                <div className="flex items-center gap-3 my-3 px-4">
                  <div className="flex-1 h-px border-t-2 border-dashed border-amber-300 dark:border-amber-700" />
                  <div className="shrink-0 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-4 py-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {seg.layoverMins != null
                        ? `${fmtDuration(seg.layoverMins)} layover in ${seg.destination}`
                        : `Layover in ${seg.destination}`}
                    </span>
                  </div>
                  <div className="flex-1 h-px border-t-2 border-dashed border-amber-300 dark:border-amber-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer — anchored at bottom, never scrolls */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Total price per person</p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
              {symbol}{Number(offer.price).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">incl. taxes &amp; fees</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors"
            >
              Close
            </button>
            {offer.bookingUrl && (
              <a
                href={offer.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sky-200 dark:shadow-sky-900/30"
              >
                View on Google Flights <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>

  )
}
