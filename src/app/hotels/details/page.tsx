'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/layout/Navbar'
import {
  Building2, Star, MapPin, ChevronLeft, ChevronRight,
  Calendar, Users, ArrowLeft, Wifi, Coffee, Dumbbell,
  Sparkles, Award, Map, CheckCircle2, MessageSquare,
  Tag, ExternalLink, ShieldCheck, HelpCircle, X,
} from 'lucide-react'
import { useCurrencyStore } from '@/lib/store'

const HotelMap = dynamic(() => import('@/components/hotels/HotelMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center">
      <Map className="w-8 h-8 text-violet-700" />
    </div>
  ),
})

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£',
  AED: 'AED ', SGD: 'S$', AUD: 'A$', JPY: '¥', CAD: 'C$',
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Free Wi-Fi':      <Wifi className="w-4 h-4 text-violet-400" />,
  'Wifi':            <Wifi className="w-4 h-4 text-violet-400" />,
  'Infinity Pool':   <Sparkles className="w-4 h-4 text-violet-400" />,
  'Pool':            <Sparkles className="w-4 h-4 text-violet-400" />,
  'Jungle Pool':     <Sparkles className="w-4 h-4 text-violet-400" />,
  'Luxury Spa':      <Award className="w-4 h-4 text-violet-400" />,
  'Spa':             <Award className="w-4 h-4 text-violet-400" />,
  'Spa & Wellness':  <Award className="w-4 h-4 text-violet-400" />,
  'Fitness Center':  <Dumbbell className="w-4 h-4 text-violet-400" />,
  'Gym':             <Dumbbell className="w-4 h-4 text-violet-400" />,
  'Free Breakfast':  <Coffee className="w-4 h-4 text-violet-400" />,
  'Breakfast':       <Coffee className="w-4 h-4 text-violet-400" />,
  'Air conditioning':<CheckCircle2 className="w-4 h-4 text-violet-400" />,
}

interface PartnerDeal { partner: string; price: number; currency: string; link: string }
interface HotelReview {
  author: string; avatar: string; rating: number; best_rating: number
  text: string; date: string; source: string; source_icon: string
  link: string; highlights: string[]
  subratings: { rooms?: number; service?: number; location?: number }
}
interface NearbyPlace {
  name: string; distance: string; transport: string
  gps_coordinates?: { latitude: number; longitude: number }
}
interface HotelDetails {
  source: string; name: string; address?: string; description: string
  stars: number; rating: number; reviewsCount: number
  images: string[]; amenities: string[]
  deals: PartnerDeal[]; reviews: HotelReview[]
  nearby: NearbyPlace[]
  gps_coordinates?: { latitude: number; longitude: number }
  error?: string
}
interface ReviewsResponse {
  reviews: HotelReview[]
  next_page_token?: string
  source: string
  error?: string
}

function fmtDate(iso: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) }
  catch { return iso }
}

function ratingLabel(score: number) {
  if (score >= 4.8) return 'Exceptional'
  if (score >= 4.5) return 'Excellent'
  if (score >= 4.0) return 'Very Good'
  if (score >= 3.5) return 'Good'
  return 'Satisfactory'
}

/* ─── Lightbox ───────────────────────────────────────────────────────────── */
function Lightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [cur, setCur] = useState(startIdx)
  const prev = useCallback(() => setCur(i => (i === 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setCur(i => (i === images.length - 1 ? 0 : i + 1)), [images.length])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [prev, next, onClose])

  return (
    <div className="fixed inset-0 z-[300] bg-black/96 backdrop-blur-xl flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white font-bold text-sm">
          {cur + 1} <span className="text-slate-500">/ {images.length}</span>
        </span>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 relative flex items-center justify-center px-14 min-h-0" onClick={e => e.stopPropagation()}>
        <button onClick={prev} className="absolute left-3 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-violet-600 text-white flex items-center justify-center transition-all border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <img
          key={cur}
          src={images[cur]}
          alt={`Photo ${cur + 1}`}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        />
        <button onClick={next} className="absolute right-3 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-violet-600 text-white flex items-center justify-center transition-all border border-white/10">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="shrink-0 px-4 pb-4 pt-3" onClick={e => e.stopPropagation()}>
        <div className="flex gap-2 justify-center overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCur(i)} className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === cur ? 'border-fuchsia-500 scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 bg-slate-800 rounded w-24" />
      <div className="h-10 bg-slate-800 rounded-2xl w-1/2" />
      <div className="grid grid-cols-3 gap-3 h-64">
        <div className="col-span-2 bg-slate-800 rounded-3xl" />
        <div className="flex flex-col gap-3">
          <div className="bg-slate-800 rounded-3xl flex-1" />
          <div className="bg-slate-800 rounded-3xl flex-1" />
        </div>
      </div>
      <div className="h-14 bg-slate-800 rounded-2xl" />
      <div className="h-64 bg-slate-800 rounded-3xl" />
    </div>
  )
}

/* ─── Main Details ───────────────────────────────────────────────────────── */
function DetailsContent() {
  const sp = useSearchParams()
  const router = useRouter()
  const { currency } = useCurrencyStore()

  const propertyToken = sp.get('property_token') ?? ''
  const checkIn      = sp.get('check_in') ?? ''
  const checkOut     = sp.get('check_out') ?? ''
  const adults       = sp.get('adults') ?? '1'

  const [activeTab, setActiveTab]   = useState<'deals'|'overview'|'amenities'|'reviews'>('deals')
  const [lightboxIdx, setLightboxIdx] = useState<number|null>(null)

  const { data, isLoading, isError } = useQuery<HotelDetails>({
    queryKey: ['hotel-details-v3', propertyToken, checkIn, checkOut, adults, currency],
    queryFn: async () => {
      const p = new URLSearchParams({ property_token: propertyToken, adults, currency })
      if (checkIn)  p.set('check_in', checkIn)
      if (checkOut) p.set('check_out', checkOut)
      const res = await fetch(`/api/hotels/details?${p}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as HotelDetails
    },
    enabled: !!propertyToken,
    staleTime: 0,
    gcTime: 0,   // don't retain stale/error data in cache after unmount
  })

  if (!propertyToken) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="w-16 h-16 text-violet-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-black text-white mb-2">No Property Selected</h2>
        <p className="text-slate-400 mb-8">Go back to search and pick a hotel.</p>
        <button onClick={() => router.back()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    )
  }

  if (isLoading) return <Skeleton />

  if (isError || !data) {
    return (
      <div className="bg-red-950/20 border border-red-800 rounded-3xl p-8 text-center max-w-lg mx-auto mt-12">
        <HelpCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-xl font-black text-red-400 mb-2">Could not load property</h3>
        <button onClick={() => router.back()} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl">Back</button>
      </div>
    )
  }

  // Backend returned an API error (no API key, SerpAPI failure, etc.)
  if (data.source === 'error') {
    return (
      <div className="bg-amber-950/20 border border-amber-800 rounded-3xl p-8 text-center max-w-lg mx-auto mt-12">
        <HelpCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-xl font-black text-amber-400 mb-2">Property data unavailable</h3>
        <p className="text-sm text-slate-400 mb-4">{data.error || 'Unable to fetch hotel details from the API.'}</p>
        <button onClick={() => router.back()} className="mt-2 bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-2 rounded-xl">Go Back</button>
      </div>
    )
  }

  const {
    name        = '',
    description = '',
    stars       = 0,
    rating      = 0,
    reviewsCount = 0,
    images      = [],
    amenities   = [],
    deals       = [],
    reviews     = [],
    nearby      = [],
    source,
    gps_coordinates,
    address,
  } = data
  const sym = CURRENCY_SYMBOLS[deals[0]?.currency ?? currency] ?? currency

  const TABS = [
    { id: 'deals',     label: 'Partner Deals',      icon: <Tag className="w-4 h-4" /> },
    { id: 'overview',  label: 'Overview & Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'amenities', label: 'Amenities',           icon: <Building2 className="w-4 h-4" /> },
    { id: 'reviews',   label: 'Guest Reviews',       icon: <MessageSquare className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox images={images} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* Back bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-violet-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
        {checkIn && checkOut && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1 text-violet-400"><Calendar className="w-3.5 h-3.5" /> Check-in:</span>
            <span>{fmtDate(checkIn)}</span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-violet-400"><Calendar className="w-3.5 h-3.5" /> Check-out:</span>
            <span>{fmtDate(checkOut)}</span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="flex items-center gap-1 text-violet-400 hidden sm:flex"><Users className="w-3.5 h-3.5" /> Guests:</span>
            <span className="hidden sm:inline">{adults} Adult{Number(adults) > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Hotel Title Card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          {/* Stars */}
          <div className="flex items-center gap-0.5 text-amber-400 mb-2">
            {[...Array(Number(stars) || 0)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
          </div>

          {/* Hotel Name */}
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">{name}</h1>

          {/* Address subtext + Open in Maps button — on one dedicated row below the name */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <MapPin className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="text-sm text-slate-400 font-medium">
              {address || 'Address Verified'}
            </span>
            {gps_coordinates?.latitude && gps_coordinates?.longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${gps_coordinates.latitude},${gps_coordinates.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-3 py-1 rounded-full shadow-md hover:shadow-lg hover:shadow-violet-900/40 transition-all duration-200 shrink-0 group"
              >
                <svg className="w-3 h-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Open in Maps
              </a>
            )}
          </div>


        </div>

        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-white">{ratingLabel(rating)}</p>
            <p className="text-xs text-slate-500">{Number(reviewsCount).toLocaleString()} guests</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-black flex items-center justify-center text-xl shadow-lg">
            {Number(rating).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Photo Grid — overflow-hidden + grid-rows-1 lock cells inside the fixed height */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-1 gap-3 h-64 md:h-[420px] overflow-hidden rounded-3xl">

        {/* Main large image — fills full left 2/3 */}
        <div
          onClick={() => setLightboxIdx(0)}
          className="md:col-span-2 h-full rounded-3xl overflow-hidden relative group cursor-zoom-in bg-slate-900"
        >
          {images[0] && (
            <img
              src={images[0]}
              alt="Main"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5">
            View all {images.length} photos
          </div>
        </div>

        {/* Right column — two equal-height stacked images */}
        <div className="hidden md:flex flex-col gap-3 h-full">
          {[images[1], images[2]].map((img, i) => (
            <div
              key={i}
              onClick={() => setLightboxIdx(i + 1)}
              className="flex-1 min-h-0 rounded-3xl overflow-hidden relative group cursor-zoom-in bg-slate-900"
            >
              {img && (
                <img
                  src={img}
                  alt={`Photo ${i + 2}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
              {i === 1 && images.length > 3 && (
                <div
                  onClick={e => { e.stopPropagation(); setLightboxIdx(2) }}
                  className="absolute inset-0 bg-black/60 hover:bg-black/70 flex flex-col items-center justify-center text-white cursor-pointer transition-colors"
                >
                  <span className="text-3xl font-black">+{images.length - 3}</span>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-violet-300 mt-1">Photos</span>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          TAB NAVIGATION BAR
         ══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-2 flex flex-wrap gap-2 shadow-lg">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={[
              'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB CONTENT
         ══════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 min-h-[320px]">

        {/* ── DEALS ─────────────────────────────────────────── */}
        {activeTab === 'deals' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-violet-400" /> Comparison Booking Deals
                </h2>
                <p className="text-xs text-slate-500 mt-1">We scour hundreds of platforms to get you the cheapest price.</p>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border whitespace-nowrap ${source === 'live' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' : 'bg-indigo-950/40 text-indigo-400 border-indigo-800'}`}>
                {source === 'live' ? '🟢 Live Tariffs' : '💾 Demo Rates'}
              </span>
            </div>

            <div className="space-y-3">
              {deals.map((deal, i) => {
                const best = i === 0
                return (
                  <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${best ? 'bg-violet-950/20 border-violet-700/50 shadow-md' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl text-xs font-black flex items-center justify-center ${best ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {deal.partner.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white flex items-center gap-2">
                          {deal.partner}
                          {best && <span className="text-[9px] font-black bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase">Cheapest</span>}
                        </p>
                        <p className="text-xs text-slate-500">Flexible cancellations may apply</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                      <div className="sm:text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Price per night</p>
                        <p className="text-xl font-black text-white">{sym}{deal.price.toLocaleString()}</p>
                      </div>
                      <a href={deal.link} target="_blank" rel="noopener noreferrer"
                        className={`px-5 py-2.5 font-bold text-sm rounded-xl flex items-center gap-1.5 transition-all ${best ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>
                        Book Deal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-4 flex gap-3 border border-slate-800">
              <ShieldCheck className="w-6 h-6 text-violet-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-300">DestinAir Verified Pricing</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tariffs are calculated directly in accordance with SerpApi property providers. No hidden fees or commissions.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left — Description + check-in info + MAP */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-white mb-3">About the Property</h2>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{description}</p>
              </div>

              <div className="border-t border-slate-800 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check-In</p>
                  <p className="text-sm font-extrabold text-slate-100 mt-1">From 14:00 PM</p>
                  <p className="text-xs text-slate-500 mt-0.5">Contact reception for late arrivals</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check-Out</p>
                  <p className="text-sm font-extrabold text-slate-100 mt-1">Until 12:00 PM</p>
                  <p className="text-xs text-slate-500 mt-0.5">Express check-out available</p>
                </div>
              </div>

              {/* ── Leaflet Map lives here — full width of left column ── */}
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Map className="w-4 h-4 text-violet-400" /> Location Map
                </h3>
                <div className="rounded-2xl overflow-hidden border border-violet-900/30 shadow-lg" style={{ height: '380px' }}>
                  <HotelMap
                    hotelCoordinates={gps_coordinates}
                    nearbyPlaces={nearby}
                    hotelName={name}
                  />
                </div>
              </div>
            </div>

            {/* Right — Nearby places list only */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-violet-400" /> Nearby Locations
              </h3>
              <div className="space-y-2">
                {nearby.slice(0, 8).map((place, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{place.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Mode: <span className="text-violet-400 font-extrabold uppercase">{place.transport}</span>
                      </p>
                    </div>
                    <span className="font-black text-violet-400 font-mono ml-3 shrink-0">{place.distance}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── AMENITIES ─────────────────────────────────────── */}
        {activeTab === 'amenities' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">Property Amenities</h2>
              <p className="text-xs text-slate-500">Live amenity data sourced directly from the property listing.</p>
            </div>
            {amenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-800 rounded-2xl">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                      {AMENITY_ICONS[amenity] || <Building2 className="w-4 h-4 text-violet-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-200">{amenity}</p>
                      <p className="text-[10px] text-slate-500">Included in tariff</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-slate-400 font-bold">No amenity data available</p>
                <p className="text-xs text-slate-600 mt-1">This property hasn&apos;t listed amenities yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS ───────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <ReviewsTab propertyToken={propertyToken} totalCount={reviewsCount} />
        )}

      </div>
    </div>
  )
}

/* ─── ReviewsTab ──────────────────────────────────────────────────────────── */
function ReviewsTab({ propertyToken, totalCount }: { propertyToken: string; totalCount: number }) {
  const [sortBy, setSortBy] = useState<1 | 2>(2)
  const [allReviews, setAllReviews] = useState<HotelReview[]>([])
  const [nextToken, setNextToken] = useState<string | undefined>(undefined)
  const [pageToken, setPageToken] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['hotel-reviews-v1', propertyToken, sortBy, pageToken],
    queryFn: async () => {
      const p = new URLSearchParams({ property_token: propertyToken, sort_by: String(sortBy) })
      if (pageToken) p.set('next_page_token', pageToken)
      const res = await fetch(`/api/hotels/reviews?${p}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return json.data as ReviewsResponse
    },
    enabled: !!propertyToken,
    staleTime: 0,
    gcTime: 0,
  })

  useEffect(() => {
    if (!data) return
    if (pageToken === undefined) {
      setAllReviews(data.reviews ?? [])
    } else {
      setAllReviews(prev => [...prev, ...(data.reviews ?? [])])
    }
    setNextToken(data.next_page_token)
    setHasMore(!!data.next_page_token)
  }, [data])

  const handleSort = (s: 1 | 2) => {
    setSortBy(s)
    setPageToken(undefined)
    setAllReviews([])
    setHasMore(true)
  }

  const StarRow = ({ count, max = 5 }: { count: number; max?: number }) => (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < Math.round(count) ? 'text-amber-400 fill-current' : 'text-slate-700'}`} />
      ))}
    </div>
  )

  const SubBar = ({ label, val }: { label: string; val?: number }) => {
    if (val == null) return null
    const pct = Math.round((val / 5) * 100)
    return (
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span className="w-14 shrink-0">{label}</span>
        <div className="flex-1 bg-slate-800 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-4 text-right text-slate-400">{val}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white">Guest Reviews</h2>
          {totalCount > 0 && <p className="text-xs text-slate-500">{totalCount.toLocaleString()} verified reviews from Google Hotels</p>}
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <button
            id="sort-most-recent"
            onClick={() => handleSort(2)}
            className={`px-4 py-1.5 rounded-full border transition-all ${sortBy === 2 ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
          >Most Recent</button>
          <button
            id="sort-most-relevant"
            onClick={() => handleSort(1)}
            className={`px-4 py-1.5 rounded-full border transition-all ${sortBy === 1 ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
          >Most Relevant</button>
        </div>
      </div>

      {/* Skeleton loading */}
      {isLoading && allReviews.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 rounded-3xl p-5 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                  <div className="h-2.5 bg-slate-700 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-slate-700 rounded w-full" />
                <div className="h-2.5 bg-slate-700 rounded w-4/5" />
                <div className="h-2.5 bg-slate-700 rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews grid */}
      {allReviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allReviews.map((r, i) => {
            const initials = r.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const hasSubratings = r.subratings && (r.subratings.rooms != null || r.subratings.service != null || r.subratings.location != null)
            return (
              <div key={i} className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all rounded-3xl p-5 flex flex-col gap-3">
                {/* Author row */}
                <div className="flex items-start gap-3">
                  {r.avatar ? (
                    <img src={r.avatar} alt={r.author} className="w-9 h-9 rounded-full object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-violet-800 flex items-center justify-center text-xs font-black text-white shrink-0">{initials}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-slate-100 truncate">{r.author}</p>
                      <StarRow count={r.rating} max={r.best_rating || 5} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.source_icon && <img src={r.source_icon} alt={r.source} className="w-3 h-3 rounded-sm" />}
                      <span className="text-[10px] text-slate-500">{r.source}</span>
                      {r.date && <span className="text-[10px] text-slate-600">· {r.date}</span>}
                    </div>
                  </div>
                </div>

                {/* Review text */}
                {r.text && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-5 italic">&ldquo;{r.text}&rdquo;</p>
                )}

                {/* Highlights */}
                {r.highlights && r.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.highlights.map((h, j) => (
                      <span key={j} className="text-[10px] bg-violet-900/40 text-violet-300 border border-violet-800/50 rounded-full px-2.5 py-0.5">{h}</span>
                    ))}
                  </div>
                )}

                {/* Sub-ratings */}
                {hasSubratings && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <SubBar label="Rooms" val={r.subratings.rooms} />
                    <SubBar label="Service" val={r.subratings.service} />
                    <SubBar label="Location" val={r.subratings.location} />
                  </div>
                )}

                {/* Link to original */}
                {r.link && r.source !== 'Google' && (
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 mt-auto">
                    <ExternalLink className="w-2.5 h-2.5" /> View on {r.source}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allReviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 font-bold">No reviews yet</p>
          <p className="text-xs text-slate-600 mt-1">Guest reviews will appear here once available from Google Hotels.</p>
        </div>
      )}

      {/* Load more */}
      {hasMore && allReviews.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            id="load-more-reviews"
            disabled={isLoading}
            onClick={() => setPageToken(nextToken)}
            className="px-8 py-2.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-700 text-violet-300 text-sm font-bold rounded-full transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Load more reviews'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function HotelDetailsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b13]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Suspense fallback={<Skeleton />}>
          <DetailsContent />
        </Suspense>
      </main>
    </div>
  )
}
