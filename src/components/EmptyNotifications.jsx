import React from 'react'
import { AiOutlineInbox } from 'react-icons/ai'

export default function EmptyNotifications() {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <AiOutlineInbox size={36} className="text-gray-400" />
      </div>
      <h4 className="text-base font-semibold">لا توجد إشعارات</h4>
      <p className="text-sm text-gray-500 mt-2">ستصلك الإشعارات هنا عند وجود حجوزات أو عروض جديدة.</p>
    </div>
  )
}
