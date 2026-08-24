import React from 'react'

// Simple Logo component (icon-only) for header
// - Uses a location-pin that doubles as a curved door/arch
// - Color is driven by currentColor so Tailwind classes can set it to the project's teal (#0D9488)
// - Props:
//   - size: number or string for height (default: 40) - keeps aspect ratio
//   - className: optional additional classes
//   - ariaLabel: accessibility label

export default function Logo({ size = 40, className = '', ariaLabel = 'Hajzy logo' }) {
  const height = typeof size === 'number' ? `${size}px` : size
  return (
    <span style={{ height }} className={`inline-block leading-0 ${className}`} role="img" aria-label={ariaLabel}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: '100%', width: 'auto' }}
        className="text-[#0D9488] dark:text-[#0D9488]"
        aria-hidden="false"
      >
        {/* Outer pin shape */}
        <path
          d="M32 4C22.06 4 14.5 11.56 14.5 21.5c0 12 17.5 30.5 17.5 30.5S49.5 33.5 49.5 21.5C49.5 11.56 41.94 4 32 4z"
          fill="currentColor"
        />
        {/* Inner door/arch (cream cutout would be applied by mask in full branding; here we draw an inner shape in white to suggest door) */}
        <path
          d="M24 26c0-4.42 3.58-8 8-8s8 3.58 8 8v12h-4v-12c0-2.21-1.79-4-4-4s-4 1.79-4 4v12h-4V26z"
          fill="white"
          opacity="0.95"
        />
        {/* Small H/slot hint at bottom of pin */}
        <rect x="28" y="42" width="8" height="4" rx="1" fill="rgba(0,0,0,0.08)" />
      </svg>
    </span>
  )
}
