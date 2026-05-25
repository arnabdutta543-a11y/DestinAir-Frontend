'use client'

import { useEffect, useState } from 'react'
import { Plane, Search, ArrowRight, Trash2, Clock, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface SearchEntry {
  id: string
  origin: string
  originCity?: string
  destination: string
  destinationCity?: string
  departureDate: string
  adults: number
  cabin: string
  currency: string
  searchedAt: string
}

function fmtCabin(c: string) {
  return c.charAt(0) + c.slice(1).toLowerCase().replace('_', ' ')
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RecentSearchesPage() {
  const [history, setHistory] = useState<SearchEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('skysearch_history')
      if (raw) setHistory(JSON.parse(raw).reverse())
    } catch {}
  }, [])

  const remove = (id: string) => {
    const next = history.filter(h => h.id !== id)
    setHistory(next)
    try { localStorage.setItem('skysearch_history', JSON.stringify([...next].reverse())) } catch {}
  }

  const clearAll = () => {
    setHistory([])
    try { localStorage.removeItem('skysearch_history') } catch {}
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Page header banner */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #8b5cf6 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-white" />
              <h1 className="text-xl font-extrabold text-white">Recent Searches</h1>
            </div>
            <p className="text-white/70 text-sm">Your last {history.length} flight search{history.length !== 1 ? 'es' : ''}</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-2 bg-white/20 hover:bg-red-500/80 backdrop-blur-sm text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-all border border-white/30">
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
          <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No searches yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your flight searches will appear here for easy access.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <Search className="w-4 h-4" /> Search Flights
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => {
            const params = new URLSearchParams({
              origin: entry.origin, destination: entry.destination,
              departureDate: entry.departureDate, adults: String(entry.adults),
              travelClass: entry.cabin, currency: entry.currency,
            })
            return (
              <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all group">
                {/* Airline icon placeholder */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-sky-500" />
                </div>

                {/* Route info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-lg text-slate-900 dark:text-white">{entry.origin}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="font-extrabold text-lg text-slate-900 dark:text-white">{entry.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{entry.departureDate}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{entry.adults} pax</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{fmtCabin(entry.cabin)}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-mono text-slate-400">{entry.currency}</span>
                  </div>
                </div>

                {/* Time ago */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 shrink-0">
                  <Clock className="w-3 h-3" /> {timeAgo(entry.searchedAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/flights/results?${params}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-white bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-600 dark:hover:bg-sky-600 px-3 py-2 rounded-xl transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-search
                  </Link>
                  <button onClick={() => remove(entry.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
