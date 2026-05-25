'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useMemo } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { 
  Building2, Star, MapPin, ChevronLeft, ChevronRight, Filter, 
  ArrowLeft, Search, Calendar, Users, SlidersHorizontal, Info,
  Sparkles, Coffee, Wifi, Dumbbell, Award, HelpCircle
} from 'lucide-react'
import { useCurrencyStore } from '@/lib/store'
import Link from 'next/link'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  AED: 'AED ', SGD: 'S$', AUD: 'A$', JPY: '¥', CAD: 'C$',
}

const AMENITIES_ICONS: Record<string, React.ReactNode> = {
  'Free Wi-Fi': <Wifi className="w-3.5 h-3.5" />,
  'Free Breakfast': <Coffee className="w-3.5 h-3.5" />,
  'Gym': <Dumbbell className="w-3.5 h-3.5" />,
  'Pool': <Sparkles className="w-3.5 h-3.5" />,
  'Infinity Pool': <Sparkles className="w-3.5 h-3.5" />,
  'Luxury Spa': <Award className="w-3.5 h-3.5" />,
  'Fitness Center': <Dumbbell className="w-3.5 h-3.5" />,
}

// Fallback images array for the carousels to keep it super premium
const CAROUSEL_FALLBACKS = [
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
]

interface HotelProperty {
  id: string
  name: string
  stars: number
  rating: number
  reviewsCount: number
  location: string
  thumbnail: string
  pricePerNight: number
  currency: string
  amenities: string[]
  property_token: string
}

function fmtDate(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

/* ─── HotelCard ──────────────────────────────────────────────────────────── */
function HotelCard({
  hotel,
  currency,
  checkIn,
  checkOut,
  adults,
}: {
  hotel: HotelProperty
  currency: string
  checkIn: string
  checkOut: string
  adults: string
}) {
  const router = useRouter()
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const sym = CURRENCY_SYMBOLS[currency] ?? currency

  // Construct images array
  const images = useMemo(() => {
    const arr = [hotel.thumbnail]
    // Filter duplicates
    CAROUSEL_FALLBACKS.forEach(img => {
      if (img !== hotel.thumbnail) arr.push(img)
    })
    return arr.slice(0, 4)
  }, [hotel.thumbnail])

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImgIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleViewDetails = () => {
    const params = new URLSearchParams({
      property_token: hotel.property_token,
      check_in: checkIn,
      check_out: checkOut,
      adults: adults,
      currency: currency,
    })
    router.push(`/hotels/details?${params.toString()}`)
  }

  const ratingLabel = (score: number) => {
    if (score >= 4.8) return 'Exceptional'
    if (score >= 4.5) return 'Excellent'
    if (score >= 4.0) return 'Very Good'
    if (score >= 3.5) return 'Good'
    return 'Satisfactory'
  }

  return (
    <div 
      onClick={handleViewDetails}
      className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 hover:border-violet-400 dark:hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-900/5 dark:hover:shadow-violet-950/20 transition-all duration-300 overflow-hidden flex flex-col md:flex-row cursor-pointer"
    >
      {/* Image Carousel */}
      <div className="relative w-full md:w-80 h-64 md:h-auto md:min-h-[260px] shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-950/50">
        <img 
          src={images[currentImgIndex]} 
          alt={hotel.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-65" />

        {/* Carousel buttons */}
        <button 
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-colors duration-200 shadow-lg opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-colors duration-200 shadow-lg opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, idx) => (
            <span 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-200 ${idx === currentImgIndex ? 'w-4 bg-violet-600' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </div>

        {/* Top-left Star Badge */}
        <div className="absolute top-3 left-3 flex gap-0.5 bg-slate-900/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-amber-400">
          {Array.from({ length: hotel.stars }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-current" />
          ))}
        </div>
      </div>

      {/* Hotel Content */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
        <div>
          {/* Header row */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                {hotel.name}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-violet-500" /> {hotel.location}
              </p>
            </div>
            {/* Rating badge */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[11px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest hidden sm:inline">
                  {ratingLabel(hotel.rating)}
                </span>
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-extrabold flex items-center justify-center shadow-lg shadow-violet-900/10 dark:shadow-none text-sm">
                  {Number(hotel.rating).toFixed(1)}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {hotel.reviewsCount.toLocaleString()} reviews
              </p>
            </div>
          </div>

          {/* Amenities badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {hotel.amenities.slice(0, 4).map((amenity, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800"
              >
                {AMENITIES_ICONS[amenity] || <Building2 className="w-3 h-3" />}
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
                +{hotel.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing + Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500">per night</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {sym}{hotel.pricePerNight.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                taxes inc.
              </span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDetails()
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shadow-lg shadow-violet-900/10 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── SearchResultsSkeleton ────────────────────────────────────────────── */
function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-5 md:p-6 flex flex-col md:flex-row gap-5 animate-pulse"
        >
          {/* Thumbnail Skeleton */}
          <div className="w-full md:w-80 h-52 shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          
          {/* Content Skeleton */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
                </div>
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-4">
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-12" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
              </div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── ResultsContent ──────────────────────────────────────────────────────── */
function ResultsContent() {
  const sp = useSearchParams()
  const router = useRouter()
  const { currency } = useCurrencyStore()

  const q = sp.get('q') ?? ''
  const cityCode = sp.get('city_code') ?? ''
  const checkIn = sp.get('check_in') ?? ''
  const checkOut = sp.get('check_out') ?? ''
  const adults = sp.get('adults') ?? '1'
  const rooms = sp.get('rooms') ?? '1'

  // Local filter states
  const [maxPrice, setMaxPrice] = useState<number>(1000)
  const [selectedStars, setSelectedStars] = useState<number[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Query Backend Search Route
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['hotels-search', q, cityCode, checkIn, checkOut, adults, currency],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cityCode) params.set('city_code', cityCode)
      if (checkIn) params.set('check_in', checkIn)
      if (checkOut) params.set('check_out', checkOut)
      params.set('adults', adults)
      params.set('currency', currency)

      const res = await fetch(`/api/hotels/search?${params.toString()}`)
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      const result = await res.json()
      return result.data as { source: string; currency: string; properties: HotelProperty[] }
    },
    enabled: !!(q || cityCode) && !!checkIn && !!checkOut,
    staleTime: 5 * 60 * 1000,
  })

  const properties = data?.properties ?? []
  const returnedCurrency = data?.currency ?? currency
  const sym = CURRENCY_SYMBOLS[returnedCurrency] ?? returnedCurrency

  // Available ranges from response
  const priceStats = useMemo(() => {
    if (!properties.length) return { min: 0, max: 1000 }
    const prices = properties.map(p => p.pricePerNight)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [properties])

  // Set default slider max once stats are computed
  useMemo(() => {
    if (priceStats.max > 0) {
      setMaxPrice(priceStats.max)
    }
  }, [priceStats.max])

  // Apply filters client-side
  const filteredProperties = useMemo(() => {
    return properties.filter((hotel) => {
      // 1. Price
      if (hotel.pricePerNight > maxPrice) return false

      // 2. Stars
      if (selectedStars.length > 0 && !selectedStars.includes(hotel.stars)) return false

      // 3. Customer Rating
      if (minRating !== null && hotel.rating < minRating) return false

      // 4. Amenities
      if (selectedAmenities.length > 0) {
        const hasAll = selectedAmenities.every(a => hotel.amenities.includes(a))
        if (!hasAll) return false
      }

      return true
    })
  }, [properties, maxPrice, selectedStars, minRating, selectedAmenities])

  // Handle Stars toggles
  const handleStarToggle = (star: number) => {
    setSelectedStars((prev) => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    )
  }

  // Handle Amenities toggles
  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  const handleResetFilters = () => {
    setMaxPrice(priceStats.max)
    setSelectedStars([])
    setMinRating(null)
    setSelectedAmenities([])
  }

  const activeFiltersCount = 
    (maxPrice < priceStats.max ? 1 : 0) + 
    selectedStars.length + 
    (minRating !== null ? 1 : 0) + 
    selectedAmenities.length

  if (!q && !cityCode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-24 h-24 rounded-full bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center mb-6 border border-violet-100 dark:border-violet-900/30">
          <Building2 className="w-12 h-12 text-violet-400 dark:text-violet-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Find Your Perfect Stay</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Please launch a hotel search from the homepage to retrieve dynamic stays.</p>
        <Link href="/" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb & Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              <Link href="/" className="hover:text-violet-500 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-violet-500">Hotels</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              Stays in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">{q}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-violet-500" /> {fmtDate(checkIn)} – {fmtDate(checkOut)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline" />
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-500" /> {adults} Guest{Number(adults) > 1 ? 's' : ''} · {rooms} Room{Number(rooms) > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden h-11 px-4 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-violet-500 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center gap-2 transition-all hover:bg-violet-50 dark:hover:bg-violet-950/20"
            >
              <Filter className="w-4 h-4 text-violet-500" /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <Link 
              href="/"
              className="h-11 px-5 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-violet-500 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center gap-2 transition-all hover:bg-violet-50 dark:hover:bg-violet-950/20 shadow-sm"
            >
              <Search className="w-4 h-4 text-violet-500" /> Modify Search
            </Link>
          </div>
        </div>
      </div>

      {/* Meta API status & stats info */}
      {!isLoading && !isError && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-5 py-3 shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filteredProperties.length} of {properties.length} matches
          </p>
          <div className="flex items-center gap-2">
            {data?.source && (
              <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border ${
                data.source === 'live' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30'
                  : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30'
              }`}>
                {data.source === 'live' ? '🟢 Live · Google Hotels' : '💾 Demo Sandbox'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sidebar + Main Grid Split */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Filters Sidebar */}
        <div className={`w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-6 shadow-sm shrink-0
          ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-500" /> Filter Stays
            </h2>
            {activeFiltersCount > 0 && (
              <button 
                onClick={handleResetFilters}
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Price Filter */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Max Price / Night
            </label>
            <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>{sym}{priceStats.min}</span>
              <span className="text-violet-600 dark:text-violet-400">{sym}{maxPrice}</span>
            </div>
            <input 
              type="range"
              min={priceStats.min}
              max={priceStats.max || 1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600 dark:accent-violet-500"
            />
          </div>

          {/* Stars Filter */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Star Rating
            </label>
            <div className="space-y-2">
              {[5, 4, 3, 2].map((star) => (
                <label 
                  key={star}
                  className="flex items-center gap-3 cursor-pointer group text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-500 transition-colors"
                >
                  <input 
                    type="checkbox"
                    checked={selectedStars.includes(star)}
                    onChange={() => handleStarToggle(star)}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:bg-slate-850 dark:border-slate-700"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    ))}
                    {Array.from({ length: 5 - star }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-slate-200 dark:text-slate-800" />
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Reviews Filter */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Customer Score
            </label>
            <div className="space-y-2">
              {[
                { label: '4.5+ Excellent', val: 4.5 },
                { label: '4.0+ Very Good', val: 4.0 },
                { label: '3.5+ Good', val: 3.5 },
              ].map((item) => (
                <label 
                  key={item.val}
                  className="flex items-center gap-3 cursor-pointer group text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-500 transition-colors"
                >
                  <input 
                    type="radio"
                    name="rating"
                    checked={minRating === item.val}
                    onChange={() => setMinRating(item.val)}
                    className="w-4 h-4 border-slate-300 text-violet-600 focus:ring-violet-500 dark:bg-slate-850 dark:border-slate-700"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-3 cursor-pointer group text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-500 transition-colors">
                <input 
                  type="radio"
                  name="rating"
                  checked={minRating === null}
                  onChange={() => setMinRating(null)}
                  className="w-4 h-4 border-slate-300 text-violet-600 focus:ring-violet-500 dark:bg-slate-850 dark:border-slate-700"
                />
                <span>Any rating</span>
              </label>
            </div>
          </div>

          {/* Amenities Filter */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Popular Amenities
            </label>
            <div className="space-y-2">
              {[
                'Free Wi-Fi',
                'Free Breakfast',
                'Infinity Pool',
                'Luxury Spa',
                'Fitness Center',
                'Air conditioning',
              ].map((amenity) => (
                <label 
                  key={amenity}
                  className="flex items-center gap-3 cursor-pointer group text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-500 transition-colors"
                >
                  <input 
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:bg-slate-850 dark:border-slate-700"
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 text-[11px] text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-violet-500" />
            <span>Stays match SerpApi hotel listings for {q}. Select detail view to examine partner deals.</span>
          </div>
        </div>

        {/* Results Listings Grid */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {isLoading ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 px-1 py-0.5">
                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                Aggregating luxury hotel inventories…
              </div>
              <SearchResultsSkeleton />
            </>
          ) : isFetching ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 px-1 py-0.5">
                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                Refreshing real-time partner pricing…
              </div>
              <SearchResultsSkeleton />
            </>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
              <Building2 className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-100 mb-2">
                No stays match your criteria
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                No properties fell within your budget or review parameters. Try increasing your maximum price or turning off some filters.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={handleResetFilters} 
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-sm"
                >
                  Reset Filters
                </button>
                <Link 
                  href="/" 
                  className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                >
                  New Search
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((hotel) => (
                <HotelCard 
                  key={hotel.id}
                  hotel={hotel}
                  currency={returnedCurrency}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  adults={adults}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HotelResultsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b13]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Suspense fallback={<SearchResultsSkeleton />}>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}
