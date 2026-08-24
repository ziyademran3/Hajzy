(async () => {
  const base = 'http://localhost:4000/api'
  const json = (obj) => JSON.stringify(obj)
  try {
    const regRes = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ fullName: 'E2E Tester', email: 'e2e+tester@example.com', password: 'TestPass123!' }) })
    const reg = await regRes.json().catch(() => ({}))
    console.log('REGISTER:', reg.message || JSON.stringify(reg))

    const token = reg.verificationToken
    if (token) {
      const vRes = await fetch(`${base}/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ token }) })
      const v = await vRes.json().catch(() => ({}))
      console.log('VERIFY:', v.message || JSON.stringify(v))
    } else {
      console.log('No verification token returned')
    }

    const loginRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ email: 'e2e+tester@example.com', password: 'TestPass123!' }) })
    const login = await loginRes.json().catch(() => ({}))
    console.log('LOGIN:', login.message, 'token:', !!login.token)

    const forgotRes = await fetch(`${base}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ email: 'e2e+tester@example.com' }) })
    const forgot = await forgotRes.json().catch(() => ({}))
    console.log('FORGOT:', forgot.message, 'resetToken present:', !!(forgot.resetToken || forgot.reset_token))
    const resetToken = forgot.resetToken || forgot.reset_token
    if (resetToken) {
      const resetRes = await fetch(`${base}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ token: resetToken, newPassword: 'NewPass123!' }) })
      const reset = await resetRes.json().catch(() => ({}))
      console.log('RESET:', reset.message)
    } else {
      console.log('No reset token returned (email service likely not configured)')
    }
  } catch (err) {
    console.error('E2E ERROR:', err.message)
    process.exit(1)
  }
})()
