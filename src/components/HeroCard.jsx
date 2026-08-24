import React from 'react'
import Card from './Card'
import { AiFillStar } from 'react-icons/ai'

export default function HeroCard() {
  return (
    <Card variant="elevated" size="md" className="overflow-hidden">
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">استكشف إقاماتنا الفاخرة</h2>
            <p className="text-sm text-gray-600 dark:text-hajzy-muted">تم اختياره لأفضل تجربة إقامة فاخرة في مصر</p>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-full px-3 py-1">
              <AiFillStar className="text-yellow-400" />
              <div>
                <div className="text-sm font-semibold">4.9</div>
                <div className="text-xs text-gray-500 dark:text-hajzy-muted">(1,248 تقييم)</div>
              </div>
            </div>

            <button className="ml-auto md:ml-0 bg-hajzy-primary text-white px-4 py-2 rounded-md font-semibold">استكشف العقارات</button>
          </div>
        </div>

        <div className="md:col-span-1 h-48 md:h-auto">
          <img src="https://images.unsplash.com/photo-1505691723518-36a5a4b9b8b9?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder" alt="hero" className="w-full h-full object-cover" />
        </div>
      </div>
    </Card>
  )
}
