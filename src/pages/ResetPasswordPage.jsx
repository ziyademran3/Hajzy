import { useMemo, useState } from 'react'
import { resetPassword } from '../lib/authApi'
import Logo from '../components/Logo'
import { useTheme } from '../components/ThemeProvider'

export default function ResetPasswordPage({ language = 'ar', onToggleLanguage, onBackToLogin }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const token = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    return params.get('token') || ''
  }, [])

  const text = language === 'en'
    ? {
        title: 'Reset password',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        submit: 'Update password',
        back: 'Back to sign in',
        requiredPassword: 'Please enter a password.',
        passwordLength: 'Password must be at least 8 characters long.',
        mismatch: 'Passwords do not match.',
        success: 'Your password was updated successfully.',
      }
    : {
        title: 'إعادة تعيين كلمة المرور',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور الجديدة',
        submit: 'تحديث كلمة المرور',
        back: 'العودة لتسجيل الدخول',
        requiredPassword: 'يرجى إدخال كلمة المرور.',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
        mismatch: 'كلمات المرور غير متطابقة.',
        success: 'تم تحديث كلمة المرور بنجاح.',
      }

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      setError(language === 'en' ? 'Invalid or missing reset token.' : 'رمز إعادة التعيين غير موجود أو منتهي.')
      setMessage('')
      return
    }

    if (!newPassword.trim()) {
      setError(text.requiredPassword)
      setMessage('')
      return
    }

    if (newPassword.length < 8) {
      setError(text.passwordLength)
      setMessage('')
      return
    }

    if (newPassword !== confirmPassword) {
      setError(text.mismatch)
      setMessage('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await resetPassword({ token, newPassword })
      setMessage(response?.message || text.success)
    } catch (requestError) {
      setError(requestError.message || (language === 'en' ? 'Unable to reset the password.' : 'تعذر إعادة تعيين كلمة المرور.'))
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[#f4faf7] dark:bg-[#090b0d] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 shadow-[0_25px_80px_rgba(15,118,110,0.08)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8 transition-colors duration-200">
          <div className="mb-6 flex items-center justify-between">
            <Logo size={32} showText={true} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                aria-label={isDark ? (language === 'ar' ? 'تفعيل الوضع النهاري' : 'Switch to light mode') : (language === 'ar' ? 'تفعيل الوضع الليلي' : 'Switch to dark mode')}
                title={isDark ? (language === 'ar' ? 'تفعيل الوضع النهاري' : 'Switch to light mode') : (language === 'ar' ? 'تفعيل الوضع الليلي' : 'Switch to dark mode')}
              >
                <span className="material-symbols-outlined text-[19px]">
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              {typeof onToggleLanguage === 'function' && (
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  aria-label={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
                >
                  <span>{language === 'en' ? 'العربية' : 'English'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">{text.title}</h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{text.newPassword}</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950/40"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{text.confirmPassword}</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950/40"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200" role="status">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 px-4 py-3.5 text-base font-bold text-slate-950 shadow-[0_18px_30px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(16,185,129,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                  {text.submit}
                </span>
              ) : (
                text.submit
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button type="button" onClick={onBackToLogin} className="font-semibold text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300">
              {text.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
