import React from 'react'
import { useTranslation } from 'react-i18next'
import HeroCard from '../components/HeroCard'
import SearchCard from '../components/SearchCard'
import CityBadge from '../components/CityBadge'
import Card from '../components/Card'
import HajzyLogo from '../components/HajzyLogo'

export default function HomePage() {
  const { t } = useTranslation()

  // padding-bottom = bottom nav (64px) + 24px plus safe-area inset
  const pb = 'calc(env(safe-area-inset-bottom, 0px) + 64px + 24px)'

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-hajzy-bg text-gray-900 dark:text-hajzy-text" style={{ paddingBottom: pb }}>
      <header className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HajzyLogo variant="icon" size={44} />
          <div>
            <h1 className="text-lg font-bold">{t('common.hajzy')}</h1>
            <p className="text-sm text-gray-600 dark:text-hajzy-muted">{t('home.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden md:inline px-3 py-1 rounded-md border border-transparent bg-hajzy-primary text-white">{t('buttons.offers')}</button>
          <button className="px-3 py-2 rounded-md border border-white text-white bg-transparent dark:border-hajzy-border dark:text-hajzy-text">{t('cities.alexandria')}</button>
        </div>
      </header>

      <div className="px-4 space-y-6">
        <HeroCard />

        <SearchCard />

        <section>
          <h2 className="text-base font-semibold mb-3">{t('home.popularCities')}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Card variant="outlined" size="sm" className="overflow-hidden">
              <div className="relative h-36">
                <img src="https://images.unsplash.com/photo-1547434459-db8b8a1f7b6e?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder" alt={t('cities.alexandria')} className="w-full h-full object-cover" />
                <div className="absolute left-3 top-3">
                  <CityBadge>{t('badges.mostRequested') || 'الأكثر طلباً'}</CityBadge>
                </div>
                <div className="absolute left-3 bottom-3">
                  <h3 className="text-white font-semibold text-sm">{t('cities.alexandria')}</h3>
                </div>
              </div>
            </Card>

            <Card variant="default" size="sm">
              <div className="h-36 flex items-end">
                <div className="p-3">
                  <h3 className="text-base font-semibold">{t('cities.cairo')}</h3>
                  <p className="text-sm text-gray-600 dark:text-hajzy-muted">{t('cities.cairoSubtitle') || 'خيارات متعددة'}</p>
                </div>
              </div>
            </Card>

            <Card variant="outlined" size="sm">
              <div className="h-36 flex items-end">
                <div className="p-3">
                  <h3 className="text-base font-semibold">{t('cities.hurghada')}</h3>
                  <p className="text-sm text-gray-600 dark:text-hajzy-muted">{t('cities.hurghadaSubtitle') || 'شاليهات وشقق'}</p>
                </div>
              </div>
            </Card>

            <Card variant="default" size="sm">
              <div className="h-36 flex items-end">
                <div className="p-3">
                  <h3 className="text-base font-semibold">{t('cities.sharm')}</h3>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
