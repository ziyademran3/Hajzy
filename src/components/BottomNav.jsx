import React, { useState } from 'react'
import { AiOutlineHome, AiOutlineCalendar } from 'react-icons/ai'
import { FiGrid, FiUser } from 'react-icons/fi'
import '../styles/safe-area.css'

// BottomNav
// - variant supports Light/Dark through tailwind dark: utilities
// - Active state shows icon+label in teal and a subtle teal background (10% alpha)
// - Safe-area padding applied via .safe-area-bottom

const ITEMS = [
  { id: 'home', label: 'الرئيسية', labelEn: 'Home', icon: AiOutlineHome },
  { id: 'bookings', label: 'حجوزاتي', labelEn: 'Bookings', icon: AiOutlineCalendar },
  { id: 'dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: FiGrid },
  { id: 'profile', label: 'الملف الشخصي', labelEn: 'Profile', icon: FiUser },
]

export default function BottomNav({ initial = 'home', onChange }) {
  const [active, setActive] = useState(initial)

  const handleClick = (id) => {
    setActive(id)
    onChange && onChange(id)
  }

  // inline style for active background (teal 10%) — uses hajzy primary #14B8A6
  const activeBg = { backgroundColor: 'rgba(20,184,166,0.10)' }

  return (
    <div className="bottom-nav-fixed safe-area-bottom">
      <nav className="bg-white dark:bg-hajzy-bottom-nav border-t border-gray-200 dark:border-hajzy-border">
        <div className="max-w-screen-md mx-auto px-4">
          <ul className="flex items-center justify-between h-16">
            {ITEMS.map((it) => {
              const Icon = it.icon
              const isActive = active === it.id

              return (
                <li key={it.id} className="flex-1">
                  <button
                    type="button"
                    onClick={() => handleClick(it.id)}
                    className={`w-full h-16 flex flex-col items-center justify-center gap-1 text-sm focus:outline-none bottom-nav-button px-2 ${
                                          isActive ? 'text-hajzy-primary dark:text-teal-400' : 'text-gray-500 dark:text-slate-400'
                    }`}
                    aria-pressed={isActive}
                    aria-label={it.label}
                    style={isActive ? activeBg : undefined}
                  >
                    <Icon size={22} />
                    <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>{it.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </div>
  )
}
