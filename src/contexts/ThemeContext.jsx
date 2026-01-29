import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
})

const THEMES = ['light', 'gray', 'dark']

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    return THEMES.includes(stored) ? stored : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'gray', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const cycleTheme = () => {
    setTheme(prev => {
      const currentIndex = THEMES.indexOf(prev)
      const nextIndex = (currentIndex + 1) % THEMES.length
      return THEMES[nextIndex]
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
