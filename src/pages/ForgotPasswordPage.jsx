import { useState } from 'react'
import { forgotPassword } from '../lib/authApi'
import Logo from '../components/Logo'
import { useTheme } from '../components/ThemeProvider'

export default function ForgotPasswordPage({ language = 'ar', onToggleLanguage, onBackToLogin, onSwitchToSignup }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

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
  const [resetLink, setResetLink] = useState('')

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
    setResetLink('')

    try {
      const response = await forgotPassword(trimmed)
      setMessage(response?.message || text.success)
      if (response?.resetLink) {
        setResetLink(response.resetLink)
      }
    } catch (requestError) {
      const rawMsg = requestError?.message || ''
      if (rawMsg.includes('Failed to fetch')) {
        setError(
          language === 'en'
            ? 'Auth server is not reachable on port 4000. Please start the backend server.'
            : 'سيرفر إرسال البريد غير متصل حالياً (port 4000).'
        )
      } else if (rawMsg.includes('ziyademran000@gmail.com') || rawMsg.includes('testing emails')) {
        setError(
          language === 'en'
            ? 'In Resend free tier, testing emails can only be sent to the registered owner email (ziyademran000@gmail.com).'
            : 'في خطة Resend التجريبية، يُسمح بالإرسال فقط إلى بريد صاحب الحساب (ziyademran000@gmail.com).'
        )
      } else {
        setError(rawMsg || text.invalidEmail)
      }
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
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{text.subtitle}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{text.email}</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
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

            {resetLink && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 p-4 text-center space-y-2.5 shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-lg text-emerald-600 dark:text-emerald-400">check_circle</span>
                  <span>{language === 'en' ? 'Password reset link is ready!' : 'تم تجهيز رابط استعادة الحساب بنجاح!'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'en'
                    ? 'Click the button below to set your new password directly:'
                    : 'اضغط على الزر أدناه لتعيين كلمة المرور الجديدة مباشرة:'}
                </p>
                <a
                  href={resetLink}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
                >
                  <span className="material-symbols-outlined text-base">lock_reset</span>
                  <span>{language === 'en' ? 'Reset Password Now' : 'إعادة تعيين كلمة المرور الآن'}</span>
                </a>
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

          <div className="mt-8 space-y-3 text-center text-sm text-slate-600 dark:text-slate-400">
            <button type="button" onClick={onBackToLogin} className="font-semibold text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300">
              {text.back}
            </button>
            <p>
              {language === 'ar' ? 'أو' : 'or'}{' '}
              <button type="button" onClick={onSwitchToSignup} className="font-bold text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300">
                {text.signup}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
