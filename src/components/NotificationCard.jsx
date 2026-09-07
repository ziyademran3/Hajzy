import React, { useState, useRef } from 'react'
import { AiOutlineCheck, AiOutlineClose, AiOutlineBell } from 'react-icons/ai'

// notification: { id, type, title, body, time, read, thumbnail }
// types: 'confirm' | 'alert' | 'offer' | 'message'
export default function NotificationCard({ notification, onDelete, onToggleRead }) {
  const formatTimeLabel = (isoDate, fallback) => {
    try {
      if (!isoDate) return fallback || ''
      const d = new Date(isoDate)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      const mins = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ar-EG'

      if (mins < 1) return document.documentElement.lang === 'en' ? 'Now' : 'الآن'
      if (mins < 60) return document.documentElement.lang === 'en' ? `${mins}m ago` : `منذ ${mins} دقيقة`
      if (hours < 24) return document.documentElement.lang === 'en' ? `${hours}h ago` : `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`

      // yesterday -> show 'أمس 3:00 م' in Arabic or 'Yesterday 3:00 PM' in English
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
      if (d >= startOfYesterday && d < startOfToday) {
        const timeStr = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
        return document.documentElement.lang === 'en' ? `Yesterday ${timeStr}` : `أمس ${timeStr}`
      }

      // within one week -> show weekday or 'منذ X يوم'
      if (days < 7) return document.documentElement.lang === 'en' ? `${days}d ago` : `منذ ${days} يوم`

      // fallback to short date
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    } catch {
      return fallback || ''
    }
  }
  const { id, type, title, body, time, read, thumbnail, date } = notification
  const [swipeX, setSwipeX] = useState(0)
  const [_dragging, setDragging] = useState(false)
  const startX = useRef(null)
  const threshold = 60 // px

  const colorForType = {
    confirm: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    alert: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    offer: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    message: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
  }

  const iconForType = {
    confirm: <AiOutlineCheck size={18} />,
    alert: <AiOutlineClose size={18} />,
    offer: <AiOutlineBell size={18} />,
    message: <AiOutlineBell size={18} />,
  }

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    setDragging(true)
  }

  const onTouchMove = (e) => {
    if (startX.current == null) return
    const dx = e.touches[0].clientX - startX.current
    setSwipeX(dx)
  }

  const onTouchEnd = () => {
    setDragging(false)
    if (swipeX > threshold) {
      // swipe right => delete
      onDelete?.(id)
    } else if (swipeX < -threshold) {
      // swipe left => mark read/unread
      onToggleRead?.(id)
    }
    setSwipeX(0)
    startX.current = null
  }

  const desktopDelete = (e) => {
    e.stopPropagation()
    onDelete?.(id)
  }

  const desktopToggle = (e) => {
    e.stopPropagation()
    onToggleRead?.(id)
  }

  const displayTime = formatTimeLabel(date, time)

  return (
    <div className="relative">
      {/* Action overlays shown on desktop hover (and as background during swipe) */}
      <div className="absolute inset-0 flex items-center justify-between px-4" style={{ pointerEvents: 'none' }}>
        <div className="flex items-center gap-3">
          {/* Delete (right swipe) */}
          <div className="hidden md:flex items-center gap-2 text-red-500">
            <AiOutlineClose /> <span className="text-sm">حذف</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-teal-600">
            <AiOutlineCheck /> <span className="text-sm">مقروء</span>
          </div>
        </div>
      </div>

      <div
        role="article"
        aria-pressed={!!read}
        tabIndex={0}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border shadow-sm rounded-xl p-3 flex gap-3 items-start min-h-[72px] transform transition-transform duration-150 ${
          read ? 'opacity-80' : 'opacity-100'
        }`}
        style={{ transform: `translateX(${swipeX}px)` }}
      >
        <div className={`flex-none w-14 h-14 rounded-md overflow-hidden flex items-center justify-center ${colorForType[type] || ''}`}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="thumb"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              {iconForType[type] || <AiOutlineBell size={18} />}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className={`text-sm font-semibold truncate ${read ? 'text-gray-600 dark:text-hajzy-muted' : 'text-gray-900 dark:text-hajzy-text'}`}>{title}</h4>
              <p className="text-xs text-gray-500 dark:text-hajzy-muted truncate">{body}</p>
            </div>

            <div className="flex-none text-xs text-gray-400 ltr:text-right rtl:text-left">{displayTime}</div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button onClick={desktopToggle} className="hidden md:inline-flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800" aria-label="toggle-read">
              {read ? 'غير مقروء' : 'مقروء'}
            </button>
            <button onClick={desktopDelete} className="hidden md:inline-flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-red-50 text-red-600" aria-label="delete">
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
