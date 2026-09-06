import React from 'react'
import { FiChevronLeft } from 'react-icons/fi'

/**
 * SettingsItem
 * Props:
 * - icon: React component or element (displayed on the right for RTL)
 * - title: string (visible title)
 * - description: string (secondary text)
 * - variant: 'link' | 'toggle' (if 'link', shows chevron; if 'toggle', shows switch)
 * - value: boolean (for toggle)
 * - onToggle: (newValue) => void
 * - onClick: () => void (for link)
 * - className: additional classes
 */
export default function SettingsItem({
  icon,
  title,
  description,
  variant = 'link',
  value = false,
  onToggle,
  onClick,
  className = '',
}) {
  const Icon = icon

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggle?.(!value)
  }

  const handleClick = () => {
    if (variant === 'link') onClick?.()
    else if (variant === 'toggle') onToggle?.(!value)
  }

  return (
    <div
      role={variant === 'link' ? 'button' : 'group'}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`w-full flex flex-row-reverse items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border ${className}`}
    >
      {/* Icon on the right (RTL-friendly through flex-row-reverse) */}
      <div className="flex-none w-10 h-10 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-hajzy-primary">
        {React.isValidElement(Icon) ? React.cloneElement(Icon, { size: 20 }) : Icon ? <Icon size={20} /> : null}
      </div>

      {/* Title and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{title}</div>
            {description && <div className="text-xs text-gray-500 dark:text-hajzy-muted truncate">{description}</div>}
          </div>
        </div>
      </div>

      {/* Control on the left: switch or chevron */}
      <div className="flex-none">
        {variant === 'link' ? (
          <FiChevronLeft className="text-gray-400" size={18} aria-hidden />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={handleToggle}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
              value ? 'bg-hajzy-primary' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${
                value ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        )}
      </div>
    </div>
  )
}
