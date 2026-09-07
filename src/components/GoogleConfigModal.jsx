import React, { useState } from 'react'
import { setGoogleClientId } from '../lib/googleAuth'

export default function GoogleConfigModal({ isOpen, language = 'ar', onClose, onSuccess }) {
  const [clientIdInput, setClientIdInput] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const isArabic = language === 'ar'

  const handleSave = (e) => {
    e.preventDefault()
    const cleanId = clientIdInput.trim()
    if (!cleanId) {
      setError(isArabic ? 'يرجى إدخال معرف العميل (Client ID)' : 'Please enter your Google Client ID')
      return
    }

    if (!cleanId.includes('.apps.googleusercontent.com')) {
      setError(
        isArabic
          ? 'المعرف يجب أن ينتهي بـ .apps.googleusercontent.com'
          : 'Client ID should end with .apps.googleusercontent.com'
      )
      return
    }

    setGoogleClientId(cleanId)
    onSuccess(cleanId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 ${
          isArabic ? 'rtl text-right' : 'ltr text-left'
        }`}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.8 2.2 2.5 6.5 2.5 11.7S6.8 21.2 12 21.2c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.3-.2-1.9H12z" />
                <path fill="#34A853" d="M3.8 7.3l3.8 2.8c1-1.9 3-3.2 5.4-3.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 8.2 2.2 5 4.5 3.8 7.3z" />
                <path fill="#FBBC05" d="M3.8 16.1c1.5 2.9 4.5 4.9 8.2 4.9 2.4 0 4.4-.8 5.9-2.2l-2.8-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.7-5.1-4l-3.1 2.4z" />
                <path fill="#4285F4" d="M12 19.8c2.2 0 4.1-.7 5.5-2l-2.7-2.1c-.9.6-2 .9-2.8.9-2.5 0-4.7-1.8-5.2-4.1l-3 2.3C1.4 16.8 6.4 19.8 12 19.8z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {isArabic ? 'إعداد حساب Google الحقيقي' : 'Configure Google Sign-In'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {isArabic
              ? 'لعرض حسابات Google المسجلة على جهازك الحقيقي بواسطة نافذة Google الرسمية، يلزم تزويد التطبيق بـ Google Client ID:'
              : 'To show your real device Google accounts using the official Google account chooser, a Google Client ID is required:'}
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Google Client ID
            </label>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => {
                setClientIdInput(e.target.value)
                setError('')
              }}
              placeholder="123456789-xxxx.apps.googleusercontent.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {isArabic ? 'كيف تحصل عليه في دقيقة واحدة مجاناً؟' : 'How to get it in 1 minute:'}
            </p>
            <ol className="list-decimal ps-4 space-y-0.5">
              <li>{isArabic ? 'ادخل إلى console.cloud.google.com' : 'Open console.cloud.google.com'}</li>
              <li>{isArabic ? 'أنشئ مشروعاً جديداً ثم اذهب إلى Credentials' : 'Create a project and go to Credentials'}</li>
              <li>{isArabic ? 'اختر Create Credentials -> OAuth client ID (Web)' : 'Choose Create Credentials -> OAuth client ID (Web)'}</li>
              <li>{isArabic ? 'أضف http://localhost:5173 في Authorized JavaScript origins' : 'Add http://localhost:5173 to Authorized JavaScript origins'}</li>
              <li>{isArabic ? 'انسخ Client ID وضعه هنا أو في ملف .env (VITE_GOOGLE_CLIENT_ID)' : 'Copy the Client ID here or in .env as VITE_GOOGLE_CLIENT_ID'}</li>
            </ol>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              {isArabic ? 'حفظ وتفعيل Google' : 'Save & Open Google'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
