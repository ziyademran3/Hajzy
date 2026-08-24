import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({ coordinates = { lat: 30.0333, lng: 31.2333 }, zoom = 13, markerLabel = '' }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // ensure default icon urls are set to CDN so bundlers don't break icon loading
    if (L && L.Icon && L.Icon.Default) {
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
    }

    // create map
    const map = L.map(containerRef.current, {
      center: [coordinates.lat, coordinates.lng],
      zoom,
      scrollWheelZoom: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map)
    if (markerLabel) marker.bindPopup(`<strong>${markerLabel}</strong>`)

    mapRef.current = map

    return () => {
      try {
        map.off()
        map.remove()
      } catch (err) {
        // ignore
      }
    }
  }, [containerRef])

  useEffect(() => {
    if (!mapRef.current) return
    try {
      mapRef.current.setView([coordinates.lat, coordinates.lng])
    } catch (err) {
      // ignore
    }
  }, [coordinates])

  return <div ref={containerRef} className="leaflet-map" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden' }} />
}
