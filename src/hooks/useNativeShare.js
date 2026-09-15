import { useCallback } from 'react'

/**
 * Native-quality share hook.
 * Uses Navigator.share API (PWA / native WebView) with a WhatsApp
 * deep-link fallback for platforms that don't support it.
 */
export function useNativeShare() {
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  /** Share a property listing */
  const shareProperty = useCallback(async ({ title, titleEn, city, price, currency, url, language = 'ar' }) => {
    const isArabic = language === 'ar'
    const displayTitle = isArabic ? title : (titleEn || title)
    const displayPrice = price ? `${Number(price).toLocaleString()} ${currency || 'EGP'}` : ''

    const shareText = isArabic
      ? `🏡 شوف الإقامة دي على حجزي!\n\n"${displayTitle}" في ${city || 'مصر'}\n${displayPrice ? `💰 ${displayPrice} / الليلة` : ''}\n\n🔗 ${url || 'https://hajzy.com'}`
      : `🏡 Check out this stay on Hajzy!\n\n"${displayTitle}" in ${city || 'Egypt'}\n${displayPrice ? `💰 ${displayPrice} / night` : ''}\n\n🔗 ${url || 'https://hajzy.com'}`

    const shareTitle = isArabic
      ? `${displayTitle} — حجزي`
      : `${displayTitle} — Hajzy`

    // Try native share first
    if (canNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url || 'https://hajzy.com',
        })
        return { success: true, method: 'native' }
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'cancelled' }
        }
        // Fall through to WhatsApp
      }
    }

    // Fallback: WhatsApp deep link
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
    return { success: true, method: 'whatsapp' }
  }, [canNativeShare])

  /** Share a confirmed booking (success page) */
  const shareBooking = useCallback(async ({ reference, propertyTitle, propertyTitleEn, checkIn, checkOut, total, currency, language = 'ar' }) => {
    const isArabic = language === 'ar'
    const displayTitle = isArabic ? propertyTitle : (propertyTitleEn || propertyTitle)
    const displayTotal = total ? `${Number(total).toLocaleString()} ${currency || 'EGP'}` : ''

    const shareText = isArabic
      ? `✅ تم تأكيد حجزي على حجزي!\n\n🏡 ${displayTitle}\n📅 ${checkIn} ← ${checkOut}\n${displayTotal ? `💰 ${displayTotal}` : ''}\n📋 رقم المرجع: ${reference || '—'}\n\nحمّل تطبيق حجزي: https://hajzy.com`
      : `✅ Booking confirmed on Hajzy!\n\n🏡 ${displayTitle}\n📅 ${checkIn} → ${checkOut}\n${displayTotal ? `💰 ${displayTotal}` : ''}\n📋 Reference: ${reference || '—'}\n\nDownload Hajzy: https://hajzy.com`

    const shareTitle = isArabic
      ? `حجز مؤكد — ${displayTitle}`
      : `Confirmed Booking — ${displayTitle}`

    if (canNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
        })
        return { success: true, method: 'native' }
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'cancelled' }
        }
      }
    }

    // Fallback: WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
    return { success: true, method: 'whatsapp' }
  }, [canNativeShare])

  return { shareProperty, shareBooking, canNativeShare }
}
