import { useEffect, useRef, useState } from 'react'

// Optimized pull-to-refresh hook that strictly respects page scroll position.
// It will NEVER intercept touch events if the user is scrolled down the page.
export default function usePullToRefresh(containerRef, onRefresh, { threshold = 70 } = {}) {
  const startY = useRef(0)
  const canPull = useRef(false)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    const el = containerRef?.current
    if (!el) return undefined

    const getScrollTop = () => {
      return (
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        (el ? el.scrollTop : 0) ||
        0
      )
    }

    const reset = (withTransition = true) => {
      canPull.current = false
      isPulling.current = false
      startY.current = 0
      pullDistanceRef.current = 0
      setPullDistance(0)
      if (el) {
        if (withTransition) {
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        }
        el.style.transform = ''
      }
      if (withTransition) {
        window.setTimeout(() => {
          if (el) el.style.transition = ''
        }, 250)
      }
    }

    const onTouchStart = (e) => {
      // If page is scrolled anywhere below the top, completely ignore
      if (getScrollTop() > 2) {
        canPull.current = false
        isPulling.current = false
        return
      }
      startY.current = e.touches?.[0]?.clientY || 0
      canPull.current = true
      isPulling.current = false
    }

    const onTouchMove = (e) => {
      if (!canPull.current) return

      // Double check scroll position: if page scrolled down at all, cancel pulling
      if (getScrollTop() > 2) {
        if (isPulling.current) {
          reset(false)
        }
        canPull.current = false
        isPulling.current = false
        return
      }

      const y = e.touches?.[0]?.clientY || 0
      const delta = y - startY.current

      // User must drag DOWNwards (delta > 0) from the very top
      // We require at least 12px deadzone before engaging pull-to-refresh
      if (delta > 12) {
        isPulling.current = true
        if (e.cancelable) {
          e.preventDefault()
        }
        // Damped distance calculation for smooth natural feel
        const d = Math.min(Math.round((delta - 12) * 0.42), 85)
        pullDistanceRef.current = d
        setPullDistance(d)
        el.style.transform = `translateY(${d}px)`
      } else if (delta < -5) {
        // User is scrolling down the page (finger moving up) -> allow native scrolling
        canPull.current = false
        if (isPulling.current) {
          reset(false)
        }
      }
    }

    const onTouchEnd = async () => {
      if (!isPulling.current) {
        reset(false)
        return
      }

      const finalDistance = pullDistanceRef.current
      if (finalDistance >= threshold) {
        try {
          setRefreshing(true)
          if (el) {
            el.style.transition = 'transform 180ms ease-out'
            el.style.transform = `translateY(45px)`
          }
          if (onRefreshRef.current) {
            await onRefreshRef.current()
          }
        } catch {
          // ignore refresh errors
        } finally {
          setRefreshing(false)
          reset(true)
        }
      } else {
        reset(true)
      }
    }

    const onTouchCancel = () => {
      reset(true)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchCancel)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [containerRef, threshold])

  return { pullDistance, refreshing }
}
