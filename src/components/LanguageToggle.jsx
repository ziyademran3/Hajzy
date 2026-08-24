import React from 'react'
import i18n from '../i18n'

export default function LanguageToggle() {
  const current = i18n.language || (typeof window !== 'undefined' && localStorage.getItem('hajzy-language')) || 'ar'

  const setLang = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex items-center space-x-3 ltr:space-x-reverse">
      <button
        aria-pressed={current === 'ar'}
        onClick={() => setLang('ar')}
        className={`px-3 py-1 rounded-md ${current === 'ar' ? 'bg-hajzy-primary text-white' : 'bg-white/10 text-hajzy-text'}`}>
        🇪🇬 العربية
      </button>

      <button
        aria-pressed={current === 'en'}
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-md ${current === 'en' ? 'bg-hajzy-primary text-white' : 'bg-white/10 text-hajzy-text'}`}>
        🇬🇧 English
      </button>
    </div>
  )
}
