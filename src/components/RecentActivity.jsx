import React from 'react'
import { useTranslation } from 'react-i18next'
import Card from './Card'
import { FiChevronLeft } from 'react-icons/fi'

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
    thumbnail: 'https://images.unsplash.com/photo-1505691723518-36a5a4b9b8b9?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
  },
  {
    id: 'a2',
    titleKey: 'activity.reviewLeft',
    titleDefault: 'مراجعة جديدة من ضيف',
    location: 'القاهرة',
    thumbnail: 'https://images.unsplash.com/photo-1542224566-3d3b8cde8c8b?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
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
                <img src={act.thumbnail} alt="thumb" className="w-full h-full object-cover" />
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
