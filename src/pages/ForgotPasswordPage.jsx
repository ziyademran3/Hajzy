import { useState } from 'react'
import { forgotPassword } from '../lib/authApi'

export default function ForgotPasswordPage({ language = 'ar', onBackToLogin, onSwitchToSignup }) {
  const text = language === 'en'
    ? {
        title: 'Forgot password',
        subtitle: 'Enter your email and we will send a reset link.',
        email: 'Email address',
        submit: 'Send reset link',
        back: 'Back to sign in',
        signup: 'Create account',
        requiredEmail: 'Please enter your email.',
        invalidEmail: 'Please enter a valid email address.',
        success: 'Reset instructions were sent successfully.',
      }
    : {
        title: 'نسيت كلمة المرور',
        subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.',
        email: 'البريد الإلكتروني',
        submit: 'إرسال رابط الاستعادة',
        back: 'العودة لتسجيل الدخول',
        signup: 'إنشاء حساب',
        requiredEmail: 'يرجى إدخال البريد الإلكتروني.',
        invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
        success: 'تم إرسال تعليمات استعادة كلمة المرور بنجاح.',
      }

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = email.trim()

    if (!trimmed) {
      setError(text.requiredEmail)
      setMessage('')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(text.invalidEmail)
      setMessage('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await forgotPassword(trimmed)
      setMessage(response?.message || text.success)
    } catch (requestError) {
      setError(requestError.message || text.invalidEmail)
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
            <p className="mt-3 text-sm text-slate-600">{text.subtitle}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700">{text.email}</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
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

          <div className="mt-8 space-y-3 text-center text-sm text-slate-600">
            <button type="button" onClick={onBackToLogin} className="font-semibold text-emerald-700 transition hover:text-emerald-800">
              {text.back}
            </button>
            <p>
              {language === 'ar' ? 'أو' : 'or'}{' '}
              <button type="button" onClick={onSwitchToSignup} className="font-bold text-emerald-700 transition hover:text-emerald-800">
                {text.signup}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
