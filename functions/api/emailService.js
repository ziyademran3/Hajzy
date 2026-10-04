/**
 * Hajzy Unified Email Service (Cloudflare Pages Functions / Workers)
 * 100% HTTP REST API based (No direct TCP/SMTP sockets)
 * Supports Brevo (Sendinblue) and Resend with automatic retry and failover.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Masks an email for safe logging without leaking PII.
 * Example: ziyademran3@gmail.com -> z***3@gmail.com
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown'
  const [local, domain] = email.trim().toLowerCase().split('@')
  if (!domain) return '***'
  const maskedLocal = local.length <= 2
    ? `${local[0] || '*'}***`
    : `${local[0]}***${local[local.length - 1]}`
  return `${maskedLocal}@${domain}`
}

/**
 * Escapes HTML characters for safe template interpolation.
 */
function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

// In-memory counter for transient failures across warm worker isolates
let consecutiveFailures = 0

/**
 * Sends an email via Brevo REST API (api.brevo.com/v3/smtp/email)
 */
async function sendViaBrevo(env, { to, toName, subject, html }) {
  const apiKey = env.BREVO_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'BREVO_API_KEY is not configured' }
  }

  const senderEmail = env.BREVO_SENDER_EMAIL?.trim() || 'hajzy2005@gmail.com'
  const senderName = env.BREVO_SENDER_NAME?.trim() || 'Hajzy | حجزي'

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to.trim().toLowerCase(), name: toName || to.split('@')[0] }],
      subject,
      htmlContent: html,
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = payload.message || payload.error || `Brevo HTTP ${response.status}`
    return { ok: false, status: response.status, error: errorMsg }
  }

  return { ok: true, provider: 'brevo', messageId: payload.messageId }
}

/**
 * Sends an email via Resend REST API (api.resend.com/emails)
 */
async function sendViaResend(env, { to, subject, html }) {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.RESEND_FROM?.trim()
  if (!apiKey || !from) {
    return { ok: false, error: 'RESEND_API_KEY or RESEND_FROM is not configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: to.trim().toLowerCase(),
      subject,
      html,
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = payload.message || `Resend HTTP ${response.status}`
    return { ok: false, status: response.status, error: errorMsg }
  }

  return { ok: true, provider: 'resend', messageId: payload.id }
}

/**
 * Unified send function with retry and failover.
 * Priority:
 * 1. Brevo (verified sender, 300 emails/day, no domain restriction)
 * 2. Resend (fallback if Brevo fails or not set)
 */
export async function sendEmailUnified(env, { to, toName, subject, html, maxRetries = 2 }) {
  const masked = maskEmail(to)
  const errors = []

  // List of active providers to attempt
  const providers = []
  if (env.BREVO_API_KEY) {
    providers.push({ name: 'brevo', fn: () => sendViaBrevo(env, { to, toName, subject, html }) })
  }
  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    providers.push({ name: 'resend', fn: () => sendViaResend(env, { to, subject, html }) })
  }

  if (providers.length === 0) {
    console.error(`[EmailService] No HTTP email provider configured. (to: ${masked})`)
    return { ok: false, message: 'No email provider configured on the server.' }
  }

  for (const provider of providers) {
    let attempt = 0
    while (attempt <= maxRetries) {
      try {
        const result = await provider.fn()
        if (result.ok) {
          consecutiveFailures = 0
          console.log(`[EmailService] SUCCESS: Delivered to ${masked} via ${provider.name} (id: ${result.messageId || 'ok'})`)
          return { ok: true, provider: provider.name, messageId: result.messageId }
        }

        errors.push(`${provider.name} attempt ${attempt + 1}: ${result.error}`)

        // If client error (4xx other than 429), don't retry same provider
        if (result.status && result.status >= 400 && result.status < 500 && result.status !== 429) {
          console.warn(`[EmailService] ${provider.name} client rejection: ${result.error} (to: ${masked})`)
          break
        }
      } catch (err) {
        errors.push(`${provider.name} attempt ${attempt + 1} exception: ${err.message || String(err)}`)
      }

      attempt += 1
      if (attempt <= maxRetries) {
        // Exponential backoff: 300ms, 600ms
        await sleep(attempt * 300)
      }
    }
  }

  consecutiveFailures += 1
  if (consecutiveFailures >= 3) {
    console.error(`[EmailService ALERT] ${consecutiveFailures} consecutive email delivery failures detected across providers!`)
  }

  console.error(`[EmailService] ALL PROVIDERS FAILED for ${masked}: ${errors.join(' | ')}`)
  return { ok: false, message: 'Failed to deliver email through all configured providers.', errors }
}

/* ==========================================================================
   RTL Email Templates with Hajzy Brand Identity
   ========================================================================== */

/**
 * Base email layout wrapper with Hajzy emerald-gold branding and RTL support.
 */
function emailLayout({ title, subtitle, contentHtml, isRtl = true }) {
  const dir = isRtl ? 'rtl' : 'ltr'
  const textAlign = isRtl ? 'right' : 'left'

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${isRtl ? 'ar' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Cairo',sans-serif;color:#0f172a;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 12px 36px rgba(15,23,42,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#064e3b 0%,#0f766e 60%,#0d9488 100%);padding:36px 24px;color:#ffffff;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:16px;background:rgba(255,255,255,0.18);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.3);color:#fef08a;font-size:26px;font-weight:700;text-align:center;margin-bottom:12px;">H</div>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Hajzy | حـجـزي</h1>
              ${subtitle ? `<p style="margin:8px 0 0;color:#a7f3d0;font-size:13px;font-weight:400;">${escapeHtml(subtitle)}</p>` : ''}
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 32px;text-align:${textAlign};direction:${dir};">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #f1f5f9;text-align:center;direction:${dir};">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                © 2026 منصة حجزي (Hajzy) — جميع الحقوق محفوظة.<br>
                منصة الإقامات الموثقة والضيافة الفاخرة.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Password Reset Template
 */
export function getPasswordResetTemplate({ resetLink, language = 'ar' }) {
  const isRtl = language !== 'en'
  const title = isRtl ? 'استعادة كلمة المرور' : 'Reset Your Password'
  const subtitle = isRtl ? 'تعليمات أمان الحساب' : 'Account Security Instructions'

  const contentHtml = isRtl
    ? `
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:21px;font-weight:700;">طلب إعادة تعيين كلمة المرور</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.7;">
        تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة <strong>حجزي</strong>. اضغط على الزر أدناه لاختيار كلمة مرور جديدة آمنة:
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 36px;border-radius:14px;box-shadow:0 8px 24px rgba(13,148,136,0.3);letter-spacing:0.2px;">
          إعادة تعيين كلمة المرور الآن
        </a>
      </div>

      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:24px;color:#166534;font-size:13px;line-height:1.6;">
        ⏱️ <strong>ملاحظة أمنية:</strong> هذا الرابط صالح لمدة <strong>30 دقيقة</strong> فقط، وللاستخدام لمرة واحدة.
      </div>

      <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
        إذا لم تطلب إعادة تعيين كلمة المرور بنفسك، يمكنك تجاهل هذه الرسالة بأمان وستظل كلمة مرورك الحالية دون أي تغيير.
      </p>

      <div style="margin-top:28px;padding-top:20px;border-top:1px dashed #e2e8f0;">
        <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;">إذا تعذر الضغط على الزر، انسخ الرابط التالي والصقه في المتصفح:</p>
        <p style="margin:0;font-size:11px;color:#0d9488;word-break:break-all;direction:ltr;text-align:left;">${resetLink}</p>
      </div>
    `
    : `
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:21px;font-weight:700;">Password Reset Request</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.7;">
        We received a request to reset your password on <strong>Hajzy</strong>. Click the button below to choose a new secure password:
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 36px;border-radius:14px;box-shadow:0 8px 24px rgba(13,148,136,0.3);">
          Reset Password Now
        </a>
      </div>

      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;margin-bottom:24px;color:#166534;font-size:13px;line-height:1.6;">
        ⏱️ <strong>Security note:</strong> This link is valid for <strong>30 minutes</strong> only and can be used once.
      </div>

      <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>

      <div style="margin-top:28px;padding-top:20px;border-top:1px dashed #e2e8f0;">
        <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;">If the button doesn't work, copy and paste this link:</p>
        <p style="margin:0;font-size:11px;color:#0d9488;word-break:break-all;">${resetLink}</p>
      </div>
    `

  return emailLayout({ title, subtitle, contentHtml, isRtl })
}

/**
 * Email Verification Template
 */
export function getEmailVerificationTemplate({ name, verificationLink, language = 'ar' }) {
  const isRtl = language !== 'en'
  const safeName = escapeHtml(name || (isRtl ? 'ضيفنا العزيز' : 'Valued Guest'))
  const title = isRtl ? 'تأكيد بريدك الإلكتروني' : 'Verify Your Email'
  const subtitle = isRtl ? 'أهلاً بك في مجتمع حجزي' : 'Welcome to Hajzy Community'

  const contentHtml = isRtl
    ? `
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:21px;font-weight:700;">مرحباً ${safeName}،</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.7;">
        شكراً لانضمامك إلى منصة <strong>حجزي</strong>. يرجى تأكيد بريدك الإلكتروني لتفعيل حسابك بالكامل والبدء في استكشاف وحجز أجمل أماكن الإقامة الفاخرة:
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 36px;border-radius:14px;box-shadow:0 8px 24px rgba(13,148,136,0.3);">
          تأكيد البريد الإلكتروني
        </a>
      </div>

      <div style="background-color:#f8fafc;border-radius:12px;padding:14px 18px;color:#64748b;font-size:13px;line-height:1.6;">
        إذا لم تقم بإنشاء حساب في منصة حجزي، يمكنك تجاهل هذه الرسالة.
      </div>
    `
    : `
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:21px;font-weight:700;">Hello ${safeName},</h2>
      <p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.7;">
        Thank you for joining <strong>Hajzy</strong>. Please confirm your email address to activate your account and start discovering verified stays:
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 36px;border-radius:14px;box-shadow:0 8px 24px rgba(13,148,136,0.3);">
          Verify Email Address
        </a>
      </div>
    `

  return emailLayout({ title, subtitle, contentHtml, isRtl })
}

/**
 * New Booking Notification Template for Property Owner
 */
export function getOwnerBookingNotificationTemplate({
  ownerName,
  guestName,
  propertyTitle,
  checkIn,
  checkOut,
  totalPrice,
  currency = 'EGP',
  bookingId,
  dashboardUrl,
  language = 'ar',
}) {
  const isRtl = language !== 'en'
  const title = isRtl ? 'إشعار بحجز جديد في عقارك' : 'New Booking Received'
  const subtitle = isRtl ? 'حجز جديد مؤكد' : 'Confirmed New Reservation'

  const contentHtml = isRtl
    ? `
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:21px;font-weight:700;">مرحباً ${escapeHtml(ownerName || 'شريكنا العزيز')}، 🎉</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
        يسعدنا إبلاغك بتلقي حجز جديد لعقارك: <strong>${escapeHtml(propertyTitle)}</strong>.
      </p>

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="font-size:14px;">
          <tr>
            <td style="color:#64748b;width:35%;">اسم الضيف:</td>
            <td style="color:#0f172a;font-weight:600;">${escapeHtml(guestName)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">تاريخ الوصول:</td>
            <td style="color:#0f172a;font-weight:600;">${escapeHtml(checkIn)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">تاريخ المغادرة:</td>
            <td style="color:#0f172a;font-weight:600;">${escapeHtml(checkOut)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">إجمالي الحجز:</td>
            <td style="color:#059669;font-weight:700;font-size:16px;">${escapeHtml(String(totalPrice))} ${escapeHtml(currency)}</td>
          </tr>
          ${bookingId ? `
          <tr>
            <td style="color:#64748b;">رقم الحجز:</td>
            <td style="color:#0f172a;font-family:'Cairo',sans-serif;">#${escapeHtml(String(bookingId))}</td>
          </tr>` : ''}
        </table>
      </div>

      ${dashboardUrl ? `
      <div style="text-align:center;margin:28px 0;">
        <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 6px 20px rgba(13,148,136,0.25);">
          عرض وإدارة الحجز في لوحة المالك
        </a>
      </div>` : ''}
    `
    : `
      <h2 style="margin:0 0 14px;color:#0f172a;font-size:21px;font-weight:700;">Hello ${escapeHtml(ownerName || 'Host')}, 🎉</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
        You have received a new booking for <strong>${escapeHtml(propertyTitle)}</strong>.
      </p>
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:28px;">
        <p><strong>Guest:</strong> ${escapeHtml(guestName)}</p>
        <p><strong>Check-in:</strong> ${escapeHtml(checkIn)}</p>
        <p><strong>Check-out:</strong> ${escapeHtml(checkOut)}</p>
        <p><strong>Total:</strong> ${escapeHtml(String(totalPrice))} ${escapeHtml(currency)}</p>
      </div>
    `

  return emailLayout({ title, subtitle, contentHtml, isRtl })
}
