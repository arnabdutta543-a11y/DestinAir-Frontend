/**
 * Rich realistic mock flight data
 * Used as fallback when SerpAPI is unavailable or the backend is offline.
 *
 * Format matches our normalised FlightOffer interface so the results page
 * works identically with live and mock data.
 */

export interface SegmentDetail {
  origin:      string   // IATA
  destination: string   // IATA
  departureAt: string   // ISO
  arrivalAt:   string   // ISO
  duration:    number   // minutes
  airline:     string
  airlineCode: string
  airlineIcon?: string
  flightNo:    string
  cabin:       string
  layoverMins?: number | null  // minutes until next segment (null for last leg)
}

export interface FlightOffer {
  id:           string
  airline:      string
  airlineCode:  string
  airlineIcon?: string
  flightNo:     string
  origin:       string
  destination:  string
  departureAt:  string
  arrivalAt:    string
  duration:     number
  stops:        number
  layovers?:    string[]
  segments?:    SegmentDetail[]
  cabin:        string
  price:        number
  seatsLeft?:   number
  baggage:      boolean
  wifi:         boolean
  refundable:   boolean      // free cancellation / refundable fare
  bookingUrl?:  string
  bookingToken?: string      // SerpAPI booking token for provider lookup
  tags:         string[]
}

/* ─── Airline metadata ──────────────────────────────────────────────────────── */
const AIRLINES = [
  { code: 'EK', name: 'Emirates',           color: '#C41230' },
  { code: 'SQ', name: 'Singapore Airlines', color: '#0033A0' },
  { code: 'BA', name: 'British Airways',    color: '#2B5EAF' },
  { code: 'AI', name: 'Air India',          color: '#E8272B' },
  { code: '6E', name: 'IndiGo',             color: '#00BFFF' },
  { code: 'QR', name: 'Qatar Airways',      color: '#5C0632' },
  { code: 'LH', name: 'Lufthansa',          color: '#003670' },
  { code: 'AF', name: 'Air France',         color: '#002157' },
  { code: 'TK', name: 'Turkish Airlines',  color: '#C8102E' },
  { code: 'AK', name: 'AirAsia',            color: '#FF0000' },
  { code: 'AA', name: 'American Airlines',  color: '#00467F' },
  { code: 'UA', name: 'United Airlines',    color: '#003580' },
  { code: 'NH', name: 'ANA',                color: '#12284C' },
  { code: 'CX', name: 'Cathay Pacific',     color: '#006564' },
  { code: 'MS', name: 'EgyptAir',           color: '#0C4E8B' },
]

/* ─── Route seed data ────────────────────────────────────────────────────────
   Each entry becomes ~3–5 flight offers with varied times, airlines, prices.  */
const ROUTES = [
  // India
  { from: 'DEL', to: 'BOM', baseMins: 125,  baseUSD: 55,   domestic: true  },
  { from: 'DEL', to: 'BLR', baseMins: 160,  baseUSD: 65,   domestic: true  },
  { from: 'DEL', to: 'HYD', baseMins: 145,  baseUSD: 60,   domestic: true  },
  { from: 'DEL', to: 'MAA', baseMins: 165,  baseUSD: 70,   domestic: true  },
  { from: 'BOM', to: 'DEL', baseMins: 125,  baseUSD: 58,   domestic: true  },
  { from: 'BOM', to: 'BLR', baseMins: 100,  baseUSD: 45,   domestic: true  },
  // India → international
  { from: 'DEL', to: 'DXB', baseMins: 210,  baseUSD: 180,  domestic: false },
  { from: 'DEL', to: 'LHR', baseMins: 510,  baseUSD: 480,  domestic: false },
  { from: 'DEL', to: 'JFK', baseMins: 900,  baseUSD: 750,  domestic: false },
  { from: 'DEL', to: 'SIN', baseMins: 360,  baseUSD: 280,  domestic: false },
  { from: 'BOM', to: 'DXB', baseMins: 190,  baseUSD: 160,  domestic: false },
  { from: 'BOM', to: 'LHR', baseMins: 540,  baseUSD: 490,  domestic: false },
  // Popular international
  { from: 'JFK', to: 'LHR', baseMins: 420,  baseUSD: 520,  domestic: false },
  { from: 'JFK', to: 'CDG', baseMins: 445,  baseUSD: 540,  domestic: false },
  { from: 'JFK', to: 'DXB', baseMins: 810,  baseUSD: 680,  domestic: false },
  { from: 'LHR', to: 'DXB', baseMins: 420,  baseUSD: 420,  domestic: false },
  { from: 'LHR', to: 'SIN', baseMins: 780,  baseUSD: 690,  domestic: false },
  { from: 'DXB', to: 'SIN', baseMins: 420,  baseUSD: 350,  domestic: false },
  { from: 'DXB', to: 'NRT', baseMins: 600,  baseUSD: 550,  domestic: false },
  { from: 'SIN', to: 'NRT', baseMins: 420,  baseUSD: 420,  domestic: false },
  { from: 'SIN', to: 'SYD', baseMins: 480,  baseUSD: 400,  domestic: false },
  { from: 'LAX', to: 'NRT', baseMins: 660,  baseUSD: 680,  domestic: false },
  { from: 'CDG', to: 'NRT', baseMins: 720,  baseUSD: 720,  domestic: false },
]

const DEPARTURE_SLOTS = [
  '05:30', '06:15', '07:00', '08:45', '09:30',
  '10:15', '11:00', '12:30', '13:45', '14:20',
  '15:05', '16:30', '17:00', '18:45', '19:30',
  '20:15', '21:00', '22:30', '23:00',
]

function pickAirlines(from: string, to: string, count: number) {
  // Deterministically pick airlines based on route string
  const seed = (from + to).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const shuffled = [...AIRLINES].sort((a, b) =>
    (seed * a.code.charCodeAt(0)) % 17 - (seed * b.code.charCodeAt(0)) % 17
  )
  return shuffled.slice(0, count)
}

function addMinutes(isoDate: string, minutes: number): string {
  return new Date(new Date(isoDate).getTime() + minutes * 60000).toISOString()
}

function buildIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00.000Z`).toISOString()
}

function priceVariant(base: number, seed: number): number {
  const multipliers = [0.85, 0.90, 0.95, 1.0, 1.05, 1.12, 1.20, 1.35]
  return Math.round(base * multipliers[seed % multipliers.length])
}

/** Generate 3–6 realistic flight offers for a given route + date */
export function generateMockFlights(
  origin: string,
  destination: string,
  departureDate: string,  // YYYY-MM-DD
  adults = 1,
  cabin = 'ECONOMY',
): FlightOffer[] {
  const route = ROUTES.find(
    (r) => r.from === origin.toUpperCase() && r.to === destination.toUpperCase()
  )

  // If no exact route, generate generic international-style flights
  const baseMins = route?.baseMins ?? 480
  const baseUSD  = route?.baseUSD  ?? 400

  const airlines = pickAirlines(origin, destination, 6)
  const slots    = [...DEPARTURE_SLOTS].sort(() => Math.random() - 0.5).slice(0, 6)

  const offers: FlightOffer[] = slots.map((slot, i) => {
    const airline   = airlines[i % airlines.length]
    const durationV = baseMins + (i % 3 === 0 ? 0 : i % 3 === 1 ? 45 : -20)
    const price     = priceVariant(baseUSD * adults, i + origin.charCodeAt(0))
    const stops     = i === 0 ? 0 : i <= 2 ? 0 : 1   // first 3 tend to be direct

    const departIso = buildIso(departureDate, slot)
    const arrIso    = addMinutes(departIso, durationV)

    const tags: string[] = []
    if (i === 0) tags.push('cheapest')
    if (i === 1) tags.push('fastest')
    if (i === 2) tags.push('best')
    if (stops === 0) tags.push('direct')

    return {
      id:          `mock-${origin}-${destination}-${i}-${departureDate}`,
      airline:     airline.name,
      airlineCode: airline.code,
      flightNo:    `${airline.code} ${100 + i * 13 + origin.charCodeAt(0) % 100}`,
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureAt: departIso,
      arrivalAt:   arrIso,
      duration:    durationV,
      stops,
      cabin,
      price,
      seatsLeft:   stops === 0 ? 4 + (i % 5) : 9,
      baggage:     cabin !== 'ECONOMY' || i % 2 === 0,
      wifi:        cabin === 'BUSINESS' || cabin === 'FIRST' || i % 3 !== 0,
      refundable:  cabin === 'BUSINESS' || cabin === 'FIRST' || i % 3 === 0,
      bookingUrl:  undefined,
      tags,
    }
  })

  return offers.sort((a, b) => a.price - b.price)
}

/** Full airport list for autocomplete fallback */
export const AIRPORTS_STATIC = [
  // India
  { code: 'DEL', city: 'New Delhi',     country: 'India',       name: 'Indira Gandhi Intl' },
  { code: 'BOM', city: 'Mumbai',        country: 'India',       name: 'Chhatrapati Shivaji Maharaj Intl' },
  { code: 'BLR', city: 'Bengaluru',     country: 'India',       name: 'Kempegowda Intl' },
  { code: 'HYD', city: 'Hyderabad',     country: 'India',       name: 'Rajiv Gandhi Intl' },
  { code: 'MAA', city: 'Chennai',       country: 'India',       name: 'Chennai Intl' },
  { code: 'CCU', city: 'Kolkata',       country: 'India',       name: 'Netaji Subhas Chandra Bose Intl' },
  { code: 'COK', city: 'Kochi',         country: 'India',       name: 'Cochin Intl' },
  { code: 'GOI', city: 'Goa',           country: 'India',       name: 'Goa Intl' },
  // Middle East
  { code: 'DXB', city: 'Dubai',         country: 'UAE',         name: 'Dubai Intl' },
  { code: 'AUH', city: 'Abu Dhabi',     country: 'UAE',         name: 'Zayed Intl' },
  { code: 'DOH', city: 'Doha',          country: 'Qatar',       name: 'Hamad Intl' },
  // Europe
  { code: 'LHR', city: 'London',        country: 'UK',          name: 'Heathrow' },
  { code: 'LGW', city: 'London',        country: 'UK',          name: 'Gatwick' },
  { code: 'CDG', city: 'Paris',         country: 'France',      name: 'Charles de Gaulle' },
  { code: 'AMS', city: 'Amsterdam',     country: 'Netherlands', name: 'Schiphol' },
  { code: 'FRA', city: 'Frankfurt',     country: 'Germany',     name: 'Frankfurt Intl' },
  { code: 'MAD', city: 'Madrid',        country: 'Spain',       name: 'Adolfo Suárez' },
  { code: 'BCN', city: 'Barcelona',     country: 'Spain',       name: 'El Prat' },
  { code: 'FCO', city: 'Rome',          country: 'Italy',       name: 'Leonardo da Vinci' },
  { code: 'IST', city: 'Istanbul',      country: 'Turkey',      name: 'Istanbul Airport' },
  // USA
  { code: 'JFK', city: 'New York',      country: 'USA',         name: 'John F. Kennedy Intl' },
  { code: 'LAX', city: 'Los Angeles',   country: 'USA',         name: 'Los Angeles Intl' },
  { code: 'ORD', city: 'Chicago',       country: 'USA',         name: "O'Hare Intl" },
  { code: 'SFO', city: 'San Francisco', country: 'USA',         name: 'San Francisco Intl' },
  { code: 'MIA', city: 'Miami',         country: 'USA',         name: 'Miami Intl' },
  // Asia Pacific
  { code: 'SIN', city: 'Singapore',     country: 'Singapore',   name: 'Changi' },
  { code: 'NRT', city: 'Tokyo',         country: 'Japan',       name: 'Narita Intl' },
  { code: 'HND', city: 'Tokyo',         country: 'Japan',       name: 'Haneda' },
  { code: 'HKG', city: 'Hong Kong',     country: 'Hong Kong',   name: 'Chek Lap Kok' },
  { code: 'BKK', city: 'Bangkok',       country: 'Thailand',    name: 'Suvarnabhumi' },
  { code: 'KUL', city: 'Kuala Lumpur',  country: 'Malaysia',    name: 'KLIA' },
  { code: 'SYD', city: 'Sydney',        country: 'Australia',   name: 'Kingsford Smith' },
  { code: 'MEL', city: 'Melbourne',     country: 'Australia',   name: 'Melbourne Airport' },
  { code: 'DPS', city: 'Bali',          country: 'Indonesia',   name: 'Ngurah Rai Intl' },
  { code: 'ICN', city: 'Seoul',         country: 'South Korea', name: 'Incheon Intl' },
]

/** Search airports for autocomplete */
export function searchAirportsStatic(query: string, limit = 7) {
  const q = query.toLowerCase()
  return AIRPORTS_STATIC.filter(
    (a) =>
      a.code.toLowerCase().startsWith(q) ||
      a.city.toLowerCase().startsWith(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().startsWith(q)
  ).slice(0, limit)
}
