import { useState } from 'react'
import Logo from '../components/Logo'
import SocialAuthModal from '../components/SocialAuthModal'
import { triggerGoogleLogin } from '../lib/googleAuth'
import { useTheme } from '../components/ThemeProvider'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
    <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
    <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
    <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
  </svg>
)


export default function SignupPage({ language = 'ar', onToggleLanguage, onSignup, onSwitchToLogin, onSocialLogin = () => {} }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', agree: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const text = language === 'en'
    ? {
        brand: 'Hajzy',
        title: 'Join Hajzy',
        subtitle: 'Create your account and start your luxury journey.',
        fullName: 'Full name',
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm password',
        agree: 'I agree to the terms and privacy policy',
        create: 'Create account',
        login: 'Sign in',
        alreadyHave: 'Already have an account?',
        google: 'Continue with Google',
        requiredName: 'Please enter your full name.',
        requiredEmail: 'Please enter your email.',
        invalidEmail: 'Please enter a valid email address.',
        requiredPassword: 'Please enter your password.',
        passwordLength: 'Password must be at least 8 characters long.',
        passwordMismatch: 'Passwords do not match.',
        requiredAgreement: 'You must accept the terms and privacy policy.',
        togglePassword: 'Show password',
        hidePassword: 'Hide password',
      }
    : {
        brand: 'Hajzy',
        title: 'انضم إلى Hajzy',
        subtitle: 'أنشئ حسابك وابدأ رحلتك الفاخرة.',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        agree: 'أوافق على شروط الخدمة وسياسة الخصوصية',
        create: 'إنشاء الحساب',
        login: 'تسجيل الدخول',
        alreadyHave: 'لديك حساب بالفعل؟',
        google: 'المتابعة باستخدام Google',
        requiredName: 'يرجى إدخال الاسم الكامل.',
        requiredEmail: 'يرجى إدخال البريد الإلكتروني.',
        invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
        requiredPassword: 'يرجى إدخال كلمة المرور.',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
        passwordMismatch: 'كلمات المرور غير متطابقة.',
        requiredAgreement: 'يجب الموافقة على الشروط وسياسة الخصوصية.',
        togglePassword: 'عرض كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
      }

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

  const validateForm = () => {
    const nextErrors = {}
    const nameValue = form.name.trim()
    const emailValue = form.email.trim()
    const passwordValue = form.password.trim()
    const confirmValue = form.confirmPassword.trim()

    if (!nameValue) nextErrors.name = text.requiredName

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

    if (!confirmValue) {
      nextErrors.confirmPassword = text.requiredPassword
    } else if (confirmValue !== passwordValue) {
      nextErrors.confirmPassword = text.passwordMismatch
    }

    if (!form.agree) nextErrors.agree = text.requiredAgreement

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
      const user = await onSignup(form.email, form.password, form.name)
      if (!user) {
        setErrors((current) => ({
          ...current,
          form: language === 'en' ? 'Unable to create the account right now.' : 'تعذر إنشاء الحساب في الوقت الحالي.',
        }))
      }
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: error?.message || (language === 'en' ? 'Unable to create the account right now.' : 'تعذر إنشاء الحساب في الوقت الحالي.'),
      }))
    } finally {
      setLoading(false)
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
            general:
              language === 'en'
                ? 'Google OAuth origin mismatch: Please make sure http://localhost:5173 is added to Authorized JavaScript origins in Google Cloud Console.'
                : 'خطأ نطاق Google: يرجى التأكد من إضافة http://localhost:5173 في Authorized JavaScript origins في Google Cloud Console.',
          })
        } else {
          setErrors({
            general:
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
      className={`min-h-screen bg-[#f4faf7] dark:bg-[#090b0d] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200 ${language === 'ar' ? 'rtl' : 'ltr'}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_25px_80px_rgba(15,118,110,0.08)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors duration-200">
          <main className="bg-white dark:bg-slate-900 p-6 sm:p-8 transition-colors duration-200">
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

            <div className="mb-6">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {text.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text.subtitle}</p>
            </div>

            <div className="mb-5">
              <button
                type="button"
                onClick={() => handleSocialClick('google')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-70"
              >
                <GoogleIcon />
                {text.google}
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
              <span>{language === 'en' ? 'or continue with email' : 'أو تابع بالبريد الإلكتروني'}</span>
              <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {text.fullName}
                </label>
                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 px-3 transition ${errors.name ? 'border-[#f1c5c9] dark:border-red-800/60 bg-[#fff8f8] dark:bg-red-950/20 shadow-[0_0_0_4px_rgba(241,197,201,0.16)]' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    placeholder={language === 'en' ? 'John Smith' : 'أحمد محمد'}
                    disabled={loading}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.name && <p id="name-error" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {text.email}
                </label>
                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 px-3 transition ${errors.email ? 'border-[#f1c5c9] dark:border-red-800/60 bg-[#fff8f8] dark:bg-red-950/20 shadow-[0_0_0_4px_rgba(241,197,201,0.16)]' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder={emailPlaceholder}
                    disabled={loading}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.email && <p id="email-error" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {text.password}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="flex items-center justify-center w-10 h-10 text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg"
                    aria-label={showPassword ? text.hidePassword : text.togglePassword}
                    title={showPassword ? text.hidePassword : text.togglePassword}
                  >
                    <span className="material-symbols-outlined text-base">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 px-3 transition ${errors.password ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={loading}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Use at least 8 characters.' : 'استخدم 8 أحرف على الأقل.'}
                </p>
                {errors.password && <p id="password-error" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {text.confirmPassword}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="flex items-center justify-center w-10 h-10 text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg"
                    aria-label={showConfirmPassword ? text.hidePassword : text.togglePassword}
                    title={showConfirmPassword ? text.hidePassword : text.togglePassword}
                  >
                    <span className="material-symbols-outlined text-base">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 px-3 transition ${errors.confirmPassword ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={loading}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.confirmPassword && <p id="confirm-password-error" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-500 focus:ring-emerald-400"
                />
                <span>
                  <a href="#" onClick={(event) => event.preventDefault()} className="font-medium text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline">{language === 'en' ? 'Terms of service' : 'شروط الخدمة'}</a>
                  {' '}
                  {language === 'en' ? 'and' : 'و'}
                  {' '}
                  <a href="#" onClick={(event) => event.preventDefault()} className="font-medium text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline">{language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}</a>
                </span>
              </label>
              {errors.agree && <p className="-mt-2 text-sm font-medium text-red-500 dark:text-red-400">{errors.agree}</p>}

              {errors.form && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
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
                    {text.create}
                  </>
                ) : (
                  text.create
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {text.alreadyHave}{' '}
              <button type="button" onClick={onSwitchToLogin} className="font-bold text-emerald-600 dark:text-emerald-400 transition hover:text-emerald-700 dark:hover:text-emerald-300">
                {text.login}
              </button>
            </p>
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
