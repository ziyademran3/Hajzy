import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'light', setTheme: () => {}, toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = window.localStorage.getItem('hajzy-theme')
      if (stored) return stored
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    } catch (e) {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('hajzy-theme', theme)
    } catch (e) {
      // ignore
    }

    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.setProperty('background-color', '#0F172A')
    } else {
      root.classList.remove('dark')
      root.style.removeProperty('background-color')
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}
