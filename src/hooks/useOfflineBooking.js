import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hajzy_offline_booking'
const CHECKIN_INSTRUCTIONS_KEY = 'hajzy_offline_checkin'

/**
 * Persists the latest confirmed booking to localStorage so the guest
 * can still access essential details (reference, dates, self-check-in
 * instructions, host contact) even when mobile signal drops at the resort.
 */
export function useOfflineBooking() {
  const [offlineBooking, setOfflineBooking] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  // Load cached booking on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setOfflineBooking(JSON.parse(raw))
      }
    } catch {
      // corrupt data — ignore
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /** Save a booking for offline access. Call this on confirmation. */
  const cacheBooking = useCallback((booking, property) => {
    if (!booking) return

    const offlineData = {
      // Booking essentials
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      total: booking.total,
      currency: booking.currency,
      paymentMethod: booking.paymentMethod,
      paidAt: booking.paidAt,

      // Property details for offline display
      propertyTitle: property?.title || booking.title,
      propertyTitleEn: property?.title_en || booking.title_en || '',
      propertyLocation: property?.location || booking.location,
      propertyImage: property?.image || booking.image,
      propertyCity: property?.city || '',

      // Self check-in & contact info
      selfCheckInInstructions: property?.selfCheckIn || property?.bookingInfo || '',
      hostPhone: property?.hostPhone || '',
      hostName: property?.hostName || '',
      emergencyNumber: property?.emergencyNumber || '',

      // Cache timestamp
      cachedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineData))

      // Also store check-in instructions separately for quick access
      if (offlineData.selfCheckInInstructions) {
        localStorage.setItem(CHECKIN_INSTRUCTIONS_KEY, JSON.stringify({
          propertyTitle: offlineData.propertyTitle,
          instructions: offlineData.selfCheckInInstructions,
          hostPhone: offlineData.hostPhone,
          cachedAt: offlineData.cachedAt,
        }))
      }
    } catch {
      // Storage full — ignore
    }

    setOfflineBooking(offlineData)
  }, [])

  /** Clear the cached offline booking */
  const clearOfflineBooking = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CHECKIN_INSTRUCTIONS_KEY)
    } catch {}
    setOfflineBooking(null)
  }, [])

  /** Get check-in instructions even without loading the full booking */
  const getCheckInInstructions = useCallback(() => {
    try {
      const raw = localStorage.getItem(CHECKIN_INSTRUCTIONS_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  return {
    offlineBooking,
    isOffline,
    cacheBooking,
    clearOfflineBooking,
    getCheckInInstructions,
  }
}
