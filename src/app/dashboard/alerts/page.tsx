'use client'

import { useEffect, useState } from 'react'
import { Bell, Plane, ArrowRight, Trash2, Plus, Target, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PriceAlert {
  id: string
  origin: string
  destination: string
  targetPrice: number
  currency: string
  cabin: string
  createdAt: string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:'$', INR:'₹', EUR:'€', GBP:'£', AED:'د.إ', SGD:'S$', AUD:'A$', JPY:'¥', CAD:'C$',
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ origin: '', destination: '', targetPrice: '', currency: 'USD', cabin: 'ECONOMY' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('skysearch_alerts')
      if (raw) setAlerts(JSON.parse(raw))
    } catch {}
  }, [])

  const save = (updated: PriceAlert[]) => {
    setAlerts(updated)
    try { localStorage.setItem('skysearch_alerts', JSON.stringify(updated)) } catch {}
  }

  const addAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.origin || !form.destination || !form.targetPrice) return
    const alert: PriceAlert = {
      id: Date.now().toString(),
      origin: form.origin.toUpperCase(),
      destination: form.destination.toUpperCase(),
      targetPrice: Number(form.targetPrice),
      currency: form.currency,
      cabin: form.cabin,
      createdAt: new Date().toISOString(),
    }
    save([...alerts, alert])
    setForm({ origin: '', destination: '', targetPrice: '', currency: 'USD', cabin: 'ECONOMY' })
    setShowForm(false)
    const sym = CURRENCY_SYMBOLS[form.currency] ?? form.currency
    toast.success(`Alert set! Notifying when ${form.origin.toUpperCase()} → ${form.destination.toUpperCase()} drops below ${sym}${form.targetPrice}`, {
      icon: '🔔', duration: 4000,
    })
  }

  const remove = (id: string) => save(alerts.filter(a => a.id !== id))

  return (
    <div className="space-y-5 fade-in">
      {/* Page header banner */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-white" />
              <h1 className="text-xl font-extrabold text-white">Price Alerts</h1>
            </div>
            <p className="text-white/70 text-sm">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''} — get notified when prices drop</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-all border border-white/30"
          >
            <Plus className="w-4 h-4" /> New Alert
          </button>
        </div>
      </div>

      {/* Add alert form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-lg shadow-sky-50 dark:shadow-sky-950/10 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-500" /> Set a Price Target
          </h3>
          <form onSubmit={addAlert} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">From (IATA)</label>
              <input
                placeholder="DEL" maxLength={3}
                value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">To (IATA)</label>
              <input
                placeholder="DXB" maxLength={3}
                value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Price</label>
              <input
                type="number" placeholder="15000" min={1}
                value={form.targetPrice} onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-1">
              <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl transition-colors">
                Create Alert
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
          <Bell className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No alerts yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Set a target price for a route and we'll notify you when prices drop.
            <br />You can also click the 🔔 bell on any flight card.
          </p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Create First Alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const sym = CURRENCY_SYMBOLS[alert.currency] ?? alert.currency
            const params = new URLSearchParams({
              origin: alert.origin, destination: alert.destination,
              departureDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              adults: '1', travelClass: alert.cabin, currency: alert.currency,
            })
            return (
              <div key={alert.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 hover:border-sky-200 dark:hover:border-sky-800 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-extrabold text-slate-900 dark:text-white">{alert.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-extrabold text-slate-900 dark:text-white">{alert.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                    Target: <span className="font-bold text-emerald-600 dark:text-emerald-400">{sym}{alert.targetPrice.toLocaleString()}</span>
                    <span>· {alert.cabin} · {alert.currency}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/flights/results?${params}`}
                    className="text-xs font-bold text-sky-600 hover:text-white bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                    <Plane className="w-3 h-3" /> Search
                  </Link>
                  <button onClick={() => remove(alert.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 italic px-1">
        💡 You can also set alerts directly from flight cards by clicking the 🔔 bell icon on any result.
      </p>
    </div>
  )
}
