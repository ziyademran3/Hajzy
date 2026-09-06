import { useState } from 'react'

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


export default function SignupPage({ language = 'ar', onToggleLanguage: _onToggleLanguage, onSignup, onSwitchToLogin, onSocialLogin = () => {} }) {
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
        google: 'Google',
        requiredName: 'Please enter your full name.',
        requiredEmail: 'Please enter your email.',
        invalidEmail: 'Please enter a valid email address.',
        requiredPassword: 'Please enter your password.',
        passwordLength: 'Password must be at least 8 characters long.',
        passwordMismatch: 'Passwords do not match.',
        requiredAgreement: 'You must accept the terms and privacy policy.',
        togglePassword: 'Show password',
        hidePassword: 'Hide password',
        passwordRequirements: 'Password requirements:',
        req8Chars: '8 or more characters',
        reqUppercase: 'At least one uppercase letter',
        reqNumber: 'At least one number',
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
        google: 'Google',
        requiredName: 'يرجى إدخال الاسم الكامل.',
        requiredEmail: 'يرجى إدخال البريد الإلكتروني.',
        invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
        requiredPassword: 'يرجى إدخال كلمة المرور.',
        passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
        passwordMismatch: 'كلمات المرور غير متطابقة.',
        requiredAgreement: 'يجب الموافقة على الشروط وسياسة الخصوصية.',
        togglePassword: 'عرض كلمة المرور',
        hidePassword: 'إخفاء كلمة المرور',
        passwordRequirements: 'متطلبات كلمة المرور:',
        req8Chars: '8 أحرف على الأقل',
        reqUppercase: 'حرف واحد على الأقل بحالة كبيرة',
        reqNumber: 'رقم واحد على الأقل',
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
    } finally {
      setLoading(false)
    }
  }

  const handleSocialClick = async (provider) => {
    if (loading) return null
    setLoading(true)
    try {
      return await onSocialLogin(provider)
    } finally {
      setLoading(false)
    }
  }

  const emailPlaceholder = language === 'en' ? 'your@email.com' : 'أدخل بريدك الإلكتروني'
  const passwordStrength = (() => {
    if (!form.password) return { label: language === 'en' ? 'No password' : 'لا توجد كلمة مرور', level: 0 }
    let score = 0
    if (form.password.length >= 8) score += 1
    if (/[A-Z]/.test(form.password)) score += 1
    if (/[0-9]/.test(form.password)) score += 1
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1
    if (score <= 1) return { label: language === 'en' ? 'Weak' : 'ضعيفة', level: 1 }
    if (score <= 2) return { label: language === 'en' ? 'Medium' : 'متوسطة', level: 2 }
    return { label: language === 'en' ? 'Strong' : 'قوية', level: 3 }
  })()

  const passwordRequirements = {
    has8Chars: form.password.length >= 8,
    hasUppercase: /[A-Z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
  }

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
                <GoogleIcon />
                {text.google}
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
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-300">
                  {text.fullName}
                </label>
                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 px-3 transition ${errors.name ? 'border-[#f1c5c9] bg-[#fff8f8] shadow-[0_0_0_4px_rgba(241,197,201,0.16)]' : 'border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
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
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.name && <p id="name-error" className="mt-2 text-sm font-medium text-[#c86b73]">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-300">
                  {text.email}
                </label>
                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 px-3 transition ${errors.email ? 'border-[#f1c5c9] bg-[#fff8f8] shadow-[0_0_0_4px_rgba(241,197,201,0.16)]' : 'border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
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
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.email && <p id="email-error" className="mt-2 text-sm font-medium text-[#c86b73]">{errors.email}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                    {text.password}
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

                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 px-3 transition ${errors.password ? 'border-red-500 bg-red-50 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]' : 'border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
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
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                   <span className={`block h-full rounded-full ${passwordStrength.level === 0 ? 'w-0' : passwordStrength.level === 1 ? 'w-1/3 bg-red-400' : passwordStrength.level === 2 ? 'w-2/3 bg-amber-400' : 'w-full bg-emerald-500'}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{passwordStrength.label}</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-slate-500">{text.passwordRequirements}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold ${passwordRequirements.has8Chars ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {passwordRequirements.has8Chars ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.has8Chars ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>{text.req8Chars}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold ${passwordRequirements.hasUppercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {passwordRequirements.hasUppercase ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>{text.reqUppercase}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold ${passwordRequirements.hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {passwordRequirements.hasNumber ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>{text.reqNumber}</span>
                    </div>
                  </div>
                </div>
                {errors.password && <p id="password-error" className="mt-2 text-sm font-medium text-red-400">{errors.password}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300">
                    {text.confirmPassword}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="flex items-center justify-center w-10 h-10 text-emerald-300 transition hover:text-emerald-200 hover:bg-emerald-500/10 rounded-lg"
                    aria-label={showConfirmPassword ? text.hidePassword : text.togglePassword}
                    title={showConfirmPassword ? text.hidePassword : text.togglePassword}
                  >
                    <span className="material-symbols-outlined text-base">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>

                <div className={`flex items-center gap-3 rounded-2xl border bg-slate-50 px-3 transition ${errors.confirmPassword ? 'border-red-500 bg-red-50 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]' : 'border-slate-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'}`}>
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
                    className="w-full border-0 bg-transparent py-3.5 text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                {errors.confirmPassword && <p id="confirm-password-error" className="mt-2 text-sm font-medium text-red-400">{errors.confirmPassword}</p>}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-400"
                />
                <span>
                  <a href="#" onClick={(event) => event.preventDefault()} className="font-medium text-emerald-700 underline-offset-2 hover:underline">{language === 'en' ? 'Terms of service' : 'شروط الخدمة'}</a>
                  {' '}
                  {language === 'en' ? 'and' : 'و'}
                  {' '}
                  <a href="#" onClick={(event) => event.preventDefault()} className="font-medium text-emerald-700 underline-offset-2 hover:underline">{language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}</a>
                </span>
              </label>
              {errors.agree && <p className="-mt-2 text-sm font-medium text-red-400">{errors.agree}</p>}

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
                    {text.create}
                  </>
                ) : (
                  text.create
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              {text.alreadyHave}{' '}
              <button type="button" onClick={onSwitchToLogin} className="font-bold text-emerald-300 transition hover:text-emerald-200">
                {text.login}
              </button>
            </p>
          </main>
        </div>
      </div>
    </div>
  )
}
