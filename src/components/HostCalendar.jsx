import React, { useState } from 'react'

export default function HostCalendar({
  language = 'ar',
  basePrice = 2800,
  currency = 'EGP',
  propertyTitle = 'Luxury Sea View Stay',
}) {
  const isArabic = language === 'ar'

  // Blocked dates set (day numbers in current month)
  const [blockedDays, setBlockedDays] = useState([4, 5, 18, 19])
  const [bookedDays] = useState([10, 11, 12, 24, 25, 26])
  const [weekendSurge, setWeekendSurge] = useState(15) // +15%
  const [selfCheckInCode, setSelfCheckInCode] = useState('8492#')
  const [copiedCode, setCopiedCode] = useState(false)

  // Current month days mock (30 days)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1)
  const weekdaysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekdays = isArabic ? weekdaysAr : weekdaysEn

  const toggleBlockDay = (day) => {
    if (bookedDays.includes(day)) return // Can't block already booked days
    setBlockedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const generateNewPasscode = () => {
    const newCode = `${Math.floor(1000 + Math.random() * 9000)}#`
    setSelfCheckInCode(newCode)
  }

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(selfCheckInCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="host-calendar-manager-card">
      <div className="calendar-manager-header">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 m-0">
            {isArabic ? 'تقويم التوافر والأسعار' : 'Availability & Pricing Calendar'}
          </h3>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {isArabic ? `إدارة مواعيد الحجز والأسعار لـ: ${propertyTitle}` : `Manage availability & rates for: ${propertyTitle}`}
          </p>
        </div>

        <div className="calendar-legend flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            {isArabic ? 'متاح' : 'Available'}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            {isArabic ? 'محجوز' : 'Booked'}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            {isArabic ? 'محظور / صيانة' : 'Blocked'}
          </span>
        </div>
      </div>

      <div className="calendar-month-grid mt-4">
        <div className="calendar-weekdays-row">
          {weekdays.map((dayName) => (
            <span key={dayName} className="weekday-title">
              {dayName}
            </span>
          ))}
        </div>

        <div className="calendar-days-grid">
          {daysInMonth.map((day) => {
            const isBooked = bookedDays.includes(day)
            const isBlocked = blockedDays.includes(day)
            const isWeekend = (day % 7 === 5) || (day % 7 === 6)
            const dailyPrice = isWeekend ? Math.round(basePrice * (1 + weekendSurge / 100)) : basePrice

            return (
              <button
                key={day}
                type="button"
                className={`calendar-day-cell ${isBooked ? 'booked' : isBlocked ? 'blocked' : 'available'} ${isWeekend ? 'weekend' : ''}`}
                onClick={() => toggleBlockDay(day)}
                title={
                  isBooked
                    ? (isArabic ? 'محجوز من ضيف' : 'Booked by guest')
                    : isBlocked
                    ? (isArabic ? 'اضغط لإلغاء الحظر' : 'Click to unblock')
                    : (isArabic ? 'اضغط لحظر اليوم' : 'Click to block date')
                }
              >
                <span className="day-number">{day}</span>
                <span className="day-price">
                  {isBlocked ? (isArabic ? 'مغلق' : 'Blocked') : `${dailyPrice.toLocaleString()}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="calendar-controls-row mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="control-tile p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {isArabic ? 'زيادة سعر عطلة نهاية الأسبوع (الخميس والجمعة)' : 'Weekend Rate Surge (Thu & Fri)'}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weekendSurge}
              onChange={(e) => setWeekendSurge(Number(e.target.value))}
              className="flex-1"
            />
            <strong className="text-emerald-700 dark:text-emerald-400 text-sm w-12 text-center">
              +{weekendSurge}%
            </strong>
          </div>
          <small className="text-[11px] text-slate-500 mt-1 block">
            {isArabic
              ? `السعر في الويك إند: ${Math.round(basePrice * (1 + weekendSurge / 100)).toLocaleString()} ${currency}`
              : `Weekend rate: ${Math.round(basePrice * (1 + weekendSurge / 100)).toLocaleString()} ${currency}`}
          </small>
        </div>

        <div className="control-tile p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {isArabic ? 'رمز القفل الذكي (الدخول الذاتي)' : 'Smart Lock Passcode (Self Check-in)'}
          </label>
          <div className="flex items-center gap-2">
            <div className="passcode-display flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
              <span>{selfCheckInCode}</span>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-800"
                onClick={handleCopyCode}
                title={isArabic ? 'نسخ الكود' : 'Copy code'}
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedCode ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <button
              type="button"
              className="secondary-button small-button text-xs py-1.5"
              onClick={generateNewPasscode}
            >
              {isArabic ? 'توليد كود جديد' : 'Generate'}
            </button>
          </div>
          <small className="text-[11px] text-slate-500 mt-1 block">
            {isArabic ? 'يتم إرسال هذا الكود تلقائياً للنزيل قبل موعد الوصول بـ 24 ساعة.' : 'Sent automatically to guest 24h prior to arrival.'}
          </small>
        </div>
      </div>
    </div>
  )
}
