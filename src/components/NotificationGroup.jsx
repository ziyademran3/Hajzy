import React from 'react'
import NotificationCard from './NotificationCard'

export default function NotificationGroup({ title, notifications, onDelete, onToggleRead }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="text-xs text-gray-500">{notifications.length} إشعار</div>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} onDelete={onDelete} onToggleRead={onToggleRead} />
        ))}
      </div>
    </section>
  )
}
