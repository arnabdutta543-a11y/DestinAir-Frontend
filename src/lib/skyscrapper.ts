/**
 * Sky Scrapper via RapidAPI — server-side only
 *
 * Sign up FREE at: https://rapidapi.com/apiheya/api/sky-scrapper
 * → Subscribe to "Basic" plan (free, no card)
 * → Copy your X-RapidAPI-Key from the dashboard
 *
 * Add to .env.local:
 *   RAPIDAPI_KEY=your_key_here
 *
 * API flow:
 *   1. searchAirport(query)  → get skyId + entityId for a city/airport
 *   2. searchFlights(params) → pass skyId values to get live prices
 *
 * Docs: https://rapidapi.com/apiheya/api/sky-scrapper
 */

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY ?? ''
const RAPIDAPI_HOST = 'sky-scrapper.p.rapidapi.com'
const BASE_URL      = `https://${RAPIDAPI_HOST}`

const DEFAULT_HEADERS = {
  'X-RapidAPI-Key':  RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST,
  'Content-Type':    'application/json',
}

/* ─── Generic GET helper ───────────────────────────────────────────────────── */
async function apiGet<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not set. Add it to .env.local')
  }

  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v))
    }
  })

  const res = await fetch(url.toString(), {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 300 }, // Cache in Next.js for 5 minutes
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Sky Scrapper API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Shared Types                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface AirportResult {
  skyId:     string   // e.g. "LOND"
  entityId:  string   // e.g. "27544008"
  name:      string   // e.g. "London"
  iataCode:  string   // e.g. "LHR"
  city:      string
  country:   string
  type:      string   // "AIRPORT" | "CITY"
}

export interface FlightSearchParams {
  /** skyId from searchAirport — e.g. "JFK"  */
  originSkyId:            string
  /** entityId from searchAirport — e.g. "95565058" */
  originEntityId:         string
  destinationSkyId:       string
  destinationEntityId:    string
  departureDate:          string   // YYYY-MM-DD
  returnDate?:            string   // YYYY-MM-DD (round trip)
  adults?:                number   // default 1
  children?:              number   // default 0
  infants?:               number   // default 0
  cabinClass?:            'economy' | 'premium_economy' | 'business' | 'first'
  currency?:              string   // 'USD', 'INR', 'EUR', etc.
  countryCode?:           string   // 'US', 'IN', 'GB', etc.
  market?:                string   // 'en-US', 'en-GB', etc.
  limit?:                 number
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* API Methods                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Step 1 — Resolve airport/city to skyId + entityId
 * GET /api/v1/flights/searchAirport
 */
export async function searchAirport(query: string, locale = 'en-US') {
  interface RawResponse {
    status:  boolean
    data: Array<{
      skyId:        string
      entityId:     string
      presentation: { title: string; suggestionTitle: string; subtitle: string }
      navigation: {
        entityId:    string
        entityType:  string
        localizedName: string
        relevantFlightParams: {
          skyId:        string
          entityId:     string
          flightPlaceType: string
          localizedName: string
        }
      }
    }>
  }

  const raw = await apiGet<RawResponse>('/api/v1/flights/searchAirport', {
    query,
    locale,
  })

  if (!raw?.data) return []

  // Normalise to a simple, flat shape
  return raw.data.map((item) => ({
    skyId:    item.navigation.relevantFlightParams.skyId,
    entityId: item.navigation.relevantFlightParams.entityId,
    iataCode: item.navigation.relevantFlightParams.skyId,
    name:     item.presentation.title,
    city:     item.navigation.relevantFlightParams.localizedName,
    country:  item.presentation.subtitle,
    type:     item.navigation.relevantFlightParams.flightPlaceType,
  })) as AirportResult[]
}

/**
 * Step 2 — Search flights with skyId values
 * GET /api/v2/flights/searchFlights   (v2 returns richer data)
 */
export async function searchFlights(params: FlightSearchParams) {
  return apiGet('/api/v2/flights/searchFlights', {
    originSkyId:         params.originSkyId,
    originEntityId:      params.originEntityId,
    destinationSkyId:    params.destinationSkyId,
    destinationEntityId: params.destinationEntityId,
    date:                params.departureDate,
    returnDate:          params.returnDate,
    adults:              params.adults ?? 1,
    children:            params.children ?? 0,
    infants:             params.infants ?? 0,
    cabinClass:          params.cabinClass ?? 'economy',
    currency:            params.currency ?? 'USD',
    countryCode:         params.countryCode ?? 'US',
    market:              params.market ?? 'en-US',
  })
}

/**
 * Price Calendar — shows cheapest days in a month
 * GET /api/v1/flights/getPriceCalendar
 */
export async function getPriceCalendar(params: {
  originSkyId:         string
  originEntityId:      string
  destinationSkyId:    string
  destinationEntityId: string
  fromDate:            string   // YYYY-MM-DD
  toDate?:             string   // YYYY-MM-DD
  currency?:           string
}) {
  return apiGet('/api/v1/flights/getPriceCalendar', {
    originSkyId:         params.originSkyId,
    originEntityId:      params.originEntityId,
    destinationSkyId:    params.destinationSkyId,
    destinationEntityId: params.destinationEntityId,
    fromDate:            params.fromDate,
    toDate:              params.toDate,
    currency:            params.currency ?? 'USD',
  })
}

/**
 * Nearby Airports
 * GET /api/v1/flights/getNearByAirports
 */
export async function getNearbyAirports(lat: number, lng: number, locale = 'en-US') {
  return apiGet('/api/v1/flights/getNearByAirports', { lat, lng, locale })
}
