import { useState, useEffect } from 'react'
import { loginUser, registerUser, getProfile as apiGetProfile, updateProfile as apiUpdateProfile } from '../lib/authApi'

const DEMO_OWNER = {
  email: 'ziyademran3@gmail.com',
  password: 'Ziad@17072005',
  name: 'مالك العقارات',
  role: 'owner',
}

const USERS_KEY = 'hajzy_users'
const CURRENT_USER_KEY = 'hajzy_user'
const AUTH_TOKEN_KEY = 'hajzy_auth_token'

const normalizeRole = (user) => {
  if (!user) return 'user'
  if (user.role === 'owner' || user.id === 'owner-demo' || user.email?.toLowerCase() === DEMO_OWNER.email.toLowerCase()) {
    return 'owner'
  }
  return 'user'
}

const safeUserRecord = (user) => {
  if (!user) return null
  const { password: _password, ...safe } = user
  return { ...safe, role: normalizeRole(user) }
}

const readUsers = () => {
  try {
    const savedUsers = localStorage.getItem(USERS_KEY) || localStorage.getItem('stitch_users')
    const defaultUsers = [{
      id: 'owner-demo',
      name: DEMO_OWNER.name,
      email: DEMO_OWNER.email,
      password: DEMO_OWNER.password,
      role: DEMO_OWNER.role,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${DEMO_OWNER.email}`,
      createdAt: new Date().toISOString(),
    }]

    if (!savedUsers) {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
      return defaultUsers
    }

    const parsedUsers = JSON.parse(savedUsers)
    const users = Array.isArray(parsedUsers) ? parsedUsers : []
    const ownerIndex = users.findIndex((account) => account?.role === 'owner')

    if (ownerIndex >= 0) {
      users[ownerIndex] = { ...users[ownerIndex], ...defaultUsers[0] }
    } else {
      users.unshift(defaultUsers[0])
    }

    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return users
  } catch (error) {
    console.error('Could not read users from localStorage', error)
    return [{
      id: 'owner-demo',
      name: DEMO_OWNER.name,
      email: DEMO_OWNER.email,
      password: DEMO_OWNER.password,
      role: DEMO_OWNER.role,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${DEMO_OWNER.email}`,
      createdAt: new Date().toISOString(),
    }]
  }
}

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('stitch_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        setError(err.message)
      }
    } else {
      setUser(null)
      localStorage.removeItem(CURRENT_USER_KEY)
    }
    setLoading(false)
  }, [])

  const persistUser = (authUser, token = null) => {
    if (!authUser) {
      setUser(null)
      localStorage.removeItem(CURRENT_USER_KEY)
      localStorage.removeItem('stitch_user')
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem('stitch_auth_token')
      return null
    }

    const safeUser = safeUserRecord(authUser)
    const normalizedUser = {
      ...safeUser,
      role: normalizeRole(safeUser),
    }
    setUser(normalizedUser)
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser))

    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem('stitch_auth_token', token)
    }

    return normalizedUser
  }

  const login = async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '').trim()

    if (!normalizedEmail || !normalizedPassword) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return null
    }

    const demoMatch = normalizedEmail === DEMO_OWNER.email.toLowerCase() && normalizedPassword === DEMO_OWNER.password
    if (demoMatch) {
      const authUser = safeUserRecord({
        ...readUsers().find((account) => account.email.toLowerCase() === normalizedEmail),
        role: 'owner',
      })
      setError(null)
      return persistUser(authUser)
    }

    try {
      const response = await loginUser({ email: normalizedEmail, password: normalizedPassword })
      if (response?.token && response?.user) {
        const authUser = {
          ...response.user,
          id: response.user.id,
          name: response.user.fullName || response.user.name || response.user.email,
          role: normalizeRole(response.user),
        }
        setError(null)
        return persistUser(authUser, response.token)
      }
    } catch {
      // Ignore API errors and fall back to the demo local auth logic when the backend is absent.
    }

    const storedUsers = readUsers()
    const matchingUser = storedUsers.find(
      (account) => account.email.toLowerCase() === normalizedEmail && account.password === normalizedPassword,
    )

    if (matchingUser) {
      const authUser = safeUserRecord({
        ...matchingUser,
        role: normalizeRole(matchingUser),
      })
      setError(null)
      return persistUser(authUser)
    }

    setError('بيانات غير صحيحة')
    return null
  }

  const signup = async (email, password, name) => {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const trimmedName = String(name || '').trim()
    const normalizedPassword = String(password || '').trim()

    if (!normalizedEmail || !normalizedPassword || !trimmedName) {
      setError('جميع الحقول مطلوبة')
      return null
    }

    try {
      const response = await registerUser({
        fullName: trimmedName,
        email: normalizedEmail,
        password: normalizedPassword,
      })

      if (response?.user) {
        const authUser = {
          id: response.user.id,
          name: trimmedName,
          email: normalizedEmail,
          role: 'user',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedEmail}`,
          emailVerified: response.user.emailVerified,
        }
        setError(null)
        return persistUser(authUser)
      }
    } catch {
      // Continue to the local demo fallback if the backend is not running.
    }

    const storedUsers = readUsers()
    const existingUser = storedUsers.find((account) => account.email.toLowerCase() === normalizedEmail)

    if (existingUser) {
      setError('هذا البريد مستخدم بالفعل')
      return null
    }

    const userData = {
      id: `user-${Math.random().toString(36).slice(2, 10)}`,
      name: trimmedName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedEmail}`,
      createdAt: new Date().toISOString(),
    }

    const updatedUsers = [userData, ...storedUsers]
    saveUsers(updatedUsers)

    const authUser = safeUserRecord({ ...userData, role: 'user' })
    setError(null)
    return persistUser(authUser)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem('stitch_user')
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('stitch_auth_token')
  }

  const fetchProfile = async () => {
    try {
      const profile = await apiGetProfile()
      if (profile?.user) {
        const authUser = {
          id: profile.user.id,
          name: profile.user.fullName || profile.user.name || profile.user.email,
          email: profile.user.email,
          role: profile.user.role || 'user',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.user.email}`,
          createdAt: profile.user.created_at || profile.user.createdAt,
        }
        persistUser(authUser)
        return authUser
      }
    } catch {
      // ignore
    }
    return null
  }

  const updateProfile = async (data) => {
    try {
      const response = await apiUpdateProfile(data)
      if (response?.user) {
        const authUser = {
          id: response.user.id,
          name: response.user.fullName || response.user.name || response.user.email,
          email: response.user.email,
          role: response.user.role || 'user',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${response.user.email}`,
          createdAt: response.user.created_at || response.user.createdAt,
        }
        persistUser(authUser)
        return authUser
      }
    } catch (err) {
      setError(err.message)
    }
    return null
  }

  return { user, loading, error, login, signup, logout, fetchProfile, updateProfile, isAuthenticated: !!user }
}
