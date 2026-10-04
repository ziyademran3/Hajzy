import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FALLBACK_STAY_PHOTO,
  sanitizePhotoUrl,
  getSafeBookings,
  normalizeBookingStatus,
  calculateBookingPricing,
} from '../lib/dataService'
import { formatCurrency, formatNumber, formatDate, pluralize } from '../lib/formatters'
import PropertyLocation from '../components/PropertyLocation'
import PropertyPrice from '../components/PropertyPrice'
import PropertyRating from '../components/PropertyRating'

export default function DashboardPage({
  user,
  bookings = [],
  properties = [],
  favorites = [],
  onNavigate = () => {},
  onLogout: _onLogout,
  language = 'ar',
  onSupportRequest,
}) {
  const { t } = useTranslation()
  const [activityFilter, setActivityFilter] = useState('all')
  const isAr = language === 'ar'

  const welcomeName = user?.name || user?.fullName || (isAr ? 'زياد' : 'Guest')

  // Dynamic time-based greeting
  const greetingData = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return {
        text: isAr ? `صباح الخير، ${welcomeName}` : `Good morning, ${welcomeName}`,
        sub: isAr ? 'يوم مميز للتخطيط لعطلتك القادمة على سواحل مصر' : 'A wonderful day to plan your next coastal getaway',
        icon: 'sunny',
        iconColor: 'text-amber-500',
      }
    }
    if (hour >= 12 && hour < 18) {
      return {
        text: isAr ? `مساء الخير، ${welcomeName}` : `Good afternoon, ${welcomeName}`,
        sub: isAr ? 'متابعة شاملة لحجوزاتك، إقاماتك القادمة، ومصروفاتك مع Hajzy' : 'Overview of your bookings, upcoming stays, and total spend with Hajzy',
        icon: 'wb_twilight',
        iconColor: 'text-orange-500',
      }
    }
    return {
      text: isAr ? `أهلاً بعودتك، ${welcomeName}` : `Welcome back, ${welcomeName}`,
      sub: isAr ? 'ليلة هادئة — استعرض أفضل العروض والإقامات الفاخرة' : 'Peaceful evening — explore exclusive retreats and stays',
      icon: 'bedtime',
      iconColor: 'text-indigo-400',
    }
  }, [isAr, welcomeName])

  // Single source of truth for bookings
  const safeBookings = useMemo(() => {
    return getSafeBookings(bookings)
  }, [bookings])

  const confirmedBookings = useMemo(() => {
    return safeBookings.filter((b) => normalizeBookingStatus(b.status) === 'confirmed')
  }, [safeBookings])

  const upcomingBookings = useMemo(() => {
    const now = new Date()
    return safeBookings.filter((b) => {
      const s = normalizeBookingStatus(b?.status)
      const co = new Date(b?.checkOut || b?.checkIn || now)
      return s !== 'cancelled' && !Number.isNaN(co.getTime()) && co >= now
    })
  }, [safeBookings])

  const pendingBookings = useMemo(() => {
    return safeBookings.filter((b) => normalizeBookingStatus(b.status) === 'pending')
  }, [safeBookings])

  // Accurate financial calculation using calculateBookingPricing
  const getBookingTotal = (booking) => {
    const property = properties.find((item) => String(item.id) === String(booking.propertyId))
    const checkInVal = booking.checkIn || ''
    const checkOutVal = booking.checkOut || booking.checkIn || ''
    const nights = (checkInVal && checkOutVal && !isNaN(new Date(checkInVal)) && !isNaN(new Date(checkOutVal)))
      ? Math.max(1, Math.round((new Date(checkOutVal) - new Date(checkInVal)) / (1000 * 60 * 60 * 24)))
      : (booking.nights || 1)

    const pricing = calculateBookingPricing({
      pricePerNight: booking.pricePerNight || property?.priceValue,
      nights,
      discountAmount: booking.discountAmount,
      serviceFee: booking.serviceFee,
      total: booking.total,
    })
    return pricing.total
  }

  const confirmedSpend = useMemo(() => {
    return confirmedBookings.reduce((sum, booking) => sum + getBookingTotal(booking), 0)
  }, [confirmedBookings, properties])

  const pendingSpend = useMemo(() => {
    return pendingBookings.reduce((sum, booking) => sum + getBookingTotal(booking), 0)
  }, [pendingBookings, properties])

  const totalAllBookingsSpend = confirmedSpend + pendingSpend
  const totalSpend = confirmedSpend

  // Loyalty Points & Club Tier
  // 1 point per 1000 EGP spent — based on confirmed bookings
  const loyaltyPoints = useMemo(() => {
    return Math.floor(confirmedSpend / 1000)
  }, [confirmedSpend])

  const loyaltyTier = useMemo(() => {
    if (loyaltyPoints >= 250) return { name: isAr ? 'بلاتينيوم' : 'Platinum', color: 'from-indigo-500 to-purple-600', badge: '💎 VIP', next: null, pointsToNext: 0 }
    if (loyaltyPoints >= 80) return { name: isAr ? 'ذهبي' : 'Gold', color: 'from-amber-400 to-amber-600', badge: '🥇', next: isAr ? 'بلاتينيوم' : 'Platinum', pointsToNext: 250 - loyaltyPoints }
    if (loyaltyPoints >= 20) return { name: isAr ? 'فضي' : 'Silver', color: 'from-slate-400 to-slate-500', badge: '🥈', next: isAr ? 'ذهبي' : 'Gold', pointsToNext: 80 - loyaltyPoints }
    return { name: isAr ? 'عضو جديد' : 'New Member', color: 'from-emerald-500 to-teal-600', badge: '🌱', next: isAr ? 'فضي' : 'Silver', pointsToNext: 20 - loyaltyPoints }
  }, [loyaltyPoints, isAr])

  // Next upcoming stay (prioritize active confirmed upcoming stay)
  const upcomingStay = upcomingBookings[0] || confirmedBookings[0] || safeBookings[0]
  const upcomingProperty = properties.find((item) => item.id === upcomingStay?.propertyId) || properties[0]

  // Countdown to next stay
  const countdownDays = useMemo(() => {
    if (!upcomingStay?.checkIn) return null
    const checkInDate = new Date(upcomingStay.checkIn)
    if (isNaN(checkInDate.getTime())) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkInDate.setHours(0, 0, 0, 0)
    const diffTime = checkInDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [upcomingStay])

  // Filtered recent activity
  const filteredBookings = useMemo(() => {
    if (activityFilter === 'confirmed') return confirmedBookings
    if (activityFilter === 'pending') return pendingBookings
    return safeBookings
  }, [safeBookings, confirmedBookings, pendingBookings, activityFilter])

  // Curated properties recommendation (top 3)
  const curatedProperties = useMemo(() => {
    return Array.isArray(properties) ? properties.slice(0, 3) : []
  }, [properties])

  const safeFormatDate = (val) => {
    if (!val) return ''
    return formatDate(val, language, { day: 'numeric', month: 'short' })
  }

  const currencyFormatter = useMemo(() => ({
    format: (amount) => formatCurrency(amount, 'EGP', language),
  }), [language])

  // Quick Action Buttons
  const quickActions = [
    {
      key: 'explore',
      icon: 'travel_explore',
      label: isAr ? 'استكشف الإقامات' : 'Explore Stays',
      desc: isAr ? 'فيلات وشاليهات فاخرة' : 'Browse luxury homes',
      color: 'from-emerald-500 to-teal-600',
      action: () => onNavigate('home'),
    },
    {
      key: 'bookings',
      icon: 'calendar_month',
      label: isAr ? 'حجوزاتي وتذاكري' : 'My Bookings',
      desc: isAr
        ? `${formatNumber(upcomingBookings.length || confirmedBookings.length)} ${(upcomingBookings.length || confirmedBookings.length) === 1 ? 'حجز مسجل' : 'حجوزات مسجلة'}`
        : `${formatNumber(upcomingBookings.length || confirmedBookings.length)} booked stays`,
      color: 'from-teal-600 to-cyan-600',
      action: () => onNavigate('bookings'),
    },
    {
      key: 'support',
      icon: 'support_agent',
      label: isAr ? 'كونسيرج 24/7' : '24/7 Concierge',
      desc: isAr ? 'خدمة الضيوف الفورية' : 'Direct VIP assistance',
      color: 'from-cyan-600 to-blue-600',
      action: () => {
        if (typeof onSupportRequest === 'function') {
          onSupportRequest()
          return
        }
        if (typeof onNavigate === 'function') {
          onNavigate('chat')
          return
        }
        window.location.href = 'mailto:support@hajzy.com?subject=Concierge%20Support'
      },
    },
    {
      key: 'profile',
      icon: 'manage_accounts',
      label: isAr ? 'الملف الشخصي' : 'Profile & Security',
      desc: isAr ? 'المحفظة والأمان' : 'Account & wallet',
      color: 'from-slate-700 to-slate-800',
      action: () => onNavigate('profile'),
    },
    ...(user?.role === 'owner'
      ? [
          {
            key: 'owner',
            icon: 'add_home_work',
            label: isAr ? 'لوحة المالك' : 'Owner Dashboard',
            desc: isAr ? 'إدارة العقارات' : 'Manage stays',
            color: 'from-amber-500 to-orange-600',
            action: () => onNavigate('owner'),
          },
        ]
      : []),
  ]

  return (
    <div className={`mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-200 ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* 1. DYNAMIC HEADER WITH TIME GREETING */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-2xl ${greetingData.iconColor}`}>
              {greetingData.icon}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {greetingData.text}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {greetingData.sub}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="primary-button"
          >
            <span className="material-symbols-outlined text-base">travel_explore</span>
            <span>{isAr ? 'استكشف الإقامات' : 'Explore Stays'}</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR LUXURY KPI STATS CARDS (Including Hajzy Club Loyalty) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Active Bookings */}
        <div
          onClick={() => onNavigate('bookings')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'الحجوزات النشطة' : 'Active Stays'}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition dark:bg-emerald-950/60 dark:text-emerald-400">
              <span className="material-symbols-outlined text-xl">calendar_month</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(upcomingBookings.length || confirmedBookings.length)}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {formatNumber(confirmedBookings.length)} {isAr ? 'مؤكد' : 'Confirmed'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {isAr ? 'عرض تذاكر الحجز' : 'Manage tickets'}
          </p>
        </div>

        {/* Total Spend + Breakdown */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي المدفوعات' : 'Total Spend'}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 group-hover:scale-110 transition dark:bg-teal-950/60 dark:text-teal-400">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(confirmedSpend, 'EGP', language)}
            </span>
          </div>
          {pendingSpend > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                {isAr ? 'مؤكد' : 'Confirmed'}: {formatCurrency(confirmedSpend, 'EGP', language)}
              </span>
              <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                {isAr ? 'قيد المراجعة' : 'Pending'}: {formatCurrency(pendingSpend, 'EGP', language)}
              </span>
              <span className="text-slate-400 font-medium">
                ({isAr ? 'المجموع' : 'Total'}: {formatCurrency(totalAllBookingsSpend, 'EGP', language)})
              </span>
            </div>
          ) : (
            <div className="mt-2 flex items-end gap-1 h-3" title={isAr ? 'نشاط الإنفاق' : 'Spend activity'}>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-200 dark:bg-teal-900" />
              <div className="w-1.5 h-2.5 rounded-full bg-teal-300 dark:bg-teal-800" />
              <div className="w-1.5 h-2 rounded-full bg-teal-400 dark:bg-teal-700" />
              <div className="w-1.5 h-3 rounded-full bg-teal-500" />
              <span className="text-[10px] text-slate-400 font-mono ms-1">{confirmedBookings.length ? (isAr ? 'نشط' : 'active') : '0'}</span>
            </div>
          )}
        </div>

        {/* Saved Favorites */}
        <div
          onClick={() => onNavigate('home')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'المفضلة' : 'Saved Escapes'}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 transition dark:bg-rose-950/60 dark:text-rose-400">
              <span className="material-symbols-outlined text-xl">favorite</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatNumber(favorites.length)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'مكان' : 'saved'}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {isAr ? 'أماكن تتابعها' : 'Curated wish list'}
          </p>
        </div>

        {/* Hajzy Club / Loyalty Points */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              {isAr ? 'نادي Hajzy' : 'Hajzy Club'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400">
              <span className="material-symbols-outlined text-lg">workspace_premium</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{formatNumber(loyaltyPoints)}</span>
            <span className="text-[11px] text-slate-300 font-bold">{isAr ? pluralize(loyaltyPoints, 'point', 'ar').replace(/^[\d,٫٬\s]+/, '') : 'pts'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-semibold text-white">{loyaltyTier.name} {loyaltyTier.badge}</span>
          </div>
          {loyaltyTier.next && (
            <div className="mt-2 text-[10px] text-slate-400">
              {isAr
                ? `${pluralize(loyaltyTier.pointsToNext, 'point', 'ar')} للوصول لمستوى ${loyaltyTier.next}`
                : `${formatNumber(loyaltyTier.pointsToNext)} pts to reach ${loyaltyTier.next}`}
            </div>
          )}
          <div className="mt-2 text-[9px] text-slate-500">
            {isAr ? 'اكسب نقطة لكل 1000 ج.م تحجز بيها' : 'Earn 1 pt per 1,000 EGP spent'}
          </div>
        </div>
      </section>

      {/* 3. UPCOMING STAY SPOTLIGHT WITH COUNTDOWN */}
      <section className="w-full">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">luggage</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'إقامتك القادمة المميزة' : 'Your Upcoming Stay'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {countdownDays !== null && countdownDays >= 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>
                    {countdownDays === 0
                      ? (isAr ? 'موعد الوصول اليوم!' : 'Check-in today!')
                      : (isAr ? `متبقي ${countdownDays} ${countdownDays === 1 ? 'يوم' : countdownDays === 2 ? 'يومان' : 'أيام'}` : `${countdownDays} days to go`)}
                  </span>
                </span>
              )}
              {upcomingStay && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {upcomingStay.status === 'confirmed'
                    ? (isAr ? 'مؤكدة وجاهزة' : 'Confirmed')
                    : (isAr ? 'قيد المراجعة' : 'Pending')}
                </span>
              )}
            </div>
          </div>

          {upcomingStay ? (
            <div className="mt-5 grid gap-6 md:grid-cols-12 md:items-center">
              <div className="md:col-span-5 relative h-52 overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={sanitizePhotoUrl(upcomingProperty?.image || upcomingStay?.image || FALLBACK_STAY_PHOTO)}
                  alt={upcomingProperty?.title || 'Upcoming Stay'}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_STAY_PHOTO) {
                      e.currentTarget.src = FALLBACK_STAY_PHOTO
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <PropertyLocation className="property-location-display--overlay text-xs font-bold">
                  {upcomingProperty?.city || upcomingStay?.location || 'Egypt'}
                </PropertyLocation>
              </div>

              <div className="md:col-span-7 space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {isAr
                    ? (upcomingProperty?.title || upcomingStay?.title || 'إقامة فاخرة')
                    : (upcomingProperty?.titleEn || upcomingStay?.title || 'Luxury Retreat')}
                </h3>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">location_on</span>
                  <span>{upcomingProperty?.location || upcomingStay?.location || (isAr ? 'موقع مميز' : 'Prime Location')}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                  <div>
                    <div className="text-slate-400">{isAr ? 'تاريخ الوصول' : 'Check-in'}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {upcomingStay?.checkIn ? safeFormatDate(upcomingStay.checkIn) : (isAr ? 'مرن' : 'Flexible')}
                    </div>
                  </div>
                  <div className="border-r border-l border-slate-200 dark:border-slate-700 px-3">
                    <div className="text-slate-400">{isAr ? 'تاريخ المغادرة' : 'Check-out'}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {upcomingStay?.checkOut ? safeFormatDate(upcomingStay.checkOut) : (isAr ? 'مرن' : 'Flexible')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">{isAr ? 'الضيوف' : 'Guests'}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {upcomingStay?.guests || 2} {isAr ? 'أشخاص' : 'guests'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('bookings')}
                    className="primary-button"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>{isAr ? 'عرض الحجز والتذكرة' : 'View Booking Details'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('chat')}
                    className="secondary-button"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    <span>{isAr ? 'التواصل مع المضيف' : 'Contact Host'}</span>
                  </button>
                  {upcomingProperty && (
                    <button
                      type="button"
                      onClick={() => onNavigate('details', upcomingProperty)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      <span>{isAr ? 'صفحة العقار' : 'Property Info'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <span className="material-symbols-outlined text-3xl">travel_explore</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'لا توجد حجوزات نشطة حالياً' : 'No upcoming bookings yet'}
              </h3>
              <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'هل تخطط لعطلتك القادمة؟ تصفح مجموعتنا الفاخرة من الشاليهات والفيلات الساحلية بأفضل الأسعار.'
                  : 'Planning your next getaway? Discover our curated luxury villas and coastal chalets with instant confirmation.'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="primary-button mt-5"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>{isAr ? 'تصفح الإقامات الآن' : 'Browse Stays Now'}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. QUICK ACTIONS GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isAr ? 'الإجراءات والخدمات السريعة' : 'Quick Actions'}
          </h2>
          <span className="text-xs text-slate-400">{isAr ? 'خدمات الضيف الذكية' : 'Guest shortcuts'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {quickActions.map(({ key, icon, label, desc, color, action }) => (
            <button
              key={key}
              type="button"
              onClick={action}
              className="group flex flex-col items-start rounded-3xl border border-slate-200/80 bg-white p-5 text-start shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition group-hover:scale-110`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
              </div>
              <strong className="mt-4 block text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition dark:text-white dark:group-hover:text-emerald-400">
                {label}
              </strong>
              <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {desc}
              </small>
            </button>
          ))}
        </div>
      </section>

      {/* 5. RECENT ACTIVITY STREAM */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isAr ? 'النشاط الأخير وسجل الحجوزات' : 'Recent Bookings & Activity'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'سجل متابعة الحجوزات الخاصة بك وتحديثات حالتها' : 'Track your bookings and recent confirmations'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActivityFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${activityFilter === 'all' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              {isAr ? 'الكل' : 'All'} ({safeBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('confirmed')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${activityFilter === 'confirmed' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              {isAr ? 'المؤكدة' : 'Confirmed'} ({confirmedBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActivityFilter('pending')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${activityFilter === 'pending' ? 'bg-white text-amber-700 shadow-sm dark:bg-slate-700 dark:text-amber-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              {isAr ? 'قيد الانتظار' : 'Pending'} ({pendingBookings.length})
            </button>
          </div>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBookings.map((booking) => {
              const property = properties.find((item) => {
                const pId = String(item.id || '').trim()
                const bPropId = String(booking.propertyId || booking.property_id || '').trim()
                if (bPropId && pId === bPropId) return true
                if (booking.title && (item.title === booking.title || item.titleEn === booking.title)) return true
                return false
              })

              const rawTs = booking.updatedAt || booking.createdAt
              let timeLabel = ''
              if (rawTs) {
                const diff = Date.now() - new Date(rawTs).getTime()
                if (!isNaN(diff) && diff >= 0) {
                  const mins = Math.floor(diff / (1000 * 60))
                  const hours = Math.floor(diff / (1000 * 60 * 60))
                  if (mins < 1) {
                    timeLabel = isAr ? 'الآن' : 'Just now'
                  } else if (mins < 60) {
                    timeLabel = isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`
                  } else if (hours < 24) {
                    timeLabel = isAr ? `منذ ${pluralize(hours, 'hour', 'ar')}` : `${hours}h ago`
                  }
                }
              }

              const checkInVal = booking.checkIn || ''
              const checkOutVal = booking.checkOut || ''
              const nights = (checkInVal && checkOutVal && !isNaN(new Date(checkInVal)) && !isNaN(new Date(checkOutVal)))
                ? Math.max(1, Math.round((new Date(checkOutVal) - new Date(checkInVal)) / (1000 * 60 * 60 * 24)))
                : (booking.nights || 1)

              const pricing = calculateBookingPricing({
                pricePerNight: booking.pricePerNight || property?.priceValue,
                nights,
                discountAmount: booking.discountAmount,
                serviceFee: booking.serviceFee,
                total: booking.total,
              })

              // Resolve Title with clear localized fallback
              const fallbackTitle = isAr
                ? t('common.unnamedStay', { defaultValue: 'إقامة محجوزة' })
                : t('common.unnamedStay', { defaultValue: 'Reserved stay' })

              const displayTitle = isAr
                ? (property?.title || booking.title || booking.titleAr || booking.propertyTitle || fallbackTitle)
                : (property?.titleEn || property?.title || booking.titleEn || booking.title || fallbackTitle)

              // Resolve City/Location with clear localized fallback
              const fallbackLocation = isAr
                ? t('common.locationUnspecified', { defaultValue: 'الموقع غير محدد' })
                : t('common.locationUnspecified', { defaultValue: 'Location unspecified' })

              let displayLocation = ''
              if (isAr) {
                if (property?.city) {
                  displayLocation = property.city
                } else if (property?.neighborhood) {
                  displayLocation = property.neighborhood
                } else if (booking.city) {
                  displayLocation = booking.city
                } else if (booking.location) {
                  const locLower = String(booking.location).trim().toLowerCase()
                  displayLocation = locLower === 'egypt' ? 'مصر' : booking.location
                } else {
                  displayLocation = fallbackLocation
                }
              } else {
                if (property?.cityEn) {
                  displayLocation = property.cityEn
                } else if (property?.city) {
                  displayLocation = property.city
                } else if (property?.neighborhood) {
                  displayLocation = property.neighborhood
                } else if (booking.cityEn) {
                  displayLocation = booking.cityEn
                } else if (booking.city) {
                  displayLocation = booking.city
                } else if (booking.location) {
                  displayLocation = booking.location
                } else {
                  displayLocation = fallbackLocation
                }
              }

              // Stay date range displayed once
              let dateRangeText = ''
              if (checkInVal && checkOutVal) {
                const inStr = safeFormatDate(checkInVal)
                const outStr = safeFormatDate(checkOutVal)
                if (inStr && outStr) {
                  dateRangeText = `${inStr} – ${outStr}`
                } else {
                  dateRangeText = inStr || outStr
                }
              } else if (checkInVal) {
                dateRangeText = safeFormatDate(checkInVal)
              } else if (checkOutVal) {
                dateRangeText = safeFormatDate(checkOutVal)
              }

              // Assemble metadata items to guarantee no dangling bullets
              const metaItems = []
              if (displayLocation) {
                metaItems.push({ text: displayLocation, isLocation: true })
              }
              if (dateRangeText) {
                metaItems.push({ text: dateRangeText })
              }
              if (timeLabel) {
                metaItems.push({ text: timeLabel, isMuted: true })
              }

              return (
                <div
                  key={booking.id}
                  className="group flex flex-col gap-4 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between rounded-2xl px-2"
                >
                  <div className="flex items-center gap-4">
                    <img
                      className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm"
                      src={sanitizePhotoUrl(property?.image || booking.image || FALLBACK_STAY_PHOTO)}
                      alt={property?.title || booking.title || 'Property'}
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_STAY_PHOTO) {
                          e.currentTarget.src = FALLBACK_STAY_PHOTO
                        }
                      }}
                    />
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition dark:text-white dark:group-hover:text-emerald-400">
                        {displayTitle}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {metaItems.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            {idx > 0 && <span className="text-slate-300 dark:text-slate-600 select-none">•</span>}
                            {item.isLocation && (
                              <span className="material-symbols-outlined text-xs text-emerald-500">location_on</span>
                            )}
                            <span className={item.isMuted ? 'text-slate-400' : ''}>{item.text}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-end">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(pricing.total, booking.currency || property?.currency || 'EGP', language)}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {formatCurrency(pricing.pricePerNight, booking.currency || property?.currency || 'EGP', language)} × {pluralize(pricing.nights, 'night', language)}
                        {pricing.serviceFee > 0 && ` + ${formatCurrency(pricing.serviceFee, booking.currency || property?.currency || 'EGP', language)} ${isAr ? 'رسوم' : 'fees'}`}
                        {pricing.discountAmount > 0 && ` - ${formatCurrency(pricing.discountAmount, booking.currency || property?.currency || 'EGP', language)} ${isAr ? 'خصم' : 'discount'}`}
                      </div>
                      <span
                        className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {booking.status === 'confirmed'
                          ? (isAr ? 'مؤكد' : 'Confirmed')
                          : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('bookings')}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      aria-label={isAr ? 'عرض الحجز' : 'View booking'}
                    >
                      <span className="material-symbols-outlined text-lg">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <span className="material-symbols-outlined text-2xl">inbox</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'لا توجد عناصر في هذا الفلتر' : 'No records match this filter'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {isAr ? 'جرب اختيار تصنيف آخر أو قم بحجز إقامة جديدة' : 'Try switching tabs or book a new destination'}
            </p>
          </div>
        )}
      </section>

      {/* 6. CURATED RECOMMENDED DESTINATIONS */}
      {curatedProperties.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {isAr ? 'وجهات مميزة مقترحة لك' : 'Handpicked For You'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'مختارة بعناية لأعلى تقييمات الضيوف والخدمات الفاخرة' : 'Top guest favorites and luxury beach escapes'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="ghost-button"
            >
              <span>{isAr ? 'عرض كل العقارات' : 'View all'}</span>
              <span className="material-symbols-outlined text-sm">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {curatedProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => onNavigate('details', property)}
                className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={sanitizePhotoUrl(property.image || FALLBACK_STAY_PHOTO)}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      if (e.currentTarget.src !== FALLBACK_STAY_PHOTO) {
                        e.currentTarget.src = FALLBACK_STAY_PHOTO
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <PropertyRating
                    rating={property.rating || 4.95}
                    reviews={property.reviews}
                    language={language}
                    placement="overlay-top-end"
                  />
                  <PropertyLocation className="property-location-display--overlay text-xs font-semibold">
                    {property.city || property.location || 'Egypt'}
                  </PropertyLocation>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition dark:text-white dark:group-hover:text-emerald-400 line-clamp-1">
                    {isAr ? property.title : (property.titleEn || property.title)}
                  </h4>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <PropertyPrice amount={property.priceValue || 2500} currency={property.currency || 'EGP'} language={language} />
                    </div>

                    <button
                      type="button"
                      className="primary-button small-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onNavigate('details', property)
                      }}
                    >
                      <span>{isAr ? 'احجز الآن' : 'Book now'}</span>
                      <span className="material-symbols-outlined text-xs">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
