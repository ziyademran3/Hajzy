import {
  sendEmailUnified,
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  getOwnerBookingNotificationTemplate,
  maskEmail,
} from './emailService.js'

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    },
  })

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const toBase64 = (value) => btoa(typeof value === 'string' ? value : String.fromCharCode(...value))
const toBase64Url = (value) => toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const utf8 = (text) => new TextEncoder().encode(text)

const paymobText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

const paymobTransactionHmacFields = (transaction) => [
  transaction.amount_cents,
  transaction.created_at,
  transaction.currency,
  transaction.error_occured,
  transaction.has_parent_transaction,
  transaction.id,
  transaction.integration_id,
  transaction.is_3d_secure,
  transaction.is_auth,
  transaction.is_capture,
  transaction.is_refunded,
  transaction.is_standalone_payment,
  transaction.is_voided,
  transaction.order?.id,
  transaction.owner,
  transaction.pending,
  transaction.source_data?.pan,
  transaction.source_data?.sub_type,
  transaction.source_data?.type,
  transaction.success,
]

async function paymobHmacIsValid(transaction, receivedHmac, secret) {
  if (!secret || !receivedHmac) return false
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    utf8(paymobTransactionHmacFields(transaction).map(paymobText).join('')),
  )
  const expected = Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  if (expected.length !== receivedHmac.length) return false
  let different = 0
  for (let index = 0; index < expected.length; index += 1) different |= expected.charCodeAt(index) ^ receivedHmac.charCodeAt(index)
  return different === 0
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', utf8(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 },
    key,
    256
  )
  return `pbkdf2:100000:${toBase64Url(salt)}:${toBase64Url(new Uint8Array(bits))}`
}

async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2:')) return false
  const [, iterationText, salt, expected] = stored.split(':')
  const key = await crypto.subtle.importKey('raw', utf8(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(salt), iterations: Number(iterationText) },
    key,
    256
  )
  return toBase64Url(new Uint8Array(bits)) === expected
}

async function signJwt(payload, secret) {
  const header = toBase64Url(utf8(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = toBase64Url(utf8(JSON.stringify(payload)))
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, utf8(data))
  return `${data}.${toBase64Url(new Uint8Array(signature))}`
}

async function verifyJwt(token, secret) {
  const [header, body, signature] = String(token || '').split('.')
  if (!header || !body || !signature) throw new Error('invalid')
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), utf8(data))
  if (!valid) throw new Error('invalid')
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired')
  return payload
}

const SEEDED_ACCOUNTS = [
  {
    id: 'owner-demo',
    fullName: 'مالك العقارات',
    email: 'hajzy2005@gmail.com',
    role: 'owner',
    password: 'Ziad@Hajzy@2005',
    emailVerified: true,
  },
  {
    id: 'demo-user',
    fullName: 'مستخدم تجريبي',
    email: 'user@hajzy.com',
    role: 'user',
    password: 'TestPass123!',
    emailVerified: true,
  },
  {
    id: 'test-user',
    fullName: 'Test Guest',
    email: 'test@example.com',
    role: 'user',
    password: 'TestPass123!',
    emailVerified: true,
  },
]

function authStore(env) {
  const kv = env.HAJZY_AUTH
  return {
    async getByEmail(email) {
      const normalized = String(email || '').trim().toLowerCase()
      const seeded = SEEDED_ACCOUNTS.find((u) => u.email.toLowerCase() === normalized)
      if (seeded) return seeded
      if (!kv) return null
      const raw = await kv.get(`email:${normalized}`)
      return raw ? JSON.parse(raw) : null
    },
    async getById(id) {
      const seeded = SEEDED_ACCOUNTS.find((u) => u.id === id)
      if (seeded) return seeded
      if (!kv) return null
      const raw = await kv.get(`id:${id}`)
      return raw ? JSON.parse(raw) : null
    },
    async getByResetToken(token) {
      const raw = await kv.get(`reset:${token}`)
      if (!raw) return null
      const record = JSON.parse(raw)
      if (new Date(record.expiresAt) <= new Date()) {
        await kv.delete(`reset:${token}`)
        return null
      }
      return this.getById(record.userId)
    },
    async getByVerificationToken(token) {
      const userId = await kv.get(`verify:${token}`)
      return userId ? this.getById(userId) : null
    },
    async save(user) {
      await kv.put(`id:${user.id}`, JSON.stringify(user))
      await kv.put(`email:${user.email}`, JSON.stringify(user))
      return user
    },
    async setResetToken(user, token, expiresAt) {
      await kv.put(`reset:${token}`, JSON.stringify({ userId: user.id, expiresAt }), { expirationTtl: 60 * 30 })
    },
    async clearResetToken(token) {
      await kv.delete(`reset:${token}`)
    },
    async setVerificationToken(userId, token) {
      await kv.put(`verify:${token}`, userId)
    },
    async clearVerificationToken(token) {
      await kv.delete(`verify:${token}`)
    },
  }
}

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function bearer(request) {
  const header = request.headers.get('Authorization') || ''
  const parts = header.split(' ')
  return parts.length === 2 ? parts[1] : parts[0]
}

async function checkRateLimit(kv, key, limit = 5, windowSeconds = 900) {
  if (!kv) return { allowed: true, remaining: limit }
  const rateKey = `rate:${key}`
  const raw = await kv.get(rateKey)
  const count = raw ? parseInt(raw, 10) : 0
  if (count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  await kv.put(rateKey, String(count + 1), { expirationTtl: windowSeconds })
  return { allowed: true, remaining: limit - (count + 1) }
}


async function paymobRequest(path, body, secretKey) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(`https://accept.paymob.com${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secretKey ? { Authorization: `Token ${secretKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.message || payload.detail || `Paymob returned ${response.status}`)
    }
    return payload
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Timed out while contacting Paymob.')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function createPaymobCheckout(env, { amount, currency, title, user, callbackBaseUrl, returnUrl }) {
  const secretKey = env.PAYMOB_SECRET_KEY?.trim()
  const publicKey = env.PAYMOB_PUBLIC_KEY?.trim()
  const integrationId = env.PAYMOB_INTEGRATION_ID?.trim()
  if (!secretKey || !publicKey || !integrationId) {
    throw new Error('Paymob is not configured. Set PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, and PAYMOB_INTEGRATION_ID.')
  }

  const amountCents = Math.round(Number(amount) * 100)
  if (!Number.isSafeInteger(amountCents) || amountCents < 100) {
    throw new Error('Payment amount must be at least 1 EGP.')
  }

  const reference = `hajzy-${crypto.randomUUID()}`
  const [firstName, ...rest] = String(user.fullName || 'Hajzy Customer').trim().split(/\s+/)
  // Allow Android deep link or any valid payment-result URL on the client's current domain
  const isAllowedReturn = returnUrl === 'com.hajzy.app://payment-result' ||
    (typeof returnUrl === 'string' && (returnUrl.startsWith('http://') || returnUrl.startsWith('https://')) && returnUrl.includes('/payment-result'))
  const redirectionUrl = isAllowedReturn
    ? returnUrl
    : env.PAYMOB_RETURN_URL?.trim() || `${callbackBaseUrl}/payment-result`

  const intention = await paymobRequest('/v1/intention/', {
    amount: amountCents,
    currency: currency || 'EGP',
    payment_methods: [Number(integrationId)],
    items: [{ name: title || 'Hajzy booking', amount: amountCents, description: title || 'Hajzy booking', quantity: 1 }],
    special_reference: reference,
    expiration: 3600,
    // The browser closes back into the installed Android app. This return is
    // only for navigation; the signed webhook below remains the source of
    // truth for marking a payment as successful.
    redirection_url: redirectionUrl,
    notification_url: `${callbackBaseUrl}/api/payments/paymob/webhook`,
    billing_data: {
      apartment: 'NA', email: user.email, floor: 'NA', first_name: firstName || 'Customer',
      street: 'NA', building: 'NA', phone_number: user.phone || '+201000000000',
      shipping_method: 'NA', postal_code: 'NA', city: 'Cairo', country: 'EG',
      last_name: rest.join(' ') || 'Customer', state: 'Cairo',
    },
  }, secretKey)
  if (!intention.client_secret) throw new Error('Paymob did not return a checkout client secret.')

  // Keep an immutable server-side link between the Paymob order and the user.
  // It is used only after the signed callback arrives.
  if (env.HAJZY_AUTH && (intention.intention_order_id || intention.id)) {
    await env.HAJZY_AUTH.put(`payment:${intention.intention_order_id || intention.id}`, JSON.stringify({
      userId: user.id,
      reference,
      amountCents,
      currency: currency || 'EGP',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 60 * 60 * 24 * 30 })
  }

  return {
    provider: 'paymob',
    reference,
    orderId: intention.intention_order_id || intention.id,
    redirectUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(intention.client_secret)}`,
    title,
  }
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    avatar_url: user.avatarUrl || null,
    role: user.role || 'user',
  }
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method === 'OPTIONS') return json({ ok: true })

  const requestUrl = new URL(request.url)
  const path = requestUrl.pathname.replace(/\/+$/, '') || '/'
  const db = authStore(env)
  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-me'
  // Always use the deployed Pages hostname unless a custom canonical URL is set.
  // The former fallback pointed to another Pages project, so verification links
  // opened the UI but sent their API request to the wrong backend.
  const appUrl = (env.APP_URL || requestUrl.origin).replace(/\/$/, '')

  try {
    if (path === '/api/health' && request.method === 'GET') {
      const isConfigured = Boolean(
        env.BREVO_API_KEY ||
        (env.RESEND_API_KEY && env.RESEND_FROM) ||
        (env.GMAIL_USER && env.GMAIL_APP_PASSWORD)
      )
      return json({
        ok: true,
        mode: db ? 'kv' : 'unconfigured',
        emailConfigured: isConfigured,
        emailProvider: env.BREVO_API_KEY ? 'brevo' : (env.RESEND_API_KEY ? 'resend' : 'none'),
        message: 'API is healthy (Cloudflare Pages).',
      })
    }

    if (!db) {
      return json({ message: 'Auth store is not configured. Bind HAJZY_AUTH KV.' }, 500)
    }

    if (path === '/api/auth/register' && request.method === 'POST') {
      const { fullName, email, password } = await readBody(request)
      if (!fullName || !email || !password) return json({ message: 'fullName, email and password are required.' }, 400)
      if (!isValidEmail(email)) return json({ message: 'Please provide a valid email address.' }, 400)
      if (password.length < 8) return json({ message: 'Password must be at least 8 characters long.' }, 400)
      const normalizedEmail = email.trim().toLowerCase()
      if (await db.getByEmail(normalizedEmail)) return json({ message: 'An account with this email already exists.' }, 409)
      const user = {
        id: crypto.randomUUID(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        emailVerified: false,
        createdAt: new Date().toISOString(),
      }
      const verificationToken = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('')
      await db.save(user)
      await db.setVerificationToken(user.id, verificationToken)

      // Send verification email asynchronously
      context.waitUntil(
        sendEmailUnified(env, {
          to: normalizedEmail,
          toName: user.fullName,
          subject: 'تأكيد بريدك الإلكتروني | Hajzy',
          html: getEmailVerificationTemplate({
            name: user.fullName,
            verificationLink: `${appUrl}/verify-email?token=${verificationToken}`,
            language: 'ar',
          }),
        })
      )

      return json({ message: 'User registered successfully. Please verify your email address.', user: publicUser(user) }, 201)
    }

    if (path === '/api/auth/login' && request.method === 'POST') {
      const { email, password } = await readBody(request)
      if (!email || !password) return json({ message: 'Email and password are required.' }, 400)
      const user = await db.getByEmail(String(email).trim().toLowerCase())
      const passwordValid = user && (
        (user.password && user.password === password) ||
        (user.passwordHash && (await verifyPassword(password, user.passwordHash)))
      )
      if (!user || !passwordValid) {
        return json({ message: 'Invalid email or password.' }, 401)
      }
      const token = await signJwt(
        { userId: user.id, email: user.email, fullName: user.fullName, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
        jwtSecret
      )
      return json({ message: 'Login successful.', token, user: publicUser(user) })
    }

    if (path === '/api/auth/forgot-password' && request.method === 'POST') {
      const { email } = await readBody(request)
      if (!email || !isValidEmail(email)) return json({ message: 'يرجى إدخال بريد إلكتروني صحيح.' }, 400)
      const normalizedEmail = email.trim().toLowerCase()

      // Rate limit by IP (max 6 requests / 15 min) and by email (max 4 requests / 15 min)
      const clientIp = request.headers.get('cf-connecting-ip') || 'anon'
      const ipLimit = await checkRateLimit(env.HAJZY_AUTH, `ip:${clientIp}:forgot`, 6, 900)
      const emailLimit = await checkRateLimit(env.HAJZY_AUTH, `email:${normalizedEmail}:forgot`, 4, 900)

      if (!ipLimit.allowed || !emailLimit.allowed) {
        return json({
          ok: false,
          message: 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار 15 دقيقة ثم المحاولة مجدداً.',
        }, 429)
      }

      const user = await db.getByEmail(normalizedEmail)

      // User Enumeration Prevention: Always return a neutral success message
      const neutralMessage = 'إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على تعليمات الاستعادة خلال دقائق.'

      if (!user) {
        return json({
          ok: true,
          emailSent: true,
          message: neutralMessage,
        })
      }

      const resetToken = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('')
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      await db.setResetToken(user, resetToken, expiresAt)
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`

      const emailResult = await sendEmailUnified(env, {
        to: normalizedEmail,
        toName: user.fullName || 'عضو منصة حجزي',
        subject: 'إعادة تعيين كلمة المرور | Hajzy Password Reset',
        html: getPasswordResetTemplate({ resetLink, language: 'ar' }),
      })

      if (!emailResult.ok) {
        console.error(`[ForgotPassword] Delivery issue for ${maskEmail(normalizedEmail)}:`, emailResult.message)
        return json({
          ok: false,
          emailSent: false,
          message: 'حدثت مشكلة مؤقتة، يرجى المحاولة مرة أخرى بعد قليل.',
        }, 503)
      }

      return json({
        ok: true,
        emailSent: true,
        message: neutralMessage,
      })
    }


    if (path === '/api/auth/reset-password' && request.method === 'POST') {
      const { token, newPassword } = await readBody(request)
      if (!token || !newPassword) return json({ message: 'Token and new password are required.' }, 400)
      if (newPassword.length < 8) return json({ message: 'New password must be at least 8 characters long.' }, 400)
      const user = await db.getByResetToken(token)
      if (!user) return json({ message: 'Invalid or expired password reset token.' }, 400)
      user.passwordHash = await hashPassword(newPassword)
      await db.save(user)
      await db.clearResetToken(token)
      return json({ message: 'Password reset successfully.' })
    }

    if (path === '/api/auth/verify-email' && request.method === 'POST') {
      const { token } = await readBody(request)
      if (!token) return json({ message: 'Verification token is required.' }, 400)
      const user = await db.getByVerificationToken(token)
      if (!user) return json({ message: 'Invalid or expired verification token.' }, 400)
      user.emailVerified = true
      await db.save(user)
      await db.clearVerificationToken(token)
      return json({ message: 'Email verified successfully.' })
    }

    if (path === '/api/payments/paymob/session' && request.method === 'POST') {
      let payload
      try {
        payload = await verifyJwt(bearer(request), jwtSecret)
      } catch {
        return json({ message: 'Please sign in before starting a payment.' }, 401)
      }
      const user = await db.getById(payload.userId)
      if (!user) return json({ message: 'User not found.' }, 404)

      const { amount, currency, propertyTitle, paymentMethod, returnUrl } = await readBody(request)
      if (String(currency || 'EGP').toUpperCase() !== 'EGP') {
        return json({ message: 'Paymob checkout currently supports EGP only.' }, 400)
      }
      if (paymentMethod && paymentMethod !== 'card') {
        return json({ message: 'This Paymob integration is configured for card payments only.' }, 400)
      }
      try {
        const session = await createPaymobCheckout(env, {
          amount,
          currency: 'EGP',
          title: String(propertyTitle || 'Hajzy booking').slice(0, 120),
          user,
          callbackBaseUrl: appUrl,
          returnUrl,
        })
        return json(session, 201)
      } catch (error) {
        console.error('Paymob session creation failed:', error.message || String(error))
        return json({ message: 'تعذر تجهيز جلسة الدفع. تحقق من إعدادات Paymob ثم أعد المحاولة.' }, 502)
      }
    }

    if (path === '/api/payments/paymob/webhook' && request.method === 'POST') {
      const callback = await readBody(request)
      const transaction = callback?.obj || callback
      const receivedHmac = requestUrl.searchParams.get('hmac') || callback?.hmac || ''
      const valid = await paymobHmacIsValid(transaction, receivedHmac, env.PAYMOB_HMAC_SECRET?.trim())
      if (!valid) return json({ message: 'Invalid Paymob callback signature.' }, 401)

      const orderId = transaction?.order?.id || transaction?.order_id
      const paymentKey = orderId ? `payment:${orderId}` : null
      const rawPayment = paymentKey && env.HAJZY_AUTH ? await env.HAJZY_AUTH.get(paymentKey) : null
      if (rawPayment && paymentKey) {
        const payment = JSON.parse(rawPayment)
        payment.status = transaction.success && !transaction.pending && !transaction.is_refunded && !transaction.is_voided
          ? 'paid'
          : 'failed'
        payment.transactionId = transaction.id
        payment.paidAt = transaction.success ? new Date().toISOString() : null
        await env.HAJZY_AUTH.put(paymentKey, JSON.stringify(payment), { expirationTtl: 60 * 60 * 24 * 30 })
      }
      return json({ received: true })
    }

    const needsAuth = path === '/api/auth/me' || path === '/api/auth/change-password'
    if (needsAuth) {
      let payload
      try {
        payload = await verifyJwt(bearer(request), jwtSecret)
      } catch {
        return json({ message: 'Invalid or expired token.' }, 401)
      }
      const user = await db.getById(payload.userId)
      if (!user) return json({ message: 'User not found.' }, 404)

      if (path === '/api/auth/me' && request.method === 'GET') {
        return json({ user: publicUser(user) })
      }

      if (path === '/api/auth/me' && request.method === 'PATCH') {
        const { fullName, email, avatar_url } = await readBody(request)
        if (fullName) user.fullName = String(fullName).trim()
        if (avatar_url) user.avatarUrl = String(avatar_url).trim()
        if (email) {
          if (!isValidEmail(email)) return json({ message: 'Please provide a valid email address.' }, 400)
          const normalized = String(email).trim().toLowerCase()
          const existing = await db.getByEmail(normalized)
          if (existing && existing.id !== user.id) return json({ message: 'Another account with this email already exists.' }, 409)
          user.email = normalized
        }
        await db.save(user)
        return json({ message: 'Profile updated successfully.', user: publicUser(user) })
      }

      if (path === '/api/auth/change-password' && request.method === 'POST') {
        const { currentPassword, newPassword } = await readBody(request)
        if (!currentPassword || !newPassword) return json({ message: 'currentPassword and newPassword are required.' }, 400)
        if (newPassword.length < 8) return json({ message: 'New password must be at least 8 characters long.' }, 400)
        const isCurrentValid = (user.password && user.password === currentPassword) ||
          (user.passwordHash && (await verifyPassword(currentPassword, user.passwordHash)))
        if (!isCurrentValid) {
          return json({ message: 'Current password is incorrect.' }, 401)
        }
        user.passwordHash = await hashPassword(newPassword)
        if (user.password) delete user.password
        await db.save(user)
        return json({ message: 'Password changed successfully.' })
      }
    }

    if (path === '/api/notifications' || path.startsWith('/api/notifications/')) {
      let payload
      try {
        payload = await verifyJwt(bearer(request), jwtSecret)
      } catch {
        return json({ message: 'Invalid or expired token.' }, 401)
      }
      const userId = payload.userId
      const kvKey = `notifs:${userId}`

      const loadNotifs = async () => {
        if (!env.HAJZY_AUTH) return []
        const raw = await env.HAJZY_AUTH.get(kvKey)
        if (!raw) return []
        try { return JSON.parse(raw) } catch { return [] }
      }

      const saveNotifs = async (list) => {
        if (!env.HAJZY_AUTH) return
        await env.HAJZY_AUTH.put(kvKey, JSON.stringify(list))
      }

      if (path === '/api/notifications' && request.method === 'GET') {
        const list = await loadNotifs()
        return json({ notifications: list })
      }

      if (path === '/api/notifications' && request.method === 'POST') {
        const reqData = await readBody(request)
        const {
          title,
          body,
          detail,
          type,
          bookingId,
          propertyId,
          ownerEmail,
          ownerName,
          guestName,
          propertyTitle,
          checkIn,
          checkOut,
          totalPrice,
          currency,
        } = reqData

        const notif = {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId,
          title: typeof title === 'object' ? title : { ar: String(title || ''), en: String(title || '') },
          body: typeof (body || detail) === 'object' ? (body || detail) : { ar: String(body || detail || ''), en: String(body || detail || '') },
          detail: typeof (body || detail) === 'object' ? (body || detail) : { ar: String(body || detail || ''), en: String(body || detail || '') },
          type: type || 'info',
          bookingId: bookingId || null,
          propertyId: propertyId || null,
          createdAt: new Date().toISOString(),
          readAt: null,
          read: false,
        }
        const list = await loadNotifs()
        const updated = [notif, ...list].slice(0, 50)
        await saveNotifs(updated)

        // Asynchronously notify owner via email if ownerEmail provided
        if (ownerEmail && isValidEmail(ownerEmail)) {
          context.waitUntil(
            sendEmailUnified(env, {
              to: ownerEmail,
              toName: ownerName || 'مالك العقار',
              subject: 'إشعار بحجز جديد في عقارك | Hajzy',
              html: getOwnerBookingNotificationTemplate({
                ownerName,
                guestName,
                propertyTitle,
                checkIn,
                checkOut,
                totalPrice,
                currency: currency || 'EGP',
                bookingId,
                dashboardUrl: `${appUrl}/owner/bookings`,
                language: 'ar',
              }),
            })
          )
        }

        return json({ notification: notif }, 201)
      }

    if (path === '/api/email/notify-booking' && request.method === 'POST') {
      const {
        ownerEmail,
        ownerName,
        guestName,
        propertyTitle,
        checkIn,
        checkOut,
        totalPrice,
        currency,
        bookingId,
        language = 'ar',
      } = await readBody(request)

      if (!ownerEmail || !isValidEmail(ownerEmail)) {
        return json({ ok: false, message: 'Valid ownerEmail is required.' }, 400)
      }

      const emailResult = await sendEmailUnified(env, {
        to: ownerEmail,
        toName: ownerName || 'مالك العقار',
        subject: language === 'en' ? 'New Booking Alert | Hajzy' : 'إشعار بحجز جديد في عقارك | Hajzy',
        html: getOwnerBookingNotificationTemplate({
          ownerName,
          guestName,
          propertyTitle,
          checkIn,
          checkOut,
          totalPrice,
          currency: currency || 'EGP',
          bookingId,
          dashboardUrl: `${appUrl}/owner/bookings`,
          language,
        }),
      })

      return json({ ok: emailResult.ok, provider: emailResult.provider, messageId: emailResult.messageId })
    }


      if (path === '/api/notifications/read-all' && (request.method === 'PATCH' || request.method === 'POST')) {
        const list = await loadNotifs()
        const now = new Date().toISOString()
        const updated = list.map((n) => ({ ...n, readAt: n.readAt || now, read: true }))
        await saveNotifs(updated)
        return json({ message: 'All notifications marked as read.', notifications: updated })
      }

      if (path.startsWith('/api/notifications/') && request.method === 'DELETE') {
        const notifId = path.replace('/api/notifications/', '').trim()
        const list = await loadNotifs()
        const updated = list.filter((n) => n.id !== notifId)
        await saveNotifs(updated)
        return json({ message: 'Notification deleted successfully.' })
      }
    }

    return json({ message: 'Not found.' }, 404)
  } catch (error) {
    console.error('Pages API error:', error)
    return json({ message: 'Unable to process the request right now.', error: error.message }, 500)
  }
}
