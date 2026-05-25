import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/**
 * GET /api/geo
 *
 * Reads the REAL client IP from Next.js request headers (Vercel, Nginx, etc.
 * all set x-forwarded-for or x-real-ip). Forwards it to the FastAPI backend
 * so ipapi.co resolves the visitor's actual location, not the server's.
 *
 * Returns: { currency, country, countryCode, flag, city }
 */
export async function GET(request: NextRequest) {
  // Extract the real client IP (works on Vercel, behind Nginx, locally)
  const xff       = request.headers.get('x-forwarded-for')
  const realIp    = request.headers.get('x-real-ip')
  const cfIp      = request.headers.get('cf-connecting-ip')   // Cloudflare
  const clientIp  = cfIp ?? xff?.split(',')[0]?.trim() ?? realIp ?? ''

  try {
    const backendUrl = `${BACKEND}/api/v1/currency/detect`
    const res = await fetch(backendUrl, {
      headers: {
        // Forward real IP so backend ipapi.co call resolves correctly
        'X-Forwarded-For': clientIp,
        'X-Real-IP':       clientIp,
      },
      // Short timeout — this is a best-effort call
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) {
      return NextResponse.json({ currency: 'USD', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: '' })
    }

    const data = await res.json()
    return NextResponse.json(data)

  } catch {
    // Graceful fallback — never break the app
    return NextResponse.json({ currency: 'USD', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: '' })
  }
}
