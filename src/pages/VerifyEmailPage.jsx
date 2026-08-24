import { useEffect, useMemo, useState } from 'react'
import { verifyEmail } from '../lib/authApi'

export default function VerifyEmailPage({ language = 'ar', onBackToLogin }) {
  const token = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    return params.get('token') || ''
  }, [])

  const text = language === 'en'
    ? {
        title: 'Verify your email',
        description: 'We are confirming your email address. This usually takes a moment.',
        submit: 'Back to sign in',
        missingToken: 'The verification link is invalid or expired.',
        success: 'Your email address has been verified successfully.',
        error: 'We could not verify this email address right now.',
      }
    : {
        title: 'تأكيد البريد الإلكتروني',
        description: 'نحن نتحقق من عنوان بريدك الإلكتروني الآن. قد يستغرق ذلك بعض الثواني.',
        submit: 'العودة لتسجيل الدخول',
        missingToken: 'رابط التفعيل غير صالح أو منتهي.',
        success: 'تم تأكيد بريدك الإلكتروني بنجاح.',
        error: 'تعذر تأكيد البريد الإلكتروني في الوقت الحالي.',
      }

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(text.missingToken)
      return
    }

    verifyEmail(token)
      .then((response) => {
        setStatus('success')
        setMessage(response?.message || text.success)
      })
      .catch((requestError) => {
        setStatus('error')
        setMessage(requestError.message || text.error)
      })
  }, [token, text.error, text.missingToken, text.success])

  return (
    <div className={`min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{text.title}</h1>
            <p className="mt-3 text-sm text-slate-600">{text.description}</p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-4 text-sm font-medium ${status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
            role={status === 'error' ? 'alert' : 'status'}
          >
            {status === 'loading' ? (
              <div className="flex items-center justify-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                <span>{text.description}</span>
              </div>
            ) : (
              message
            )}
          </div>

          <button
            type="button"
            onClick={onBackToLogin}
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-500 px-4 py-3.5 text-base font-bold text-white shadow-[0_18px_30px_rgba(13,148,136,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(13,148,136,0.28)]"
          >
            {text.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
