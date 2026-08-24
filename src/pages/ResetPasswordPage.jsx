import { useMemo, useState } from 'react'
import { resetPassword } from '../lib/authApi'

export default function ResetPasswordPage({ language = 'ar', onBackToLogin }) {
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
    <div className={`min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{text.title}</h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">{text.newPassword}</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">{text.confirmPassword}</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" role="status">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-500 px-4 py-3.5 text-base font-bold text-white shadow-[0_18px_30px_rgba(13,148,136,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(13,148,136,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {text.submit}
                </span>
              ) : (
                text.submit
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button type="button" onClick={onBackToLogin} className="font-semibold text-emerald-700 transition hover:text-emerald-800">
              {text.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
