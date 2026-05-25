import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/**
 * GET /api/airports/search → proxies to FastAPI /api/v1/flights/airports
 *
 * Airport autocomplete backed by SerpAPI Google Flights airports endpoint (via backend).
 * Falls back to static list when backend is unreachable.
 */
export async function GET(request: NextRequest) {
  const query = (
    request.nextUrl.searchParams.get('query') ||
    request.nextUrl.searchParams.get('q') ||
    ''
  ).trim()

  const limit = request.nextUrl.searchParams.get('limit') ?? '7'

  if (!query) return NextResponse.json({ data: [] })

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/flights/airports?query=${encodeURIComponent(query)}&limit=${limit}`,
      { next: { revalidate: 3600 } }   // 1h edge cache for airport lookups
    )

    if (!res.ok) throw new Error(`Backend ${res.status}`)

    const data = await res.json()
    return NextResponse.json(data)

  } catch (err) {
    console.error('[airports/search proxy] Backend unreachable:', err)
    // Static fallback — import directly so the frontend never breaks
    const { searchAirportsStatic } = await import('@/lib/mock-flights')
    const airports = searchAirportsStatic(query, Number(limit))
    return NextResponse.json({ data: airports, source: 'static-fallback' })
  }
}
