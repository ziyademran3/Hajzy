import React from 'react'

/**
 * Card component
 * Props:
 * - variant: 'default' | 'outlined' | 'elevated' | 'interactive'
 * - size: 'sm' | 'md' (controls radius: sm -> rounded-xl (12px), md -> rounded-2xl (16px))
 * - children
 * - onClick: optional click handler (if provided and variant === 'interactive' becomes pressable)
 * - className, style
 */
export default function Card({
  variant = 'default',
  size = 'md',
  children,
  onClick,
  className = '',
  style = {},
  ...rest
}) {
  const radiusClass = size === 'sm' ? 'rounded-xl' : 'rounded-2xl'

  // Base: padding >= 16px (p-4), min width 0 to allow flex/shrink
  let base = `p-4 min-w-0 ${radiusClass} ${className}`

  // Light / Dark base styles
  // Light: bg-white, shadow-sm for default; Dark: bg-hajzy-card, border-hajzy-border
  const variants = {
    default:
      `bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text border border-transparent dark:border-hajzy-border shadow-sm`,
    outlined:
      `bg-white dark:bg-transparent text-gray-900 dark:text-hajzy-text border border-gray-200 dark:border-hajzy-border`,
    elevated:
      `bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text border border-transparent dark:border-hajzy-border shadow-lg`,
    interactive:
      `bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text border border-transparent dark:border-hajzy-border shadow-sm hover:shadow-md focus:shadow-md transition-shadow duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hajzy-primary active:scale-[0.995]`,
  }

  const variantClass = variants[variant] || variants.default

  const isInteractive = typeof onClick === 'function' || variant === 'interactive'

  const handleKeyDown = (e) => {
    if (!isInteractive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick && onClick(e)
    }
  }

  if (isInteractive) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={`${base} ${variantClass}`}
        style={style}
        {...rest}
      >
        {children}
      </div>
    )
  }

  return (
    <div className={`${base} ${variantClass}`} style={style} {...rest}>
      {children}
    </div>
  )
}
