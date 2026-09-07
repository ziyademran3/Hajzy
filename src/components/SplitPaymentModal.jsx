import React, { useState } from 'react'

export default function SplitPaymentModal({
  isOpen,
  onClose,
  totalAmount = 0,
  currency = 'EGP',
  language = 'ar',
  propertyName = '',
}) {
  const [splitCount, setSplitCount] = useState(3)
  const [paidCount, setPaidCount] = useState(1)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const isArabic = language === 'ar'
  const perPersonAmount = Math.ceil(totalAmount / splitCount)
  const paidAmount = perPersonAmount * paidCount
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  const progressPercent = Math.min(100, Math.round((paidAmount / totalAmount) * 100))

  const shareLink = `https://hajzy.com/pay/split?ref=SPLIT-${Math.floor(100000 + Math.random() * 900000)}&share=${perPersonAmount}`

  const handleCopy = () => {
    navigator.clipboard?.writeText(
      isArabic
        ? `مرحباً! هذا رابط دفع حصتك في حجز "${propertyName}" بقيمة ${perPersonAmount} ${currency}: ${shareLink}`
        : `Hi! Here is the link to pay your share for "${propertyName}" (${perPersonAmount} ${currency}): ${shareLink}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSimulatePayment = () => {
    if (paidCount < splitCount) {
      setPaidCount((c) => c + 1)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dialog-modal split-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-2xl">group_work</span>
            <h3>{isArabic ? 'تقسيم الفاتورة مع الأصدقاء' : 'Split Bill with Friends'}</h3>
          </div>
          <button type="button" className="icon-button small" onClick={onClose} aria-label={isArabic ? 'إغلاق' : 'Close'}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="split-modal-body">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {isArabic
              ? 'قسّم تكلفة الإقامة بسهولة وشارك الرابط مع أصدقائك ليدفع كل شخص حصته مباشرة.'
              : 'Easily split the stay cost and share the payment link with friends.'}
          </p>

          <div className="split-config-card">
            <div className="split-row">
              <span>{isArabic ? 'إجمالي المبلغ' : 'Total Amount'}</span>
              <strong>{totalAmount.toLocaleString()} {currency}</strong>
            </div>

            <div className="split-row mt-3">
              <span>{isArabic ? 'عدد الأفراد' : 'Number of People'}</span>
              <div className="stepper-controls">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => {
                    if (splitCount > 2) {
                      setSplitCount((n) => n - 1)
                      if (paidCount >= splitCount) setPaidCount((n) => Math.max(1, n - 1))
                    }
                  }}
                  disabled={splitCount <= 2}
                >
                  -
                </button>
                <strong className="step-val">{splitCount}</strong>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setSplitCount((n) => Math.min(10, n + 1))}
                  disabled={splitCount >= 10}
                >
                  +
                </button>
              </div>
            </div>

            <div className="split-divider" />

            <div className="split-row highlight">
              <span>{isArabic ? 'حصة كل فرد' : 'Share per person'}</span>
              <strong className="text-emerald-700 dark:text-emerald-400 text-lg">
                {perPersonAmount.toLocaleString()} {currency}
              </strong>
            </div>
          </div>

          <div className="split-progress-section mt-5">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>{isArabic ? `تم تحصيل ${paidCount} من ${splitCount}` : `${paidCount} of ${splitCount} paid`}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{isArabic ? `المحصّل: ${paidAmount.toLocaleString()} ${currency}` : `Paid: ${paidAmount.toLocaleString()} ${currency}`}</span>
              <span>{isArabic ? `المتبقي: ${remainingAmount.toLocaleString()} ${currency}` : `Remaining: ${remainingAmount.toLocaleString()} ${currency}`}</span>
            </div>
          </div>

          <div className="share-link-box mt-5">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="share-input"
            />
            <button
              type="button"
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ الرابط' : 'Copy link')}</span>
            </button>
          </div>

          <div className="modal-actions-footer mt-5">
            <button
              type="button"
              className="secondary-button w-full"
              onClick={handleSimulatePayment}
              disabled={paidCount >= splitCount}
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>
                {paidCount >= splitCount
                  ? (isArabic ? 'اكتمل سداد جميع الحصص' : 'All shares completed')
                  : (isArabic ? 'محاكاة دفع حصة صديق' : 'Simulate friend payment')}
              </span>
            </button>
            <button type="button" className="primary-button w-full" onClick={onClose}>
              {isArabic ? 'تم، حفظ ومتابعة' : 'Done, continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
