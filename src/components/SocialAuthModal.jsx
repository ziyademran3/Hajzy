import React, { useState } from 'react'

export default function SocialAuthModal({
  isOpen,
  provider = 'google',
  language = 'ar',
  onClose,
  onSelectAccount,
}) {
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  if (!isOpen) return null

  const isArabic = language === 'ar'
  const isGoogle = provider === 'google'

  // Google accounts on device
  const defaultAccounts = [
    {
      name: 'Ziyad',
      email: 'ziyad@gmail.com',
      avatar: 'Z',
      color: 'bg-emerald-700',
    },
    {
      name: 'Ziyad Personal',
      email: 'ziyad.work@gmail.com',
      avatar: 'Z',
      color: 'bg-blue-600',
    },
  ]

  const handleChoose = (account) => {
    onSelectAccount({
      id: `${provider}-${Date.now()}`,
      name: account.name,
      email: account.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=0D9488&color=fff`,
      role: 'user',
      provider,
    })
    onClose()
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customEmail) return
    const name = customName.trim() || customEmail.split('@')[0]
    handleChoose({
      name,
      email: customEmail,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`,
    })
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="dialog-modal social-oauth-modal max-w-sm w-[92%] bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
              <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
              <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
              <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
            </svg>
          </div>

          <h3 className="text-lg font-bold m-0">
            {isArabic ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 m-0">
            {isArabic ? 'اختر حساباً للمتابعة إلى تطبيق Hajzy' : 'Choose an account to continue to Hajzy'}
          </p>
        </div>

        {!showCustomInput ? (
          <div className="account-list flex flex-col gap-2">
            {defaultAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="flex items-center gap-3 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-start"
                onClick={() => handleChoose(acc)}
              >
                <div className={`w-9 h-9 rounded-full ${acc.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {acc.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block text-sm font-semibold truncate">{acc.name}</strong>
                  <span className="block text-xs text-slate-500 truncate">{acc.email}</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">
                  arrow_forward
                </span>
              </button>
            ))}

            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full p-2.5 mt-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
              onClick={() => setShowCustomInput(true)}
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>{isArabic ? 'استخدام حساب Gmail آخر' : 'Use another Google account'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold block mb-1">
                {isArabic ? 'اسم الحساب' : 'Account Name'}
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={isArabic ? 'مثال: زياد محمد' : 'e.g. Ziyad'}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">
                {isArabic ? 'البريد الإلكتروني (Gmail)' : 'Email address (Gmail)'}
              </label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="secondary-button text-xs py-2 flex-1"
                onClick={() => setShowCustomInput(false)}
              >
                {isArabic ? 'رجوع' : 'Back'}
              </button>
              <button type="submit" className="primary-button text-xs py-2 flex-1">
                {isArabic ? 'متابعة' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium"
            onClick={onClose}
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
