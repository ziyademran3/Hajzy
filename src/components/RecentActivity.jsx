import React from 'react'
import { useTranslation } from 'react-i18next'
import Card from './Card'
import { FiChevronLeft } from 'react-icons/fi'
import { FALLBACK_STAY_PHOTO } from '../lib/dataService'

// RecentActivity component
// - uses t('dashboard.recentActivity') for heading
// - displays a list of activity cards (thumbnail, title, location, chevron)
// - shows empty state when no activities

const SAMPLE = [
  {
    id: 'a1',
    titleKey: 'activity.bookingConfirmed',
    titleDefault: 'حجز مؤكد — فيلا على البحر',
    location: 'الإسكندرية',
    thumbnail: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'a2',
    titleKey: 'activity.reviewLeft',
    titleDefault: 'مراجعة جديدة من ضيف',
    location: 'القاهرة',
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop',
  },
]

export default function RecentActivity({ activities = SAMPLE }) {
  const { t } = useTranslation()

  const heading = t('dashboard.recentActivity', { defaultValue: 'النشاط الأخير' })
  const emptyText = t('dashboard.noRecentActivity', { defaultValue: 'لا يوجد نشاط حديث' })

  if (!activities || activities.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{heading}</h3>
        </div>

        <div className="py-6">
          <div className="text-center text-gray-500">{emptyText}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{heading}</h3>
      </div>

      <div className="space-y-3">
        {activities.map((act) => (
          <Card key={act.id} variant="default" size="sm" className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={act.thumbnail || FALLBACK_STAY_PHOTO}
                  alt="thumb"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_STAY_PHOTO) {
                      e.currentTarget.src = FALLBACK_STAY_PHOTO
                    }
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {t(act.titleKey, { defaultValue: act.titleDefault })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-hajzy-muted truncate">{act.location}</div>
                  </div>

                  <div className="flex-none text-gray-400 ltr:ml-3 rtl:mr-3">
                    <FiChevronLeft size={18} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
