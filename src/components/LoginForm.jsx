import React, { useState } from 'react'
import PasswordInput from './PasswordInput'
import OAuthButtons from './OAuthButtons'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginForm({ onLogin, onRegister, onForgot }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!email) e.email = 'الرجاء إدخال البريد الإلكتروني'
    else if (!emailRegex.test(email)) e.email = 'الرجاء إدخال بريد إلكتروني صالح'
    if (!password) e.password = 'الرجاء إدخال كلمة المرور'
    else if (password.length < 6) e.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onLogin && onLogin({ email, password, remember })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
        <input
          type="email"
          placeholder="أدخل بريدك الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-hajzy-border bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hajzy-primary"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">كلمة المرور</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      </div>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="form-checkbox h-4 w-4 text-hajzy-primary" />
          <span>تذكرني</span>
        </label>
        <button type="button" onClick={onForgot} className="text-sm text-hajzy-primary underline">هل نسيت كلمة المرور؟</button>
      </div>

      <div className="space-y-3">
        <button type="submit" className="w-full px-4 py-3 rounded-lg bg-hajzy-secondary text-white font-semibold">تسجيل الدخول</button>

        <button type="button" onClick={onRegister} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-hajzy-border bg-transparent text-gray-700 dark:text-hajzy-text">إنشاء حساب جديد</button>
      </div>

      <div className="pt-2">
        <OAuthButtons onGoogle={() => onLogin && onLogin({ oauth: 'google' })} onApple={() => onLogin && onLogin({ oauth: 'apple' })} />
      </div>
    </form>
  )
}
