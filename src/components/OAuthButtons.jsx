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
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-blue-400"
      >
        <FcGoogle className="h-5 w-5" aria-hidden />
        <span className="font-medium">التسجيل بـ Google</span>
      </button>

      <button
        type="button"
        onClick={() => typeof onApple === 'function' && onApple()}
        aria-label="التسجيل بـ Apple"
        title="التسجيل بـ Apple"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-blue-400"
      >
        <FaApple className="h-4 w-4" aria-hidden />
        <span className="font-medium">التسجيل بـ Apple</span>
      </button>
    </div>
  )
}
