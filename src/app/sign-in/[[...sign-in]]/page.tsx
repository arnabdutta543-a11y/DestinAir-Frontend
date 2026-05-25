import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      {/* Brand header */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="relative h-14 w-[220px] overflow-hidden">
          {/* Light mode */}
          <Image
            src="/destinair-logo.png"
            alt="DestinAir"
            fill
            quality={100}
            sizes="440px"
            className="object-cover object-center dark:hidden"
            priority
          />
          {/* Dark mode */}
          <Image
            src="/destinair-logo white.png"
            alt="DestinAir"
            fill
            quality={100}
            sizes="440px"
            className="object-cover object-center hidden dark:block"
            priority
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Your global flight companion</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-2xl shadow-sky-100/50 dark:shadow-sky-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl',
            headerTitle: 'text-slate-900 dark:text-white font-extrabold',
            headerSubtitle: 'text-slate-500 dark:text-slate-400',
            socialButtonsBlockButton: 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors',
            formButtonPrimary: 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl font-semibold shadow-lg shadow-sky-200/50 transition-all',
            formFieldInput: 'rounded-xl border-slate-200 dark:border-slate-700 focus:border-sky-400 focus:ring-sky-400',
            footerActionLink: 'text-sky-600 hover:text-sky-700 font-semibold',
          },
        }}
      />
    </div>
  )
}
