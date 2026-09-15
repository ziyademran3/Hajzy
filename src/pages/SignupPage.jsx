import { useState } from 'react'
import Logo from '../components/Logo'
import SocialAuthModal from '../components/SocialAuthModal'
import { triggerGoogleLogin } from '../lib/googleAuth'
import { useTheme } from '../components/ThemeProvider'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
    <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
    <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
    <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
  </svg>
)

// Calculate password complexity for instant guest reassurance
const evaluatePasswordStrength = (password) => {
  if (!password) return { score: 0, labelEn: '', labelAr: '', color: '' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  switch (score) {
    case 1:
      return { score: 1, labelEn: 'Weak', labelAr: 'ضعيفة', color: 'bg-rose-500' }
    case 2:
      return { score: 2, labelEn: 'Moderate', labelAr: 'متوسطة', color: 'bg-amber-500' }
    case 3:
      return { score: 3, labelEn: 'Strong', labelAr: 'قوية', color: 'bg-emerald-500' }
    case 4:
      return { score: 4, labelEn: 'Exceptional', labelAr: 'ممتازة', color: 'bg-teal-400' }
    default:
      return { score: 0, labelEn: '', labelAr: '', color: '' }
  }
}

export default function SignupPage({
  language = 'ar',
  onToggleLanguage,
  onSignup,
  onSwitchToLogin,
  onSocialLogin = () => {},
}) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [capsLockActive, setCapsLockActive] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [socialModalProvider, setSocialModalProvider] = useState(null)

  const passwordStrength = evaluatePasswordStrength(form.password)

  const text = language === 'en'
    ? {
        brand: 'Hajzy',
        tagline: 'Luxury Hospitality & Verified Stays',
        title: 'Create Account',
        subtitle: 'Join Hajzy to unlock private coastal villas and concierge booking.',
        tabLogin: 'Sign In',
        tabSignup: 'Create Account',
        fullName: 'Full name',
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm password',
        agree: 'I agree to the Terms of Service and Privacy Policy',
        create: 'Create my account',
        login: 'Sign in instead',
        alreadyHave: 'Already have an account?',
        google: 'Sign up with Google',
        dividerText: 'or sign up with email',
        capsLockOn: 'Caps Lock is on',
        strengthLabel: 'Password strength',
        requiredName: 'Please enter your full name.',
        requiredEmail: 'Please enter your email.',
        invalidEmail: 'Please enter a valid email address.',
        requiredPassword: 'Please enter your password.',
        passwordLength: 'Password must be at least 8 characters long.',
        passwordMismatch: 'Passwords do not match.',
        requiredAgreement: 'You must accept the terms and privacy policy.',
        togglePassword: 'Show password',
        hidePassword: 'Hide password',
        showcaseTitle: 'Handpicked Luxury Stays & Escapes in Egypt',
        showcaseSubtitle: 'From private beachfront villas in El Gouna and the Red Sea to tranquil retreats in Siwa and Aswan.',
        statStays: '+5,000 Verified Stays',
        statRating: '4.92/5 Guest Score',
        statInstant: '100% Instant Booking',
        quote: '"The most refined booking experience for private coastal villas in Egypt."',
        quoteAuthor: 'Verified Guest • Cairo',
      }
    : {
        brand: 'حجزي',
        tagline: 'منصة الإقامات الفاخرة والموثقة',
        title: 'إنشاء حساب فاخر',
        subtitle: 'انضم إلى حجزي واستمتع بأرقى الفلل والشاليهات الخاصة مع حجز فوري موثق.',
        tabLogin: 'تسجيل الدخول',
        tabSignup: 'حساب جديد',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        agree: 'أوافق على شروط الخدمة وسياسة الخصوصية المعتمدة',
        create: 'إنشاء حسابي الآن',
        login: 'تسجيل الدخول',
        alreadyHave: 'لديك حساب بالفعل؟',
        google: 'التسجيل السريع عبر Google',
        dividerText: 'أو التسجيل عبر البريد الإلكتروني',
        capsLockOn: 'زر الحروف الكبيرة (Caps Lock) مفعّل',
        strengthLabel: 'قوة كلمة المرور',
        requiredName: 'يرجى إدخال الاسم الكامل.',
        requiredEmail: 'يرجى إدخال البريد الإلكتروني.',
        invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
        requiredPassword: 'يرجى إدخال كلمة المرور.',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
        passwordMismatch: 'كلمات المرور غير متطابقة.',
        requiredAgreement: 'يجب الموافقة على الشروط وسياسة الخصوصية.',
        togglePassword: 'عرض كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
        showcaseTitle: 'نخبة الإقامات والمنتجعات الفاخرة في مصر',
        showcaseSubtitle: 'من الفلل الشاطئية الخاصة في الجونة والبحر الأحمر إلى الواحات الهادئة في سيوة وأسوان.',
        statStays: '+5,000 إقامة موثقة',
        statRating: '4.92/5 تقييم الضيوف',
        statInstant: 'حجز فوري مؤكد 100%',
        quote: '“أرقى تجربة حجز للإقامات والفلل الساحلية في مصر بأعلى معايير المصداقية.”',
        quoteAuthor: 'ضيف موثق • القاهرة',
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

  const handleKeyModifier = (event) => {
    if (event.getModifierState) {
      setCapsLockActive(event.getModifierState('CapsLock'))
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
    if (!validateForm()) return

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
          // Closed
        } else if (errMsg.includes('origin_mismatch')) {
          setErrors({
            general:
              language === 'en'
                ? 'Google OAuth origin mismatch: Please verify authorized origins.'
                : 'خطأ نطاق Google: يرجى التحقق من Authorized JavaScript origins.',
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

  const emailPlaceholder = language === 'en' ? 'name@domain.com' : 'name@example.com'

  return (
    <div
      className={`min-h-[100dvh] w-full bg-[#f8faf9] text-[#111918] dark:bg-[#07090b] dark:text-[#f3f6f5] transition-colors duration-300 flex flex-col justify-between ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Utility Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/70 dark:border-white/5 bg-white/80 dark:bg-[#07090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo size={34} showText={true} />
            <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider text-emerald-800/80 dark:text-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full px-2.5 py-0.5">
              {text.tagline}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition active:scale-95 shadow-xs theme-toggle"
              aria-label={
                isDark
                  ? language === 'ar' ? 'تفعيل الوضع النهاري' : 'Switch to light mode'
                  : language === 'ar' ? 'تفعيل الوضع الليلي' : 'Switch to dark mode'
              }
              title={
                isDark
                  ? language === 'ar' ? 'تفعيل الوضع النهاري' : 'Switch to light mode'
                  : language === 'ar' ? 'تفعيل الوضع الليلي' : 'Switch to dark mode'
              }
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Language Switcher Pill */}
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

      {/* Main Luxury Split Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Visual Showcase Panel (Desktop Editorial Display) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 order-2 lg:order-2 flex-col justify-between self-stretch relative overflow-hidden rounded-[32px] border border-slate-200/80 dark:border-white/10 shadow-2xl bg-[#00433f] text-white min-h-[660px]">
            <img
              src="/auth-luxury-stay.jpg"
              alt="Luxury Resort Egypt"
              className="absolute inset-0 h-full w-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out hover:scale-100"
              loading="eager"
            />
            
            {/* Ambient Multi-layer Gradient Scrim (subtle top & bottom for high image clarity) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#001817]/90 via-black/20 to-black/15" />
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#001211]/50" />

            {/* Top Bar inside showcase */}
            <div className="relative z-10 p-8 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-bold backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {text.statInstant}
              </span>
              <span className="text-xs font-semibold text-white/80 tabular-nums">
                {text.statRating}
              </span>
            </div>

            {/* Bottom Content & Testimonial inside showcase */}
            <div className="relative z-10 p-8 sm:p-10 space-y-6">
              <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-white leading-snug">
                  {text.showcaseTitle}
                </h2>
                <p className="text-sm text-emerald-100/90 leading-relaxed">
                  {text.showcaseSubtitle}
                </p>
              </div>

              {/* Guest Quote Card */}
              <div className="rounded-2xl border border-white/15 bg-black/35 backdrop-blur-xl p-4 sm:p-5 shadow-lg max-w-md">
                <p className="text-xs sm:text-sm font-medium italic text-white/95 leading-relaxed">
                  {text.quote}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">★★★★★</span>
                  <span className="text-[11px] font-semibold text-emerald-200/90">{text.quoteAuthor}</span>
                </div>
              </div>

              {/* Verified Features Row */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-center border-t border-white/15">
                <div className="p-1">
                  <div className="text-base font-black text-white tabular-nums">+5,000</div>
                  <div className="text-[11px] text-emerald-200/80">{language === 'ar' ? 'إقامة موثقة' : 'Verified Stays'}</div>
                </div>
                <div className="p-1 border-x border-white/15">
                  <div className="text-base font-black text-white tabular-nums">100%</div>
                  <div className="text-[11px] text-emerald-200/80">{language === 'ar' ? 'ضمان الضيافة' : 'Hospitality Guarantee'}</div>
                </div>
                <div className="p-1">
                  <div className="text-base font-black text-amber-300 tabular-nums">4.92★</div>
                  <div className="text-[11px] text-emerald-200/80">{language === 'ar' ? 'رضا النزلاء' : 'Guest Score'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Authentication Panel */}
          <div className="w-full lg:col-span-6 xl:col-span-5 order-1 lg:order-1 max-w-md mx-auto">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#101418] shadow-[0_20px_60px_rgba(0,67,63,0.08)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.5)] p-6 sm:p-8 transition-all">
              
              {/* Card Switcher Pills: Sign In vs Sign Up */}
              <div className="mb-6 flex rounded-2xl bg-slate-100/90 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  {text.tabLogin}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-white dark:bg-emerald-900/60 py-2.5 text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-100 shadow-xs transition"
                >
                  {text.tabSignup}
                </button>
              </div>

              {/* Title & Welcome Note */}
              <div className="mb-5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  {text.title}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {text.subtitle}
                </p>
              </div>

              {/* Google Social Login */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => handleSocialClick('google')}
                  disabled={loading}
                  className="flex w-full min-h-[46px] items-center justify-center gap-3 rounded-2xl border border-slate-300/80 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/25 active:scale-[0.98] disabled:opacity-60 shadow-xs"
                >
                  <GoogleIcon />
                  <span>{text.google}</span>
                </button>
              </div>

              {/* Thin Line Divider */}
              <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/10" />
                <span>{text.dividerText}</span>
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/10" />
              </div>

              {/* Signup Form */}
              <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
                {/* Name */}
                <div>
                  <label htmlFor="name" className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {text.fullName}
                  </label>
                  <div
                    className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-white/5 px-3.5 transition-all ${
                      errors.name
                        ? 'border-red-400 bg-red-50/50 dark:border-red-500 dark:bg-red-950/30'
                        : 'border-slate-200 dark:border-white/10 focus-within:border-emerald-600 dark:focus-within:border-emerald-400 focus-within:bg-white dark:focus-within:bg-black/40 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] shrink-0">
                      person
                    </span>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      placeholder={language === 'en' ? 'John Smith' : 'أحمد محمود'}
                      disabled={loading}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      className="w-full min-h-[44px] border-0 bg-transparent py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  {errors.name && <p id="name-error" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {text.email}
                  </label>
                  <div
                    className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-white/5 px-3.5 transition-all ${
                      errors.email
                        ? 'border-red-400 bg-red-50/50 dark:border-red-500 dark:bg-red-950/30'
                        : 'border-slate-200 dark:border-white/10 focus-within:border-emerald-600 dark:focus-within:border-emerald-400 focus-within:bg-white dark:focus-within:bg-black/40 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] shrink-0">
                      mail
                    </span>
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
                      dir="ltr"
                      className="w-full min-h-[44px] border-0 bg-transparent py-2 text-sm text-left text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  {errors.email && <p id="email-error" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                {/* Password with Strength Indicator */}
                <div>
                  <label htmlFor="password" className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {text.password}
                  </label>
                  <div
                    className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-white/5 px-3.5 transition-all ${
                      errors.password
                        ? 'border-red-400 bg-red-50/50 dark:border-red-500 dark:bg-red-950/30'
                        : 'border-slate-200 dark:border-white/10 focus-within:border-emerald-600 dark:focus-within:border-emerald-400 focus-within:bg-white dark:focus-within:bg-black/40 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] shrink-0">
                      lock
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      onKeyUp={handleKeyModifier}
                      onKeyDown={handleKeyModifier}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      disabled={loading}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password
                          ? 'password-error'
                          : capsLockActive
                          ? 'signup-capslock-warning'
                          : undefined
                      }
                      dir="ltr"
                      className="w-full min-h-[44px] border-0 bg-transparent py-2 text-sm text-left text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      aria-label={showPassword ? text.hidePassword : text.togglePassword}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Caps Lock indicator */}
                  {capsLockActive && (
                    <div
                      id="signup-capslock-warning"
                      className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                    >
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      <span>{text.capsLockOn}</span>
                    </div>
                  )}

                  {/* Password Strength Meter */}
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">{text.strengthLabel}</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {language === 'ar' ? passwordStrength.labelAr : passwordStrength.labelEn}
                        </span>
                      </div>
                      <div className="flex h-1.5 w-full gap-1">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              bar <= passwordStrength.score
                                ? passwordStrength.color
                                : 'bg-slate-200 dark:bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.password && <p id="password-error" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {text.confirmPassword}
                  </label>
                  <div
                    className={`flex items-center gap-2.5 rounded-2xl border bg-slate-50/90 dark:bg-white/5 px-3.5 transition-all ${
                      errors.confirmPassword
                        ? 'border-red-400 bg-red-50/50 dark:border-red-500 dark:bg-red-950/30'
                        : 'border-slate-200 dark:border-white/10 focus-within:border-emerald-600 dark:focus-within:border-emerald-400 focus-within:bg-white dark:focus-within:bg-black/40 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] shrink-0">
                      lock_reset
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onKeyUp={handleKeyModifier}
                      onKeyDown={handleKeyModifier}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      disabled={loading}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                      dir="ltr"
                      className="w-full min-h-[44px] border-0 bg-transparent py-2 text-sm text-left text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      aria-label={showConfirmPassword ? text.hidePassword : text.togglePassword}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword && <p id="confirm-password-error" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-1">
                  <label
                    htmlFor="terms-agree"
                    className="inline-flex cursor-pointer items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 select-none leading-relaxed"
                  >
                    <input
                      id="terms-agree"
                      type="checkbox"
                      name="agree"
                      checked={form.agree}
                      onChange={handleChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{text.agree}</span>
                  </label>
                  {errors.agree && <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{errors.agree}</p>}
                </div>

                {errors.form && (
                  <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300" role="alert">
                    {errors.form}
                  </div>
                )}

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00433f] via-[#0b5f59] to-[#00433f] px-4 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,67,63,0.25)] transition-all hover:shadow-[0_16px_34px_rgba(0,67,63,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>{text.create}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      <span>{text.create}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Already have an account */}
              <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
                <span>{text.alreadyHave} </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline transition"
                >
                  {text.login}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full border-t border-slate-200/60 dark:border-white/5 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>© {new Date().getFullYear()} Hajzy. {language === 'ar' ? 'جميع الحقوق محفوظة • حجز آمن وموثق 100%' : 'All rights reserved • 100% Secured Luxury Stays'}</p>
      </footer>

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
