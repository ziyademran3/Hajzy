const LOCAL_API_BASE = 'http://localhost:4000/api'
const configuredApiBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')

// Local Vite talks to Express. Production on Pages uses same-origin /api Functions.
const API_BASE = import.meta.env.DEV
  ? (configuredApiBase && !configuredApiBase.startsWith('/') ? configuredApiBase : LOCAL_API_BASE)
  : (configuredApiBase || '/api')

async function requestJson(path, options = {}) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('hajzy_auth_token') || localStorage.getItem('stitch_auth_token')
      : null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30000)
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('انتهت مهلة تجهيز الدفع. تحقق من نشر إعدادات Paymob ثم أعد المحاولة.')
    }
    throw new Error('Failed to fetch')
  } finally {
    clearTimeout(timeout)
  }

  const contentType = response.headers.get('content-type') || ''
  // A missing/crashed Pages Function often returns HTML. Preserve the HTTP
  // status so it is not mistaken for a Gmail delivery failure.
  const body = await response.text().catch(() => '')
  let payload = {}
  if (contentType.includes('application/json') && body) {
    try {
      payload = JSON.parse(body)
    } catch {
      payload = {}
    }
  }

  if (!response.ok) {
    throw new Error(payload.message || `تعذر الاتصال بخدمة الحسابات (رمز الخطأ ${response.status}).`)
  }

  if (!contentType.includes('application/json')) {
    throw new Error('استجابة غير صالحة من خدمة الحسابات. تأكد من نشر دوال API على الخادم.')
  }

  return payload
}

export function registerUser({ fullName, email, password }) {
  return requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  })
}

export function loginUser({ email, password }) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function forgotPassword(email) {
  return requestJson('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword({ token, newPassword }) {
  return requestJson('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
}

export function verifyEmail(token) {
  return requestJson('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

// New profile endpoints
export function getProfile() {
  return requestJson('/auth/me', { method: 'GET' })
}

export function updateProfile(data) {
  return requestJson('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function changePassword(currentPassword, newPassword) {
  return requestJson('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

// Paymob credentials and payment-key generation intentionally live on the
// server. Never create a checkout URL or expose a Paymob API key in Vite.
export function createPaymobPaymentSession({ amount, currency, propertyTitle, paymentMethod, returnUrl }) {
  return requestJson('/payments/paymob/session', {
    method: 'POST',
    timeoutMs: 35000,
    body: JSON.stringify({ amount, currency, propertyTitle, paymentMethod, returnUrl }),
  })
}
