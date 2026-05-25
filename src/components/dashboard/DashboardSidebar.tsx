'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, User, Bell, BookOpen, History, ChevronRight } from 'lucide-react'

const SIDEBAR_LINKS = [
  { href: '/dashboard',          label: 'Profile',         icon: User,     desc: 'Account info'    },
  { href: '/dashboard/searches', label: 'Recent Searches', icon: History,  desc: 'Search history'  },
  { href: '/dashboard/alerts',   label: 'Price Alerts',    icon: Bell,     desc: 'Track prices'    },
  { href: '/dashboard/bookings', label: 'My Bookings',     icon: BookOpen, desc: 'Tracked flights' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden sticky top-24">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">My Account</p>
              <p className="text-white/60 text-[11px]">DestinAir Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-col gap-1">
          {SIDEBAR_LINKS.map(({ href, label, icon: Icon, desc }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href} href={href}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/50 dark:to-indigo-950/50 border border-sky-100 dark:border-sky-900/50 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-200 dark:shadow-sky-900/40'
                    : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-950/40'
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isActive ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{desc}</p>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-100 dark:border-sky-900/40">
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 mb-0.5">✈️ Pro Tip</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Set a price alert and save up to 40% on flights!
          </p>
        </div>
      </div>
    </aside>
  )
}
