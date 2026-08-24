import React, { useState } from 'react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'

export default function PasswordInput({ value, onChange, placeholder = 'أدخل كلمة المرور', name = 'password', id, error, className = '' }) {
  const [show, setShow] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-3 pr-10 rounded-lg border border-gray-200 dark:border-hajzy-border bg-white dark:bg-hajzy-card text-gray-900 dark:text-hajzy-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-hajzy-primary`}
        aria-invalid={!!error}
      />

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 left-3 md:left-4 flex items-center text-gray-500 dark:text-hajzy-muted"
        aria-label={show ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'}
      >
        {show ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
