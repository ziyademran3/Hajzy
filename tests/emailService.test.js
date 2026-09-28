import test from 'node:test'
import assert from 'node:assert/strict'
import {
  maskEmail,
  sendEmailUnified,
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  getOwnerBookingNotificationTemplate,
} from '../functions/api/emailService.js'

test('maskEmail obfuscates email addresses safely', () => {
  assert.equal(maskEmail('ziyademran3@gmail.com'), 'z***3@gmail.com')
  assert.equal(maskEmail('test@example.com'), 't***t@example.com')
  assert.equal(maskEmail('a@b.com'), 'a***@b.com')
  assert.equal(maskEmail(''), 'unknown')
  assert.equal(maskEmail(null), 'unknown')
})

test('getPasswordResetTemplate generates accessible RTL HTML with branding', () => {
  const resetLink = 'https://hajzy-83y.pages.dev/reset-password?token=test-token-123'
  const html = getPasswordResetTemplate({ resetLink, language: 'ar' })

  assert.ok(html.includes('dir="rtl"'), 'HTML must specify rtl direction')
  assert.ok(html.includes('lang="ar"'), 'HTML must specify Arabic language')
  assert.ok(html.includes('Hajzy | حـجـزي'), 'HTML must include brand title')
  assert.ok(html.includes(resetLink), 'HTML must contain the exact reset link')
  assert.ok(html.includes('30 دقيقة'), 'HTML must state the 30-minute security expiry')
})

test('getEmailVerificationTemplate generates RTL verification email', () => {
  const verifyLink = 'https://hajzy-83y.pages.dev/verify-email?token=ver-abc'
  const html = getEmailVerificationTemplate({ name: 'زياد عمران', verificationLink: verifyLink, language: 'ar' })

  assert.ok(html.includes('زياد عمران'))
  assert.ok(html.includes(verifyLink))
  assert.ok(html.includes('dir="rtl"'))
})

test('getOwnerBookingNotificationTemplate includes booking details', () => {
  const html = getOwnerBookingNotificationTemplate({
    ownerName: 'زياد عمران',
    guestName: 'أحمد محمود',
    propertyTitle: 'فيلا مراسي الفاخرة',
    checkIn: '2026-10-01',
    checkOut: '2026-10-05',
    totalPrice: 15000,
    currency: 'EGP',
    bookingId: 'BK-9988',
    dashboardUrl: 'https://hajzy-83y.pages.dev/owner/bookings',
    language: 'ar',
  })

  assert.ok(html.includes('فيلا مراسي الفاخرة'))
  assert.ok(html.includes('أحمد محمود'))
  assert.ok(html.includes('15000 EGP'))
  assert.ok(html.includes('#BK-9988'))
})

test('sendEmailUnified returns failure when no provider is configured', async () => {
  const fakeEnv = {}
  const res = await sendEmailUnified(fakeEnv, {
    to: 'guest@example.com',
    subject: 'Test',
    html: '<p>Test</p>',
  })

  assert.equal(res.ok, false)
  assert.ok(res.message.includes('No email provider configured'))
})

test('sendEmailUnified handles transient error with retry logic', async () => {
  let callCount = 0
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (url) => {
    callCount += 1
    if (callCount === 1) {
      // Simulate transient 500 error on first try
      return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 })
    }
    // Success on retry
    return new Response(JSON.stringify({ messageId: '<mock-msg-id-123>' }), { status: 200 })
  }

  try {
    const fakeEnv = {
      BREVO_API_KEY: 'test-key',
      BREVO_SENDER_EMAIL: 'sender@example.com',
    }

    const res = await sendEmailUnified(fakeEnv, {
      to: 'guest@example.com',
      subject: 'Test Subject',
      html: '<p>Content</p>',
      maxRetries: 2,
    })

    assert.equal(res.ok, true)
    assert.equal(callCount, 2, 'Should have succeeded after 1 retry')
    assert.equal(res.messageId, '<mock-msg-id-123>')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('sendEmailUnified falls back to Resend if Brevo permanently fails', async () => {
  const originalFetch = globalThis.fetch
  const calls = []

  globalThis.fetch = async (url) => {
    calls.push(url.toString())
    if (url.toString().includes('brevo.com')) {
      // Simulate Brevo 401 invalid key
      return new Response(JSON.stringify({ message: 'Unauthorized key' }), { status: 401 })
    }
    // Resend fallback succeeds
    return new Response(JSON.stringify({ id: 'resend-msg-999' }), { status: 200 })
  }

  try {
    const fakeEnv = {
      BREVO_API_KEY: 'invalid-brevo-key',
      RESEND_API_KEY: 'valid-resend-key',
      RESEND_FROM: 'Hajzy <no-reply@resend.dev>',
    }

    const res = await sendEmailUnified(fakeEnv, {
      to: 'guest@example.com',
      subject: 'Fallback Test',
      html: '<p>Fallback</p>',
    })

    assert.equal(res.ok, true)
    assert.equal(res.provider, 'resend')
    assert.equal(res.messageId, 'resend-msg-999')
    assert.ok(calls.some((u) => u.includes('brevo.com')), 'Brevo should have been called first')
    assert.ok(calls.some((u) => u.includes('resend.com')), 'Resend should have been called as fallback')
  } finally {
    globalThis.fetch = originalFetch
  }
})
