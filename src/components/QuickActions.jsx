import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiHeart, FiSearch, FiHelpCircle } from 'react-icons/fi'

export default function QuickActions() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t('dashboard.quickActions')}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border">
          <FiHeart className="text-hajzy-primary" size={20} />
          <span className="text-xs">{t('dashboard.savedHomes')}</span>
        </button>

        <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border">
          <FiSearch className="text-hajzy-primary" size={20} />
          <span className="text-xs">{t('dashboard.searchCity')}</span>
        </button>

        <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white dark:bg-hajzy-card border border-gray-100 dark:border-hajzy-border">
          <FiHelpCircle className="text-hajzy-primary" size={20} />
          <span className="text-xs">{t('dashboard.support')}</span>
        </button>
      </div>
    </div>
  )
}
