import React, { useState } from 'react'
import PasswordInput from './PasswordInput'
import OAuthButtons from './OAuthButtons'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterForm({ onRegister, onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!name) e.name = 'الرجاء إدخال الاسم'
    if (!email) e.email = 'الرجاء إدخال البريد الإلكتروني'
    else if (!emailRegex.test(email)) e.email = 'الرجاء إدخال بريد إلكتروني صالح'
    if (!password) e.password = 'الرجاء إدخال كلمة المرور'
    else if (password.length < 6) e.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    if (password !== confirm) e.confirm = 'كلمتا المرور غير متطابقتين'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onRegister && onRegister({ name, email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">الاسم الكامل</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-hajzy-border bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hajzy-primary"
          placeholder="الاسم الكامل"
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="mt-2 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="أدخل بريدك الإلكتروني"
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-hajzy-border bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hajzy-primary"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">كلمة المرور</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">تأكيد كلمة المرور</label>
        <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} placeholder="أعد إدخال كلمة المرور" />
      </div>

      <div className="space-y-3">
        <button type="submit" className="w-full px-4 py-3 rounded-lg bg-hajzy-secondary text-white font-semibold">إنشاء حساب جديد</button>
        <button type="button" onClick={onLogin} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-hajzy-border bg-transparent text-gray-700 dark:text-hajzy-text">لدي حساب بالفعل — تسجيل الدخول</button>
      </div>

      <div className="pt-2">
        <OAuthButtons onGoogle={() => onRegister && onRegister({ oauth: 'google' })} onApple={() => onRegister && onRegister({ oauth: 'apple' })} />
      </div>
    </form>
  )
}
