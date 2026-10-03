import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { getSafeBookings, normalizeBookingStatus, calculateBookingPricing } from '../lib/dataService'
import { getNotificationPreferences, saveNotificationPreferences } from '../lib/notificationService'

const getPrivateAccountPreference = (userId, fallback = true) => {
  try {
    const stored = window.localStorage.getItem(`hajzy_private_account_${userId}`)
    return stored === null ? fallback : stored === 'true'
  } catch (error) {
    console.warn('Failed to load account privacy preference:', error)
    return fallback
  }
}

const savePrivateAccountPreference = (userId, isPrivate) => {
  try {
    window.localStorage.setItem(`hajzy_private_account_${userId}`, String(isPrivate))
  } catch (error) {
    console.warn('Failed to save account privacy preference:', error)
  }
}

export default function ProfilePage({
  user: initialUser,
  bookings = [],
  language = 'ar',
  onEdit: _onEdit = () => {},
  onUpdateProfile,
  onToggleLanguage = () => {},
  onNavigate = () => {},
  onLogout,
}) {
  const { t } = useTranslation()
  const { updateProfile: fallbackUpdateProfile, changeUserPassword, logout } = useAuth()
  const updateProfile = onUpdateProfile || fallbackUpdateProfile
  const settingsUserId = String(initialUser?.id || initialUser?.email || 'guest')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: initialUser?.name || initialUser?.fullName || '',
    email: initialUser?.email || '',
    phone: initialUser?.phone || '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(initialUser?.avatar || initialUser?.avatar_url || '')
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirmNewPassword: '' })
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreferences(settingsUserId).inApp)
  const [isPrivateAccount, setIsPrivateAccount] = useState(() => getPrivateAccountPreference(settingsUserId, initialUser?.isPrivate !== false))

  useEffect(() => {
    setNotificationsEnabled(getNotificationPreferences(settingsUserId).inApp)
    setIsPrivateAccount(getPrivateAccountPreference(settingsUserId, initialUser?.isPrivate !== false))
  }, [settingsUserId, initialUser?.isPrivate])

  const clubPoints = useMemo(() => {
    const safe = getSafeBookings(bookings)
    const confirmed = safe.filter((b) => normalizeBookingStatus(b.status) === 'confirmed')
    const totalSpend = confirmed.reduce((sum, b) => {
      const pricing = calculateBookingPricing({
        pricePerNight: b.pricePerNight,
        nights: b.nights,
        discountAmount: b.discountAmount,
        serviceFee: b.serviceFee,
        total: b.total,
      })
      return sum + pricing.total
    }, 0)
    return Math.floor(totalSpend / 1000)
  }, [bookings])
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  // Password strength meter
  const passwordStrength = useMemo(() => {
    const pw = passwordForm.newPassword
    if (!pw) return 0
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }, [passwordForm.newPassword])

  const passwordStrengthLabel = useMemo(() => {
    if (passwordStrength <= 1) return { text: t('profileSecurity.strength.weak'), color: 'bg-rose-500', width: 'w-1/4' }
    if (passwordStrength === 2) return { text: t('profileSecurity.strength.fair'), color: 'bg-amber-500', width: 'w-2/4' }
    if (passwordStrength === 3) return { text: t('profileSecurity.strength.good'), color: 'bg-teal-500', width: 'w-3/4' }
    return { text: t('profileSecurity.strength.strong'), color: 'bg-emerald-500', width: 'w-full' }
  }, [passwordStrength, t])

  const canChangePassword = Boolean(
    passwordForm.current && passwordForm.newPassword && passwordForm.confirmNewPassword && !passwordLoading,
  )

  const handleShareApp = async () => {
    const shareData = {
      title: 'Hajzy - إقامات وشاليهات فاخرة في مصر',
      text: 'احجز أفضل الفيلات والشاليهات في مصر عبر تطبيق Hajzy!',
      url: window.location.origin,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // user cancelled
      }
    } else {
      navigator.clipboard?.writeText(window.location.origin)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2500)
    }
  }

  useEffect(() => {
    setAvatarPreview(initialUser?.avatar || initialUser?.avatar_url || '')
  }, [initialUser?.avatar, initialUser?.avatar_url])

  const formattedJoinedDate = useMemo(() => {
    const rawDate = initialUser?.created_at || initialUser?.createdAt
    if (!rawDate) return null
    const date = new Date(rawDate)
    if (isNaN(date.getTime())) return null

    try {
      const locale = language === 'en' ? 'en-US' : 'ar-EG-u-nu-latn'
      const monthYear = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
      }).format(date)

      return t('memberSince', {
        lng: language,
        date: monthYear,
        defaultValue: language === 'en' ? `Member since ${monthYear}` : `عضو منذ ${monthYear}`,
      })
    } catch {
      return null
    }
  }, [initialUser?.created_at, initialUser?.createdAt, language, t])

  const text = language === 'en' ? {
    title: 'Profile',
    email: 'Email',
    name: 'Full name',
    phone: 'Phone number',
    edit: 'Edit profile',
    save: 'Save changes',
    cancel: 'Cancel',
    joined: 'Member since',
    success: 'Profile updated successfully.',
    logout: 'Log out',
    logoutConfirm: 'Are you sure you want to log out?',
  } : {
    title: 'الملف الشخصي',
    email: 'البريد الإلكتروني',
    name: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    edit: 'تعديل الملف',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    joined: 'عضو منذ',
    success: 'تم تحديث الملف الشخصي بنجاح.',
    logout: 'تسجيل الخروج',
    logoutConfirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((c) => ({ ...c, [name]: value }))
    setError('')
    setMessage('')
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const data = {
        fullName: form.name,
        name: form.name,
        email: form.email,
        phone: form.phone,
      }
      if (avatarPreview) {
        data.avatar_url = avatarPreview
      }
      const updated = await updateProfile(data)
      if (updated) {
        setMessage(text.success)
        setEditing(false)
      }
    } catch (err) {
      setError(err.message || 'Unable to update')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(language === 'en' ? 'Please choose an image file.' : 'يرجى اختيار ملف صورة.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const avatarUrl = String(reader.result || '')
      if (!avatarUrl) return

      setAvatarPreview(avatarUrl)
      setAvatarBroken(false)
      setLoading(true)
      setError('')
      setMessage('')

      try {
        const updated = await updateProfile({ avatar_url: avatarUrl, avatar: avatarUrl })
        if (updated) {
          setMessage(language === 'en' ? 'Profile photo updated successfully.' : 'تم تحديث صورة الملف الشخصي بنجاح.')
        }
      } catch (err) {
        setError(err.message || (language === 'en' ? 'Unable to update profile photo.' : 'تعذر تحديث صورة الملف الشخصي.'))
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteAvatar = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      setAvatarPreview('')
      setAvatarBroken(false)
      const updated = await updateProfile({ avatar_url: '', avatar: '' })
      if (updated) {
        setMessage(t('photoDeleted', {
          lng: language,
          defaultValue: language === 'en' ? 'Profile photo removed successfully.' : 'تم حذف صورة الملف الشخصي بنجاح.',
        }))
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Unable to remove photo.' : 'تعذر حذف الصورة.'))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.current) {
      setPasswordError(language === 'en' ? 'Please enter current password.' : 'يرجى إدخال كلمة المرور الحالية.')
      return
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setPasswordError(language === 'en' ? 'New password must be at least 8 characters.' : 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError(language === 'en' ? 'New passwords do not match.' : 'كلمات المرور الجديدة غير متطابقة.')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')
    setPasswordMessage('')
    try {
      const res = await changeUserPassword(passwordForm.current, passwordForm.newPassword)
      if (res) {
        setPasswordMessage(language === 'en' ? 'Password updated successfully.' : 'تم تحديث كلمة المرور بنجاح.')
        setPasswordForm({ current: '', newPassword: '', confirmNewPassword: '' })
      }
    } catch (err) {
      setPasswordError(err.message || (language === 'en' ? 'Unable to change password.' : 'تعذر تغيير كلمة المرور.'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout()
    } else {
      const confirmed = window.confirm(text.logoutConfirm)
      if (confirmed) {
        logout()
      }
    }
  }

  const settingsCards = [
    {
      id: 'notifications',
      icon: 'notifications',
      title: t('profileSettings.notifications'),
      value: t(notificationsEnabled ? 'profileSettings.enabled' : 'profileSettings.disabled'),
    },
    {
      id: 'privacy',
      icon: 'security',
      title: t('profileSettings.privacy'),
      value: t(isPrivateAccount ? 'profileSettings.privateAccount' : 'profileSettings.publicAccount'),
    },
    {
      id: 'language',
      icon: 'language',
      title: t('profileSettings.language'),
      value: language === 'en' ? 'English' : 'العربية',
    },
  ]

  const handleNotificationsToggle = () => {
    const nextEnabled = !notificationsEnabled
    setNotificationsEnabled(nextEnabled)
    saveNotificationPreferences(settingsUserId, {
      ...getNotificationPreferences(settingsUserId),
      inApp: nextEnabled,
    })
  }

  const handlePrivacyToggle = () => {
    const nextPrivate = !isPrivateAccount
    setIsPrivateAccount(nextPrivate)
    savePrivateAccountPreference(settingsUserId, nextPrivate)
  }

  const displayName = initialUser?.name || initialUser?.fullName || initialUser?.email || ''
  const firstLetter = useMemo(() => {
    const trimmed = (displayName || '').trim()
    if (!trimmed) return language === 'en' ? 'U' : 'م'
    const char = Array.from(trimmed)[0]
    return char ? char.toUpperCase() : (language === 'en' ? 'U' : 'م')
  }, [displayName, language])

  // Only show real user photos (Google profile pics, uploaded photos, data URIs).
  // Exclude auto-generated placeholder services and app logos.
  const rawAvatar = avatarPreview || initialUser?.avatar || initialUser?.avatar_url || ''
  const isPlaceholderUrl = rawAvatar && (
    rawAvatar.includes('dicebear.com') ||
    rawAvatar.includes('ui-avatars.com') ||
    rawAvatar.includes('placeholder.com') ||
    rawAvatar.includes('via.placeholder') ||
    rawAvatar.includes('hajzy-logo') ||
    rawAvatar.includes('hajzy-brand') ||
    rawAvatar.includes('logo')
  )
  const [avatarBroken, setAvatarBroken] = useState(false)
  const avatarSrc = (!isPlaceholderUrl && !avatarBroken) ? rawAvatar : ''

  const emptyPlaceholderFor = (field) => {
    if (language === 'en') {
      return field === 'name' ? 'Add your name' : 'Add your email'
    }
    return field === 'name' ? 'أضف اسمك ليظهر هنا' : 'أضف بريدك الإلكتروني'
  }

  return (
    <div className="page-shell profile-shell">
      {/* Luxury Cover Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm mb-6">
        <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-[#112423] via-[#163331] to-[#0d1e1d] opacity-90 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-emerald-500/20 overflow-hidden shadow-sm shrink-0 flex items-center justify-center"
              style={!avatarSrc ? { backgroundColor: 'var(--primary, #00433f)' } : { backgroundColor: '#f1f5f9' }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" onError={() => setAvatarBroken(true)} />
              ) : (
                <div className="text-3xl sm:text-4xl font-black text-white tracking-wide select-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  {firstLetter}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {displayName || (language === 'en' ? 'Welcome' : 'أهلاً بيك')}
                </h2>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>{language === 'en' ? 'Verified' : 'موثق'}</span>
                </span>
                {!editing && (
                  <button type="button" className="text-slate-500 hover:text-emerald-600 transition" onClick={() => setEditing(true)} aria-label={text.edit}>
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {text.email}: {initialUser?.email ? initialUser.email : <span className="empty-field">{emptyPlaceholderFor('email')}</span>}
              </p>
              {formattedJoinedDate && (
                <p className="text-[11px] text-slate-400">
                  {formattedJoinedDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareApp}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              <span>{copiedShare ? (language === 'en' ? 'Copied!' : 'تم النسخ!') : (language === 'en' ? 'Share App' : 'مشاركة التطبيق')}</span>
            </button>
          </div>
        </div>

        {/* Account Quick Stats Strip */}
        <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 divide-x divide-slate-100 dark:divide-slate-800 text-center py-3">
          <div>
            <div className="text-xs font-bold text-slate-400">{language === 'en' ? 'Status' : 'الحالة'}</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{language === 'en' ? 'Active VIP' : 'عضو نشط'}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">{language === 'en' ? 'Security' : 'الأمان'}</div>
            <div className="text-sm font-black text-teal-600 dark:text-teal-400 mt-0.5">{language === 'en' ? 'Protected' : 'محمي'} 🛡️</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">{language === 'en' ? 'Club Points' : 'نقاط الولاء'}</div>
            <div className="text-sm font-black text-amber-500 mt-0.5">{clubPoints} ⭐</div>
          </div>
        </div>
      </div>

      <section className="profile-details mt-6">
        <h3>{language === 'en' ? 'Account details' : 'تفاصيل الحساب'}</h3>
        <div className="details-grid">
          <div className="detail-item">
            <label>{text.name}</label>
            {!editing ? <div>{initialUser?.name || initialUser?.fullName || '-'}</div> : (
              <input name="name" value={form.name} onChange={handleChange} />
            )}
          </div>
          <div className="detail-item">
            <label>{text.email}</label>
            {!editing ? <div>{initialUser?.email || '-'}</div> : (
              <input name="email" value={form.email} onChange={handleChange} />
            )}
          </div>
          <div className="detail-item">
            <label>{text.phone}</label>
            {!editing ? <div>{initialUser?.phone || (language === 'en' ? 'Not set' : 'لم يحدد')}</div> : (
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+20 10..." />
            )}
          </div>
        </div>

        <div className="avatar-section">
          <h4>{language === 'en' ? 'Avatar' : 'الصورة'}</h4>
          <div className="avatar-row flex flex-col sm:flex-row items-center gap-5">
            <div
              className="h-24 w-24 rounded-full border-2 border-emerald-500/20 overflow-hidden shadow-sm shrink-0 flex items-center justify-center"
              style={!avatarSrc ? { backgroundColor: 'var(--primary, #00433f)' } : { backgroundColor: '#f1f5f9' }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar-preview" className="h-full w-full object-cover" onError={() => setAvatarBroken(true)} />
              ) : (
                <div className="text-3xl font-black text-white tracking-wide select-none">
                  {firstLetter}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center sm:items-start gap-2.5">
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden-file-input sr-only"
                onChange={(e) => handleAvatarFile(e.target.files[0])}
              />

              <div className="flex items-center flex-wrap gap-2.5">
                <label
                  htmlFor="profile-avatar-upload"
                  className="inline-flex items-center justify-center gap-2 rounded-xl text-white px-4 py-2.5 text-xs font-bold shadow-sm hover:opacity-95 transition cursor-pointer active:scale-95"
                  style={{ backgroundColor: 'var(--primary, #00433f)', minHeight: '44px' }}
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  <span>{t('choosePhoto', { lng: language, defaultValue: language === 'en' ? 'Choose photo' : 'اختر صورة' })}</span>
                </label>

                {avatarSrc && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 px-3.5 py-2.5 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition active:scale-95"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>{t('deletePhoto', { lng: language, defaultValue: language === 'en' ? 'Delete photo' : 'حذف الصورة' })}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('photoHint', { lng: language, defaultValue: language === 'en' ? 'Upload a square profile photo (PNG or JPG).' : 'ارفع صورة مربعة للملف الشخصي (PNG أو JPG).' })}
              </p>
            </div>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" role="status">{message}</div>}

        {editing && (
          <div className="profile-form-actions">
            <button className="secondary-button" type="button" onClick={() => {
              setEditing(false)
              setForm({
                name: initialUser?.name || initialUser?.fullName || '',
                email: initialUser?.email || '',
                phone: initialUser?.phone || '',
              })
            }}>{text.cancel}</button>
            <button className="primary-button" type="button" onClick={handleSave} disabled={loading}>{loading ? '...' : text.save}</button>
          </div>
        )}
      </section>

      <section className="profile-details mt-6" id="profile-settings">
        <h3>{language === 'en' ? 'Settings' : 'الإعدادات'}</h3>
        <div className="settings-cards">
          {settingsCards.map((item) => (
            <div key={item.title} className="settings-card-item">
              <div className="settings-card-head">
                <span className="material-symbols-outlined">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.value}</small>
                </div>
              </div>
              {item.id === 'language' ? (
                <button
                  type="button"
                  className="language-toggle"
                  onClick={onToggleLanguage}
                  aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                  title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">language</span>
                  <span className="language-toggle-text">{language === 'en' ? 'العربية' : 'English'}</span>
                </button>
              ) : (
                <div className="settings-card-actions">
                  <button
                    type="button"
                    role="switch"
                    className="settings-switch"
                    aria-checked={item.id === 'notifications' ? notificationsEnabled : isPrivateAccount}
                    aria-label={t(item.id === 'notifications' ? 'profileSettings.toggleNotifications' : 'profileSettings.togglePrivacy')}
                    onClick={item.id === 'notifications' ? handleNotificationsToggle : handlePrivacyToggle}
                  >
                    <span className="settings-switch-thumb" aria-hidden="true" />
                  </button>
                  {item.id === 'notifications' && (
                    <button
                      type="button"
                      className="settings-card-details"
                      aria-label={t('profileSettings.notificationDetails')}
                      title={t('profileSettings.notificationDetails')}
                      onClick={() => onNavigate('notifications')}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {language === 'en' ? 'chevron_right' : 'chevron_left'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-details mt-6 profile-security-section">
        <h3>{language === 'en' ? 'Security' : 'الأمان'}</h3>
        <div className="details-grid">
          <div className="detail-item">
            <label htmlFor="current-password-input">{t('profileSecurity.currentPassword')}</label>
            <div className="password-field">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                data-testid="current-password-input"
                id="current-password-input"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((c) => ({ ...c, current: e.target.value }))}
              />
              <button type="button" className="visibility-toggle" aria-label={t(showCurrentPassword ? 'profileSecurity.hidePassword' : 'profileSecurity.showPassword')} onClick={() => setShowCurrentPassword((value) => !value)}>
                <span className="material-symbols-outlined">{showCurrentPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div className="detail-item">
            <label htmlFor="new-password-input">{t('profileSecurity.newPassword')}</label>
            <div className="password-field">
              <input
                type={showNewPassword ? 'text' : 'password'}
                data-testid="new-password-input"
                id="new-password-input"
                value={passwordForm.newPassword}
                aria-describedby="password-strength"
                onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))}
              />
              <button type="button" className="visibility-toggle" aria-label={t(showNewPassword ? 'profileSecurity.hidePassword' : 'profileSecurity.showPassword')} onClick={() => setShowNewPassword((value) => !value)}>
                <span className="material-symbols-outlined">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <div className="password-strength" id="password-strength" aria-live="polite">
              <div className="password-strength-copy">
                <span>{t('profileSecurity.strength.label')}</span>
                <span className="password-strength-value">{passwordForm.newPassword ? passwordStrengthLabel.text : t('profileSecurity.strength.enterPassword')}</span>
              </div>
              <div className="password-strength-track" aria-hidden="true">
                <div
                  className={`password-strength-fill ${passwordForm.newPassword ? passwordStrengthLabel.width : ''} ${passwordForm.newPassword ? passwordStrengthLabel.color : ''}`}
                />
              </div>
            </div>
          </div>
          <div className="detail-item">
            <label htmlFor="confirm-password-input">{t('profileSecurity.confirmPassword')}</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                data-testid="confirm-password-input"
                id="confirm-password-input"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm((c) => ({ ...c, confirmNewPassword: e.target.value }))}
              />
              <button type="button" className="visibility-toggle" aria-label={t(showConfirmPassword ? 'profileSecurity.hidePassword' : 'profileSecurity.showPassword')} onClick={() => setShowConfirmPassword((value) => !value)}>
                <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
        </div>

        {passwordError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="password-change-error" role="alert">{passwordError}</div>}
        {passwordMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" data-testid="password-change-success" role="status">{passwordMessage}</div>}

        <div className="mt-4">
          <button
            type="button"
            className="primary-button security-save-button"
            data-testid="change-password-button"
            onClick={handlePasswordChange}
            disabled={!canChangePassword}
          >
            {passwordLoading ? t('profileSecurity.saving') : t('profileSecurity.save')}
          </button>
        </div>
      </section>

      <div className="profile-logout-wrap">
        <button
          type="button"
          onClick={handleLogoutClick}
          className="profile-logout-btn"
          id="profile-logout-button"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>{text.logout}</span>
        </button>
      </div>
    </div>
  )
}
