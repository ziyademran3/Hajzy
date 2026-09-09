import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage({
  user: initialUser,
  language = 'ar',
  onEdit: _onEdit = () => {},
  onToggleLanguage = () => {},
  onLogout,
}) {
  const { updateProfile, changeUserPassword, logout } = useAuth()
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
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

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
      setLoading(true)
      setError('')
      setMessage('')

      try {
        const updated = await updateProfile({ avatar_url: avatarUrl })
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
      icon: 'notifications',
      title: language === 'en' ? 'Push notifications' : 'الإشعارات',
      value: language === 'en' ? 'Enabled' : 'مفعلة',
    },
    {
      icon: 'security',
      title: language === 'en' ? 'Privacy' : 'الخصوصية',
      value: language === 'en' ? 'Private account' : 'حساب خاص',
    },
    {
      icon: 'language',
      title: language === 'en' ? 'Language' : 'اللغة',
      value: language === 'en' ? 'English' : 'العربية',
    },
  ]

  const displayName = initialUser?.name || initialUser?.fullName || initialUser?.email || ''
  const initials = (displayName || 'U').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U'
  const avatarSrc = avatarPreview || initialUser?.avatar || initialUser?.avatar_url || ''

  const emptyPlaceholderFor = (field) => {
    if (language === 'en') {
      return field === 'name' ? 'Add your name' : 'Add your email'
    }
    return field === 'name' ? 'أضف اسمك ليظهر هنا' : 'أضف بريدك الإلكتروني'
  }

  return (
    <div className="page-shell profile-shell">
      <div className="profile-hero">
        <div className="profile-avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" />
          ) : (
            <div className="avatar-initials" aria-label="avatar initials">{initials}</div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <h2>{displayName || (language === 'en' ? 'Welcome' : 'أهلاً بيك')}</h2>
            {!editing && (
              <button type="button" className="icon-button profile-edit-button" onClick={() => setEditing(true)} aria-label={text.edit}>
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
          </div>
          <p className="muted">{text.email}: {initialUser?.email ? initialUser.email : <span className="empty-field">{emptyPlaceholderFor('email')}</span>}</p>
          <p className="muted">{text.joined}: {initialUser?.createdAt ? new Date(initialUser.createdAt).toLocaleDateString() : <span className="empty-field">{language === 'en' ? 'Not joined yet' : 'لم يضف بعد'}</span>}</p>
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
          <div className="avatar-row">
            <div className="avatar-preview-wrap">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar-preview" className="avatar-preview" />
              ) : (
                <div className="avatar-preview avatar-initials" aria-hidden="true">{initials}</div>
              )}

              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden-file-input"
                onChange={(e) => handleAvatarFile(e.target.files[0])}
              />

              <label htmlFor="profile-avatar-upload" className="custom-file-button large">
                <span className="material-symbols-outlined">upload_file</span>
                <span>{language === 'en' ? 'Choose photo' : 'اختر صورة'}</span>
              </label>

            </div>
            <p className="muted small">{language === 'en' ? 'Upload a square avatar image.' : 'ارفع صورة مربعة للملف الشخصي.'}</p>
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
              {item.icon === 'language' ? (
                <button type="button" className="language-toggle" onClick={onToggleLanguage} aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}>
                  <span aria-hidden="true">🇪🇬</span>
                  <span className="language-toggle-text">{language === 'en' ? 'العربية' : 'English'}</span>
                </button>
              ) : (
                <button type="button" className="secondary-button small-button">
                  {language === 'en' ? 'Manage' : 'إدارة'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-details mt-6">
        <h3>{language === 'en' ? 'Security' : 'الأمان'}</h3>
        <div className="details-grid">
          <div className="detail-item">
            <label>{language === 'en' ? 'Current password' : 'كلمة المرور الحالية'}</label>
            <div className="password-field">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((c) => ({ ...c, current: e.target.value }))}
              />
              <button type="button" className="visibility-toggle" onClick={() => setShowCurrentPassword((value) => !value)}>
                <span className="material-symbols-outlined">{showCurrentPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div className="detail-item">
            <label>{language === 'en' ? 'New password' : 'كلمة المرور الجديدة'}</label>
            <div className="password-field">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))}
              />
              <button type="button" className="visibility-toggle" onClick={() => setShowNewPassword((value) => !value)}>
                <span className="material-symbols-outlined">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div className="detail-item">
            <label>{language === 'en' ? 'Confirm new password' : 'تأكيد كلمة المرور الجديدة'}</label>
            <div className="password-field">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm((c) => ({ ...c, confirmNewPassword: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {passwordError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{passwordError}</div>}
        {passwordMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" role="status">{passwordMessage}</div>}

        <div className="mt-4">
          <button className="primary-button" onClick={handlePasswordChange} disabled={passwordLoading}>{passwordLoading ? '...' : (language === 'en' ? 'Change password' : 'تغيير كلمة المرور')}</button>
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
