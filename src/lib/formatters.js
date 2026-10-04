const getNumericLocale = (language = 'ar') => (
  language === 'en' ? 'en-US-u-nu-latn' : 'ar-EG-u-nu-latn'
)

export const normalizeNumerals = (value) => String(value).replace(/[٠-٩۰-۹]/g, (digit) => {
  const code = digit.charCodeAt(0)
  return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660)
})

export const formatNumber = (num, options = {}) => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0'
  const intlOptions = { ...options }
  delete intlOptions.numeralSystem
  try {
    return new Intl.NumberFormat(getNumericLocale(), {
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      ...intlOptions,
      numberingSystem: 'latn',
    }).format(num)
  } catch {
    return Number(num).toLocaleString('en-US-u-nu-latn')
  }
}

export const formatCurrency = (amount, currency = 'EGP', currentLanguage = 'ar', options = {}) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    const isArabic = currentLanguage === 'ar'
    const sym = currency === 'EGP' ? (isArabic ? 'ج.م' : 'EGP') : currency
    return isArabic ? `0 ${sym}` : `${sym} 0`
  }
  const isArabic = currentLanguage === 'ar'
  const intlOptions = { ...options }
  delete intlOptions.numeralSystem
  const value = new Intl.NumberFormat(getNumericLocale(currentLanguage), {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    ...intlOptions,
    numberingSystem: 'latn',
  }).format(amount)
  const symbol = currency === 'EGP' ? (isArabic ? 'ج.م' : 'EGP') : currency

  return isArabic ? `${value} ${symbol}` : `${symbol} ${value}`
}

/**
 * Safely parse a YYYY-MM-DD string into a local midnight Date object.
 * Returns null if the string is empty or invalid.
 */
export const parseISODate = (str) => {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)

  const date = new Date(year, month, day)
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

/**
 * Build a YYYY-MM-DD string from year, month (1-based), day numbers.
 */
export const buildISODateString = (year, month, day) => {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Safely convert a Date or string to YYYY-MM-DD without UTC timezone shift.
 */
export const formatISODate = (date) => {
  if (!date) return ''
  let d = date
  if (typeof date === 'string') {
    const parsed = parseISODate(date)
    if (parsed) return date.trim().slice(0, 10)
    d = new Date(date)
  }
  if (!(d instanceof Date) || isNaN(d.getTime())) return ''
  return buildISODateString(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/**
 * Calculate the number of nights between two dates.
 * Returns 0 if either date is invalid, null, or if end <= start.
 * Never throws an error.
 */
export const nightsBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0

  let d1 = typeof startDate === 'string' ? parseISODate(startDate) : startDate
  if (!d1 || !(d1 instanceof Date) || isNaN(d1.getTime())) {
    if (typeof startDate === 'string') {
      const fallback = new Date(startDate)
      if (!isNaN(fallback.getTime())) d1 = fallback
    }
  }

  let d2 = typeof endDate === 'string' ? parseISODate(endDate) : endDate
  if (!d2 || !(d2 instanceof Date) || isNaN(d2.getTime())) {
    if (typeof endDate === 'string') {
      const fallback = new Date(endDate)
      if (!isNaN(fallback.getTime())) d2 = fallback
    }
  }

  if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0

  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate())
  const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

/**
 * Safely format a date for display in the current language.
 * Never throws RangeError on empty, null, or invalid dates.
 */
export const formatDate = (dateString, currentLanguage = 'ar', options = {}) => {
  if (!dateString) return '—'

  let d = null
  if (typeof dateString === 'string') {
    d = parseISODate(dateString)
    if (!d) {
      const parsed = new Date(dateString)
      if (!isNaN(parsed.getTime())) d = parsed
    }
  } else if (dateString instanceof Date && !isNaN(dateString.getTime())) {
    d = dateString
  }

  if (!d) return '—'

  const locale = getNumericLocale(currentLanguage)
  const intlOptions = { ...options }
  delete intlOptions.numeralSystem
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...intlOptions,
      numberingSystem: 'latn',
    }).format(d)
  } catch {
    return '—'
  }
}

export const formatTime = (date, currentLanguage, options = {}) => {
  if (date === null || date === undefined || date === '') return ''
  const value = date instanceof Date ? date : new Date(date)
  if (isNaN(value.getTime())) return ''
  const language = currentLanguage || (
    typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar'
  )
  return new Intl.DateTimeFormat(getNumericLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
    numberingSystem: 'latn',
  }).format(value)
}

/**
 * Format ISO date string (YYYY-MM-DD) into explicit day/month/year (DD/MM/YYYY)
 * Example: '2026-10-03' -> '03/10/2026'
 */
export const formatDisplayDMY = (isoDateStr) => {
  if (!isoDateStr) return ''
  const parsed = parseISODate(isoDateStr)
  if (parsed) {
    const day = String(parsed.getDate()).padStart(2, '0')
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const year = parsed.getFullYear()
    return `${day}/${month}/${year}`
  }
  const parts = String(isoDateStr).split('-')
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
  }
  return String(isoDateStr)
}

/**
 * Returns next day ISO string (YYYY-MM-DD) based on input date, or tomorrow if empty.
 */
export const getNextDayISO = (isoDateStr) => {
  if (!isoDateStr) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatISODate(tomorrow)
  }
  const parsed = parseISODate(isoDateStr)
  if (parsed) {
    parsed.setDate(parsed.getDate() + 1)
    return formatISODate(parsed)
  }
  return isoDateStr
}

export const ARABIC_PLURAL_FORMS = {
  result: {
    singular: 'نتيجة',
    dual: 'نتيجتان',
    plural: 'نتائج',
  },
  stay: {
    singular: 'إقامة',
    dual: 'إقامتان',
    plural: 'إقامات',
  },
  point: {
    singular: 'نقطة',
    dual: 'نقطتان',
    plural: 'نقاط',
  },
  night: {
    singular: 'ليلة',
    dual: 'ليلتان',
    plural: 'ليالٍ',
  },
  guest: {
    singular: 'ضيف',
    dual: 'ضيفان',
    plural: 'ضيوف',
  },
  booking: {
    singular: 'حجز',
    dual: 'حجزان',
    plural: 'حجوزات',
  },
  trip: {
    singular: 'رحلة',
    dual: 'رحلتان',
    plural: 'رحلات',
  },
  hour: {
    singular: 'ساعة',
    dual: 'ساعتان',
    plural: 'ساعات',
  },
  minute: {
    singular: 'دقيقة',
    dual: 'دقيقتان',
    plural: 'دقائق',
  },
}

ARABIC_PLURAL_FORMS['نتيجة'] = ARABIC_PLURAL_FORMS.result
ARABIC_PLURAL_FORMS['نتائج'] = ARABIC_PLURAL_FORMS.result
ARABIC_PLURAL_FORMS['إقامة'] = ARABIC_PLURAL_FORMS.stay
ARABIC_PLURAL_FORMS['إقامات'] = ARABIC_PLURAL_FORMS.stay
ARABIC_PLURAL_FORMS['نقطة'] = ARABIC_PLURAL_FORMS.point
ARABIC_PLURAL_FORMS['نقاط'] = ARABIC_PLURAL_FORMS.point
ARABIC_PLURAL_FORMS['ليلة'] = ARABIC_PLURAL_FORMS.night
ARABIC_PLURAL_FORMS['ليالي'] = ARABIC_PLURAL_FORMS.night
ARABIC_PLURAL_FORMS['ضيف'] = ARABIC_PLURAL_FORMS.guest
ARABIC_PLURAL_FORMS['ضيوف'] = ARABIC_PLURAL_FORMS.guest
ARABIC_PLURAL_FORMS['حجز'] = ARABIC_PLURAL_FORMS.booking
ARABIC_PLURAL_FORMS['حجوزات'] = ARABIC_PLURAL_FORMS.booking
ARABIC_PLURAL_FORMS['رحلة'] = ARABIC_PLURAL_FORMS.trip
ARABIC_PLURAL_FORMS['رحلات'] = ARABIC_PLURAL_FORMS.trip
ARABIC_PLURAL_FORMS['ساعة'] = ARABIC_PLURAL_FORMS.hour
ARABIC_PLURAL_FORMS['ساعات'] = ARABIC_PLURAL_FORMS.hour

export const ENGLISH_PLURAL_FORMS = {
  result: { singular: 'result', plural: 'results' },
  stay: { singular: 'stay', plural: 'stays' },
  point: { singular: 'point', plural: 'points' },
  night: { singular: 'night', plural: 'nights' },
  guest: { singular: 'guest', plural: 'guests' },
  booking: { singular: 'booking', plural: 'bookings' },
  trip: { singular: 'trip', plural: 'trips' },
  hour: { singular: 'hour', plural: 'hours' },
  minute: { singular: 'minute', plural: 'minutes' },
}

/**
 * Returns the grammatically correct Arabic word according to count:
 * - 1: مفرد (إقامة)
 * - 2: مثنى (إقامتان / إقامتين)
 * - 3 إلى 10: جمع (إقامات)
 * - 11 فأكثر: مفرد (إقامة)
 */
export const getArabicPluralWord = (count, typeOrForms) => {
  const forms =
    typeof typeOrForms === 'string'
      ? ARABIC_PLURAL_FORMS[typeOrForms] || { singular: typeOrForms, dual: typeOrForms, plural: typeOrForms }
      : typeOrForms || {}

  const n = Math.abs(Number(count) || 0)

  // 1 = مفرد
  if (n === 1) {
    return forms.singular || ''
  }

  // 2 = مثنى
  if (n === 2) {
    return forms.dual || forms.singular || ''
  }

  // 3 إلى 10 = جمع (مع الأخذ بالاعتبار 103-110 إلخ)
  const mod100 = n % 100
  if (mod100 >= 3 && mod100 <= 10) {
    return forms.plural || forms.singular || ''
  }

  // 11 فأكثر = مفرد (و 0 = مفرد)
  return forms.singular || forms.plural || ''
}

/**
 * Formats a count and word with proper pluralization in Arabic or English.
 * Examples:
 *   pluralize(15, 'result', 'ar') -> '15 نتيجة'
 *   pluralize(6, 'point', 'ar')  -> '6 نقاط'
 *   pluralize(3, 'stay', 'ar')   -> '3 إقامات'
 *   pluralize(2, 'guest', 'ar')  -> '2 ضيفان'
 *   pluralize(1, 'night', 'ar')  -> '1 ليلة'
 */
export const pluralize = (count, typeOrForms, language = 'ar', options = {}) => {
  const n = Number(count) || 0
  const isEn = language === 'en'

  if (isEn) {
    const forms =
      typeof typeOrForms === 'string'
        ? ENGLISH_PLURAL_FORMS[typeOrForms] || { singular: typeOrForms, plural: `${typeOrForms}s` }
        : typeOrForms || {}
    const word = n === 1 ? (forms.singular || typeOrForms) : (forms.plural || `${forms.singular || typeOrForms}s`)
    return options.includeNumber === false ? word : `${n} ${word}`
  }

  const word = getArabicPluralWord(n, typeOrForms)
  if (options.includeNumber === false) {
    return word
  }

  if (n === 2 && options.standaloneDual) {
    return word
  }

  return `${n} ${word}`
}
