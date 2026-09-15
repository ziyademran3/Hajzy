import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({
  coordinates = { lat: 30.0333, lng: 31.2333 },
  zoom = 13,
  markerLabel = '',
  priceText = '',
  height = '240px',
}) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Ensure map is not initialized twice on the same node
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(containerRef.current, {
      center: [coordinates.lat, coordinates.lng],
      zoom,
      scrollWheelZoom: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Luxury Custom DivIcon (Emerald Price Pill or Luxury Pin)
    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          background: #00433f;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 12px;
          box-shadow: 0 8px 20px rgba(0,67,63,0.35);
          border: 2px solid rgba(255,255,255,0.9);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          transform: translate(-50%, -50%);
        ">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#34d399;"></span>
          <span>${priceText || markerLabel || 'Hajzy'}</span>
        </div>
      `,
      iconSize: [0, 0],
    })

    const marker = L.marker([coordinates.lat, coordinates.lng], { icon: customIcon }).addTo(map)
    if (markerLabel) {
      marker.bindPopup(
        `<div style="font-family: inherit; font-size: 13px; font-weight: 700; color: #0f172a; padding: 2px;">
          ${markerLabel}
        </div>`
      )
    }

    mapRef.current = map

    return () => {
      try {
        map.off()
        map.remove()
        mapRef.current = null
      } catch {
        // ignore cleanup error
      }
    }
  }, [coordinates.lat, coordinates.lng, markerLabel, priceText, zoom])

  useEffect(() => {
    if (!mapRef.current) return
    try {
      mapRef.current.setView([coordinates.lat, coordinates.lng], zoom)
    } catch {
      // ignore
    }
  }, [coordinates.lat, coordinates.lng, zoom])

  return (
    <div
      ref={containerRef}
      className="leaflet-map rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden"
      style={{ width: '100%', height }}
    />
  )
}
