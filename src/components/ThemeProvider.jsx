import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'light', setTheme: () => {}, toggleTheme: () => {} })

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      // Start in light mode for every visitor. The previous implementation
      // inherited the phone's dark-mode setting, which made the site appear
      // dark without the customer choosing it. A versioned key also resets
      // that old automatic preference once, while preserving future choices.
      const stored = window.localStorage.getItem('hajzy-theme-v2')
      return stored === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('hajzy-theme-v2', theme)
    } catch {
      // ignore
    }

    const root = document.documentElement
    const body = document.body

    root.setAttribute('data-theme', theme)
    if (body) body.setAttribute('data-theme', theme)

    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      root.style.setProperty('background-color', '#090b0d')
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      root.style.removeProperty('background-color')
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

