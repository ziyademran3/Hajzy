import { useTranslation } from 'react-i18next'

export default function DashboardPage({ user, bookings = [], properties = [], onNavigate, onLogout: _onLogout, language = 'ar', onSupportRequest }) {
  const { t } = useTranslation()
  const totalSpend = bookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0)
  const upcomingStay = bookings[0]
  const featuredProperty = properties.find((item) => item.id === upcomingStay?.propertyId) || properties[0]

  const stats = [
    {
    label: t('dashboard.statsBookings'),
      value: String(bookings.length || 0),
    detail: t('dashboard.activeStays'),
      tone: 'emerald',
      icon: 'calendar_month',
    },
    {
    label: t('dashboard.statsFavorites'),
      value: String(Math.min(12, properties.length || 0)),
    detail: t('dashboard.savedHomes'),
      tone: 'sky',
      icon: 'favorite',
    },
    {
    label: t('dashboard.statsSpending'),
      value:
        language === 'en'
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(totalSpend || 1400)
          : new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(totalSpend || 1400),
    detail: t('dashboard.thisYear'),
      tone: 'amber',
      icon: 'payments',
    },

  ]

  const recentBookings = bookings.slice(0, 3)
  const welcomeName = user?.name || user?.fullName || (language === 'en' ? 'Welcome back' : 'أهلاً بيك')

  const quickActions = [
    {
      key: 'support',
      icon: 'support_agent',
      label: t('quickActions.support'),
      action: () => {
        if (typeof onSupportRequest === 'function') {
          onSupportRequest()
          return
        }
        window.location.href = 'mailto:support@hajzy.com?subject=Support%20Request'
      },
    },
    {
      key: 'discover',
      icon: 'travel_explore',
      label: t('quickActions.discover'),
      action: () => onNavigate('home'),
    },

    ...(user?.role === 'owner'
      ? [
          {
            key: 'owner',
            icon: 'add_home_work',
            label: t('addProperty'),
            action: () => onNavigate('owner'),
          },
        ]
      : []),
  ]

  const dateFormatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-EG', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="dashboard-shell page-shell">
      <div className="page-header-block">
          <h2 className="page-title-main">{language === 'en' ? 'Overview' : 'نظرة عامة'}</h2>
      </div>

      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-chip">Hajzy</div>
          <p className="eyebrow">{t('welcomeBack', { defaultValue: language === 'en' ? 'Welcome back' : 'مرحبًا بعودتك' })}</p>
          <h2>{welcomeName}</h2>
        </div>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card summary-primary">
            <div className="summary-label">{t('upcomingStay', { defaultValue: language === 'en' ? 'UPCOMINGSTAY' : 'إقامتك القادمة' })}</div>
          <div className="summary-title">
            {language === 'en'
              ? (featuredProperty?.titleEn || featuredProperty?.title || upcomingStay?.title || 'Curated stay')
              : (featuredProperty?.title || upcomingStay?.title || 'إقامة مختارة')}
          </div>
          <div className="summary-meta">
            <span className="material-symbols-outlined">location_on</span>
            {language === 'en'
              ? (featuredProperty?.locationEn || featuredProperty?.location || upcomingStay?.location || 'Your city escape')
              : (featuredProperty?.location || upcomingStay?.location || 'موقعك المفضل')}
          </div>
          <div className="summary-meta">
            <span className="material-symbols-outlined">date_range</span>
            {upcomingStay?.checkIn && upcomingStay?.checkOut
              ? `${dateFormatter.format(new Date(upcomingStay.checkIn))} - ${dateFormatter.format(new Date(upcomingStay.checkOut))}`
              : language === 'en'
                ? 'Flexible dates'
                : 'تواريخ مرنة'}
          </div>
        </div>

        <div className="summary-card summary-secondary">
          <div className="summary-label">{language === 'en' ? 'Explore more' : 'اكتشف المزيد'}</div>
          <div className="summary-title">{language === 'en' ? 'New coastal escapes' : 'وجهات ساحلية جديدة'}</div>
          <div className="summary-points">
            <span>{language === 'en' ? 'Beach stays' : 'إقامات بحرية'}</span>
            <span>{language === 'en' ? 'Private villas' : 'فيلا خاصة'}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.tone}`}>
            <div className="stat-icon-wrap">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>{t('dashboard.quickActions')}</h3>
        </div>

        <div className="quick-actions">
          {quickActions.map(({ key, icon, label, action }) => (
            <button key={key} type="button" className="quick-button" onClick={action}>
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h3>{t('dashboard.recentActivity')}</h3>
        </div>

        {recentBookings.length ? (
          <div className="activity-list">
            {recentBookings.map((booking) => {
              const property = properties.find((item) => item.id === booking.propertyId)
              // compute a friendly time label: minutes/hours ago for recent activity, otherwise a short date
              const ts = booking.updatedAt || booking.createdAt || booking.checkIn || booking.createdAt
              let timeLabel = ''
              if (ts) {
                const diff = Date.now() - new Date(ts).getTime()
                const mins = Math.floor(diff / (1000 * 60))
                const hours = Math.floor(diff / (1000 * 60 * 60))
                if (mins < 60) {
                  timeLabel = language === 'en' ? `${mins}m ago` : `منذ ${mins} دقيقة`
                } else if (hours < 24) {
                  timeLabel = language === 'en' ? `${hours}h ago` : `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
                } else {
                  timeLabel = dateFormatter.format(new Date(ts))
                }
              } else {
                timeLabel = language === 'en' ? 'Unknown time' : 'وقت غير معروف'
              }

              return (
                <div key={booking.id} className="activity-item">
                  {property?.image && <img className="activity-thumb" src={property.image} alt={property.title || 'Property'} />}
                  <div className="activity-copy">
                    <strong>{language === 'en' ? (property?.titleEn || property?.title || booking.title || 'Property stay') : (property?.title || booking.title || 'إقامة عقار')}</strong>
                    <span>{booking.status === 'confirmed' ? (language === 'en' ? 'Confirmed' : 'مؤكد') : (language === 'en' ? 'Pending review' : 'قيد المراجعة')}</span>
                    <small className="activity-time">{timeLabel}</small>
                  </div>
                  <button type="button" className="activity-view-button" onClick={() => onNavigate('bookings')} aria-label={language === 'en' ? 'View booking' : 'عرض الحجز'}>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-inline">
            {t('noBookingsYet', { defaultValue: language === 'en' ? 'No bookings yet' : 'لا توجد حجوزات بعد' })}
          </div>
        )}
      </section>
    </div>
  )
}
