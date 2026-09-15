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
  const [selectedMethod, setSelectedMethod] = useState('instapay')

  if (!isOpen) return null

  const isArabic = language === 'ar'
  const perPersonAmount = Math.ceil(totalAmount / splitCount)
  const paidAmount = perPersonAmount * paidCount
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  const progressPercent = Math.min(100, Math.round((paidAmount / totalAmount) * 100))

  const shareLink = `https://hajzy.com/pay/split?ref=SPLIT-${Math.floor(100000 + Math.random() * 900000)}&share=${perPersonAmount}`

  const shareMessage = isArabic
    ? `مرحباً! هذا رابط دفع حصتك في حجز "${propertyName}" عبر منصة حجزي بقيمة ${perPersonAmount.toLocaleString()} ${currency}: ${shareLink}`
    : `Hi! Here is your share link for booking "${propertyName}" on Hajzy (${perPersonAmount.toLocaleString()} ${currency}): ${shareLink}`

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`
    window.open(url, '_blank')
  }

  const handleSimulatePayment = () => {
    if (paidCount < splitCount) {
      setPaidCount((c) => c + 1)
    }
  }

  const localMethods = [
    { id: 'instapay', name: isArabic ? 'إنستاباي (InstaPay)' : 'InstaPay QR', icon: 'bolt', badge: isArabic ? 'دفع لحظي مجاني' : 'Instant 0% Fee' },
    { id: 'wallets', name: isArabic ? 'المحافظ الذكية (فودافون كاش / أورنج / وي)' : 'Mobile Wallets (Vodafone / Orange)', icon: 'account_balance_wallet', badge: isArabic ? 'متاح 24/7' : '24/7' },
    { id: 'card', name: isArabic ? 'بطاقة بنكية / فيزا وماستركارد' : 'Credit / Debit Card', icon: 'credit_card', badge: isArabic ? 'تأكيد فوري' : 'Instant' },
  ]

  return (
    <div className="dialog-backdrop" onClick={onClose} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div
        className="dialog-modal split-modal w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#11161b] p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[22px]">group_work</span>
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black">{isArabic ? 'تقسيم الفاتورة مع الأصدقاء' : 'Split Bill with Friends'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{propertyName}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
            onClick={onClose}
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isArabic
              ? 'قسّم تكلفة الإقامة بسهولة وشارك الرابط مع أصدقائك عبر واتساب ليدفع كل شخص حصته مباشرة عبر InstaPay أو المحافظ الإلكترونية.'
              : 'Easily split the stay cost and share WhatsApp payment links with your group.'}
          </p>

          {/* Stepper Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{isArabic ? 'إجمالي مبلغ الحجز' : 'Total Stay Amount'}</span>
              <strong className="text-sm font-black tabular-nums">{totalAmount.toLocaleString()} {currency}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{isArabic ? 'عدد المشتركين' : 'Number of People'}</span>
              <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-black/30 border border-slate-200/80 dark:border-white/10 p-1 shadow-xs">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950 transition disabled:opacity-30"
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
                <span className="w-8 text-center text-sm font-black tabular-nums">{splitCount}</span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950 transition disabled:opacity-30"
                  onClick={() => setSplitCount((n) => Math.min(12, n + 1))}
                  disabled={splitCount >= 12}
                >
                  +
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-slate-200 dark:bg-white/10" />

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">{isArabic ? 'حصة كل فرد' : 'Share per person'}</span>
              <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                {perPersonAmount.toLocaleString()} {currency}
              </strong>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>{isArabic ? `تم سداد ${paidCount} من ${splitCount} حصص` : `${paidCount} of ${splitCount} paid`}</span>
              <span className="text-emerald-600 font-bold tabular-nums">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5 tabular-nums">
              <span>{isArabic ? `المحصّل: ${paidAmount.toLocaleString()} ${currency}` : `Collected: ${paidAmount.toLocaleString()} ${currency}`}</span>
              <span>{isArabic ? `المتبقي: ${remainingAmount.toLocaleString()} ${currency}` : `Remaining: ${remainingAmount.toLocaleString()} ${currency}`}</span>
            </div>
          </div>

          {/* Payment Methods Pill Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              {isArabic ? 'طرق الدفع المدعومة للحصص:' : 'Supported Payment Methods:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {localMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex flex-col items-start p-2.5 rounded-2xl border text-xs text-start transition active:scale-95 ${
                    selectedMethod === m.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200/80 dark:border-white/10 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">{m.icon}</span>
                    <span className="truncate">{m.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{m.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp & Copy Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#20bd5a] transition active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>{isArabic ? 'إرسال عبر واتساب' : 'WhatsApp Share'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs sm:text-sm font-bold transition active:scale-95 ${
                copied
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الرابط' : 'Copy Link')}</span>
            </button>
          </div>

          {/* Actions Footer */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2">
            <button
              type="button"
              className="flex-1 rounded-2xl bg-slate-100 dark:bg-white/5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition active:scale-95"
              onClick={handleSimulatePayment}
              disabled={paidCount >= splitCount}
            >
              {paidCount >= splitCount
                ? (isArabic ? 'اكتمل سداد الفاتورة ✓' : 'All shares completed ✓')
                : (isArabic ? 'محاكاة دفع حصة صديق' : 'Simulate friend payment')}
            </button>
            <button
              type="button"
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#00433f] to-[#0b5f59] py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-110 transition active:scale-95"
              onClick={onClose}
            >
              {isArabic ? 'حفظ ومتابعة' : 'Done & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
