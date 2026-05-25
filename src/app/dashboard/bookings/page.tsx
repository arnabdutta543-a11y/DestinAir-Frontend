'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Plane, ArrowRight, ExternalLink, Trash2, Clock } from 'lucide-react'
import Link from 'next/link'

interface Booking {
  id: string
  airline: string
  airlineCode: string
  flightNo: string
  origin: string
  destination: string
  departureAt: string
  arrivalAt: string
  price: number
  currency: string
  cabin: string
  bookingUrl: string
  bookedAt: string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:'$', INR:'₹', EUR:'€', GBP:'£', AED:'د.إ', SGD:'S$', AUD:'A$', JPY:'¥', CAD:'C$',
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  // SerpAPI times are local-time strings ("YYYY-MM-DDTHH:MM"). Parse date part directly.
  if (iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
    const datePart = iso.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('skysearch_bookings')
      if (raw) setBookings(JSON.parse(raw).reverse())
    } catch {}
  }, [])

  const remove = (id: string) => {
    const next = bookings.filter(b => b.id !== id)
    setBookings(next)
    try { localStorage.setItem('skysearch_bookings', JSON.stringify([...next].reverse())) } catch {}
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Page header banner */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-white" />
            <h1 className="text-xl font-extrabold text-white">My Bookings</h1>
          </div>
          <p className="text-white/70 text-sm">{bookings.length} flight{bookings.length !== 1 ? 's' : ''} tracked on this device</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No bookings tracked yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            When you click <strong>"Book"</strong> on a flight result, it'll appear here so you can track your choices.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <Plane className="w-4 h-4" /> Search Flights
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const sym = CURRENCY_SYMBOLS[b.currency] ?? b.currency
            return (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  {/* Airline badge */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl shrink-0">
                    ✈️
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-xl text-slate-900 dark:text-white">{b.origin}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="font-extrabold text-xl text-slate-900 dark:text-white">{b.destination}</span>
                      <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono">{b.flightNo}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <span>{fmtDate(b.departureAt)} · {fmtTime(b.departureAt)} → {fmtTime(b.arrivalAt)}</span>
                      <span>{b.airline}</span>
                      <span>{b.cabin}</span>
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
                      {sym}{Number(b.price).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3 h-3" /> {timeAgo(b.bookedAt)}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <a
                        href={b.bookingUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-white bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-600 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-3 h-3" /> Book Flight
                      </a>
                      <button onClick={() => remove(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-400">
        <strong>Note:</strong> Bookings are tracked locally on this device. Clicking "Book Flight" opens the provider's page (via Google Flights) to complete your purchase.
      </div>
    </div>
  )
}
