import React from 'react'

// CityBadge: a non-button badge (gold star + label) for "الأكثر طلباً"
// Usage: <CityBadge>الأكثر طلباً</CityBadge>

export default function CityBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 text-xs font-semibold shadow-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#FBBF24" />
      </svg>
      <span>{children}</span>
    </span>
  )
}
