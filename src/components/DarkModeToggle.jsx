import React from 'react'
import { useTheme } from './ThemeProvider'

export default function DarkModeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm ${className}`}
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <>
          <span className="w-4 h-4 block bg-white rounded-full" aria-hidden="true" />
          Light
        </>
      ) : (
        <>
          <span className="w-4 h-4 block bg-hajzy-primary rounded-full" aria-hidden="true" />
          Dark
        </>
      )}
    </button>
  )
}
