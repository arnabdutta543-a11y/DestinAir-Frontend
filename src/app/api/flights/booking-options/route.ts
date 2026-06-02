import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30   // allow up to 30s for SerpAPI booking options

// Use the server-side env var (no NEXT_PUBLIC_ prefix) for the backend URL when
// available, so it is never exposed to the browser bundle.
const BACKEND =
  process.env.BACKEND_URL ??           // server-only override (preferred)
  process.env.NEXT_PUBLIC_API_URL ??   // fallback for local dev
  'http://localhost:8000'

/**
 * GET /api/flights/booking-options → proxies to FastAPI /api/v1/flights/booking-options
 *
 * By routing through this Next.js server-side proxy we avoid the browser
 * making a direct call to the backend URL. On Vercel the backend URL must be
 * configured as BACKEND_URL (server-only) or NEXT_PUBLIC_API_URL.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // Forward all query params as-is to the FastAPI backend
  const backendUrl = `${BACKEND}/api/v1/flights/booking-options?${params.toString()}`

  try {
    const res = await fetch(backendUrl, {
      next:   { revalidate: 0 },
      signal: AbortSignal.timeout(28_000),
    })

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json(
        { error: `Backend error ${res.status}`, detail: body },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)

  } catch (err) {
    console.error('[flights/booking-options proxy] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', bookingOptions: [] },
      { status: 502 }
    )
  }
}
