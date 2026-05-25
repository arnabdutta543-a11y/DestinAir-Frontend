import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q) return NextResponse.json({ data: [] })

  try {
    const res = await fetch(
      `${BACKEND}/api/v1/flights/autocomplete?q=${encodeURIComponent(q)}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) {
      return NextResponse.json({ data: [], error: `Backend ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ data: [], error: 'Backend unreachable' }, { status: 502 })
  }
}
