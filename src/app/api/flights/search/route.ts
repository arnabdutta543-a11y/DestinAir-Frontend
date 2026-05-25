import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30   // allow up to 30s for SerpAPI polling

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/**
 * GET /api/flights/search → proxies to FastAPI /api/v1/flights/search
 *
 * Forwards all search + filter params so filtering happens server-side
 * (and each unique filter combo is cached independently in Redis).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // ── Core search params ──────────────────────────────────────────────────
  const backendParams = new URLSearchParams()
  backendParams.set('origin',         params.get('origin')        ?? '')
  backendParams.set('destination',    params.get('destination')   ?? '')
  backendParams.set('departure_date', params.get('departureDate') ?? '')
  backendParams.set('adults',         params.get('adults')        ?? '1')
  backendParams.set('travel_class',   params.get('cabin') ?? params.get('travelClass') ?? 'ECONOMY')
  backendParams.set('currency',       params.get('currency')      ?? 'USD')

  const returnDate = params.get('returnDate')
  if (returnDate) backendParams.set('return_date', returnDate)

  // ── Filter params (forwarded as-is) ─────────────────────────────────────
  const filterMap: Record<string, string> = {
    filterStops:       'filter_stops',
    filterMaxPrice:    'filter_max_price',
    filterDepStart:    'filter_dep_start',
    filterDepEnd:      'filter_dep_end',
    filterMaxDuration: 'filter_max_duration',
    filterAirlines:    'filter_airlines',
    filterBaggage:     'filter_baggage',
    filterWifi:        'filter_wifi',
    filterRefundable:  'filter_refundable',
  }
  for (const [frontKey, backKey] of Object.entries(filterMap)) {
    const val = params.get(frontKey)
    if (val !== null && val !== '') backendParams.set(backKey, val)
  }

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/flights/search?${backendParams.toString()}`,
      {
        next:   { revalidate: 0 },          // no edge caching — backend Redis handles it
        signal: AbortSignal.timeout(28_000), // 28s — backend polls up to ~12s
      }
    )

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
    console.error('[flights/search proxy] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', source: 'error', offers: [] },
      { status: 502 }
    )
  }
}
