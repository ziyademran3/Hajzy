const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

async function requestJson(path, options = {}) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('hajzy_auth_token') || localStorage.getItem('stitch_auth_token')
      : null
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'The request failed.')
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
