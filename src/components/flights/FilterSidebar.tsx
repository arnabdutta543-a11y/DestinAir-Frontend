'use client'
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react'

export interface FilterState {
  stops: number[]           // -1=any, 0=direct, 1=1stop, 2=2+
  maxPrice: number
  airlines: string[]        // empty = all
  depTimes: string[]        // 'morning','afternoon','evening','night'
  maxDuration: number       // minutes, 0=any
  baggageOnly: boolean
  wifiOnly: boolean
  refundableOnly: boolean
}

export const DEFAULT_FILTERS: FilterState = {
  stops: [],
  maxPrice: 0,
  airlines: [],
  depTimes: [],
  maxDuration: 0,
  baggageOnly: false,
  wifiOnly: false,
  refundableOnly: false,
}

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
  availableAirlines: { code: string; name: string }[]
  priceRange: { min: number; max: number }
  maxDurationAvail: number
  activeCount: number
  symbol: string
}

const STOP_OPTIONS = [
  { label: 'Direct', value: 0 },
  { label: '1 Stop', value: 1 },
  { label: '2+ Stops', value: 2 },
]

const DEP_TIME_OPTIONS = [
  { label: '🌅 Morning', sub: '05:00–11:59', value: 'morning' },
  { label: '☀️ Afternoon', sub: '12:00–17:59', value: 'afternoon' },
  { label: '🌆 Evening', sub: '18:00–22:59', value: 'evening' },
  { label: '🌙 Night', sub: '23:00–04:59', value: 'night' },
]

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

export function FilterSidebar({ filters, onChange, availableAirlines, priceRange, maxDurationAvail, activeCount, symbol }: Props) {
  const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial })

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-4">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30">
          <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 bg-sky-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </span>
          {activeCount > 0 && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="p-4 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Stops */}
          <section>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Stops</p>
            <div className="space-y-1.5">
              {STOP_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.stops.includes(opt.value)}
                    onChange={() => set({ stops: toggle(filters.stops, opt.value) })}
                    className="w-3.5 h-3.5 accent-sky-600 rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-sky-600 transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Price */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Price</p>
              <span className="text-xs font-bold text-sky-600">
                {filters.maxPrice > 0 ? `${symbol}${filters.maxPrice.toLocaleString()}` : 'Any'}
              </span>
            </div>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={Math.max(1, Math.floor((priceRange.max - priceRange.min) / 50))}
              value={filters.maxPrice > 0 ? filters.maxPrice : priceRange.max}
              onChange={e => set({ maxPrice: Number(e.target.value) })}
              className="w-full accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>{symbol}{priceRange.min.toLocaleString()}</span>
              <span>{symbol}{priceRange.max.toLocaleString()}</span>
            </div>
            {filters.maxPrice > 0 && (
              <button onClick={() => set({ maxPrice: 0 })} className="mt-1 text-[10px] text-rose-400 hover:text-rose-500 flex items-center gap-0.5">
                <X className="w-2.5 h-2.5" /> Clear
              </button>
            )}
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Departure Time */}
          <section>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Departure Time</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEP_TIME_OPTIONS.map(opt => {
                const active = filters.depTimes.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => set({ depTimes: toggle(filters.depTimes, opt.value) })}
                    className={`rounded-xl border px-2 py-2 text-left transition-all ${
                      active
                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-sky-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{opt.sub}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Duration */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Max Duration</p>
              <span className="text-xs font-bold text-sky-600">
                {filters.maxDuration > 0 ? `${Math.floor(filters.maxDuration / 60)}h ${filters.maxDuration % 60}m` : 'Any'}
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={maxDurationAvail || 1440}
              step={30}
              value={filters.maxDuration > 0 ? filters.maxDuration : (maxDurationAvail || 1440)}
              onChange={e => set({ maxDuration: Number(e.target.value) })}
              className="w-full accent-sky-600"
            />
            {filters.maxDuration > 0 && (
              <button onClick={() => set({ maxDuration: 0 })} className="mt-1 text-[10px] text-rose-400 hover:text-rose-500 flex items-center gap-0.5">
                <X className="w-2.5 h-2.5" /> Clear
              </button>
            )}
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Airlines */}
          {availableAirlines.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Airlines</p>
                {filters.airlines.length > 0 && (
                  <button onClick={() => set({ airlines: [] })} className="text-[10px] text-rose-400 hover:text-rose-500">Clear</button>
                )}
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {availableAirlines.map(a => (
                  <label key={a.code} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.airlines.includes(a.code)}
                      onChange={() => set({ airlines: toggle(filters.airlines, a.code) })}
                      className="w-3.5 h-3.5 accent-sky-600 rounded"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-sky-600 transition-colors truncate">
                      {a.name}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Amenities */}
          <section>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amenities</p>
            <div className="space-y-2">
              {[
                { key: 'baggageOnly', label: '🧳 Baggage included' },
                { key: 'wifiOnly', label: '📶 Wi-Fi on board' },
                { key: 'refundableOnly', label: '↩️ Refundable only' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => set({ [item.key]: !filters[item.key as keyof FilterState] } as Partial<FilterState>)}
                    className={`w-8 h-4 rounded-full transition-all cursor-pointer relative ${
                      filters[item.key as keyof FilterState] ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                      filters[item.key as keyof FilterState] ? 'left-4' : 'left-0.5'
                    }`} />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

        </div>
      </div>
    </aside>
  )
}
