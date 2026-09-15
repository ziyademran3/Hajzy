import { useState } from 'react'
import { forgotPassword } from '../lib/authApi'
import Logo from '../components/Logo'
import SocialAuthModal from '../components/SocialAuthModal'
import { triggerGoogleLogin } from '../lib/googleAuth'
import { useTheme } from '../components/ThemeProvider'

// Reusable social icons, kept locally for a small and clean dependency footprint.
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
    <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
    <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
    <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
  </svg>
)


export default function LoginPage({
  language = 'ar',
  onToggleLanguage,
  onLogin,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSocialLogin = () => {},
  onBrowseGuest,
}) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  // Use a single source of truth for translated strings to keep labels and validation consistent.
  const text = language === 'en'
    ? {
        brand: 'Hajzy',
        title: 'Welcome Back',
        subtitle: 'Experience verified luxury stays and seamless bookings across Egypt.',
        emailLabel: 'Email address',
        passwordLabel: 'Password',
        remember: 'Remember me',
        forgot: 'Forgot password?',
        createAccount: 'Create new account',
        login: 'Sign in',
        socialGoogle: 'Continue with Google',
        noAccount: "Don't have an account?",
        signup: 'Sign up',
        togglePassword: 'Show password',
        hidePassword: 'Hide password',
        requiredEmail: 'Please enter your email.',
        invalidEmail: 'Please enter a valid email address.',
        requiredPassword: 'Please enter your password.',
        passwordLength: 'Password must be at least 8 characters long.',
        invalidCredentials: 'The email or password is incorrect.',
        resetSent: 'Password reset instructions have been sent to your email.',
        resetUnavailable: 'The password reset server is not available yet. Please connect the API endpoint first.',
        browseAsGuest: 'Explore as Guest',
        guestSubtitle: 'Browse all stays and prices without logging in',
      }
    : {
        brand: 'Hajzy',
        title: 'مرحباً بك مجدداً',
        subtitle: 'استكشف أفضل الإقامات الفاخرة والموثقة في مصر بكل سهولة.',
        emailLabel: 'البريد الإلكتروني',
        passwordLabel: 'كلمة المرور',
        remember: 'تذكرني',
        forgot: 'هل نسيت كلمة المرور؟',
        createAccount: 'إنشاء حساب جديد',
        login: 'تسجيل الدخول',
        socialGoogle: 'تسجيل الدخول عبر Google',
        noAccount: 'ليس لديك حساب؟',
        signup: 'إنشاء حساب',
        togglePassword: 'عرض كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
        requiredEmail: 'يرجى إدخال البريد الإلكتروني.',
        invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
        requiredPassword: 'يرجى إدخال كلمة المرور.',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
        invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        resetSent: 'تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني.',
        resetUnavailable: 'خدمة استعادة كلمة المرور غير متاحة بعد. ربط الـ API أولاً.',
        browseAsGuest: 'تصفح التطبيق كزائر',
        guestSubtitle: 'استكشف الإقامات والأسعار فوراً بدون تسجيل',
      }

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }))
    }
  }

  // Centralized validation keeps the component predictable and simple to extend.
  const validateForm = () => {
    const nextErrors = {}
    const emailValue = form.email.trim()
    const passwordValue = form.password.trim()

    if (!emailValue) {
      nextErrors.email = text.requiredEmail
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.email = text.invalidEmail
    }

    if (!passwordValue) {
      nextErrors.password = text.requiredPassword
    } else if (passwordValue.length < 8) {
      nextErrors.password = text.passwordLength
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const user = await onLogin(form.email, form.password)
      if (!user) {
        setErrors((current) => ({
          ...current,
          form: text.invalidCredentials,
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const emailValue = form.email.trim()

    if (!emailValue) {
      setErrors((current) => ({ ...current, email: text.requiredEmail }))
      setResetMessage('')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setErrors((current) => ({ ...current, email: text.invalidEmail }))
      setResetMessage('')
      return
    }

    setErrors((current) => ({ ...current, email: '', form: '' }))

    try {
      const response = await forgotPassword(emailValue)
      setResetMessage(response?.message || `${text.resetSent} (${emailValue})`)
    } catch (error) {
      setResetMessage(error.message || text.resetUnavailable)
    }
  }

  const [socialModalProvider, setSocialModalProvider] = useState(null)

  const handleSocialClick = async (provider) => {
    if (loading) return
    if (provider === 'google') {
      try {
        setLoading(true)
        setErrors({})
        const account = await triggerGoogleLogin()
        if (account) {
          await onSocialLogin(account)
        }
      } catch (err) {
        console.error('Google Sign-In error:', err)
        const errMsg = err?.message || ''
        if (
          errMsg.includes('popup_closed') ||
          errMsg.includes('access_denied') ||
          errMsg.includes('closed')
        ) {
          // User closed popup without selecting an account
        } else if (errMsg.includes('origin_mismatch')) {
          setErrors({
            form:
              language === 'en'
                ? 'Google OAuth origin mismatch: Please make sure http://localhost:5173 is added to Authorized JavaScript origins in Google Cloud Console.'
                : 'خطأ نطاق Google: يرجى التأكد من إضافة http://localhost:5173 في Authorized JavaScript origins في Google Cloud Console.',
          })
        } else {
          setErrors({
            form:
              language === 'en'
                ? `Google sign-in failed: ${errMsg}`
                : `تعذر تسجيل الدخول بـ Google: ${errMsg}`,
          })
        }
      } finally {
        setLoading(false)
      }
      return
    }
    setSocialModalProvider(provider)
  }

  const handleSelectSocialAccount = async (account) => {
    setLoading(true)
    try {
      await onSocialLogin(account)
    } finally {
      setLoading(false)
      setSocialModalProvider(null)
    }
  }

  const emailPlaceholder = language === 'en' ? 'your@email.com' : 'أدخل بريدك الإلكتروني'

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f0f9f6] via-[#f8fafc] to-[#eef7f4] dark:from-[#060d0b] dark:via-[#090e11] dark:to-[#040807] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-300 ${language === 'ar' ? 'rtl' : 'ltr'}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-400/20 dark:bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-teal-400/20 dark:bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-cyan-400/15 dark:bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/80 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 shadow-[0_25px_80px_rgba(15,118,110,0.12)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300">
          <main className="p-6 sm:p-8">
            {/* Header: Logo, Theme & Language toggles */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={32} showText={true} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95"
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
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95"
                    aria-label={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
                  >
                    <span>{language === 'en' ? 'العربية' : 'English'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Instant Guest Mode Banner (One-click entry) */}
            {typeof onBrowseGuest === 'function' && (
              <button
                type="button"
                onClick={onBrowseGuest}
                className="w-full mb-6 group relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:via-teal-500/15 hover:to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[22px]">explore</span>
                  </span>
                  <div className="text-start">
                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{text.browseAsGuest}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold tracking-wide uppercase">
                        {language === 'en' ? 'Quick Access' : 'دخول فوري'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {text.guestSubtitle}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            )}

            {/* Welcome Title & Subtitle */}
            <div className="mb-6">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {text.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {text.subtitle}
              </p>
            </div>

            {/* Social Login Button */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => handleSocialClick('google')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-70 active:scale-[0.99]"
              >
                <GoogleIcon />
                <span>{text.socialGoogle}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <div className="h-[1px] flex-1 bg-slate-200/80 dark:bg-slate-800" />
              <span>{language === 'en' ? 'or sign in with email' : 'أو تسجيل الدخول بالبريد'}</span>
              <div className="h-[1px] flex-1 bg-slate-200/80 dark:bg-slate-800" />
            </div>

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {text.emailLabel}
                </label>
                <div className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-slate-800/70 px-3.5 transition-all ${errors.email ? 'border-red-300 dark:border-red-800/80 bg-red-50/50 dark:bg-red-950/20 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]' : 'border-slate-200/90 dark:border-slate-700/70 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]'}`}>
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[19px]">mail</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="username"
                    placeholder={emailPlaceholder}
                    disabled={loading}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="w-full border-0 bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {text.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword || handleForgotPassword}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline"
                  >
                    {text.forgot}
                  </button>
                </div>

                <div className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-slate-800/70 px-3.5 transition-all ${errors.password ? 'border-red-300 dark:border-red-800/80 bg-red-50/50 dark:bg-red-950/20 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]' : 'border-slate-200/90 dark:border-slate-700/70 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]'}`}>
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[19px]">lock</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={loading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className="w-full border-0 bg-transparent py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    aria-label={showPassword ? text.hidePassword : text.togglePassword}
                    title={showPassword ? text.hidePassword : text.togglePassword}
                  >
                    <span className="material-symbols-outlined text-[19px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{text.remember}</span>
                </label>
              </div>

              {resetMessage && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200" role="status" aria-live="polite">
                  {resetMessage}
                </div>
              )}

              {errors.form && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300" role="alert">
                  {errors.form}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-4 py-3.5 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_18px_32px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>{text.login}</span>
                  </>
                ) : (
                  <span>{text.login}</span>
                )}
              </button>

              {/* Create Account Secondary Button */}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.99]"
              >
                {text.createAccount}
              </button>
            </form>
          </main>
        </div>
      </div>

      <SocialAuthModal
        isOpen={Boolean(socialModalProvider)}
        provider={socialModalProvider || 'google'}
        language={language}
        onClose={() => setSocialModalProvider(null)}
        onSelectAccount={handleSelectSocialAccount}
      />
    </div>
  )
}
