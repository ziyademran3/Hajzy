/**
 * Utilities and validation rules for booking confirmation and guest information.
 */

// Convert Eastern Arabic (٠-٩) and Persian (۰-۹) numerals to standard Latin digits (0-9)
export const normalizeArabicDigits = (str = '') => {
  return String(str ?? '')
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
}

/**
 * Safely normalizes any phone number input:
 * - Starts with const v = String(value ?? '')
 * - Converts Arabic/Persian digits to standard Latin (0-9)
 * - Removes spaces, dashes, parentheses, dots and unexpected characters
 * - Preserves leading '+' for international numbers
 * - Handles autofill values like "+20 102 468 8333", "010 2277 7320", "(+20) 102-468-8333"
 * - Never throws an error on any input type
 */
export const normalizePhone = (value = '') => {
  try {
    const v = String(value ?? '')
    if (!v) return ''
    const converted = normalizeArabicDigits(v)
    const trimmed = converted.trim()
    const hasLeadingPlus = trimmed.startsWith('+')
    const digitsOnly = trimmed.replace(/\D/g, '')
    if (!digitsOnly) return ''
    return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly
  } catch {
    return ''
  }
}

/**
 * Clean phone number: alias to normalizePhone for backward compatibility
 */
export const cleanPhoneNumber = (phone = '') => {
  return normalizePhone(phone)
}

/**
 * Validates full name:
 * - not empty after trim
 * - at least 3 characters
 * - collapses consecutive spaces
 */
export const validateFullName = (name = '', language = 'ar') => {
  const isEn = language === 'en'
  const trimmed = String(name ?? '').trim()

  if (!trimmed) {
    return {
      isValid: false,
      error: isEn ? 'Full name is required' : 'الاسم مطلوب',
      normalized: '',
    }
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: isEn ? 'Name must be at least 3 characters' : 'الاسم يجب أن يكون 3 أحرف على الأقل',
      normalized: trimmed.replace(/\s+/g, ' '),
    }
  }

  return {
    isValid: true,
    error: '',
    normalized: trimmed.replace(/\s+/g, ' '),
  }
}

/**
 * Validates phone number according to Egyptian mobile rules + international format
 * - Egyptian local mobile: 01[0125]\d{8} (11 digits, e.g. 01012345678)
 * - Egyptian international: (+20|0020)1[0125]\d{8}
 * - Egyptian without plus prefix: 201[0125]\d{8}
 * - International guests: +[1-9]\d{7,14}
 * Normalizes to standard E.164 (e.g. +201012345678)
 */
export const validatePhone = (phone = '', language = 'ar') => {
  const isEn = language === 'en'
  const cleaned = normalizePhone(phone)

  if (!cleaned) {
    return {
      isValid: false,
      error: isEn ? 'Phone number is required' : 'رقم الهاتف مطلوب',
      normalized: '',
    }
  }

  const egLocalRegex = /^01[0125]\d{8}$/
  const egIntlRegex = /^(\+20|0020)1[0125]\d{8}$/
  const egNoPlusRegex = /^201[0125]\d{8}$/
  const globalIntlRegex = /^\+[1-9]\d{7,14}$/

  let normalized = ''

  if (egLocalRegex.test(cleaned)) {
    // 01xxxxxxxxx -> +201xxxxxxxxx
    normalized = `+20${cleaned.slice(1)}`
  } else if (egIntlRegex.test(cleaned)) {
    if (cleaned.startsWith('0020')) {
      normalized = `+20${cleaned.slice(4)}`
    } else {
      normalized = cleaned
    }
  } else if (egNoPlusRegex.test(cleaned)) {
    // 201xxxxxxxxx -> +201xxxxxxxxx
    normalized = `+${cleaned}`
  } else if (globalIntlRegex.test(cleaned)) {
    normalized = cleaned
  } else {
    return {
      isValid: false,
      error: isEn
        ? 'Invalid phone number, e.g. 01012345678'
        : 'رقم الهاتف غير صحيح، مثال: 01012345678',
      normalized: cleaned,
    }
  }

  return {
    isValid: true,
    error: '',
    normalized,
  }
}

/**
 * Validates email format:
 * - trimmed, lowercase
 * - basic standard email regex
 */
export const validateEmail = (email = '', language = 'ar') => {
  const isEn = language === 'en'
  const trimmed = String(email || '').trim().toLowerCase()

  if (!trimmed) {
    return {
      isValid: false,
      error: isEn ? 'Email is required' : 'البريد الإلكتروني مطلوب',
      normalized: '',
    }
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: isEn ? 'Invalid email address' : 'البريد الإلكتروني غير صحيح',
      normalized: trimmed,
    }
  }

  return {
    isValid: true,
    error: '',
    normalized: trimmed,
  }
}

/**
 * Validates the whole guest form.
 * Notes are completely optional and ignored.
 */
export const validateGuestForm = (form = {}, language = 'ar') => {
  const nameResult = validateFullName(form.fullName, language)
  const phoneResult = validatePhone(form.phone, language)
  const emailResult = validateEmail(form.email, language)

  const errors = {}
  let firstInvalidField = null

  if (!nameResult.isValid) {
    errors.fullName = nameResult.error
    if (!firstInvalidField) firstInvalidField = 'fullName'
  }

  if (!phoneResult.isValid) {
    errors.phone = phoneResult.error
    if (!firstInvalidField) firstInvalidField = 'phone'
  }

  if (!emailResult.isValid) {
    errors.email = emailResult.error
    if (!firstInvalidField) firstInvalidField = 'email'
  }

  const isValid = Object.keys(errors).length === 0

  return {
    isValid,
    errors,
    firstInvalidField,
    normalizedData: {
      fullName: nameResult.normalized,
      phone: phoneResult.normalized,
      email: emailResult.normalized,
      notes: String(form.notes || '').trim(),
    },
  }
}
