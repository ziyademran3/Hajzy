import { useEffect, useRef, useState } from 'react'

// Simple pull-to-refresh hook. Attach to a scroll container ref.
// onRefresh should be an async function returning when refresh finished.
export default function usePullToRefresh(containerRef, onRefresh, { threshold = 70 } = {}) {
  const startY = useRef(0)
  const pulling = useRef(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const el = containerRef?.current
    if (!el) return undefined

    const onTouchStart = (e) => {
      if (el.scrollTop > 0) return
      startY.current = e.touches?.[0]?.clientY || 0
      pulling.current = true
    }

    const onTouchMove = (e) => {
      if (!pulling.current) return
      const y = e.touches?.[0]?.clientY || 0
      const delta = Math.max(0, y - startY.current)
      if (delta > 0) {
        e.preventDefault()
        const d = Math.min(delta, 140)
        setPullDistance(d)
        el.style.transform = `translateY(${d}px)`
      }
    }

    const reset = () => {
      pulling.current = false
      startY.current = 0
      setPullDistance(0)
      if (el) el.style.transition = 'transform 220ms ease-out'
      if (el) el.style.transform = ''
      // remove transition after it runs
      window.setTimeout(() => {
        if (el) el.style.transition = ''
      }, 250)
    }

    const onTouchEnd = async () => {
      if (!pulling.current) return
      try {
        if (pullDistance >= threshold) {
          setRefreshing(true)
          // keep a small visible offset while refreshing
          if (el) el.style.transform = `translateY(50px)`
          await onRefresh()
        }
      } catch {
        // ignore refresh errors
      } finally {
        setRefreshing(false)
        reset()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [containerRef, onRefresh, pullDistance, threshold])

  return { pullDistance, refreshing }
}
