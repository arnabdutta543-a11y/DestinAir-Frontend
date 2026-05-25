import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const propertyToken = params.get('property_token')

  if (!propertyToken) {
    return NextResponse.json({ error: 'Missing property_token' }, { status: 400 })
  }

  const backendParams = new URLSearchParams({ property_token: propertyToken })
  const sortBy = params.get('sort_by')
  const nextPageToken = params.get('next_page_token')
  if (sortBy) backendParams.set('sort_by', sortBy)
  if (nextPageToken) backendParams.set('next_page_token', nextPageToken)

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/hotels/reviews?${backendParams}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json({ error: `Backend error ${res.status}`, detail: body }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[hotels/reviews proxy]', err)
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 })
  }
}
