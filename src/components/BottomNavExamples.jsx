import React from 'react'
import BottomNav from './BottomNav'

export default function BottomNavExamples() {
  return (
    <div className="space-y-8">
      <section className="p-6">
        <h3 className="text-lg font-semibold mb-4">Light mode — Bottom Nav</h3>
        <div style={{ height: 220, border: '1px dashed #e5e7eb' }} className="relative">
          <div className="p-4">محتوى التجربة أسفل الصفحة — تأكد أن الـ Bottom Nav لا يغطي الأزرار.</div>
          <BottomNav />
        </div>
      </section>

      <section className="p-6 dark">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark mode — Bottom Nav</h3>
        <div style={{ height: 220, background: '#0b1220' }} className="relative">
          <div className="p-4 text-white">محتوى التجربة في الوضع الداكن.</div>
          <BottomNav />
        </div>
      </section>
    </div>
  )
}
