import React from 'react'

// HajzyLogo Component
// Props:
// - variant: 'icon' | 'horizontal' | 'vertical' | 'mono' (default: 'icon')
// - size: number (px) or string (e.g., '48', '48px') — controls the width for icon/mono, and height for others
// - className: optional
// - ariaLabel: optional accessible label

const TEAL = '#0D9488'
const CREAM = '#F5F5DC'

export const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="${CREAM}" />
  <g transform="translate(0,4)">
    <path d="M64 12C50 12 40 22 40 36c0 22 24 46 24 46s24-24 24-46c0-14-10-24-24-24z" fill="${TEAL}" />
    <path d="M52 44a12 12 0 0 1 24 0v18h-8v-18a4 4 0 0 0-8 0v18h-8V44z" fill="${CREAM}" />
    <rect x="58" y="64" width="12" height="6" rx="3" fill="rgba(255,255,255,0.12)" />
  </g>
</svg>
`

export const HORIZONTAL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="420" height="120">
  <g transform="translate(18,6)">
    <rect x="0" y="0" width="96" height="96" rx="18" fill="${CREAM}" />
    <g transform="translate(0,4)">
      <path d="M48 12C34 12 24 22 24 36c0 22 24 46 24 46s24-24 24-46c0-14-10-24-24-24z" fill="${TEAL}" />
      <path d="M36 44a12 12 0 0 1 24 0v18h-8v-18a4 4 0 0 0-8 0v18h-8V44z" fill="${CREAM}" />
    </g>
  </g>
  <g transform="translate(132,48)" font-family="Cairo, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" text-anchor="start">
    <text x="0" y="0" font-size="28" fill="${TEAL}">حجزي</text>
    <text x="0" y="26" font-size="14" fill="${TEAL}">HAJZY</text>
  </g>
</svg>
`

export const VERTICAL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260">
  <g transform="translate(52,14)">
    <rect x="0" y="0" width="96" height="96" rx="18" fill="${CREAM}" />
    <g transform="translate(0,4)">
      <path d="M48 12C34 12 24 22 24 36c0 22 24 46 24 46s24-24 24-46c0-14-10-24-24-24z" fill="${TEAL}" />
      <path d="M36 44a12 12 0 0 1 24 0v18h-8v-18a4 4 0 0 0-8 0v18h-8V44z" fill="${CREAM}" />
    </g>
  </g>
  <g transform="translate(0,150)" font-family="Cairo, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" text-anchor="middle">
    <text x="100" y="0" font-size="28" fill="${TEAL}" text-anchor="middle">حجزي</text>
    <text x="100" y="28" font-size="14" fill="${TEAL}" text-anchor="middle">HAJZY</text>
  </g>
</svg>
`

export const MONO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#0F172A" />
  <g transform="translate(0,4)">
    <path d="M64 12C50 12 40 22 40 36c0 22 24 46 24 46s24-24 24-46c0-14-10-24-24-24z" fill="#FFFFFF" />
    <path d="M52 44a12 12 0 0 1 24 0v18h-8v-18a4 4 0 0 0-8 0v18h-8V44z" fill="#0F172A" />
  </g>
</svg>
`

export default function HajzyLogo({ variant = 'icon', size = 48, className = '', ariaLabel = 'Hajzy logo' }) {
  const common = { role: 'img', 'aria-label': ariaLabel }
  const px = typeof size === 'number' ? `${size}px` : size

  const squareStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: px,
    height: px,
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(13,148,136,0.04))',
    boxShadow: 'inset 0 0 0 1px rgba(13,148,136,0.08), 0 8px 18px rgba(13,148,136,0.08)',
  }

  switch (variant) {
    case 'horizontal':
      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: HORIZONTAL_SVG.replace(/width="[^"]+"/, `width="${px}"`) }}
          {...common}
        />
      )

    case 'vertical':
      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: VERTICAL_SVG.replace(/width="[^"]+"/, `width="${px}"`) }}
          {...common}
        />
      )

    case 'mono':
      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: MONO_SVG.replace(/width="[^"]+"/, `width="${px}"`) }}
          {...common}
        />
      )

    case 'icon':
    default:
      return (
        <span style={squareStyle} className={className} {...common}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            width="100%"
            height="100%"
            aria-hidden="true"
            style={{ display: 'block' }}
          >
            <g transform="translate(0,4)">
              <path d="M64 12C50 12 40 22 40 36c0 22 24 46 24 46s24-24 24-46c0-14-10-24-24-24z" fill="#0D9488" />
              <path d="M52 44a12 12 0 0 1 24 0v18h-8v-18a4 4 0 0 0-8 0v18h-8V44z" fill="#F5F5DC" />
              <rect x="58" y="64" width="12" height="6" rx="3" fill="rgba(255,255,255,0.12)" />
            </g>
          </svg>
        </span>
      )
  }
}
