/**
 * Travelpayouts / Aviasales Data API — server-side only
 *
 * ✅ FREE — just sign up as affiliate at travelpayouts.com
 * ✅ No monthly request limits on cached data endpoints
 * ✅ Real prices from the last 48h of user searches
 *
 * Your key is in .env.local:
 *   TRAVELPAYOUTS_TOKEN=58403dc7a3b3614199de260122a0d062
 *
 * API docs: https://travelpayouts.github.io/slate/
 */

const TOKEN   = process.env.TRAVELPAYOUTS_TOKEN ?? ''
const BASE    = 'https://api.travelpayouts.com'

async function tpGet<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('token', TOKEN)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Encoding': 'gzip, deflate' },
    next: { revalidate: 3600 }, // Cache 1 hour — data is cached on their end anyway
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Travelpayouts ${res.status}: ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Types                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface CheapTicket {
  origin:           string   // IATA code
  destination:      string
  price:            number   // in the requested currency
  airline:          string   // IATA airline code
  flight_number:    number
  departure_at:     string   // ISO timestamp
  return_at:        string   // ISO timestamp (empty for one-way)
  transfers:        number   // number of stopovers
  duration:         number   // total duration in minutes
  duration_to:      number
  duration_back:    number
  link:             string   // booking deep-link on aviasales.com
  expires_at:       string
}

export interface NonStopTicket {
  price:         number
  airline:       string
  flight_number: number
  departure_at:  string
  return_at:     string
  link:          string
}

export interface CalendarDay {
  price:        number
  found_at:     string
  departure_at: string
  return_at:    string
  transfers:    number
  airline:      string
  duration:     number
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* API Methods                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Cheapest tickets for a route (cached, from last user searches)
 * /v1/prices/cheap
 *
 * @param origin       IATA code e.g. "DEL"
 * @param destination  IATA code e.g. "LHR" (or empty for anywhere)
 * @param currency     "usd" | "inr" | "eur" | "gbp" etc.
 * @param page         0-indexed pagination
 */
export async function getCheapTickets(
  origin: string,
  destination: string,
  currency = 'usd',
  page = 1,
) {
  interface Resp {
    success: boolean
    data: Record<string, Record<string, CheapTicket>>
    currency: string
  }

  const raw = await tpGet<Resp>('/v1/prices/cheap', {
    origin,
    destination: destination || '-',
    currency,
    page,
    limit: 30,
  })

  if (!raw?.success || !raw.data) return []

  // Flatten nested { destination: { "1": ticket, "2": ticket } }
  const tickets: CheapTicket[] = []
  for (const dest of Object.values(raw.data)) {
    for (const ticket of Object.values(dest)) {
      tickets.push(ticket)
    }
  }

  return tickets.sort((a, b) => a.price - b.price)
}

/**
 * Month price calendar — cheapest price per day
 * /v1/prices/calendar
 *
 * @param origin       IATA code
 * @param destination  IATA code
 * @param month        YYYY-MM (e.g. "2026-06")
 * @param currency     "usd" | "inr" etc.
 * @param tripDuration days for return trip (omit for one-way)
 */
export async function getPriceCalendar(
  origin: string,
  destination: string,
  month: string,
  currency = 'usd',
  tripDuration?: number,
) {
  interface Resp {
    success: boolean
    data: Record<string, CalendarDay>
    currency: string
  }

  const raw = await tpGet<Resp>('/v1/prices/calendar', {
    origin,
    destination,
    month,
    currency,
    trip_duration: tripDuration,
  })

  if (!raw?.success) return []
  return Object.entries(raw.data).map(([date, d]) => ({ date, ...d }))
}

/**
 * Latest cheapest tickets for a route
 * /v2/prices/latest
 */
export async function getLatestPrices(
  origin: string,
  destination?: string,
  currency = 'usd',
  limit = 20,
) {
  interface Resp {
    success: boolean
    data: CheapTicket[]
  }

  const raw = await tpGet<Resp>('/v2/prices/latest', {
    origin,
    destination,
    currency,
    limit,
    sorting: 'price',
    one_way: true,
  })

  return raw?.data || []
}

/**
 * Non-stop only tickets
 * /v1/prices/nonstop
 */
export async function getNonStopTickets(
  origin: string,
  destination: string,
  currency = 'usd',
) {
  interface Resp {
    success: boolean
    data: Record<string, NonStopTicket>
    currency: string
  }

  const raw = await tpGet<Resp>('/v1/prices/nonstop', {
    origin,
    destination,
    currency,
  })

  if (!raw?.success) return []
  return Object.values(raw.data || {})
}

/**
 * Popular destinations from an origin
 * /v1/city-directions
 */
export async function getPopularDestinations(origin: string, currency = 'usd') {
  interface Resp {
    success: boolean
    data: Record<string, { price: number; transfers: number; airline: string; departure_at: string }>
  }

  const raw = await tpGet<Resp>('/v1/city-directions', {
    origin,
    currency,
  })

  if (!raw?.success) return []
  return Object.entries(raw.data || {}).map(([dest, info]) => ({
    destination: dest,
    ...info,
  }))
}
