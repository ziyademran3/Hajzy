import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Tactile haptic feedback hook for mobile (Capacitor).
 * Falls back gracefully to navigator.vibrate or no-op on web/desktop.
 *
 * Intensities:
 *  - 'light'   → gentle tick (photo swipe, toggle)
 *  - 'medium'  → standard click (button press, settings change)
 *  - 'heavy'   → strong bump (booking confirmed, payment success)
 *  - 'success' → double-tap success pattern
 *  - 'warning' → short-long warning pattern
 *  - 'error'   → triple-burst error pattern
 */

const VIBRATE_PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [15, 60, 25],
  warning: [12, 50, 30],
  error: [10, 30, 10, 30, 10],
}

const getHapticsPlugin = () => {
  if (typeof window === 'undefined') return null
  if (Capacitor.getPlatform() === 'web') return null

  if (window.Capacitor?.Plugins?.Haptics) {
    return window.Capacitor.Plugins.Haptics
  }
  if (typeof Capacitor.isPluginAvailable === 'function' && Capacitor.isPluginAvailable('Haptics')) {
    return Capacitor.Plugins?.Haptics || null
  }
  return null
}

const vibrateFromPattern = (pattern) => {
  try {
    if (navigator?.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch {
    // Vibration API not supported — silently ignore
  }
}

export function useHaptics() {
  const trigger = useCallback(async (intensity = 'medium') => {
    // Respect reduced-motion preference
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      if (motionQuery?.matches) return
    }

    const pattern = VIBRATE_PATTERNS[intensity] || VIBRATE_PATTERNS.medium

    // Try native Capacitor Haptics first
    const plugin = getHapticsPlugin()
    if (plugin) {
      try {
        if (intensity === 'light') {
          await plugin.impact({ style: 'LIGHT' })
        } else if (intensity === 'heavy' || intensity === 'success') {
          await plugin.impact({ style: 'HEAVY' })
        } else if (intensity === 'warning' || intensity === 'error') {
          await plugin.notification({ type: intensity === 'error' ? 'ERROR' : 'WARNING' })
        } else {
          await plugin.impact({ style: 'MEDIUM' })
        }
        return
      } catch {
        // Fall through to web fallback
      }
    }

    // Web fallback via Vibration API
    vibrateFromPattern(pattern)
  }, [])

  return { trigger }
}
