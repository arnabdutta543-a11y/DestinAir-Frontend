'use client'

import { useEffect, useRef } from 'react'

interface NearbyPlace {
  name: string
  distance: string
  transport: string
  gps_coordinates?: { latitude: number; longitude: number }
}

interface HotelMapProps {
  hotelCoordinates?: { latitude: number; longitude: number }
  nearbyPlaces: NearbyPlace[]
  hotelName?: string
}

export default function HotelMap({ hotelCoordinates, nearbyPlaces, hotelName }: HotelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Derive best available center coordinates
  const getCenter = (): { lat: number; lng: number } | null => {
    if (hotelCoordinates?.latitude && hotelCoordinates?.longitude) {
      return { lat: Number(hotelCoordinates.latitude), lng: Number(hotelCoordinates.longitude) }
    }
    for (const p of (nearbyPlaces || [])) {
      if (p.gps_coordinates?.latitude && p.gps_coordinates?.longitude) {
        return {
          lat: Number(p.gps_coordinates.latitude) + 0.002,
          lng: Number(p.gps_coordinates.longitude) + 0.002,
        }
      }
    }
    return null
  }

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    const center = getCenter()
    if (!center) return

    let destroyed = false

    const boot = async () => {
      try {
        // Dynamically import both leaflet and its CSS
        const L = (await import('leaflet')).default

        // Inject Leaflet CSS once
        if (!document.getElementById('leaflet-css-link')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css-link'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
          link.crossOrigin = ''
          document.head.appendChild(link)
        }

        if (destroyed || !mapRef.current) return

        const map = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        })
        mapInstanceRef.current = map

        // Dark CartoDB tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap © CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        // Hotel main marker — violet glowing ping
        const hotelIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(139,92,246,0.25);animation:hping 2s ease-out infinite;"></div>
            <div style="position:absolute;width:30px;height:30px;border-radius:50%;background:rgba(139,92,246,0.15);animation:hping 2s ease-out 0.6s infinite;"></div>
            <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#d946ef);border:3px solid #fff;box-shadow:0 0 20px rgba(139,92,246,0.8),0 4px 14px rgba(0,0,0,0.6);position:relative;z-index:2;"></div>
          </div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          popupAnchor: [0, -28],
        })

        const makeNearbyIcon = (transport: string) => {
          const bg =
            transport.toLowerCase() === 'walk'
              ? 'linear-gradient(135deg,#0ea5e9,#3b82f6)'
              : transport.toLowerCase().includes('taxi') || transport.toLowerCase().includes('car')
              ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
              : 'linear-gradient(135deg,#10b981,#06b6d4)'
          return L.divIcon({
            className: '',
            html: `<div style="width:18px;height:18px;border-radius:50%;background:${bg};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.45);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -13],
          })
        }

        const popupOpts = { className: 'hmp', maxWidth: 240, closeButton: false }

        L.marker([center.lat, center.lng], { icon: hotelIcon })
          .addTo(map)
          .bindPopup(
            `<div style="background:#1e1b4b;border:1px solid rgba(139,92,246,0.5);border-radius:12px;padding:11px 14px;min-width:170px;font-family:system-ui,sans-serif;">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                <div style="width:9px;height:9px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#d946ef);flex-shrink:0;"></div>
                <span style="font-size:13px;font-weight:800;color:#fff;">${hotelName || 'Hotel'}</span>
              </div>
              <span style="font-size:10px;color:#a78bfa;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">📍 Your Stay</span>
            </div>`,
            popupOpts
          )

        const bounds: [number, number][] = [[center.lat, center.lng]]
        const validNearby = (nearbyPlaces || []).filter(
          (p) => p.gps_coordinates?.latitude && p.gps_coordinates?.longitude
        )

        validNearby.forEach((place) => {
          const pLat = Number(place.gps_coordinates!.latitude)
          const pLng = Number(place.gps_coordinates!.longitude)
          bounds.push([pLat, pLng])

          const em =
            place.transport.toLowerCase() === 'walk' ? '🚶' :
            place.transport.toLowerCase().includes('taxi') ? '🚕' :
            place.transport.toLowerCase().includes('car') ? '🚗' : '🚌'

          L.marker([pLat, pLng], { icon: makeNearbyIcon(place.transport) })
            .addTo(map)
            .bindPopup(
              `<div style="background:#0f172a;border:1px solid rgba(99,102,241,0.4);border-radius:12px;padding:10px 13px;min-width:150px;font-family:system-ui,sans-serif;">
                <p style="font-size:12px;font-weight:800;color:#e2e8f0;margin:0 0 5px;">${place.name}</p>
                <div style="display:flex;align-items:center;gap:5px;">
                  <span>${em}</span>
                  <span style="font-size:11px;color:#a78bfa;font-weight:700;">${place.distance}</span>
                  <span style="font-size:10px;color:#64748b;">via ${place.transport}</span>
                </div>
              </div>`,
              { ...popupOpts, maxWidth: 220 }
            )
        })

        if (bounds.length > 1) {
          map.fitBounds(bounds as any, { padding: [44, 44], maxZoom: 15 })
        }

        // Inject custom styles once
        if (!document.getElementById('hmp-css')) {
          const s = document.createElement('style')
          s.id = 'hmp-css'
          s.textContent = `
            @keyframes hping {
              0%   { transform:scale(.8); opacity:.9; }
              70%  { transform:scale(2.3); opacity:0; }
              100% { transform:scale(.8); opacity:0; }
            }
            .hmp .leaflet-popup-content-wrapper {
              background:transparent!important;border:none!important;
              box-shadow:none!important;padding:0!important;border-radius:0!important;
            }
            .hmp .leaflet-popup-content { margin:0!important; }
            .hmp .leaflet-popup-tip-container { display:none!important; }
            .leaflet-control-zoom {
              border:1px solid rgba(139,92,246,.4)!important;
              background:rgba(15,23,42,.92)!important;
              border-radius:10px!important;overflow:hidden!important;
            }
            .leaflet-control-zoom a {
              background:transparent!important;color:#a78bfa!important;
              border-bottom:1px solid rgba(139,92,246,.25)!important;
              width:30px!important;height:30px!important;line-height:30px!important;
            }
            .leaflet-control-zoom a:hover {
              background:rgba(139,92,246,.2)!important;color:#fff!important;
            }
          `
          document.head.appendChild(s)
        }
      } catch (err) {
        console.error('[HotelMap] init error:', err)
      }
    }

    boot()

    return () => {
      destroyed = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasCenter = !!getCenter()

  if (!hasCenter) {
    return (
      <div className="w-full h-full bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-xs font-semibold">Map not available</p>
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
