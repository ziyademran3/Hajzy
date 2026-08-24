import React, { useState } from 'react'
import Card from './Card'
import { FaMapMarkerAlt, FaRegCalendarAlt, FaUserFriends } from 'react-icons/fa'

export default function SearchCard() {
  const [destination, setDestination] = useState('الإسكندرية')
  const [dates, setDates] = useState('10/09/2026 - 15/09/2026')
  const [guests, setGuests] = useState(2)

  const onSearch = () => {
    // demo behavior
    // eslint-disable-next-line no-alert
    alert(`بحث: ${destination} | ${dates} | ضيوف: ${guests}`)
  }

  return (
    <Card variant="default" size="md" className="overflow-visible">
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-xs text-gray-600 dark:text-hajzy-muted mb-1">الوجهة</label>
          <div className="mt-1 bg-white dark:bg-hajzy-card border border-gray-200 dark:border-hajzy-border rounded-lg p-3 flex items-center gap-3">
            <FaMapMarkerAlt className="text-gray-500 dark:text-hajzy-muted" />
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent flex-1 text-base outline-none placeholder-gray-400"
              placeholder="ابحث عن مدينة أو منطقة"
            />
          </div>
        </div>

        <div className="w-full md:w-56">
          <label className="text-xs text-gray-600 dark:text-hajzy-muted mb-1">التواريخ</label>
          <div className="mt-1 bg-white dark:bg-hajzy-card border border-gray-200 dark:border-hajzy-border rounded-lg p-3 flex items-center gap-3">
            <FaRegCalendarAlt className="text-gray-500 dark:text-hajzy-muted" />
            <input
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="bg-transparent flex-1 text-base outline-none"
            />
          </div>
        </div>

        <div className="w-40">
          <label className="text-xs text-gray-600 dark:text-hajzy-muted mb-1">الضيوف</label>
          <div className="mt-1 bg-white dark:bg-hajzy-card border border-gray-200 dark:border-hajzy-border rounded-lg p-3 flex items-center gap-3">
            <FaUserFriends className="text-gray-500 dark:text-hajzy-muted" />
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-transparent w-12 text-base outline-none"
            />
          </div>
        </div>

        <div className="flex items-end md:items-center">
          <button onClick={onSearch} className="w-full md:w-auto bg-hajzy-primary text-white px-5 py-3 rounded-lg font-semibold">بحث</button>
        </div>
      </div>
    </Card>
  )
}
