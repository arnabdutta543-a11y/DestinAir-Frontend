'use client'


import { Navbar } from '@/components/layout/Navbar'
import { HeroSearch } from '@/components/search/HeroSearch'
import { scrollToSearch } from '@/components/search/FlightSearchForm'
import { useSearchStore } from '@/lib/store'
import Image from 'next/image'
import {
  Plane, TrendingDown, Shield, Clock, Star,
  ArrowRight, Zap, Globe2, BadgeCheck
} from 'lucide-react'
import Link from 'next/link'

// ── Data ──────────────────────────────────────────────────────────────────────
const DESTINATIONS = [
  {
    city: 'Tokyo', code: 'TYO', country: 'Japan',
    img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=85',
    tag: 'Most Popular', price: 'from $620',
  },
  {
    city: 'Paris', code: 'CDG', country: 'France',
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=85',
    tag: 'Romantic', price: 'from $480',
  },
  {
    city: 'New York', code: 'JFK', country: 'USA',
    img: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=85',
    tag: 'City Break', price: 'from $390',
  },
  {
    city: 'Dubai', code: 'DXB', country: 'UAE',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=85',
    tag: 'Luxury', price: 'from $310',
  },
  {
    city: 'London', code: 'LHR', country: 'UK',
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=85',
    tag: 'Cultural', price: 'from $420',
  },
  {
    city: 'Bali', code: 'DPS', country: 'Indonesia',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=85',
    tag: 'Tropical', price: 'from $550',
  },
]

const DEALS = [
  { from: 'New York',    fromCode: 'JFK', to: 'London',    toCode: 'LHR', price: '$289', airline: 'British Airways', seats: '4 seats left', badge: '🔥 Hot Deal'   },
  { from: 'Los Angeles', fromCode: 'LAX', to: 'Tokyo',     toCode: 'NRT', price: '$499', airline: 'JAL',            seats: '7 seats left', badge: '⚡ Flash Sale'  },
  { from: 'Dubai',       fromCode: 'DXB', to: 'Singapore', toCode: 'SIN', price: '$199', airline: 'Emirates',       seats: '2 seats left', badge: '🌟 Best Value'  },
]

const FEATURES = [
  { icon: TrendingDown, title: 'Price Drop Alerts', desc: 'Set your target price and we\'ll notify you the instant fares drop — automatically.', color: 'from-sky-500 to-cyan-400' },
  { icon: Globe2, title: '1000+ Airlines', desc: 'We search every airline, low-cost carrier, and booking site to find your best deal.', color: 'from-violet-500 to-purple-400' },
  { icon: Zap, title: 'Instant Booking', desc: 'No redirects, no hassle. Book directly and get your ticket in under 2 minutes.', color: 'from-amber-500 to-orange-400' },
  { icon: BadgeCheck, title: 'Price Guarantee', desc: 'Found it cheaper elsewhere? We\'ll match it. Our price guarantee has you covered.', color: 'from-emerald-500 to-green-400' },
]

const STATS = [
  { value: '500M+', label: 'Flights Searched' },
  { value: '180+', label: 'Countries' },
  { value: '1000+', label: 'Airlines' },
  { value: '4.9★', label: 'App Rating' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', loc: 'New York', text: 'Saved $340 on my Tokyo trip. The price alert feature is absolutely game-changing!', avatar: '👩‍💼' },
  { name: 'Rahul P.', loc: 'Mumbai', text: 'Booked London tickets in 3 minutes. The search is lightning fast and the UI is gorgeous.', avatar: '👨‍💻' },
  { name: 'Aiko T.', loc: 'Singapore', text: 'Best travel aggregator I\'ve used. Found deals I couldn\'t find anywhere else.', avatar: '👩‍🎨' },
]

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-sky-200 text-sm font-medium">{label}</div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { setFlightParams } = useSearchStore()

  /** Fill search form fields then smooth-scroll to it */
  const fillAndScroll = (origin?: string, destination?: string) => {
    if (origin)      setFlightParams({ origin })
    if (destination) setFlightParams({ destination })
    scrollToSearch()
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080f1a]">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col overflow-hidden">
        {/* Static bg — no parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1800&q=85')` }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c2a4a]/90 via-[#0c3560]/80 to-[#071828]/95" />

        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-8">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold px-5 py-2 rounded-full fade-in"
            style={{ animationDelay: '0ms' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live prices · 500M+ searches powered by Google Flights
          </div>

          {/* Headline */}
          <div className="fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6 max-w-4xl">
              Your Dream Trip,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400">
                Unbeatable Price
              </span>
            </h1>
            <p className="text-sky-100/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Search 1000+ airlines and hotels. Set price alerts. Book in minutes.
              <br className="hidden sm:block" />
              Travel smarter with real-time data.
            </p>
          </div>

          {/* Search card — id is the scroll target */}
          <div id="hero-search" className="w-full max-w-5xl fade-in" style={{ animationDelay: '200ms' }}>
            {/* Outer glow ring */}
            <div className="relative rounded-3xl p-px"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 50%, rgba(14,165,233,0.3) 100%)' }}>
              <div className="bg-white/[0.97] dark:bg-slate-900/95 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-6 shadow-2xl shadow-black/30">
                <HeroSearch />
              </div>
            </div>
          </div>

          {/* Popular searches */}
          <div className="flex flex-wrap justify-center gap-2 fade-in" style={{ animationDelay: '300ms' }}>
            <span className="text-sky-200/70 text-sm">Trending:</span>
            {['NYC → London', 'Dubai → Bali', 'Paris → Tokyo'].map((route) => (
              <button
                key={route}
                className="text-sky-300 text-sm hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 transition-all"
              >
                ✈ {route}
              </button>
            ))}
          </div>
        </div>

        {/* Stats ribbon */}
        <div className="relative w-full bg-black/30 backdrop-blur-md border-t border-white/10 py-6">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((s) => <AnimatedStat key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 to-transparent dark:from-sky-950/20 dark:to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-sky-600 dark:text-sky-400 text-sm font-bold tracking-widest uppercase mb-3">Why DestinAir</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Travel smarter,<br />spend less
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto">
              We built the tools frequent travelers wish they had.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-sky-100 dark:hover:shadow-sky-950 transition-all duration-300 hover-lift"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLASH DEALS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-[#080f1a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-amber-500 text-sm font-bold tracking-widest uppercase">⚡ Limited Time</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">Today's Flash Deals</h2>
            </div>
            <Link href="/flights/results" className="hidden sm:flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold text-sm hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEALS.map((deal) => (
              <div
                key={deal.to}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg hover:shadow-sky-100 dark:hover:shadow-sky-950/30 transition-all duration-300 hover-lift"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                    {deal.badge}
                  </span>
                  <span className="text-xs text-red-500 font-semibold animate-pulse">{deal.seats}</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-center">
                    <p className="font-extrabold text-xl text-slate-900 dark:text-white">{deal.from.split(' ')[deal.from.split(' ').length - 1]}</p>
                    <p className="text-xs text-slate-400 font-medium">{deal.from}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-center w-full">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      <Plane className="w-4 h-4 text-sky-500 mx-1" />
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <p className="text-xs text-slate-400">{deal.airline}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-xl text-slate-900 dark:text-white">{deal.to.split(' ')[deal.to.split(' ').length - 1]}</p>
                    <p className="text-xs text-slate-400 font-medium">{deal.to}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-400">Starting from</p>
                    <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">{deal.price}</p>
                  </div>
                  <button
                    onClick={() => fillAndScroll(deal.fromCode, deal.toCode)}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors group-hover:scale-105"
                  >
                    Book now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-sky-600 dark:text-sky-400 text-sm font-bold tracking-widest uppercase">Explore</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                Popular Destinations
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Click a destination to instantly search flights</p>
            </div>
          </div>

          {/* Magazine grid — 3 cols, Tokyo tall left, Bali panoramic bottom */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: '280px 280px 200px',
              gridTemplateAreas: `
                "tokyo paris  newyork"
                "tokyo dubai  london"
                "bali  bali   bali"
              `,
            }}
          >
            {DESTINATIONS.map((dest) => {
              const areaMap: Record<string, string> = {
                TYO: 'tokyo', CDG: 'paris', JFK: 'newyork',
                DXB: 'dubai', LHR: 'london', DPS: 'bali',
              }
              const area = areaMap[dest.code]
              return (
                <button
                  key={dest.code}
                  onClick={() => fillAndScroll(undefined, dest.code)}
                  id={`dest-${dest.code.toLowerCase()}`}
                  style={{ gridArea: area }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer text-left w-full h-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.img}
                    alt={dest.city}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Gradient overlay — stronger on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 group-hover:from-black/90 transition-all duration-300" />

                  {/* Tag badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                      {dest.tag}
                    </span>
                  </div>

                  {/* Hover: search CTA top-right */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <span className="inline-flex items-center gap-1 bg-sky-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                      Search <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Price chip */}
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-sky-300/90 bg-black/30 px-2 py-0.5 rounded-full">
                        {dest.price}
                      </span>
                    </div>
                    <p className="text-white font-extrabold text-xl leading-tight drop-shadow-sm">{dest.city}</p>
                    <p className="text-white/60 text-xs font-medium mt-0.5">{dest.country}</p>

                    {/* Hover underline animation */}
                    <div className="mt-2 h-0.5 w-0 group-hover:w-12 bg-sky-400 rounded-full transition-all duration-300" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sky-600 dark:text-sky-400 text-sm font-bold tracking-widest uppercase">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">Loved by travelers worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 transition-shadow hover-lift">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=60')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Never miss a price drop again
          </h2>
          <p className="text-sky-100 text-lg mb-8 max-w-xl mx-auto">
            Set up a free price alert in 30 seconds and we'll email you the moment fares fall.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-sky-700 font-bold text-base px-8 py-4 rounded-2xl hover:bg-sky-50 transition-colors shadow-lg"
            >
              <Plane className="w-5 h-5" /> Start Searching Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/30 border border-white/30 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4 -ml-3">
              <div className="relative h-10 w-[130px] overflow-hidden">
                <Image
                  src="/destinair-logo white.png"
                  alt="DestinAir"
                  fill
                  quality={100}
                  sizes="260px"
                  className="object-cover object-center"
                />
              </div>
            </div>
            <p className="text-sm leading-relaxed">The smartest way to search flights, hotels, and car rentals worldwide.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-3 text-sm">Product</p>
            <ul className="space-y-2 text-sm">
              {['Flights', 'Hotels', 'Car Rentals', 'Price Alerts'].map((l) => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3 text-sm">Company</p>
            <ul className="space-y-2 text-sm">
              {['About', 'Blog', 'Careers', 'Press'].map((l) => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3 text-sm">Legal</p>
            <ul className="space-y-2 text-sm">
              {['Privacy', 'Terms', 'Cookies', 'Contact'].map((l) => (
                <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4">
          <p className="text-center text-xs text-slate-500">© 2025 DestinAir. Powered by Google Flights via SerpAPI. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
