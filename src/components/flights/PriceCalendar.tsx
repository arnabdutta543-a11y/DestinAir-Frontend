'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Info, Loader2, TrendingDown } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayPrice {
  price: number | null
  level: string
  currency: string
  tier: 'low' | 'mid' | 'high' | 'none'
}
interface PriceMap { [date: string]: DayPrice }

interface PriceCalendarProps {
  origin: string
  destination: string
  currency?: string
  adults?: number
  travelClass?: number
  selectedDate?: string        // YYYY-MM-DD
  returnDate?: string
  onSelectDate: (date: string) => void
  onSelectReturn?: (date: string) => void
  mode?: 'single' | 'range'   // range = departure + return
  onClose?: () => void
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayDate() {
  const d = new Date(); d.setHours(0,0,0,0); return d
}
function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function firstDayOfWeek(year: number, month: number) {
  // 0=Mon ... 6=Sun
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}
function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, maximumFractionDigits: 0, notation: 'compact'
    }).format(price)
  } catch {
    return `${price}`
  }
}

// ── Tier → colour ─────────────────────────────────────────────────────────────
const TIER_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  low:  { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-300', label: 'Cheap' },
  mid:  { bg: 'bg-amber-500',   text: 'text-white', ring: 'ring-amber-300',   label: 'Average' },
  high: { bg: 'bg-rose-500',    text: 'text-white', ring: 'ring-rose-300',    label: 'Expensive' },
  none: { bg: 'bg-transparent', text: 'text-slate-400', ring: '', label: '' },
}

// ── Single Month Grid ─────────────────────────────────────────────────────────
function MonthGrid({
  year, month, prices, loading,
  selectedDate, returnDate, hoverDate,
  onDay, onHover, mode,
}: {
  year: number; month: number
  prices: PriceMap; loading: boolean
  selectedDate?: string; returnDate?: string; hoverDate?: string
  onDay: (d: string) => void
  onHover: (d: string | null) => void
  mode: 'single' | 'range'
}) {
  const today    = todayDate()
  const numDays  = daysInMonth(year, month)
  const startDay = firstDayOfWeek(year, month)
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ]

  const rangeStart = selectedDate
  const rangeEnd   = hoverDate || returnDate

  function inRange(ds: string) {
    if (mode !== 'range' || !rangeStart || !rangeEnd || rangeStart === rangeEnd) return false
    const [a, b] = rangeStart < rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart]
    return ds > a && ds < b
  }
  function isStart(ds: string) { return ds === selectedDate }
  function isEnd(ds: string)   { return ds === (returnDate || hoverDate) }
  function isPast(ds: string)  { return new Date(ds + 'T00:00') < today }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const ds      = dateStr(year, month, day)
          const dp      = prices[ds]
          const past    = isPast(ds)
          const fetching = loading && !dp
          const tier    = past ? 'none' : (dp?.tier ?? 'none')
          const style   = fetching ? null : (TIER_STYLES[tier] ?? TIER_STYLES.none)
          const start   = isStart(ds)
          const end     = isEnd(ds)
          const inR     = inRange(ds)

          return (
            <div
              key={ds}
              className={`relative flex flex-col items-center py-0.5 ${inR ? 'bg-sky-50 dark:bg-sky-900/20' : ''} ${start ? 'rounded-l-full' : ''} ${end ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={past}
                onClick={() => !past && onDay(ds)}
                onMouseEnter={() => !past && onHover(ds)}
                onMouseLeave={() => onHover(null)}
                className={`
                  relative w-9 h-9 rounded-full flex flex-col items-center justify-center
                  transition-all duration-150 select-none
                  ${past ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
                  ${fetching ? 'bg-slate-200 dark:bg-slate-700 animate-pulse' : style?.bg ?? ''}
                  ${style?.text ?? ''}
                  ${(start || end) ? `ring-2 ring-offset-1 dark:ring-offset-slate-900 ${style?.ring ?? ''}` : ''}
                  ${!past && tier === 'none' && !start && !end ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                  ${!past && tier !== 'none' && !fetching ? 'hover:brightness-110 hover:scale-110 hover:shadow-lg' : ''}
                `}
              >
                <span className={`text-[13px] font-bold leading-none ${past ? 'text-slate-400' : tier === 'none' ? 'text-slate-700 dark:text-slate-200' : ''}`}>
                  {day}
                </span>
                {/* Price tag */}
                {!past && dp?.price != null && tier !== 'none' && (
                  <span className="text-[8px] font-semibold leading-none mt-0.5 opacity-90">
                    {formatPrice(dp.price, dp.currency)}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
      {(['low','mid','high'] as const).map(tier => (
        <span key={tier} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${TIER_STYLES[tier].bg} inline-block`} />
          {TIER_STYLES[tier].label}
        </span>
      ))}
    </div>
  )
}

// ── Main PriceCalendar ────────────────────────────────────────────────────────
export function PriceCalendar({
  origin, destination, currency = 'USD', adults = 1, travelClass = 1,
  selectedDate, returnDate, onSelectDate, onSelectReturn,
  mode = 'single', onClose,
}: PriceCalendarProps) {
  const today        = todayDate()
  const initYear     = today.getFullYear()
  const initMonth    = today.getMonth()

  const [baseYear, setBaseYear]   = useState(initYear)
  const [baseMonth, setBaseMonth] = useState(initMonth)
  const [prices, setPrices]       = useState<PriceMap>({})
  const [loading, setLoading]     = useState(false)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [pickingReturn, setPickingReturn] = useState(false)
  const fetchRef = useRef(0)

  // The two visible months
  const month1 = { year: baseYear, month: baseMonth }
  const raw2   = baseMonth + 1 > 11 ? { year: baseYear + 1, month: 0 } : { year: baseYear, month: baseMonth + 1 }
  const month2 = raw2

  const canGoPrev = baseYear > initYear || baseMonth > initMonth

  function prevMonths() {
    if (!canGoPrev) return
    if (baseMonth === 0) { setBaseYear(y => y - 1); setBaseMonth(11) }
    else setBaseMonth(m => m - 1)
  }
  function nextMonths() {
    if (baseMonth === 11) { setBaseYear(y => y + 1); setBaseMonth(0) }
    else setBaseMonth(m => m + 1)
  }

  // Fetch prices for both visible months
  const fetchPrices = useCallback(async () => {
    if (!origin || !destination || origin === destination) return
    const id = ++fetchRef.current
    setLoading(true)
    try {
      const months = [month1, month2]
      const results: PriceMap = {}
      await Promise.all(months.map(async ({ year, month }) => {
        const params = new URLSearchParams({
          origin, destination,
          year: String(year), month: String(month + 1),
          currency, adults: String(adults), travel_class: String(travelClass),
        })
        const res  = await fetch(`/api/flights/price-calendar?${params}`)
        const json = await res.json()
        if (id !== fetchRef.current) return
        Object.assign(results, json.data ?? {})
      }))
      if (id === fetchRef.current) setPrices(prev => ({ ...prev, ...results }))
    } catch { /* silently ignore */ }
    finally  { if (id === fetchRef.current) setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, currency, adults, travelClass, baseYear, baseMonth])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  function handleDay(ds: string) {
    if (mode === 'range') {
      if (!selectedDate || pickingReturn) {
        onSelectDate(ds)
        setPickingReturn(false)
      } else if (ds < selectedDate) {
        onSelectDate(ds)
      } else {
        onSelectReturn?.(ds)
        setPickingReturn(true)
      }
    } else {
      onSelectDate(ds)
      onClose?.()
    }
  }

  // Cheapest price across both months
  const allPrices = Object.values(prices).filter(p => p.price != null).map(p => p.price as number)
  const cheapest  = allPrices.length ? Math.min(...allPrices) : null
  const cheapDay  = cheapest != null ? Object.entries(prices).find(([,p]) => p.price === cheapest) : null

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {origin} → {destination}
          </h3>
          {cheapDay && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              <TrendingDown className="w-3.5 h-3.5" />
              Cheapest: {formatPrice(cheapest!, cheapDay[1].currency)} on {cheapDay[0]}
            </p>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
            Loading prices…
          </div>
        )}
      </div>

      {/* ── Calendar grid ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-6">
          {/* Month 1 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button" onClick={prevMonths} disabled={!canGoPrev}
                className={`p-1.5 rounded-lg transition-colors ${canGoPrev ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {MONTHS[month1.month]} {month1.year}
              </h4>
              <div className="w-7" /> {/* spacer */}
            </div>
            <MonthGrid
              year={month1.year} month={month1.month}
              prices={prices} loading={loading}
              selectedDate={selectedDate} returnDate={returnDate} hoverDate={hoverDate ?? undefined}
              onDay={handleDay} onHover={setHoverDate} mode={mode}
            />
          </div>

          {/* Month 2 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-7" /> {/* spacer */}
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {MONTHS[month2.month]} {month2.year}
              </h4>
              <button
                type="button" onClick={nextMonths}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <MonthGrid
              year={month2.year} month={month2.month}
              prices={prices} loading={loading}
              selectedDate={selectedDate} returnDate={returnDate} hoverDate={hoverDate ?? undefined}
              onDay={handleDay} onHover={setHoverDate} mode={mode}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <div className="flex items-center gap-4">
          <Legend />
          <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        {mode === 'range' && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {!selectedDate
              ? 'Select departure date'
              : !returnDate
              ? 'Now select return date'
              : `${selectedDate} → ${returnDate}`}
          </div>
        )}
        {onClose && (
          <button
            type="button" onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  )
}
