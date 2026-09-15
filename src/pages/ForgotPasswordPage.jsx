import { useState } from 'react'
import { forgotPassword } from '../lib/authApi'
import Logo from '../components/Logo'
import { useTheme } from '../components/ThemeProvider'

export default function ForgotPasswordPage({ language = 'ar', onToggleLanguage, onBackToLogin, onSwitchToSignup }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const text = language === 'en'
    ? {
        brand: 'Hajzy',
        tagline: 'Luxury Hospitality & Verified Stays',
        title: 'Reset Password',
        subtitle: 'Enter your registered email address and we will provide you with secure reset instructions.',
        email: 'Email address',
        submit: 'Send recovery link',
        back: 'Back to sign in',
        signup: 'Create account',
        requiredEmail: 'Please enter your email.',
        invalidEmail: 'Please enter a valid email address.',
        success: 'Reset instructions were sent successfully.',
        guarantee: 'Your data and credentials are encrypted and protected under strict privacy standards.',
      }
    : {
        brand: 'حجزي',
        tagline: 'منصة الإقامات الفاخرة والموثقة',
        title: 'استعادة كلمة المرور',
        subtitle: 'أدخل بريدك الإلكتروني المسجل وسنرسل لك تعليمات آمنة لتعيين كلمة مرور جديدة.',
        email: 'البريد الإلكتروني',
        submit: 'إرسال رابط الاستعادة الآمن',
        back: 'العودة لتسجيل الدخول',
        signup: 'إنشاء حساب جديد',
        requiredEmail: 'يرجى إدخال البريد الإلكتروني.',
        invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
        success: 'تم إرسال تعليمات استعادة كلمة المرور بنجاح.',
        guarantee: 'بياناتك وكلمة مرورك مشفرة ومحمية بالكامل بأعلى معايير الخصوصية.',
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
      if (!response?.emailSent && response?.resetLink) {
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
    <div
      className={`min-h-[100dvh] w-full bg-[#f8faf9] text-[#111918] dark:bg-[#07090b] dark:text-[#f3f6f5] transition-colors duration-300 flex flex-col justify-between ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/70 dark:border-white/5 bg-white/80 dark:bg-[#07090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo size={34} showText={true} />
            <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider text-emerald-800/80 dark:text-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full px-2.5 py-0.5">
              {text.tagline}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 shadow-xs theme-toggle"
              aria-label={
                isDark
                  ? language === 'ar' ? 'تفعيل الوضع النهاري' : 'Switch to light mode'
                  : language === 'ar' ? 'تفعيل الوضع الليلي' : 'Switch to dark mode'
              }
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {typeof onToggleLanguage === 'function' && (
              <button
                type="button"
                onClick={onToggleLanguage}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 shadow-xs language-toggle"
                aria-label={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                <span className="material-symbols-outlined text-[17px] text-slate-400 dark:text-slate-500">translate</span>
                <span>{language === 'en' ? 'العربية' : 'English'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 flex items-center justify-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#101418] shadow-[0_20px_60px_rgba(0,67,63,0.08)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.5)] p-6 sm:p-8 transition-all">
          
          {/* Back Icon Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
            >
              <span className="material-symbols-outlined text-[18px]">
                {language === 'ar' ? 'arrow_forward' : 'arrow_back'}
              </span>
              <span>{text.back}</span>
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {text.title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {text.subtitle}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                {text.email}
              </label>
              <div
                className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-white/5 px-3.5 transition-all ${
                  error
                    ? 'border-red-400 bg-red-50/50 dark:border-red-500 dark:bg-red-950/30 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]'
                    : 'border-slate-200 dark:border-white/10 focus-within:border-emerald-600 dark:focus-within:border-emerald-400 focus-within:bg-white dark:focus-within:bg-black/40 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                }`}
              >
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] shrink-0">
                  mail
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full min-h-[46px] border-0 bg-transparent py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div
                className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2"
                role="alert"
              >
                <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div
                className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-start gap-2"
                role="status"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
                <span>{message}</span>
              </div>
            )}

            {resetLink && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 p-4 text-center space-y-2.5 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <span className="material-symbols-outlined text-lg text-emerald-600 dark:text-emerald-400">check_circle</span>
                  <span>{language === 'en' ? 'Password reset link is ready!' : 'تم تجهيز رابط استعادة الحساب بنجاح!'}</span>
                </div>
                <a
                  href={resetLink}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00433f] to-[#0b5f59] py-3 text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition"
                >
                  <span className="material-symbols-outlined text-base">lock_reset</span>
                  <span>{language === 'en' ? 'Reset Password Now' : 'إعادة تعيين كلمة المرور الآن'}</span>
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00433f] via-[#0b5f59] to-[#00433f] px-4 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,67,63,0.25)] transition-all hover:shadow-[0_16px_34px_rgba(0,67,63,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{text.submit}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                  <span>{text.submit}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline transition"
            >
              {text.back}
            </button>
            {typeof onSwitchToSignup === 'function' && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline transition"
                >
                  {text.signup}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 dark:border-white/5 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>© {new Date().getFullYear()} Hajzy. {language === 'ar' ? 'جميع الحقوق محفوظة • حجز آمن وموثق 100%' : 'All rights reserved • 100% Secured Luxury Stays'}</p>
      </footer>
    </div>
  )
}
