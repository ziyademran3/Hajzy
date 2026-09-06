import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
}

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'ar'

  const saved = window.localStorage.getItem('hajzy-language')
  const normalized = saved === 'en' ? 'en' : 'ar'

  if (saved !== normalized) {
    window.localStorage.setItem('hajzy-language', normalized)
  }

  return normalized
}

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: false,
  supportedLngs: ['ar', 'en'],
  nonExplicitSupportedLngs: true,
  debug: false,
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
  react: { useSuspense: false },
})

function applyLang(lng) {
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng === 'en' ? 'en' : 'ar'
      document.documentElement.dir = lng === 'en' ? 'ltr' : 'rtl'
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hajzy-language', lng)
    }
  } catch {
    // ignore
  }
}

// set initial document lang/dir
applyLang(i18n.language || getStoredLanguage())

// keep document in sync when language changes
i18n.on('languageChanged', (lng) => applyLang(lng))

export default i18n
