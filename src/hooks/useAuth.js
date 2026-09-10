import { useState, useEffect } from 'react'
import {
  loginUser,
  registerUser,
  getProfile as apiGetProfile,
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
} from '../lib/authApi'

const DEMO_OWNER = {
  email: import.meta.env.VITE_DEMO_OWNER_EMAIL || 'owner@hajzy.com',
  password: import.meta.env.VITE_DEMO_OWNER_PASSWORD || '',
  name: 'مالك العقارات',
  role: 'owner',
}

const USERS_KEY = 'hajzy_users'
const CURRENT_USER_KEY = 'hajzy_user'
const AUTH_TOKEN_KEY = 'hajzy_auth_token'

const normalizeRole = (user) => {
  if (!user) return 'user'
  if (user.role === 'owner' || user.id === 'owner-demo' || (DEMO_OWNER.email && user.email?.toLowerCase() === DEMO_OWNER.email.toLowerCase())) {
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
    try {
      const isForceLogin = localStorage.getItem('hajzy_force_login') === 'true'
      if (isForceLogin) {
        setUser(null)
      } else {
        const saved = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('stitch_user')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            setUser({
              ...parsed,
              role: normalizeRole(parsed),
            })
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e)
    } finally {
      setLoading(false)
    }
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
    localStorage.setItem('hajzy_force_login', 'false')
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

    const demoMatch = Boolean(DEMO_OWNER.password) &&
      normalizedEmail === DEMO_OWNER.email.toLowerCase() &&
      normalizedPassword === DEMO_OWNER.password
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
        // Registration itself does not issue a token. Sign in immediately so
        // payment uses a server-issued JWT rather than a local-only session.
        const loginResponse = await loginUser({ email: normalizedEmail, password: normalizedPassword })
        if (loginResponse?.token && loginResponse?.user) {
          const authUser = {
            ...loginResponse.user,
            id: loginResponse.user.id,
            name: loginResponse.user.fullName || trimmedName,
            role: normalizeRole(loginResponse.user),
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${normalizedEmail}`,
          }
          setError(null)
          return persistUser(authUser, loginResponse.token)
        }
        throw new Error('Unable to create a secure sign-in session.')
      }
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('already exists')) {
        throw new Error('هذا البريد مستخدم بالفعل. سجّل الدخول عبر Google أو استخدم بريدًا إلكترونيًا آخر.')
      }
      // Continue to the local demo fallback if the backend is not running.
    }

    const storedUsers = readUsers()
    const existingUser = storedUsers.find((account) => account.email.toLowerCase() === normalizedEmail)

    if (existingUser) {
      setError('هذا البريد مستخدم بالفعل')
      throw new Error('هذا البريد مستخدم بالفعل. سجّل الدخول عبر Google أو استخدم بريدًا إلكترونيًا آخر.')
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
    localStorage.setItem('hajzy_force_login', 'true')
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
          avatar: profile.user.avatar_url || profile.user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.user.email}`,
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
          avatar: data.avatar_url || response.user.avatar_url || response.user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${response.user.email}`,
          createdAt: response.user.created_at || response.user.createdAt,
          phone: data.phone || response.user.phone || '',
        }
        persistUser(authUser)
        return authUser
      }
    } catch {
      // Backend is unavailable, perform local persistence
    }

    if (user) {
      const updatedUser = {
        ...user,
        name: data.fullName || data.name || user.name,
        email: data.email || user.email,
        avatar: data.avatar_url || user.avatar,
        phone: data.phone !== undefined ? data.phone : (user.phone || ''),
      }

      // Update in hajzy_users list
      const storedUsers = readUsers()
      const userIndex = storedUsers.findIndex(
        (u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase(),
      )
      if (userIndex >= 0) {
        storedUsers[userIndex] = { ...storedUsers[userIndex], ...updatedUser }
        saveUsers(storedUsers)
      }

      persistUser(updatedUser)
      return updatedUser
    }

    return null
  }

  const changeUserPassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiChangePassword(currentPassword, newPassword)
      if (response) return response
    } catch {
      // Backend unavailable, handle locally
    }

    if (!user) {
      throw new Error('User is not logged in')
    }

    const storedUsers = readUsers()
    const userIndex = storedUsers.findIndex(
      (u) => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase(),
    )

    if (userIndex >= 0) {
      const existing = storedUsers[userIndex]
      if (existing.password && existing.password !== currentPassword && user.id !== 'owner-demo') {
        throw new Error('كلمة المرور الحالية غير صحيحة')
      }
      storedUsers[userIndex] = { ...existing, password: newPassword }
      saveUsers(storedUsers)
      return { success: true, message: 'تم تحديث كلمة المرور بنجاح' }
    }

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' }
  }

  const socialLogin = async (account) => {
    let accountData = account
    if (typeof account === 'string') {
      accountData = {
        id: `social-${account}-${Date.now()}`,
        name: account === 'google' ? 'Google User' : 'Apple User',
        email: `${account}@hajzy.local`,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${account}`,
      }
    }

    const authUser = {
      id: accountData.id || `user-${Date.now()}`,
      name: accountData.name || 'User',
      email: accountData.email || 'user@hajzy.local',
      role: normalizeRole(accountData),
      avatar: accountData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(accountData.name || 'User')}&background=0D9488&color=fff`,
      createdAt: new Date().toISOString(),
    }

    // Save to users list if not existing
    const storedUsers = readUsers()
    const existingIndex = storedUsers.findIndex(
      (u) => u.email?.toLowerCase() === authUser.email.toLowerCase()
    )
    if (existingIndex >= 0) {
      storedUsers[existingIndex] = { ...storedUsers[existingIndex], ...authUser }
    } else {
      storedUsers.push(authUser)
    }
    saveUsers(storedUsers)

    persistUser(authUser)
    return authUser
  }

  return {
    user,
    loading,
    error,
    login,
    signup,
    socialLogin,
    logout,
    fetchProfile,
    updateProfile,
    changeUserPassword,
    isAuthenticated: !!user,
  }
}
