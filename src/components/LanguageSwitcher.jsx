import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// LanguageSwitcher
// - Dropdown that shows current language (flag + name) in header
// - Options: 🇪🇬 العربية (EG), 🇬🇧 English (GB)
// - On select: calls i18n.changeLanguage(lang), sets document.dir and localStorage
// - Accessible: button with aria-haspopup and menu role

const OPTIONS = [
  { code: 'ar', label: 'العربية', flag: '🇪🇬', region: 'EG' },
  { code: 'en', label: 'English', flag: '🇬🇧', region: 'GB' },
]

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentCode = i18n.language?.startsWith('en') ? 'en' : 'ar'
  const current = OPTIONS.find((o) => o.code === currentCode) || OPTIONS[0]

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const applyLang = (code) => {
    try {
      i18n.changeLanguage(code)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = code === 'en' ? 'en' : 'ar'
        document.documentElement.dir = code === 'en' ? 'ltr' : 'rtl'
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('hajzy-language', code)
      }
    } catch {
      // ignore
    }
  }

  const onSelect = (code) => {
    applyLang(code)
    setOpen(false)
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-hajzy-card border border-gray-200 dark:border-hajzy-border text-sm focus:outline-none focus:ring-2 focus:ring-hajzy-primary"
      >
        <span className="text-sm">{current.label}</span>
        <span aria-hidden className="text-lg">{current.flag}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Language menu"
          className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white dark:bg-hajzy-card ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        >
          <div className="py-1">
            {OPTIONS.map((opt) => (
              <button
                key={opt.code}
                role="menuitem"
                onClick={() => onSelect(opt.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between ${
                  opt.code === currentCode ? 'font-semibold' : 'font-normal'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{opt.flag}</span>
                  <span>{opt.label}</span>
                </span>
                <span className="text-xs text-gray-400">{opt.region}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
