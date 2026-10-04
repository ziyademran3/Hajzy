import React from 'react'
import { FcGoogle } from 'react-icons/fc'
import { FaApple } from 'react-icons/fa'

export default function OAuthButtons({ onGoogle, onApple }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => typeof onGoogle === 'function' && onGoogle()}
        aria-label="التسجيل بـ Google"
        title="التسجيل بـ Google"
        className="secondary-button w-full"
      >
        <FcGoogle className="h-5 w-5" aria-hidden />
        <span className="font-medium">التسجيل بـ Google</span>
      </button>

      <button
        type="button"
        onClick={() => typeof onApple === 'function' && onApple()}
        aria-label="التسجيل بـ Apple"
        title="التسجيل بـ Apple"
        className="secondary-button w-full"
      >
        <FaApple className="h-4 w-4" aria-hidden />
        <span className="font-medium">التسجيل بـ Apple</span>
      </button>
    </div>
  )
}
