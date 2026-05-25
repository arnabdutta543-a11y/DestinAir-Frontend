'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrencyStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plane, MapPin, Calendar } from 'lucide-react'

interface Props {
  destination: { city: string; code: string; country: string; img: string }
  onClose: () => void
}

export function DestinationModal({ destination, onClose }: Props) {
  const router = useRouter()
  const { currency } = useCurrencyStore()
  const [origin, setOrigin] = useState('')
  const [date, setDate] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.code,
      departureDate: date,
      adults: '1',
      travelClass: 'ECONOMY',
      currency,
    })
    router.push(`/flights/results?${params.toString()}`)
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header image */}
        <div className="relative h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={destination.img} alt={destination.city} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-4 h-4 text-sky-300" />
              <span className="text-sky-300 text-sm font-medium">{destination.country}</span>
            </div>
            <h2 className="text-2xl font-extrabold">{destination.city}</h2>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">{destination.code}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground font-medium">Search flights to {destination.city}</p>

          <div className="space-y-1.5">
            <Label htmlFor="modal-origin" className="flex items-center gap-1.5 text-sm font-semibold">
              <Plane className="w-3.5 h-3.5 text-sky-500" /> From (IATA code)
            </Label>
            <Input
              id="modal-origin"
              placeholder="e.g. DEL, BOM, JFK, LHR"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              maxLength={3}
              className="h-12 text-lg font-bold uppercase tracking-widest placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-date" className="flex items-center gap-1.5 text-sm font-semibold">
              <Calendar className="w-3.5 h-3.5 text-sky-500" /> Departure Date
            </Label>
            <Input
              id="modal-date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base gap-2 rounded-xl"
          >
            <Plane className="w-4 h-4" />
            Search Flights to {destination.city}
          </Button>
        </form>
      </div>
    </div>
  )
}
