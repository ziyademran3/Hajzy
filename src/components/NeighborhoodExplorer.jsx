import React, { useState } from 'react'

export default function NeighborhoodExplorer({
  location = 'Alexandria, Egypt',
  coordinates = { lat: 31.2001, lng: 29.9187 },
  language = 'ar',
}) {
  const [activeCategory, setActiveCategory] = useState('all')

  const isArabic = language === 'ar'

  const categories = [
    { id: 'all', label: isArabic ? 'الكل' : 'All', icon: 'explore' },
    { id: 'beach', label: isArabic ? 'الشواطئ والبحر' : 'Beaches', icon: 'beach_access' },
    { id: 'dining', label: isArabic ? 'مطاعم وكافيهات' : 'Dining & Cafés', icon: 'restaurant' },
    { id: 'shopping', label: isArabic ? 'تسوق وبقالة' : 'Shopping', icon: 'shopping_bag' },
    { id: 'health', label: isArabic ? 'صيدليات ومستشفيات' : 'Health', icon: 'local_hospital' },
  ]

  const places = [
    {
      id: 1,
      name: isArabic ? 'شاطئ استانلي وممشى الكورنيش' : 'Stanley Beach & Corniche Promenade',
      category: 'beach',
      distance: '250m',
      time: isArabic ? '3 دقائق سيراً' : '3 min walk',
      icon: 'beach_access',
      rating: 4.9,
    },
    {
      id: 2,
      name: isArabic ? 'كافيه ومطعم سيلانترو' : 'Cilantro Café & Bistro',
      category: 'dining',
      distance: '180m',
      time: isArabic ? '2 دقيقة سيراً' : '2 min walk',
      icon: 'coffee',
      rating: 4.8,
    },
    {
      id: 3,
      name: isArabic ? 'مطعم الأسماك اليوناني القديم' : 'Greek Club Seafood Restaurant',
      category: 'dining',
      distance: '1.2 km',
      time: isArabic ? '5 دقائق بالسيارة' : '5 min drive',
      icon: 'restaurant',
      rating: 4.7,
    },
    {
      id: 4,
      name: isArabic ? 'سوبرماركت زهران ماركت 24/7' : 'Zahran Market 24/7',
      category: 'shopping',
      distance: '400m',
      time: isArabic ? '5 دقائق سيراً' : '5 min walk',
      icon: 'storefront',
      rating: 4.8,
    },
    {
      id: 5,
      name: isArabic ? 'صيدليات العزبي (خدمة 24 ساعة)' : 'El-Ezaby Pharmacy 24/7',
      category: 'health',
      distance: '300m',
      time: isArabic ? '4 دقائق سيراً' : '4 min walk',
      icon: 'local_pharmacy',
      rating: 4.9,
    },
    {
      id: 6,
      name: isArabic ? 'سان ستيفانو مول وسينما' : 'San Stefano Grand Plaza & Cinema',
      category: 'shopping',
      distance: '2.5 km',
      time: isArabic ? '8 دقائق بالسيارة' : '8 min drive',
      icon: 'shopping_bag',
      rating: 4.8,
    },
  ]

  const filteredPlaces = activeCategory === 'all'
    ? places
    : places.filter((p) => p.category === activeCategory)

  return (
    <div className="neighborhood-explorer-card">
      <div className="explorer-header">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">near_me</span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
              {isArabic ? 'دليل الحي والأماكن المجاورة' : 'Neighborhood & Nearby Highlights'}
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              {isArabic ? `أبرز الخدمات والمعالم بالقرب من ${location}` : `Key services and landmarks near ${location}`}
            </p>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates.lat + ',' + coordinates.lng)}`}
          target="_blank"
          rel="noreferrer"
          className="text-button text-xs font-bold"
        >
          {isArabic ? 'فتح في خرائط Google' : 'Open in Google Maps'}
        </a>
      </div>

      <div className="category-filter-strip mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`chip small-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="places-list-grid mt-3">
        {filteredPlaces.map((place) => (
          <div key={place.id} className="place-item-card">
            <div className="place-icon-circle">
              <span className="material-symbols-outlined text-emerald-700 dark:text-emerald-400">
                {place.icon}
              </span>
            </div>
            <div className="place-info flex-1 min-w-0">
              <strong className="block text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                {place.name}
              </strong>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">straighten</span>
                  {place.distance}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">directions_walk</span>
                  {place.time}
                </span>
                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                  ★ {place.rating}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
