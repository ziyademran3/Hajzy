import React from 'react'

export default function ExampleCard({ title = 'شاطئ فيستا', location = 'الإسكندرية', price = 1250 }) {
  return (
    <article className="max-w-sm rounded-hajzy-lg shadow-hajzy-soft overflow-hidden">
      {/* image area with badge overlay */}
      <div className="relative">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60" alt={title} className="w-full h-40 object-cover" />
        <div className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
          <span>الأكثر طلباً</span>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-gray-900 dark:text-hajzy-text font-bold">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-hajzy-muted">{location}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-hajzy-muted">EGP</div>
            <div className="text-lg font-extrabold text-gray-900 dark:text-hajzy-text">{price.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-hajzy-muted">/ ليلة</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 px-3 py-2 rounded-md bg-hajzy-primary text-white hover:opacity-95">احجز الآن</button>
          <button className="px-3 py-2 rounded-md border border-gray-200 dark:border-hajzy-border text-gray-700 dark:text-hajzy-text">التفاصيل</button>
        </div>
      </div>
    </article>
  )
}
