import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FALLBACK_STAY_PHOTO, sanitizePhotoUrl } from '../lib/dataService'

export default function DashboardPage({
  user,
  bookings = [],
  properties = [],
  favorites = [],
  onNavigate,
  onLogout: _onLogout,
  language = 'ar',
  onSupportRequest,
}) {
  const { t } = useTranslation()
  const [activityFilter, setActivityFilter] = useState('all')
  const isAr = language === 'ar'

  const welcomeName = user?.name || user?.fullName || (isAr ? 'زياد' : 'Guest')

  // Financial calculations
  const totalSpend = bookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0)
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')
  const pendingBookings = bookings.filter((b) => b.status === 'pending')

  // Next upcoming stay
  const upcomingStay = bookings[0]
  const upcomingProperty = properties.find((item) => item.id === upcomingStay?.propertyId) || properties[0]

  // Filtered recent activity
  const filteredBookings = useMemo(() => {
    if (activityFilter === 'confirmed') return bookings.filter((b) => b.status === 'confirmed')
    if (activityFilter === 'pending') return bookings.filter((b) => b.status === 'pending')
    return bookings
  }, [bookings, activityFilter])

  // Curated properties recommendation (top 3)
  const curatedProperties = useMemo(() => {
    return properties.slice(0, 3)
  }, [properties])

  const currencyFormatter = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  })

  const dateFormatter = new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })

  // Quick Action Buttons
  const quickActions = [
    {
      key: 'explore',
      icon: 'travel_explore',
      label: isAr ? 'استكشاف الوجهات' : 'Explore Stays',
      desc: isAr ? 'تصفح الفيلات والشاليهات' : 'Browse luxury homes',
      color: 'from-emerald-500 to-teal-600',
      action: () => onNavigate('home'),
    },
    {
      key: 'bookings',
      icon: 'calendar_month',
      label: isAr ? 'حجوزاتي وتذاكري' : 'My Bookings',
      desc: isAr ? `${bookings.length} حجوزات مسجلة` : `${bookings.length} booked stays`,
      color: 'from-teal-600 to-cyan-600',
      action: () => onNavigate('bookings'),
    },
    {
      key: 'support',
      icon: 'support_agent',
      label: isAr ? 'كونسيرج ودعم 24/7' : '24/7 Concierge',
      desc: isAr ? 'فريق خدمة الضيوف الفوري' : 'Direct VIP assistance',
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
      desc: isAr ? 'إدارة بياناتك والمحفظة' : 'Manage account & wallet',
      color: 'from-slate-700 to-slate-800',
      action: () => onNavigate('profile'),
    },
    ...(user?.role === 'owner'
      ? [
          {
            key: 'owner',
            icon: 'add_home_work',
            label: isAr ? 'لوحة تحكم المالك' : 'Owner Dashboard',
            desc: isAr ? 'إدارة العقارات والحجوزات' : 'Manage properties & stays',
            color: 'from-amber-500 to-orange-600',
            action: () => onNavigate('owner'),
          },
        ]
      : []),
  ]

  return (
    <div className={`mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-200 ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* 1. CLEAN MINIMAL HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isAr ? `أهلاً بعودتك، ${welcomeName}` : `Welcome back, ${welcomeName}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'متابعة شاملة لحجوزاتك، إقاماتك القادمة، ومصروفاتك مع Hajzy'
              : 'Overview of your bookings, upcoming stays, and total spend with Hajzy'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">travel_explore</span>
          <span>{isAr ? 'استكشاف إقامة جديدة' : 'Explore New Stays'}</span>
        </button>
      </div>

      {/* 2. THREE CLEAN KPI STATS CARDS (No dummy reward card) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        {/* Active Bookings */}
        <div
          onClick={() => onNavigate('bookings')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'الحجوزات النشطة' : 'Active Stays'}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition dark:bg-emerald-950/60 dark:text-emerald-400">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{bookings.length}</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {confirmedBookings.length} {isAr ? 'مؤكد' : 'confirmed'}
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            {isAr ? 'اضغط لعرض وإدارة تذاكر الحجز' : 'Click to manage tickets'}
          </p>
        </div>

        {/* Total Spend */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي المدفوعات' : 'Total Spend'}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 group-hover:scale-110 transition dark:bg-teal-950/60 dark:text-teal-400">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {currencyFormatter.format(totalSpend || 0)}
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            {isAr ? 'سجل مدفوعاتك المؤكدة في التطبيق' : 'Total verified bookings'}
          </p>
        </div>

        {/* Saved Favorites */}
        <div
          onClick={() => onNavigate('home')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'المفضلة وقائمتي' : 'Saved Escapes'}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 transition dark:bg-rose-950/60 dark:text-rose-400">
              <span className="material-symbols-outlined text-2xl">favorite</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {favorites.length}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isAr ? 'عقار محفوظ' : 'saved'}</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            {isAr ? 'أماكن تتابعها لرحلتك القادمة' : 'Curated wish list'}
          </p>
        </div>
      </section>

      {/* 3. UPCOMING STAY SPOTLIGHT (Full Width, No Golden Guarantee Card) */}
      <section className="w-full">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">luggage</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'إقامتك القادمة المميزة' : 'Your Upcoming Stay'}
              </h2>
            </div>
            {upcomingStay && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {upcomingStay.status === 'confirmed'
                  ? (isAr ? 'مؤكدة وجاهزة' : 'Confirmed')
                  : (isAr ? 'قيد المراجعة' : 'Pending')}
              </span>
            )}
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
                <div className="absolute bottom-3 right-3 left-3 text-xs font-bold text-white">
                  📍 {upcomingProperty?.city || upcomingStay?.location || 'Egypt'}
                </div>
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
                      {upcomingStay?.checkIn ? dateFormatter.format(new Date(upcomingStay.checkIn)) : (isAr ? 'مرن' : 'Flexible')}
                    </div>
                  </div>
                  <div className="border-r border-l border-slate-200 dark:border-slate-700 px-3">
                    <div className="text-slate-400">{isAr ? 'تاريخ المغادرة' : 'Check-out'}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {upcomingStay?.checkOut ? dateFormatter.format(new Date(upcomingStay.checkOut)) : (isAr ? 'مرن' : 'Flexible')}
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>{isAr ? 'عرض الحجز والتذكرة' : 'View Booking Details'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('chat')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">chat</span>
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
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-emerald-500 hover:to-teal-500"
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
              {isAr ? 'الكل' : 'All'} ({bookings.length})
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
              const property = properties.find((item) => item.id === booking.propertyId)
              const rawTs = booking.updatedAt || booking.createdAt
              let timeLabel = ''
              if (rawTs) {
                const diff = Date.now() - new Date(rawTs).getTime()
                if (diff < 0) {
                  timeLabel = isAr ? 'الآن' : 'Just now'
                } else {
                  const mins = Math.floor(diff / (1000 * 60))
                  const hours = Math.floor(diff / (1000 * 60 * 60))
                  if (mins < 1) {
                    timeLabel = isAr ? 'الآن' : 'Just now'
                  } else if (mins < 60) {
                    timeLabel = isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`
                  } else if (hours < 24) {
                    timeLabel = isAr ? `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}` : `${hours}h ago`
                  } else {
                    timeLabel = dateFormatter.format(new Date(rawTs))
                  }
                }
              } else if (booking.checkIn) {
                timeLabel = dateFormatter.format(new Date(booking.checkIn))
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
                        {isAr
                          ? (property?.title || booking.title || 'إقامة عقار')
                          : (property?.titleEn || property?.title || booking.title || 'Property stay')}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-emerald-500">location_on</span>
                          {property?.city || booking.location || 'Egypt'}
                        </span>
                        {booking.checkIn && booking.checkOut && (
                          <>
                            <span>•</span>
                            <span>
                              {dateFormatter.format(new Date(booking.checkIn))} - {dateFormatter.format(new Date(booking.checkOut))}
                            </span>
                          </>
                        )}
                        {timeLabel && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{timeLabel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-end">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {currencyFormatter.format(booking.total || 1400)}
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
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
                  <div className="absolute top-3 right-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                    ⭐ {property.rating || '4.95'}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white">
                    📍 {property.city || property.location || 'Egypt'}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition dark:text-white dark:group-hover:text-emerald-400 line-clamp-1">
                    {isAr ? property.title : (property.titleEn || property.title)}
                  </h4>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {currencyFormatter.format(property.priceValue || 2500)}
                      </span>
                      <span className="text-[11px] text-slate-400"> / {isAr ? 'ليلة' : 'night'}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 group-hover:bg-emerald-600 group-hover:text-white transition dark:bg-slate-800 dark:text-slate-300">
                      <span>{isAr ? 'حجز' : 'Book'}</span>
                      <span className="material-symbols-outlined text-xs">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
                    </span>
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
