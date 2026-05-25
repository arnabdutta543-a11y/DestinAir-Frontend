import { currentUser } from '@clerk/nextjs/server'
import { Mail, Calendar, Zap, ArrowUpRight, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

function fmtProvider(raw?: string) {
  if (!raw) return 'Email & Password'
  const map: Record<string, string> = {
    oauth_google: 'Google',
    oauth_github: 'GitHub',
    oauth_facebook: 'Facebook',
    oauth_apple: 'Apple',
  }
  return map[raw] ?? raw.replace('oauth_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default async function ProfilePage() {
  const user = await currentUser()

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Traveler'
  const email = user?.emailAddresses[0]?.emailAddress ?? '—'
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'
  const provider = fmtProvider(user?.externalAccounts[0]?.provider)
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(n => n![0]).join('').toUpperCase() || '?'

  return (
    <div className="space-y-6 fade-in">

      {/* ── Top hero card ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">

        {/* Top colour strip */}
        <div className="h-3 w-full" style={{ background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7)' }} />

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl ring-4 ring-white dark:ring-slate-900">
              {user?.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Active" />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">{displayName}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Verified
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> {provider}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Member since {joinDate}</p>
          </div>

          {/* Quick CTA */}
          <Link
            href="/dashboard/alerts"
            className="shrink-0 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-sm font-bold shadow-md shadow-sky-200 dark:shadow-sky-900/30 hover:shadow-lg hover:scale-105 transition-all"
          >
            <Zap className="w-4 h-4" /> Set Alert
          </Link>
        </div>
      </div>

      {/* ── Info grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoTile icon={Mail} label="Email address" value={email} accent="sky" />
        <InfoTile icon={Calendar} label="Member since" value={joinDate} accent="indigo" />
      </div>

      {/* ── Quick stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <QuickStat href="/dashboard/searches" icon="🔍" label="Searches"  gradient="from-sky-500 to-cyan-500" />
        <QuickStat href="/dashboard/alerts"   icon="🔔" label="Alerts"   gradient="from-amber-500 to-orange-500" />
        <QuickStat href="/dashboard/bookings" icon="✈️" label="Bookings" gradient="from-violet-500 to-purple-600" />
      </div>

      {/* ── Feature shortcuts ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FeatureCard
          href="/dashboard/searches"
          gradient="from-sky-500 to-indigo-500"
          emoji="🕐"
          title="Recent Searches"
          desc="Jump back into your last flight searches instantly."
        />
        <FeatureCard
          href="/dashboard/alerts"
          gradient="from-amber-500 to-red-500"
          emoji="🔔"
          title="Price Alerts"
          desc="We'll notify you the moment your target price is hit."
        />
      </div>

      <p className="text-[11px] text-slate-400 italic">
        💡 Currency can be changed from the 🌍 globe icon in the navbar.
      </p>
    </div>
  )
}

/* ─── Sub-components ────────────────────────────────────────────────────────── */

const accentMap: Record<string, { bg: string; icon: string; border: string }> = {
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    icon: 'bg-sky-500',
    border: 'border-sky-100 dark:border-sky-900/50',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: 'bg-indigo-500',
    border: 'border-indigo-100 dark:border-indigo-900/50',
  },
}

function InfoTile({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent: string
}) {
  const a = accentMap[accent] ?? accentMap.sky
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${a.bg} ${a.border}`}>
      <div className={`w-10 h-10 rounded-xl ${a.icon} flex items-center justify-center shadow-sm shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  )
}

function QuickStat({ href, icon, label, gradient }: {
  href: string; icon: string; label: string; gradient: string
}) {
  return (
    <Link href={href} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl mx-auto mb-2 shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-[10px] text-sky-500 font-semibold mt-0.5 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        View <ArrowUpRight className="w-3 h-3" />
      </p>
    </Link>
  )
}

function FeatureCard({ href, gradient, emoji, title, desc }: {
  href: string; gradient: string; emoji: string; title: string; desc: string
}) {
  return (
    <Link href={href} className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 overflow-hidden hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all">
      {/* Subtle gradient accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
      <div className="relative">
        <span className="text-3xl mb-3 block">{emoji}</span>
        <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-sm">
          {title}
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </Link>
  )
}
