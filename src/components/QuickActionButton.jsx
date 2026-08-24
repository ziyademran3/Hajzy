import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * QuickActionButton
 * Props:
 * - icon: React component (e.g., FiSearch) or React element
 * - labelKey: translation key (e.g., 'dashboard.searchCity')
 * - onClick: handler
 * - className: optional
 *
 * Behavior:
 * - Uses t(labelKey) to render the label
 * - If the translation returns the raw key (missing), attempts to read Arabic fallback resource
 *   and use that instead so Arabic UI doesn't show keys.
 */
export default function QuickActionButton({ icon, labelKey, onClick, className = '' }) {
  const { t, i18n } = useTranslation()

  let label = t(labelKey)

  // If t returned the key itself (missing translation), try to fetch Arabic fallback
  if (label === labelKey) {
    try {
      // parse possible namespace.key (e.g., 'dashboard.searchCity')
      const parts = labelKey.split('.')
      let ns = 'translation'
      let k = labelKey
      if (parts.length > 1) {
        ns = parts[0]
        k = parts.slice(1).join('.')
      }
      const arVal = i18n.getResource('ar', ns, k)
      if (arVal) label = arVal
    } catch (e) {
      // ignore
    }
  }

  const Icon = icon

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-hajzy-primary ${className}`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white dark:bg-transparent">
        {React.isValidElement(Icon) ? (
          // icon passed as element
          React.cloneElement(Icon, { className: 'text-hajzy-primary', size: 20 })
        ) : Icon ? (
          // icon passed as component
          <Icon className="text-hajzy-primary" size={20} />
        ) : null}
      </div>
      <span className="text-xs text-gray-700 dark:text-hajzy-text">{label}</span>
    </button>
  )
}
