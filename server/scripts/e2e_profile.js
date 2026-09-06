(async () => {
  const base = 'http://localhost:4000/api'
  const json = (obj) => JSON.stringify(obj)
  try {
    // first register a test user
    const regRes = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ fullName: 'Profile Tester', email: 'profile.tester@example.com', password: 'TestPass123!' }) })
    const reg = await regRes.json().catch(() => ({}))
    console.log('REGISTER:', reg.message || JSON.stringify(reg))

    // verify if token returned
    const token = reg.verificationToken
    if (token) {
      const vRes = await fetch(`${base}/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ token }) })
      const v = await vRes.json().catch(() => ({}))
      console.log('VERIFY:', v.message || JSON.stringify(v))
    }

    // login
    const loginRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json({ email: 'profile.tester@example.com', password: 'TestPass123!' }) })
    const login = await loginRes.json().catch(() => ({}))
    console.log('LOGIN:', login.message, 'token:', !!login.token)
    const tokenAuth = login.token

    // get profile
    const meRes = await fetch(`${base}/auth/me`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAuth}` } })
    const meText = await meRes.text()
    let me = {}
    try { me = JSON.parse(meText) } catch { me = { raw: meText } }
    console.log('ME status:', meRes.status, 'body:', me)

    // update profile
    const updRes = await fetch(`${base}/auth/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAuth}` }, body: json({ fullName: 'Profile Updated Tester', email: 'profile.updated@example.com' }) })
    const updText = await updRes.text()
    let upd = {}
    try { upd = JSON.parse(updText) } catch { upd = { raw: updText } }
    console.log('UPDATE status:', updRes.status, 'body:', upd)
  } catch (err) {
    console.error('E2E PROFILE ERROR:', err.message)
    process.exit(1)
  }
})()
