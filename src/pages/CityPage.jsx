import React, { useState, useMemo } from 'react'
import { CITY_DEFINITIONS, getCitySlug, FALLBACK_STAY_PHOTO } from '../lib/dataService'
import HeartIcon from '../components/HeartIcon'

export default function CityPage({
  citySlug,
  properties = [],
  isLoading = false,
  language = 'ar',
  onBack,
  onSelectProperty,
  onBookProperty,
  isFavorite,
  toggleFavorite,
  formatCurrency,
  handleStayImageError,
}) {
  const isEn = language === 'en'
  const isRtl = language === 'ar'

  const [sortBy, setSortBy] = useState('recommended')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchArea, setSearchArea] = useState('')
  const [hasError, setHasError] = useState(false)

  // Normalize and lookup city definition
  const normalizedSlug = getCitySlug(citySlug) || citySlug || ''
  const cityMeta = CITY_DEFINITIONS[normalizedSlug]

  const cityName = cityMeta
    ? (isEn ? cityMeta.nameEn : cityMeta.nameAr)
    : (citySlug || (isEn ? 'Destination' : 'الوجهة'))

  const citySubtitle = cityMeta
    ? (isEn ? cityMeta.subtitleEn : cityMeta.subtitleAr)
    : ''

  const cityCover = cityMeta?.photo || FALLBACK_STAY_PHOTO

  // Filter properties belonging to this city
  const cityAllProperties = useMemo(() => {
    if (!Array.isArray(properties)) return []
    return properties.filter((property) => {
      const pSlug = property.cityId || property.citySlug || getCitySlug(property.city) || getCitySlug(property.cityEn)
      if (pSlug && normalizedSlug) {
        return pSlug.toLowerCase() === normalizedSlug.toLowerCase()
      }
      const pCityAr = (property.city || '').toLowerCase()
      const pCityEn = (property.cityEn || '').toLowerCase()
      const searchTarget = (cityMeta?.nameAr || citySlug || '').toLowerCase()
      const searchTargetEn = (cityMeta?.nameEn || citySlug || '').toLowerCase()
      return pCityAr.includes(searchTarget) || pCityEn.includes(searchTargetEn)
    })
  }, [properties, normalizedSlug, cityMeta, citySlug])

  // Apply sorting and local area/type filter
  const displayedProperties = useMemo(() => {
    let result = [...cityAllProperties]

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((p) => {
        const text = `${p.title || ''} ${p.titleEn || ''} ${(p.details || []).join(' ')} ${(p.detailsEn || []).join(' ')}`.toLowerCase()
        if (typeFilter === 'apartment') return text.includes('شقة') || text.includes('suite') || text.includes('flat') || text.includes('residence')
        if (typeFilter === 'hotel') return text.includes('فندق') || text.includes('hotel') || text.includes('جناح')
        if (typeFilter === 'villa') return text.includes('فيلا') || text.includes('villa') || text.includes('شاليه') || text.includes('chalet')
        return true
      })
    }

    // Search inside city (by neighborhood, location, or name)
    const areaQuery = searchArea.trim().toLowerCase()
    if (areaQuery) {
      result = result.filter((p) => {
        const combined = `${p.title || ''} ${p.titleEn || ''} ${p.location || ''} ${p.locationEn || ''} ${p.neighborhood || ''}`.toLowerCase()
        return combined.includes(areaQuery)
      })
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.priceValue || 0) - Number(b.priceValue || 0))
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.priceValue || 0) - Number(a.priceValue || 0))
    } else if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    }

    return result
  }, [cityAllProperties, typeFilter, searchArea, sortBy])

  const getTitle = (p) => (!p ? '' : isEn ? (p.titleEn || p.title) : p.title)
  const getLocation = (p) => (!p ? '' : isEn ? (p.locationEn || p.location) : p.location)
  const getDetails = (p) => (!p ? [] : (isEn && p.detailsEn) ? p.detailsEn : (p.details || []))

  // Error State Handler
  if (hasError) {
    return (
      <div className="page-shell city-shell min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-rose-500 mb-3">error_outline</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isEn ? 'Something went wrong' : 'حدث خطأ أثناء تحميل إقامات المدينة'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {isEn ? 'Please try again or head back to the main exploration page.' : 'يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="secondary-button px-5 py-2.5 rounded-xl font-bold text-xs"
              onClick={() => setHasError(false)}
            >
              {isEn ? 'Retry' : 'إعادة المحاولة'}
            </button>
            <button
              type="button"
              className="primary-button px-5 py-2.5 rounded-xl font-bold text-xs"
              onClick={onBack}
            >
              {isEn ? 'Back to Home' : 'العودة للرئيسية'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell city-shell pb-20">
      {/* Top Header with Back Navigation */}
      <div className="city-top-nav flex items-center justify-between gap-3 py-4 mb-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition backdrop-blur-sm cursor-pointer"
          onClick={onBack}
          aria-label={isEn ? 'Back to Home' : 'الرجوع للرئيسية'}
        >
          <span className="material-symbols-outlined text-lg">
            {isRtl ? 'arrow_forward' : 'arrow_back'}
          </span>
          <span>{isEn ? 'Home' : 'الرئيسية'}</span>
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {isEn ? 'City Stays' : 'إقامات المدينة'}
          </span>
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
            {cityName}
          </h1>
        </div>

        <div className="w-16 flex justify-end">
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold px-2.5 py-1">
            {cityAllProperties.length} {isEn ? (cityAllProperties.length === 1 ? 'stay' : 'stays') : 'إقامة'}
          </span>
        </div>
      </div>

      {/* Hero Banner for the City */}
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-md border border-slate-200/70 dark:border-slate-800 bg-slate-900 min-h-[160px] sm:min-h-[200px] flex items-end">
        <img
          src={cityCover}
          alt={cityName}
          onError={handleStayImageError}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-75 transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        <div className="relative z-10 p-5 sm:p-7 text-white w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">location_city</span>
                <span className="text-xs font-semibold text-emerald-200 tracking-wide">
                  {isEn ? 'Egypt Destination' : 'وجهات مصر المميزة'}
                </span>
                {cityMeta?.badgeAr && (
                  <span className="rounded-full bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5">
                    {isEn ? cityMeta.badgeEn : cityMeta.badgeAr}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {cityName}
              </h2>
              {citySubtitle && (
                <p className="text-xs sm:text-sm text-slate-200/90 mt-0.5">
                  {citySubtitle}
                </p>
              )}
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-right">
              <span className="block text-[10px] uppercase font-bold text-white/80">
                {isEn ? 'Total Available' : 'المتاح حالياً'}
              </span>
              <strong className="text-lg font-black text-white">
                {cityAllProperties.length} {isEn ? (cityAllProperties.length === 1 ? 'stay' : 'stays') : 'إقامة'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Property Type Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist">
            {[
              { id: 'all', label: isEn ? 'All' : 'الكل' },
              { id: 'hotel', label: isEn ? 'Hotels' : 'فنادق' },
              { id: 'apartment', label: isEn ? 'Apartments' : 'شقق' },
              { id: 'villa', label: isEn ? 'Villas & Chalets' : 'فيلات وشاليهات' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={typeFilter === tab.id}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                onClick={() => setTypeFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isEn ? 'Sort by:' : 'ترتيب:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              aria-label={isEn ? 'Sort stays' : 'ترتيب الإقامات'}
            >
              <option value="recommended">{isEn ? 'Recommended' : 'الموصى به'}</option>
              <option value="price-low">{isEn ? 'Lowest Price' : 'الأقل سعراً'}</option>
              <option value="price-high">{isEn ? 'Highest Price' : 'الأعلى سعراً'}</option>
              <option value="rating">{isEn ? 'Highest Rated' : 'الأعلى تقييماً'}</option>
            </select>
          </div>
        </div>

        {/* Quick Area / Neighborhood Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            placeholder={isEn ? `Search in ${cityName} (e.g. area, street, hotel name)...` : `ابحث داخل ${cityName} (مثلاً: المنطقة، الكورنيش، اسم الفندق)...`}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-white py-2 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          {searchArea && (
            <button
              type="button"
              onClick={() => setSearchArea('')}
              className="absolute left-3 rtl:left-3 ltr:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              aria-label={isEn ? 'Clear search' : 'مسح البحث'}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="h-48 bg-slate-200 dark:bg-slate-800 w-full" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedProperties.length === 0 ? (
        /* Empty State */
        <div className="empty-state bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm my-6">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-3">
            travel_explore
          </span>
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1.5">
            {isEn ? 'No stays available in this city currently' : 'لا توجد إقامات متاحة في هذه المدينة حالياً'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {searchArea || typeFilter !== 'all'
              ? (isEn ? 'No properties match your current filters. Try changing or clearing your search.' : 'لا توجد نتائج مطابقة للفلاتر الحالية. جرّب مسح الفلاتر أو البحث بكلمات أخرى.')
              : (isEn ? 'We are constantly adding new luxury stays. Check out other destinations or return to the home page.' : 'نحن نعمل باستمرار على إضافة أماكن إقامة جديدة وفاخرة. تصفح المدن الأخرى أو عد إلى الصفحة الرئيسية.')}
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            {(searchArea || typeFilter !== 'all') && (
              <button
                type="button"
                className="secondary-button px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                onClick={() => {
                  setSearchArea('')
                  setTypeFilter('all')
                }}
              >
                {isEn ? 'Clear filters' : 'إلغاء الفلاتر'}
              </button>
            )}
            <button
              type="button"
              className="primary-button px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
              onClick={onBack}
            >
              <span className="material-symbols-outlined text-sm">home</span>
              <span>{isEn ? 'Back to Home' : 'العودة للرئيسية'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Stays Grid */
        <div className="property-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayedProperties.map((property) => (
            <article
              key={property.id}
              className="property-card property-card-modern bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              onClick={(event) => {
                if (event.target.closest('button')) return
                // Clicking the card opens confirmation/checkout directly
                onBookProperty(property)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onBookProperty(property)
                }
              }}
              aria-label={`${getTitle(property)}, ${getLocation(property)}`}
            >
              {/* Image & Badges */}
              <div className="image-wrap relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={property.image}
                  alt={getTitle(property)}
                  onError={handleStayImageError}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Favorite Heart Button */}
                <button
                  type="button"
                  className={isFavorite(property.id) ? 'favorite-button active' : 'favorite-button'}
                  aria-label={isEn ? 'Add to favorites' : 'إضافة للمفضلة'}
                  onClick={(event) => toggleFavorite(event, property.id)}
                >
                  <HeartIcon filled={isFavorite(property.id)} size={20} />
                </button>

                {/* Rating Badge */}
                <div className="rating-badge absolute bottom-3 rtl:right-3 ltr:left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-2.5 py-1 text-xs font-black shadow-sm flex items-center gap-1 text-slate-800 dark:text-white">
                  <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                  <span>{property.rating}</span>
                  {property.reviews > 0 && (
                    <small className="text-[10px] text-slate-400 font-normal">({property.reviews})</small>
                  )}
                </div>

                {/* City Tag */}
                <div className="absolute top-3 rtl:right-3 ltr:left-3 bg-black/60 backdrop-blur-md text-white rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                  {cityName}
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="card-topline flex items-center justify-between gap-2 mb-2">
                    <span className="property-badge text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {isEn ? 'Verified Stay' : 'إقامة موثقة'}
                    </span>
                    <span className="property-availability text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isEn ? 'Available now' : 'متاح الآن'}
                    </span>
                  </div>

                  <div className="title-block mb-3">
                    <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {getTitle(property)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      <span className="line-clamp-1">{getLocation(property)}</span>
                    </p>
                  </div>

                  {/* Meta features */}
                  <div className="property-meta-row flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bed</span>
                      {isEn ? `${property.guests || 2} guests` : `${property.guests || 2} ضيوف`}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">wifi</span> Wi‑Fi
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">local_parking</span> {isEn ? 'Parking' : 'موقف'}
                    </span>
                  </div>

                  {/* Tag Chips */}
                  <div className="tag-row flex flex-wrap gap-1.5 mb-4">
                    {getDetails(property).slice(0, 3).map((detail, index) => (
                      <span
                        key={`${detail}-${index}`}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="price-row flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="price-box">
                    <strong className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(property.priceValue, property.currency, language)}
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isEn ? ' / night' : ' / ليلة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Details Button */}
                    <button
                      type="button"
                      className="secondary-button small-button px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectProperty(property)
                      }}
                      title={isEn ? 'View property details' : 'عرض تفاصيل الإقامة'}
                    >
                      {isEn ? 'Details' : 'تفاصيل الحجز'}
                    </button>

                    {/* Book Now Button (leads to Confirm Booking / Checkout) */}
                    <button
                      type="button"
                      className="primary-button small-button px-4 py-2 rounded-xl text-xs font-black shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition active:scale-95 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onBookProperty(property)
                      }}
                      title={isEn ? 'Confirm booking' : 'تأكيد الحجز'}
                    >
                      {isEn ? 'Book now' : 'احجز الآن'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
