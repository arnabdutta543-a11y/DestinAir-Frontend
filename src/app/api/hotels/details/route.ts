import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const backendParams = new URLSearchParams()
  const propertyToken = params.get('property_token')
  const checkIn = params.get('check_in')
  const checkOut = params.get('check_out')
  const adults = params.get('adults')
  const currency = params.get('currency')

  if (!propertyToken) {
    return NextResponse.json(
      { error: 'Missing required parameter: property_token' },
      { status: 400 }
    )
  }

  backendParams.set('property_token', propertyToken)
  if (checkIn) backendParams.set('check_in', checkIn)
  if (checkOut) backendParams.set('check_out', checkOut)
  if (adults) backendParams.set('adults', adults)
  if (currency) backendParams.set('currency', currency)

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/hotels/details?${backendParams.toString()}`,
      { next: { revalidate: 0 } }
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
    console.error('[hotels/details proxy] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', details: null },
      { status: 502 }
    )
  }
}
