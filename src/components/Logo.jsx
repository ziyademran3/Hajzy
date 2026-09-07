import React from 'react'

/**
 * Official Hajzy Emblem & Logo Component
 * - Golden 'H' monogram integrated with a rooftop and 4-pane window
 * - Supports icon-only or with 'Hajzy' wordmark
 */
export default function Logo({
  size = 40,
  showText = false,
  className = '',
  ariaLabel = 'Hajzy logo',
}) {
  const height = typeof size === 'number' ? `${size}px` : size

  return (
    <span
      style={{ height, display: 'inline-flex', alignItems: 'center', gap: '10px' }}
      className={`hajzy-brand-logo ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: '100%', width: 'auto', maxHeight: '100%', flexShrink: 0 }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hajzyGoldPillarLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECC870" />
            <stop offset="40%" stopColor="#C99837" />
            <stop offset="85%" stopColor="#9E731F" />
            <stop offset="100%" stopColor="#D8AC4B" />
          </linearGradient>
          <linearGradient id="hajzyGoldPillarRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F7DF94" />
            <stop offset="35%" stopColor="#D4A744" />
            <stop offset="80%" stopColor="#A87C22" />
            <stop offset="100%" stopColor="#E2B755" />
          </linearGradient>
          <linearGradient id="hajzyGoldRoof" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B38628" />
            <stop offset="50%" stopColor="#F9E6A2" />
            <stop offset="100%" stopColor="#C59432" />
          </linearGradient>
          <linearGradient id="hajzyGoldWindow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3D580" />
            <stop offset="100%" stopColor="#AD7F1F" />
          </linearGradient>
        </defs>

        {/* Left Pillar of 'H' */}
        <path
          d="M38 24 H66 V176 H38 Z"
          fill="url(#hajzyGoldPillarLeft)"
          rx="2"
        />

        {/* Right Pillar of 'H' */}
        <path
          d="M134 24 H162 V176 H134 Z"
          fill="url(#hajzyGoldPillarRight)"
          rx="2"
        />

        {/* Rooftop / Chevron Crossbar */}
        <path
          d="M66 100 L100 62 L134 100 L134 128 L100 90 L66 128 Z"
          fill="url(#hajzyGoldRoof)"
        />

        {/* 4-Pane Window under the roof */}
        {/* Top Left Pane */}
        <rect x="86" y="112" width="11" height="11" rx="1.5" fill="url(#hajzyGoldWindow)" />
        {/* Top Right Pane */}
        <rect x="103" y="112" width="11" height="11" rx="1.5" fill="url(#hajzyGoldWindow)" />
        {/* Bottom Left Pane */}
        <rect x="86" y="129" width="11" height="11" rx="1.5" fill="url(#hajzyGoldWindow)" />
        {/* Bottom Right Pane */}
        <rect x="103" y="129" width="11" height="11" rx="1.5" fill="url(#hajzyGoldWindow)" />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: "'Cairo', 'Poppins', 'Inter', sans-serif",
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
            color: 'inherit',
          }}
        >
          Hajzy
        </span>
      )}
    </span>
  )
}

