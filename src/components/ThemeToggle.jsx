import React from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from './ThemeProvider'

// ThemeToggle - shows localized label and icon depending on language and theme
// - Uses useTranslation() for localization
// - For Arabic specifically shows 'وضع ليلي' / 'وضع نهاري' as requested
// - For English uses translations from locales or falls back to 'Dark'/'Light'

export default function ThemeToggle({ className = '' }) {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'

  // Determine labels — prefer specific Arabic phrasing when language is 'ar'
  const labels = React.useMemo(() => {
    if (i18n.language && i18n.language.startsWith('ar')) {
      return { dark: 'وضع ليلي', light: 'وضع نهاري' }
    }
    // fallback to translation keys; if missing, provide English defaults
    return {
      dark: t('common.dark', 'Dark'),
      light: t('common.light', 'Light'),
    }
  }, [i18n.language, t])

  const label = isDark ? labels.dark : labels.light
  const icon = isDark ? '🌙' : '☀️'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-hajzy-primary bg-white dark:bg-hajzy-card text-gray-800 dark:text-hajzy-text ${className}`}
    >
      <span aria-hidden className="text-lg leading-none">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
