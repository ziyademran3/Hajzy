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
    {
      id: 'instapay',
      name: isArabic ? 'إنستاباي (InstaPay)' : 'InstaPay QR',
      shortName: isArabic ? 'إنستاباي' : 'InstaPay',
      icon: 'bolt',
      badge: isArabic ? 'دفع لحظي 0%' : 'Instant 0%',
    },
    {
      id: 'wallets',
      name: isArabic ? 'المحافظ الإلكترونية (فودافون كاش / أورنج / وي)' : 'Mobile Wallets',
      shortName: isArabic ? 'المحافظ' : 'Wallets',
      icon: 'account_balance_wallet',
      badge: isArabic ? 'متاح 24/7' : '24/7',
    },
    {
      id: 'card',
      name: isArabic ? 'بطاقة بنكية / فيزا وماستركارد' : 'Bank Card',
      shortName: isArabic ? 'بطاقة بنكية' : 'Bank Card',
      icon: 'credit_card',
      badge: isArabic ? 'تأكيد فوري' : 'Instant',
    },
  ]

  return (
    <div
      className="dialog-backdrop !z-[1000] p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div
        className="dialog-modal relative w-full max-w-lg rounded-3xl sm:rounded-[28px] border border-slate-200/90 dark:border-white/10 !bg-white dark:!bg-[#11161f] p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.35)] text-slate-900 dark:text-white my-auto overflow-hidden"
        style={{ backgroundColor: 'var(--split-dialog-bg, #ffffff)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">group_work</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate leading-tight">
                {isArabic ? 'تقسيم الفاتورة مع الأصدقاء' : 'Split Bill with Friends'}
              </h3>
              {propertyName && (
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">location_on</span>
                  <span className="truncate">{propertyName}</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
            onClick={onClose}
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4 pt-4">
          {/* Informational Banner */}
          <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 sm:p-3.5 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
              {isArabic
                ? 'قسّم تكلفة الإقامة بسهولة وشارك الرابط مع أصدقائك عبر واتساب ليدفع كل شخص حصته مباشرة عبر InstaPay أو المحافظ الإلكترونية.'
                : 'Easily split the stay cost and share WhatsApp payment links with your group to pay via InstaPay or Mobile Wallets.'}
            </p>
          </div>

          {/* Stepper Card with Financial Breakdown */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-white/5 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {isArabic ? 'إجمالي مبلغ الحجز' : 'Total Stay Amount'}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                {totalAmount.toLocaleString()} {currency}
              </span>
            </div>

            <div className="h-px bg-slate-200/80 dark:bg-white/10" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  {isArabic ? 'عدد المشتركين' : 'Number of People'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {isArabic ? `مقسم على ${splitCount} أفراد بالتساوي` : `Split equally between ${splitCount}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-white/15 p-1 shadow-xs shrink-0">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => {
                    if (splitCount > 2) {
                      setSplitCount((n) => n - 1)
                      if (paidCount >= splitCount) setPaidCount((n) => Math.max(1, n - 1))
                    }
                  }}
                  disabled={splitCount <= 2}
                  aria-label="Decrease split count"
                >
                  <span className="text-base leading-none">−</span>
                </button>
                <span className="w-8 text-center text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  {splitCount}
                </span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => setSplitCount((n) => Math.min(12, n + 1))}
                  disabled={splitCount >= 12}
                  aria-label="Increase split count"
                >
                  <span className="text-base leading-none">+</span>
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200/80 dark:bg-white/10" />

            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-3.5 py-2.5 sm:py-3">
              <div>
                <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-100 block">
                  {isArabic ? 'حصة كل فرد' : 'Share per person'}
                </span>
                <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
                  {isArabic ? 'شاملة كافة الرسوم والخدمات' : 'All inclusive'}
                </span>
              </div>
              <div className="text-end">
                <span className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {perPersonAmount.toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Tracker Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {isArabic ? `تم سداد ${paidCount} من ${splitCount} حصص` : `${paidCount} of ${splitCount} paid`}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] pt-0.5 text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
              <span className="text-emerald-700 dark:text-emerald-400">
                {isArabic ? `المحصّل: ${paidAmount.toLocaleString()} ${currency}` : `Collected: ${paidAmount.toLocaleString()} ${currency}`}
              </span>
              <span>
                {isArabic ? `المتبقي: ${remainingAmount.toLocaleString()} ${currency}` : `Remaining: ${remainingAmount.toLocaleString()} ${currency}`}
              </span>
            </div>
          </div>

          {/* Payment Methods Pill Selector */}
          <div className="space-y-2 pt-0.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {isArabic ? 'طرق الدفع المدعومة للحصص:' : 'Supported Payment Methods:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {localMethods.map((m) => {
                const isSelected = selectedMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] mb-1 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                      {m.icon}
                    </span>
                    <span className="text-xs font-bold leading-tight truncate w-full">{m.shortName}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate w-full">{m.badge}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* WhatsApp & Copy Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] px-4 text-xs sm:text-sm font-black text-white shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              <span>{isArabic ? 'إرسال عبر واتساب' : 'Share on WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer ${
                copied
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              <span>{copied ? (isArabic ? 'تم نسخ الرابط!' : 'Link Copied!') : (isArabic ? 'نسخ الرابط' : 'Copy Link')}</span>
            </button>
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              className="w-full sm:flex-1 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 text-xs sm:text-sm font-bold transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              onClick={handleSimulatePayment}
              disabled={paidCount >= splitCount}
            >
              {paidCount >= splitCount
                ? (isArabic ? 'اكتمل سداد الفاتورة ✓' : 'All shares completed ✓')
                : (isArabic ? 'محاكاة دفع حصة صديق' : 'Simulate friend payment')}
            </button>
            <button
              type="button"
              className="w-full sm:flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#00433f] to-[#0b5f59] hover:brightness-110 text-white text-xs sm:text-sm font-black shadow-md transition active:scale-95 cursor-pointer"
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
