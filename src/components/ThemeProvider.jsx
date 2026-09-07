import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'light', setTheme: () => {}, toggleTheme: () => {} })

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = window.localStorage.getItem('hajzy-theme') || window.localStorage.getItem('theme')
      if (stored) return stored
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('hajzy-theme', theme)
      window.localStorage.setItem('theme', theme)
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

