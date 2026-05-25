import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: { default: 'DestinAir — Find Flights, Hotels & Cars', template: '%s | DestinAir' },
  description: 'Search and compare the best deals on flights, hotels, and car rentals worldwide. Price alerts, multi-currency support, and real-time availability.',
  keywords: ['flights', 'hotels', 'car rentals', 'travel', 'cheap flights', 'price comparison', 'destinair'],
  metadataBase: new URL('https://destinair.app'),
  openGraph: {
    type: 'website',
    title: 'DestinAir — Best Travel Deals',
    description: 'Compare flights, hotels and car rentals worldwide.',
    siteName: 'DestinAir',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body suppressHydrationWarning>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
