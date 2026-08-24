import { useState } from 'react'
import { forgotPassword } from '../lib/authApi'

// Reusable social icons, kept locally for a small and clean dependency footprint.
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
    <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
    <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
    <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M15.7 12.8c0-2.4 2-3.5 2.1-3.5-1.1-1.7-2.8-1.9-3.4-1.9-1.5-.2-2.8.9-3.6.9-.8 0-2-.9-3.2-.9C5.2 7.5 3.6 8.8 2.9 10.6c-1.4 2.4-.4 5.9 1 7.8.7 1 1.5 2.1 2.6 2 1.1-.1 1.5-.7 2.8-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-.9 2.7-1.9 0.8-1.2 1.2-2.5 1.2-2.6-.1-.1-2.2-.8-3.7-2.1Zm-2.6-6.7c.6-.7 1.1-1.7 1-2.7-.9-.1-2.1.6-2.8 1.3-.6.7-1.2 1.7-1 2.7 1 .2 2.1-.6 2.8-1.3Z" />
  </svg>
)


export default function LoginPage({ language = 'ar', onToggleLanguage, onLogin, onSwitchToSignup, onSwitchToForgotPassword, onSocialLogin = () => {} }) {
  // Use a single source of truth for translated strings to keep labels and validation consistent.
  const text = language === 'en'
    ? {
        brand: 'Hajzy',
        title: 'Sign in',
        subtitle: 'Sign in to manage your bookings and stay updates.',
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
        browseAsGuest: 'Browse as guest',
      }
    : {
        brand: 'Hajzy',
        title: 'تسجيل الدخول',
        subtitle: 'سجل الدخول لإدارة حجوزاتك وتحديثات إقامتك.',
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
        browseAsGuest: 'تصفح بدون تسجيل',
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

  const handleSocialClick = async (provider) => {
    if (loading) return
    setLoading(true)
    try {
      const guestUser = await onSocialLogin(provider)
      if (guestUser && typeof guestUser === 'object') {
        return guestUser
      }
    } finally {
      setLoading(false)
    }
    return null
  }

  const emailPlaceholder = language === 'en' ? 'your@email.com' : 'أدخل بريدك الإلكتروني'

  return (
    <div
      className={`min-h-screen bg-[#f4faf7] px-4 py-8 sm:px-6 lg:px-8 ${language === 'ar' ? 'rtl' : 'ltr'}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 shadow-[0_25px_80px_rgba(15,118,110,0.08)] backdrop-blur-xl">
          <main className="bg-white p-6 sm:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {text.title}
              </h1>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleSocialClick('google')} disabled={loading} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-70">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
                  <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
                  <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
                  <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
                </svg>
                Google
              </button>
              <button type="button" onClick={() => handleSocialClick('apple')} disabled={loading} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-70">
                <AppleIcon />
                Apple
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3 text-xs text-slate-500">
              <div className="h-[2px] flex-1 bg-slate-200" />
              <span>{language === 'en' ? 'or continue with email' : 'أو تابع بالبريد الإلكتروني'}</span>
              <div className="h-[2px] flex-1 bg-slate-200" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-300">
                  {text.emailLabel}
                </label>
                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 px-3 transition ${errors.email ? 'border-[#f1c5c9] bg-[#fff8f8] shadow-[0_0_0_4px_rgba(241,197,201,0.16)]' : 'border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
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
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-2 text-sm font-medium text-[#c86b73]">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                    {text.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="flex items-center justify-center w-10 h-10 text-emerald-300 transition hover:text-emerald-200 hover:bg-emerald-500/10 rounded-lg"
                    aria-label={showPassword ? text.hidePassword : text.togglePassword}
                    title={showPassword ? text.hidePassword : text.togglePassword}
                  >
                    <span className="material-symbols-outlined text-base">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 px-3 transition ${errors.password ? 'border-[#f1c5c9] bg-[#fff8f8] shadow-[0_0_0_4px_rgba(241,197,201,0.16)]' : 'border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
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
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm font-medium text-[#c86b73]">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>{text.remember}</span>
                </label>

                <button
                  type="button"
                  onClick={onSwitchToForgotPassword || handleForgotPassword}
                  className="font-semibold text-emerald-300 underline-offset-4 transition hover:text-emerald-200 hover:underline"
                >
                  {text.forgot}
                </button>
              </div>

              <button
                type="button"
                onClick={onSwitchToSignup}
                className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.99]"
              >
                {text.createAccount}
              </button>

              {resetMessage && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/30 px-3 py-2 text-sm font-medium text-emerald-200" role="status" aria-live="polite">
                  {resetMessage}
                </div>
              )}

              {errors.form && (
                <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200" role="alert">
                  {errors.form}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 px-4 py-3.5 text-base font-bold text-slate-950 shadow-[0_18px_30px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(16,185,129,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                    {text.login}
                  </>
                ) : (
                  text.login
                )}
              </button>

            </form>
          </main>
        </div>
      </div>
    </div>
  )
}
