import React, { useMemo, useState } from 'react'
import NotificationGroup from '../components/NotificationGroup'
import EmptyNotifications from '../components/EmptyNotifications'

// helper to get relative bucket: today / yesterday / this week
const getBucket = (isoDate) => {
  const d = new Date(isoDate)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (d >= startOfToday) return 'اليوم'
  if (d >= startOfYesterday) return 'أمس'
  if (d >= oneWeekAgo) return 'هذا الأسبوع'
  return 'أقدم'
}

// sample data
const SAMPLE = [
  {
    id: 'n1',
    type: 'confirm',
    title: 'حجز مؤكد — شقة على البحر',
    body: 'تم تأكيد حجزك من 10-09 إلى 15-09. الرقم المرجعي: 8231',
    time: 'الآن',
    read: false,
    thumbnail: 'https://images.unsplash.com/photo-1505691723518-36a5a4b9b8b9?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
    date: new Date().toISOString(),
  },
  {
    id: 'n2',
    type: 'offer',
    title: 'عرض خاص 15% خصم',
    body: 'خصم على إقامات في الغردقة خلال شهر نوفمبر.',
    time: '2 ساعة مضت',
    read: false,
    thumbnail: null,
    date: new Date().toISOString(),
  },
  {
    id: 'n3',
    type: 'alert',
    title: 'تنبيه: فشل الدفع',
    body: 'حدثت مشكلة في عملية الدفع لطلب #7722. الرجاء التحقق.',
    time: 'أمس',
    read: false,
    thumbnail: null,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    type: 'message',
    title: 'رسالة من المضيف',
    body: 'مرحبا! هل تحتاج مساعدة في الوصول؟',
    time: '3 أيام مضت',
    read: true,
    thumbnail: 'https://images.unsplash.com/photo-1542224566-3d3b8cde8c8b?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function NotificationPage() {
  const [notifications, setNotifications] = useState(SAMPLE)

  const grouped = useMemo(() => {
    const map = {}
    notifications.forEach((n) => {
      const bucket = getBucket(n.date)
      if (!map[bucket]) map[bucket] = []
      map[bucket].push(n)
    })
    // order: اليوم، أمس، هذا الأسبوع، أقدم
    const order = ['اليوم', 'أمس', 'هذا الأسبوع', 'أقدم']
    return order.map((k) => ({ key: k, items: map[k] || [] })).filter((g) => g.items.length > 0)
  }, [notifications])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((p) => ({ ...p, read: true })))
  }

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((p) => p.id !== id))
  }

  const handleToggleRead = (id) => {
    setNotifications((prev) => prev.map((p) => (p.id === id ? { ...p, read: !p.read } : p)))
  }

  return (
    <main className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-hajzy-bg text-gray-900 dark:text-hajzy-text">
      <div className="flex items-center justify-between mb-6">
        <div></div>
        <div className="flex items-center gap-3">
          <button onClick={markAllRead} className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">تحديد الكل كمقروء</button>
          <button onClick={() => { if (window.confirm('هل تريد مسح جميع الإشعارات؟')) setNotifications([]) }} className="px-3 py-2 rounded-md bg-red-50 text-red-600 text-sm">مسح الكل</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <NotificationGroup key={g.key} title={g.key} notifications={g.items} onDelete={handleDelete} onToggleRead={handleToggleRead} />
          ))}
        </div>
      )}

      {/* ensure space for bottom nav */}
      <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }} />
    </main>
  )
}
