import React, { useState, useEffect } from 'react'

export default function PropertyGalleryModal({
  isOpen,
  onClose,
  title = 'Luxury Stay Gallery',
  images = [],
  language = 'ar',
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = language === 'en'
    ? [
        { key: 'all', label: 'All Photos' },
        { key: 'living', label: 'Living & Lounge' },
        { key: 'bedrooms', label: 'Bedrooms' },
        { key: 'outdoor', label: 'Pool & View' },
      ]
    : [
        { key: 'all', label: 'جميع الصور' },
        { key: 'living', label: 'الصالة والمعيشة' },
        { key: 'bedrooms', label: 'غرف النوم' },
        { key: 'outdoor', label: 'المسبح والإطلالة' },
      ]

  // Filter or augment images
  const safeImages = images && images.length > 0
    ? images
    : [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
      ]

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1))
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, safeImages.length, onClose])

  if (!isOpen) return null

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1))
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white backdrop-blur-2xl transition-all duration-300 animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Controls Bar */}
      <header className="flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8 border-b border-white/10 z-20">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-white/95 max-w-xs sm:max-w-md truncate">
            {title}
          </h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums text-emerald-400">
            {currentIndex + 1} / {safeImages.length}
          </span>
        </div>

        {/* Categories Chips on Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                selectedCategory === cat.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90"
          aria-label={language === 'en' ? 'Close gallery' : 'إغلاق المعرض'}
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </header>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 sm:left-8 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/20 text-white hover:bg-emerald-600 transition active:scale-90"
          aria-label={language === 'en' ? 'Previous photo' : 'الصورة السابقة'}
        >
          <span className="material-symbols-outlined text-[26px]">chevron_left</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 sm:right-8 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/20 text-white hover:bg-emerald-600 transition active:scale-90"
          aria-label={language === 'en' ? 'Next photo' : 'الصورة التالية'}
        >
          <span className="material-symbols-outlined text-[26px]">chevron_right</span>
        </button>

        {/* Current Image */}
        <div className="relative max-h-full max-w-5xl flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={safeImages[currentIndex]}
            alt={`${title} - ${currentIndex + 1}`}
            className="max-h-[65vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl transition-all duration-300"
          />
        </div>
      </div>

      {/* Bottom Thumbnails Ribbon */}
      <footer className="h-20 sm:h-24 border-t border-white/10 bg-black/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-center overflow-x-auto gap-2.5 z-20">
        {safeImages.map((imgUrl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`relative h-14 sm:h-16 w-20 sm:w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
              currentIndex === idx
                ? 'border-emerald-500 scale-105 shadow-md'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={imgUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </footer>
    </div>
  )
}
