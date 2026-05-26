import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const origin      = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const year        = searchParams.get('year')
  const month       = searchParams.get('month')
  const currency    = searchParams.get('currency') ?? 'USD'
  const adults      = searchParams.get('adults') ?? '1'
  const travelClass = searchParams.get('travel_class') ?? '1'

  if (!origin || !destination || !year || !month) {
    return NextResponse.json({ error: 'origin, destination, year, month are required' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ origin, destination, year, month, currency, adults, travel_class: travelClass })
    const res = await fetch(`${BACKEND}/api/v1/flights/price-calendar?${params}`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      return NextResponse.json({ data: {}, error: `Backend ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ data: {}, error: 'Backend unreachable' }, { status: 502 })
  }
}
