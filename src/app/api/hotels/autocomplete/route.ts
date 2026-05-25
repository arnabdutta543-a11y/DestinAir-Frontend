import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  
  try {
    const res = await fetch(
      `${BACKEND}/api/v1/hotels/autocomplete?q=${encodeURIComponent(q)}`,
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
    console.error('[hotels/autocomplete proxy] Backend unreachable:', err)
    return NextResponse.json(
      { error: 'Backend unreachable', suggestions: [] },
      { status: 502 }
    )
  }
}
