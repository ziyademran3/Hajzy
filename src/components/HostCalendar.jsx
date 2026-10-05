import React, { useState } from 'react'
import { formatNumber, formatCurrency } from '../lib/formatters'
import { getBookedDaysForProperty } from '../lib/ownerBookingMetrics'

export default function HostCalendar({
  language = 'ar',
  basePrice = 2800,
  currency = 'EGP',
  propertyTitle = 'Luxury Sea View Stay',
  propertyId,
  bookings = [],
}) {
  const isArabic = language === 'ar'

  const [blockedDays, setBlockedDays] = useState([])
  const [weekendSurge, setWeekendSurge] = useState(15) // +15%
  const [selfCheckInCode, setSelfCheckInCode] = useState('8492#')
  const [copiedCode, setCopiedCode] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1)
  const bookedDays = getBookedDaysForProperty(bookings, propertyId, year, month)
  const leadingBlankDays = new Date(year, month, 1).getDay()
  const calendarCells = [
    ...Array.from({ length: leadingBlankDays }, (_, index) => ({ type: 'blank', key: `blank-${index}` })),
    ...daysInMonth.map((day) => ({ type: 'day', day })),
  ]
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

      {/* Mobile scroll indicator banner */}
      <div className="calendar-scroll-hint sm:hidden flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mt-3 mb-2">
        <span className="inline-flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">swipe</span>
          {isArabic ? 'اسحب الجدول أفقياً لعرض باقي الأيام' : 'Swipe horizontally to view all days'}
        </span>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
          {isArabic ? 'أحد ⟵ سبت' : 'Sun ⟶ Sat'}
        </span>
      </div>

      <div className="calendar-scroll-wrap">
        <div className="calendar-month-grid mt-1">
          <div className="calendar-weekdays-row">
            {weekdays.map((dayName) => (
              <span key={dayName} className="weekday-title">
                {dayName}
              </span>
            ))}
          </div>

          <div className="calendar-days-grid">
            {calendarCells.map((cell) => {
              if (cell.type === 'blank') {
                return <span key={cell.key} className="calendar-day-spacer" aria-hidden="true" />
              }
              const day = cell.day
              const isBooked = bookedDays.includes(day)
              const isBlocked = blockedDays.includes(day)
              const isWeekend = [4, 5].includes(new Date(year, month, day).getDay())
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
                    {isBlocked ? (isArabic ? 'مغلق' : 'Blocked') : formatNumber(dailyPrice)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="calendar-controls-row mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekend surge slider with clear min/max bounds and dynamic price breakdown */}
        <div className="control-tile p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isArabic ? 'زيادة سعر عطلة نهاية الأسبوع (الخميس والجمعة)' : 'Weekend Rate Surge (Thu & Fri)'}
            </label>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
              +{weekendSurge}%
            </span>
          </div>

          <div className="relative pt-1 pb-1">
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weekendSurge}
              onChange={(e) => setWeekendSurge(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              aria-label={isArabic ? 'نسبة زيادة عطلة نهاية الأسبوع' : 'Weekend surge percentage'}
            />
            {/* Min and Max bounds clearly visible at track edges */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-1">
              <span>0% ({isArabic ? 'سعر أساسي' : 'Base'})</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {isArabic ? `المحدد: +${weekendSurge}%` : `Selected: +${weekendSurge}%`}
              </span>
              <span>+50% ({isArabic ? 'الحد الأقصى' : 'Max'})</span>
            </div>
          </div>

          {/* Dynamic price breakdown */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-2 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span>{isArabic ? 'السعر في ليلة الويك إند:' : 'Weekend night rate:'}</span>
            <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
              {formatCurrency(Math.round(basePrice * (1 + weekendSurge / 100)), currency, language)}
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mr-1">
                ({isArabic ? `+${formatNumber(Math.round(basePrice * (weekendSurge / 100)))} زيادة` : `+${formatNumber(Math.round(basePrice * (weekendSurge / 100)))} surge`})
              </span>
            </strong>
          </div>
        </div>

        {/* Smart lock passcode with clear validity and status pill */}
        <div className="control-tile p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isArabic ? 'رمز القفل الذكي (الدخول الذاتي)' : 'Smart Lock Passcode (Self Check-in)'}
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isArabic ? 'نشط للنزيل القادم' : 'Active for next guest'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="passcode-display flex-1 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black text-lg tracking-widest text-emerald-700 dark:text-emerald-400 shadow-xs">
              <span>{selfCheckInCode}</span>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                onClick={handleCopyCode}
                title={isArabic ? 'نسخ الكود' : 'Copy code'}
                aria-label={isArabic ? 'نسخ رمز القفل' : 'Copy smart lock code'}
              >
                <span className="material-symbols-outlined text-base">
                  {copiedCode ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <button
              type="button"
              className="secondary-button small-button text-xs py-2 px-3 whitespace-nowrap inline-flex items-center gap-1"
              onClick={generateNewPasscode}
            >
              <span className="material-symbols-outlined text-xs">autorenew</span>
              <span>{isArabic ? 'توليد جديد' : 'Generate'}</span>
            </button>
          </div>

          {/* Direct Expiry Information linked to the code */}
          <div className="flex items-start gap-1.5 text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 mt-2">
            <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">event_available</span>
            <div className="flex-1 min-w-0">
              <strong className="block text-[11px] leading-snug font-bold">
                {isArabic ? 'صالح حتى: 30 سبتمبر 2026 - 12:00 ظهراً (موعد المغادرة)' : 'Valid until: Sep 30, 2026 - 12:00 PM (Check-out)'}
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {isArabic ? 'يُرسل للنزيل تلقائياً قبل الوصول بـ 24 ساعة ويُلغى تلقائياً عند المغادرة' : 'Auto-sent 24h prior to arrival and auto-expires at checkout'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
