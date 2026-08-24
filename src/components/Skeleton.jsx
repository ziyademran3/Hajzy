import React from 'react'

export default function Skeleton({ type = 'card', count = 4 }) {
  const items = Array.from({ length: count })
  return (
    <div className={`skeleton-root skeleton-${type}`} aria-hidden="true">
      {items.map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-media" />
          <div className="skeleton-body">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line small" />
          </div>
        </div>
      ))}
    </div>
  )
}
