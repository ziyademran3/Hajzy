import React from 'react'
import { useTranslation } from 'react-i18next'
import HeroCard from '../components/HeroCard'
import SearchCard from '../components/SearchCard'
import CityBadge from '../components/CityBadge'
import Card from '../components/Card'
import HajzyLogo from '../components/HajzyLogo'

import { CITY_PHOTOS, FALLBACK_STAY_PHOTO } from '../lib/dataService'

const cityImages = {
  alexandria: CITY_PHOTOS['الإسكندرية'],
  cairo: CITY_PHOTOS['القاهرة'],
  giza: CITY_PHOTOS['الجيزة'],
  hurghada: CITY_PHOTOS['الغردقة'],
  sharm: CITY_PHOTOS['شرم الشيخ'],
}

export default function HomePage() {
  const { t } = useTranslation()

  const cityCards = [
    {
      key: 'alexandria',
      badge: t('badges.mostRequested'),
      image: cityImages.alexandria,
    },
    {
      key: 'cairo',
      subtitle: t('cities.cairoSubtitle'),
      image: cityImages.cairo,
    },
    {
      key: 'giza',
      subtitle: t('cities.gizaSubtitle'),
      image: cityImages.giza,
    },
    {
      key: 'hurghada',
      subtitle: t('cities.hurghadaSubtitle'),
      image: cityImages.hurghada,
    },
    {
      key: 'sharm',
      image: cityImages.sharm,
    },
  ]

  // padding-bottom = bottom nav (64px) + 24px plus safe-area inset
  const pb = 'calc(env(safe-area-inset-bottom, 0px) + 64px + 24px)'

  return (
    <main className="min-h-screen bg-[#f3f4f1] dark:bg-hajzy-bg text-gray-900 dark:text-hajzy-text" style={{ paddingBottom: pb }}>
      <div className="mx-auto max-w-[760px] px-3 sm:px-4">
        <header className="flex items-center justify-between gap-3 pt-6 pb-4">
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

        <div className="space-y-6 pb-8">
          <HeroCard />

          <SearchCard />

          <section>
            <h2 className="text-base font-semibold mb-3">{t('home.popularCities')}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cityCards.map((city, index) => (
                <Card key={city.key} variant={index === 0 ? 'outlined' : 'default'} size="sm" className="overflow-hidden">
                  <div className="relative h-36">
                    <img src={city.image} alt={t(`cities.${city.key}`)} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = FALLBACK_STAY_PHOTO }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    {city.badge && (
                      <div className="absolute left-3 top-3">
                        <CityBadge>{city.badge}</CityBadge>
                      </div>
                    )}
                    <div className="absolute left-3 right-3 bottom-3">
                      <h3 className="text-white font-semibold text-sm">{t(`cities.${city.key}`)}</h3>
                      {city.subtitle && <p className="text-[11px] text-white/85">{city.subtitle}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
