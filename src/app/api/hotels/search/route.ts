import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const backendParams = new URLSearchParams()
  const q = params.get('q')
  const cityCode = params.get('city_code')
  
  if (q) backendParams.set('q', q)
  if (cityCode) backendParams.set('city_code', cityCode)
  
  backendParams.set('check_in',  params.get('check_in')  ?? '')
  backendParams.set('check_out', params.get('check_out') ?? '')
  backendParams.set('adults',    params.get('adults')    ?? '1')
  backendParams.set('currency',  params.get('currency')  ?? 'USD')

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/hotels/search?${backendParams.toString()}`,
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
    console.error('[hotels/search proxy] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', properties: [] },
      { status: 502 }
    )
  }
}
