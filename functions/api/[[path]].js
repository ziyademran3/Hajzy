import { connect } from 'cloudflare:sockets'

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

function authStore(env) {
  const kv = env.HAJZY_AUTH
  if (!kv) return null
  return {
    async getByEmail(email) {
      const raw = await kv.get(`email:${email}`)
      return raw ? JSON.parse(raw) : null
    },
    async getById(id) {
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

function resetEmailHtml(resetLink) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 15px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td align="center" style="background:linear-gradient(135deg,#064e3b,#0d9488);padding:36px 20px;">
          <h1 style="margin:0;color:#fff;font-size:24px;">Hajzy | حجزي</h1>
        </td></tr>
        <tr><td style="padding:36px 30px;text-align:right;direction:rtl;">
          <h2 style="margin:0 0 14px;font-size:20px;">طلب إعادة تعيين كلمة المرور</h2>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">اضغط على الزر أدناه لاختيار كلمة مرور جديدة:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#fff;text-decoration:none;font-weight:700;padding:14px 34px;border-radius:14px;">إعادة تعيين كلمة المرور الآن</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;word-break:break-all;direction:ltr;text-align:left;">${resetLink}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function verificationEmailHtml(name, verificationLink) {
  const safeName = String(name || 'ضيفنا العزيز').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 15px;background:#f1f5f9;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 12px 36px rgba(15,23,42,.08);">
        <tr><td align="center" style="background:linear-gradient(135deg,#064e3b,#0d9488);padding:34px 20px;">
          <div style="width:54px;height:54px;line-height:54px;border-radius:16px;background:#fff;color:#0d9488;font-size:27px;font-weight:900;margin:0 auto 12px;">H</div>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Hajzy | حجزي</h1>
          <p style="margin:7px 0 0;color:#a7f3d0;font-size:13px;">أهلًا بك في مجتمع حجزي</p>
        </td></tr>
        <tr><td style="padding:36px 30px;text-align:right;direction:rtl;">
          <h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">تأكيد البريد الإلكتروني</h2>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#475569;">مرحبًا ${safeName}،</p>
          <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">شكرًا لانضمامك إلى Hajzy. أكّد بريدك الإلكتروني لتفعيل حسابك والاستفادة من جميع خدماتنا.</p>
          <div style="text-align:center;margin:32px 0 24px;">
            <a href="${verificationLink}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 34px;border-radius:14px;box-shadow:0 8px 20px rgba(13,148,136,.28);">تأكيد البريد الإلكتروني</a>
          </div>
          <div style="padding:14px 16px;border-radius:12px;background:#f0fdfa;color:#0f766e;font-size:13px;line-height:1.7;">إذا لم تنشئ هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.</div>
          <p style="margin:22px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;word-break:break-all;direction:ltr;text-align:left;">إذا لم يعمل الزر، انسخ الرابط التالي وافتحه في المتصفح:<br>${verificationLink}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function readSmtp(reader, decoder, leftover) {
  let buffer = leftover
  while (true) {
    const lines = buffer.split(/\r?\n/)
    if (lines.length > 1) {
      const line = lines.shift()
      return { line, leftover: lines.join('\n') }
    }
    const { value, done } = await reader.read()
    if (done) return { line: buffer, leftover: '' }
    buffer += decoder.decode(value, { stream: true })
  }
}

async function sendViaGmailSmtp({ user, pass, to, subject, html }) {
  const socket = connect(
    { hostname: 'smtp.gmail.com', port: 465 },
    { secureTransport: 'on' },
  )
  const writer = socket.writable.getWriter()
  const reader = socket.readable.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let leftover = ''

  const send = async (command) => {
    await writer.write(encoder.encode(`${command}\r\n`))
  }
  const recv = async () => {
    const next = await readSmtp(reader, decoder, leftover)
    leftover = next.leftover
    return next.line
  }
  const expect = async (prefix) => {
    let line = await recv()
    while (line && line[3] === '-') line = await recv()
    if (!line.startsWith(prefix)) throw new Error(line || 'SMTP handshake failed')
    return line
  }

  try {
    await expect('220')
    await send('EHLO hajzy.pages.dev')
    await expect('250')
    await send('AUTH LOGIN')
    await expect('334')
    await send(btoa(user))
    await expect('334')
    await send(btoa(pass))
    await expect('235')
    await send(`MAIL FROM:<${user}>`)
    await expect('250')
    await send(`RCPT TO:<${to}>`)
    await expect('250')
    await send('DATA')
    await expect('354')
    const encodedSubject = `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(subject)))}?=`
    const payload = [
      `From: Hajzy <${user}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
      '.',
    ].join('\r\n')
    await writer.write(encoder.encode(`${payload}\r\n`))
    await expect('250')
    await send('QUIT')
    return { ok: true }
  } finally {
    try { await writer.close() } catch {}
    try { reader.releaseLock() } catch {}
  }
}

async function sendEmail(env, { to, subject, html }) {
  const gmailUser = env.GMAIL_USER?.trim()
  const gmailPass = env.GMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '')
  let gmailError = null
  if (gmailUser && gmailPass) {
    try {
      await sendViaGmailSmtp({ user: gmailUser, pass: gmailPass, to, subject, html })
      return { ok: true }
    } catch (error) {
      gmailError = error.message || String(error)
      console.error('Gmail SMTP error:', gmailError)
    }
  }

  if (env.RESEND_API_KEY) {
    const from = env.RESEND_FROM?.trim()
    if (!from) return { ok: false, message: 'RESEND_FROM is not configured with a verified sender address.' }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, message: payload.message || 'Failed to send email via Resend.' }
    }
    return { ok: true }
  }

  if (gmailError) return { ok: false, message: `Gmail could not send the reset email: ${gmailError}` }
  return { ok: false, message: 'Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD, or configure Resend.' }
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

async function createPaymobCheckout(env, { amount, currency, title, user, callbackBaseUrl }) {
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
    redirection_url: env.PAYMOB_RETURN_URL?.trim() || `${callbackBaseUrl}/payment-result`,
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
      return json({
        ok: true,
        mode: db ? 'kv' : 'unconfigured',
        emailConfigured: Boolean((env.GMAIL_USER && env.GMAIL_APP_PASSWORD) || env.RESEND_API_KEY),
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
      await sendEmail(env, {
        to: normalizedEmail,
        subject: 'تأكيد بريدك الإلكتروني | Hajzy',
        html: verificationEmailHtml(user.fullName, `${appUrl}/verify-email?token=${verificationToken}`),
      })
      return json({ message: 'User registered successfully. Please verify your email address.', user: publicUser(user) }, 201)
    }

    if (path === '/api/auth/login' && request.method === 'POST') {
      const { email, password } = await readBody(request)
      if (!email || !password) return json({ message: 'Email and password are required.' }, 400)
      const user = await db.getByEmail(String(email).trim().toLowerCase())
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
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
      if (!email || !isValidEmail(email)) return json({ message: 'Please provide a valid email address.' }, 400)
      const normalizedEmail = email.trim().toLowerCase()
      const user = await db.getByEmail(normalizedEmail)
      if (!user) {
        return json({
          ok: false,
          emailSent: false,
          message: 'هذا البريد الإلكتروني غير مسجل. أنشئ حسابًا جديدًا أو استخدم بريدًا مسجلاً.',
        }, 404)
      }
      const resetToken = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('')
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      await db.setResetToken(user, resetToken, expiresAt)
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`
      const emailResult = await sendEmail(env, {
        to: normalizedEmail,
        subject: 'إعادة تعيين كلمة المرور | Hajzy Password Reset',
        html: resetEmailHtml(resetLink),
      })
      if (!emailResult.ok) {
        console.error(`Password reset email failed for ${normalizedEmail}:`, emailResult.message)
        return json({
          ok: false,
          emailSent: false,
          message: 'تعذر إرسال رسالة الاستعادة حالياً. تحقق من إعدادات البريد في الخادم ثم أعد المحاولة.',
        }, 503)
      }
      return json({
        ok: true,
        emailSent: true,
        message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.',
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

      const { amount, currency, propertyTitle, paymentMethod } = await readBody(request)
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
        if (!(await verifyPassword(currentPassword, user.passwordHash))) {
          return json({ message: 'Current password is incorrect.' }, 401)
        }
        user.passwordHash = await hashPassword(newPassword)
        await db.save(user)
        return json({ message: 'Password changed successfully.' })
      }
    }

    return json({ message: 'Not found.' }, 404)
  } catch (error) {
    console.error('Pages API error:', error)
    return json({ message: 'Unable to process the request right now.', error: error.message }, 500)
  }
}
