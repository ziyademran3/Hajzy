import React, { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useHaptics } from './hooks/useHaptics'
import { useOfflineBooking } from './hooks/useOfflineBooking'
import { useNativeShare } from './hooks/useNativeShare'
import Skeleton from './components/Skeleton'
import LuxuryPageSkeleton from './components/LuxuryPageSkeleton'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

const MarketingPage = lazy(() => import('./pages/MarketingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const CityPage = lazy(() => import('./pages/CityPage'))
import MapView from './components/MapView'
import Logo from './components/Logo'
import SplitPaymentModal from './components/SplitPaymentModal'
import PropertyGalleryModal from './components/PropertyGalleryModal'
import AiConciergeModal from './components/AiConciergeModal'
import NeighborhoodExplorer from './components/NeighborhoodExplorer'
import HostCalendar from './components/HostCalendar'
import { useTheme } from './components/ThemeProvider'
import {
  formatCurrency,
  formatNumber,
  formatDate,
  parseISODate,
  formatISODate,
  formatDisplayDMY,
  getNextDayISO,
  pluralize,
  getArabicPluralWord,
  nightsBetween,
} from './lib/formatters'
import {
  createPaymobPaymentSession,
  fetchNotificationsApi,
  createNotificationApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
} from './lib/authApi'
import {
  getUserNotifications,
  saveUserNotifications,
  createNotification,
  createOwnerBookingNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  requestBrowserPushPermission,
  markAllAsRead,
  deleteNotification,
  purgeLegacyMockNotifications,
  checkAndGenerateArrivalReminders,
  formatRelativeTime,
} from './lib/notificationService'
import {
  validateGuestForm,
  validateFullName,
  validatePhone,
  validateEmail,
  cleanPhoneNumber,
  normalizePhone,
} from './lib/bookingValidation'
import ErrorBoundary from './components/ErrorBoundary'
import {
  addBooking,
  addChatMessage,
  addProperty,
  calculateBookingPricing,
  CITY_PHOTOS,
  deleteBooking,
  deleteProperty,
  FALLBACK_STAY_PHOTO,
  fetchBookings,
  fetchChatMessages,
  fetchProperties,
  getCitySlug,
  getSafeBookings,
  hasSupabaseConnection,
  normalizeBookingStatus,
  propertySeed,
  updateBooking,
  updateProperty,
} from './lib/dataService'

const HeartIcon = ({ filled = false, size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    style={{ display: 'block', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
  >
    {filled ? (
      <path
        fill="#e11d48"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    ) : (
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    )}
  </svg>
)

const handleStayImageError = (event) => {
  if (event.currentTarget.src !== FALLBACK_STAY_PHOTO) {
    event.currentTarget.src = FALLBACK_STAY_PHOTO
  }
}

const pageTitlesByLanguage = {
  ar: {
    dashboard: 'لوحة التحكم',
    account: 'حسابي',
    home: 'Hajzy',
    city: 'إقامات المدينة',
    details: 'تفاصيل الشقة',
    checkout: 'تأكيد الحجز',
    success: 'تم التأكيد',
    bookings: 'حجوزاتي',
    notifications: 'الإشعارات',
    profile: 'حسابي',
    owner: 'لوحة المالك',
    'owner-settings': 'إعدادات المالك',
  },
  en: {
    dashboard: 'Dashboard',
    account: 'My Account',
    home: 'Hajzy',
    city: 'City Stays',
    details: 'Property details',
    checkout: 'Confirm booking',
    success: 'Confirmed',
    bookings: 'My bookings',
    notifications: 'Notifications',
    profile: 'My Account',
    owner: 'Owner dashboard',
    'owner-settings': 'Owner settings',
  },
}

const NOTIFICATION_TRANSLATIONS = {
  ar: {
    'تم تأكيد حجزك': 'تم تأكيد حجزك',
    'Booking Confirmed': 'تم تأكيد حجزك',
    'إقامة فيستا الإسكندرية - الوصول غدًا في 15:00': 'إقامة فيستا الإسكندرية - الوصول غدًا في 15:00',
    'Alexandria Vista Stay - Arrival tomorrow at 15:00': 'إقامة فيستا الإسكندرية - الوصول غدًا في 15:00',
    'انخفض سعر إقامتك المفضلة': 'انخفض سعر إقامتك المفضلة',
    'Price drop on your favorite stay': 'انخفض سعر إقامتك المفضلة',
    'تم تخفيض سعر شاليه البحر الأحمر بنسبة 12%': 'تم تخفيض سعر شاليه البحر الأحمر بنسبة 12%',
    'Red Sea Chalet price was reduced by 12%': 'تم تخفيض سعر شاليه البحر الأحمر بنسبة 12%',
    'تذكير الوصول': 'تذكير الوصول',
    'Check-in Reminder': 'تذكير الوصول',
    'يرجى تأكيد موعد الوصول قبل 24 ساعة': 'يرجى تأكيد موعد الوصول قبل 24 ساعة',
    'Please confirm arrival time 24 hours prior': 'يرجى تأكيد موعد الوصول قبل 24 ساعة',
    'Please confirm check-in time 24 hours prior': 'يرجى تأكيد موعد الوصول قبل 24 ساعة',
    'تم إلغاء الحجز': 'تم إلغاء الحجز',
    'Booking Cancelled': 'تم إلغاء الحجز',
    'تم تحديث حالة الحجز بنجاح وسيتم إبلاغك بأي تغييرات لاحقًا.': 'تم تحديث حالة الحجز بنجاح وسيتم إبلاغك بأي تغييرات لاحقًا.',
    'Booking status updated successfully. You will be notified of any changes.': 'تم تحديث حالة الحجز بنجاح وسيتم إبلاغك بأي تغييرات لاحقًا.',
    'الآن': 'الآن',
    'Just now': 'الآن',
    'منذ 2 س': 'منذ 2 س',
    '2h ago': 'منذ 2 س',
    'أمس': 'أمس',
    'Yesterday': 'أمس',
  },
  en: {
    'تم تأكيد حجزك': 'Booking Confirmed',
    'Booking Confirmed': 'Booking Confirmed',
    'إقامة فيستا الإسكندرية - الوصول غدًا في 15:00': 'Alexandria Vista Stay - Arrival tomorrow at 15:00',
    'Alexandria Vista Stay - Arrival tomorrow at 15:00': 'Alexandria Vista Stay - Arrival tomorrow at 15:00',
    'انخفض سعر إقامتك المفضلة': 'Price drop on your favorite stay',
    'Price drop on your favorite stay': 'Price drop on your favorite stay',
    'تم تخفيض سعر شاليه البحر الأحمر بنسبة 12%': 'Red Sea Chalet price was reduced by 12%',
    'Red Sea Chalet price was reduced by 12%': 'Red Sea Chalet price was reduced by 12%',
    'تذكير الوصول': 'Check-in Reminder',
    'Check-in Reminder': 'Check-in Reminder',
    'يرجى تأكيد موعد الوصول قبل 24 ساعة': 'Please confirm arrival time 24 hours prior',
    'Please confirm arrival time 24 hours prior': 'Please confirm arrival time 24 hours prior',
    'Please confirm check-in time 24 hours prior': 'Please confirm arrival time 24 hours prior',
    'تم إلغاء الحجز': 'Booking Cancelled',
    'Booking Cancelled': 'Booking Cancelled',
    'تم تحديث حالة الحجز بنجاح وسيتم إبلاغك بأي تغييرات لاحقًا.': 'Booking status updated successfully. You will be notified of any changes.',
    'Booking status updated successfully. You will be notified of any changes.': 'Booking status updated successfully. You will be notified of any changes.',
    'الآن': 'Just now',
    'Just now': 'Just now',
    'منذ 2 س': '2h ago',
    '2h ago': '2h ago',
    'أمس': 'Yesterday',
    'Yesterday': 'Yesterday',
  },
}

const getLocalizedNotificationText = (text, lang) => {
  if (!text) return ''
  if (typeof text === 'object') {
    return text[lang] || text.ar || text.en || ''
  }
  if (typeof text === 'string') {
    const targetLang = lang === 'en' ? 'en' : 'ar'
    if (NOTIFICATION_TRANSLATIONS[targetLang] && NOTIFICATION_TRANSLATIONS[targetLang][text]) {
      return NOTIFICATION_TRANSLATIONS[targetLang][text]
    }
    if (targetLang === 'en') {
      const bookingMatch = text.match(/^تم حجز (.+?) بنجاح، موعد الوصول (.+?)، وإجمالي (.+?)\.$/)
      if (bookingMatch) {
        return `Successfully booked ${bookingMatch[1]}, arrival on ${bookingMatch[2]}, total ${bookingMatch[3]}.`
      }
    } else {
      const bookingEnMatch = text.match(/^Successfully booked (.+?), arrival on (.+?), total (.+?)\.$/)
      if (bookingEnMatch) {
        return `تم حجز ${bookingEnMatch[1]} بنجاح، موعد الوصول ${bookingEnMatch[2]}، وإجمالي ${bookingEnMatch[3]}.`
      }
    }
  }
  return text
}

const getDefaultBookingDates = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  return {
    checkIn: formatISODate(tomorrow),
    checkOut: formatISODate(dayAfterTomorrow),
  }
}

const getFavoritesStorageKey = (currentUser) => {
  try {
    const userToUse = currentUser || JSON.parse(localStorage.getItem('hajzy_user') || 'null')
    if (userToUse?.id || userToUse?.email) {
      const accountKey = userToUse.id || String(userToUse.email).trim().toLowerCase()
      return `hajzy_favorites_${accountKey}`
    }
  } catch {}
  return 'hajzy_favorites_guest'
}

const loadStoredFavorites = (currentUser) => {
  try {
    const key = getFavoritesStorageKey(currentUser)
    const saved = localStorage.getItem(key)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function App() {
  const { t, i18n } = useTranslation()
  const { user, loading, login, signup, socialLogin, logout, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const haptics = useHaptics()
  const { offlineBooking, isOffline, cacheBooking } = useOfflineBooking()
  const { shareProperty, shareBooking } = useNativeShare()
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null)
  const [activeBookingActionsTarget, setActiveBookingActionsTarget] = useState(null)
  const [activePage, setActivePage] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '')
      const params = new URLSearchParams(window.location.search)
      const cityParam = params.get('city')
      if (cityParam) return 'city'
      if (hash && ['home', 'dashboard', 'owner', 'bookings', 'favorites', 'account', 'profile', 'details', 'checkout', 'success', 'notifications', 'chat', 'reviews', 'city', 'owner-settings'].includes(hash)) {
        return hash
      }
    } catch {}
    return 'home'
  })
  const [selectedCitySlug, setSelectedCitySlug] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const cityParam = params.get('city')
      if (cityParam) return getCitySlug(cityParam)
    } catch {}
    return 'alexandria'
  })
  const homeScrollPositionRef = useRef(0)
  const [authRequired, setAuthRequired] = useState(() => {
    try {
      const isForceLogin = localStorage.getItem('hajzy_force_login') === 'true'
      if (isForceLogin) return true
    } catch {}
    return false
  })
  const [isGuestMode, setIsGuestMode] = useState(() => {
    try {
      const isForceLogin = localStorage.getItem('hajzy_force_login') === 'true'
      if (isForceLogin) return false
      return true
    } catch { return true }
  })
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [currentAuthPage, setCurrentAuthPage] = useState('login')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [favorites, setFavorites] = useState(() => loadStoredFavorites(user))
  const isFavoritesInitializedRef = useRef(false)
  const [showDealModal, setShowDealModal] = useState(false)
  const [copiedDealCode, setCopiedDealCode] = useState(false)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const isBookingSubmittingRef = useRef(false)
  const [accountTab, setAccountTab] = useState('overview')
  const [lastBooking, setLastBooking] = useState(null)
  const defaultBookingDates = getDefaultBookingDates()

  const [bookingDates, setBookingDates] = useState({
    ...defaultBookingDates,
    guests: 2,
  })
  const [ownerNotice, setOwnerNotice] = useState('')
  const [ownerEditingId, setOwnerEditingId] = useState(null)
  const [bookingFilter, setBookingFilter] = useState('upcoming')
  const [ownerBookingFilter, setOwnerBookingFilter] = useState('all')
  const [notifFilter, setNotifFilter] = useState('all')
  const [ownerNotifPrefs, setOwnerNotifPrefs] = useState(() => getNotificationPreferences(null))
  const [showReviewsTooltip, setShowReviewsTooltip] = useState(false)
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return 'ar'
    }

    const savedLanguage = localStorage.getItem('hajzy-language')
    const nextLanguage = savedLanguage === 'en' ? 'en' : 'ar'
    localStorage.setItem('hajzy-language', nextLanguage)
    return nextLanguage
  })

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [bookingStep, setBookingStep] = useState(1)
  const [guestForm, setGuestForm] = useState(() => {
    try {
      const stored = sessionStorage.getItem('hajzy_booking_guest_info')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          return {
            fullName: String(parsed.fullName || ''),
            phone: String(parsed.phone || ''),
            email: String(parsed.email || ''),
            notes: String(parsed.notes || ''),
          }
        } else {
          sessionStorage.removeItem('hajzy_booking_guest_info')
        }
      }
    } catch {
      try {
        sessionStorage.removeItem('hajzy_booking_guest_info')
      } catch {}
    }
    return {
      fullName: '',
      phone: '',
      email: '',
      notes: '',
    }
  })
  const [guestErrors, setGuestErrors] = useState({})
  const [guestFormTouched, setGuestFormTouched] = useState(false)
  const guestNameRef = useRef(null)
  const guestPhoneRef = useRef(null)
  const guestEmailRef = useRef(null)
  const isSubmittingStep2Ref = useRef(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [walletNumber, setWalletNumber] = useState('')
  const [instapayHandle, setInstapayHandle] = useState('')
  const [fawryRefCode] = useState('74920184')
  const [toast, setToast] = useState(null)
  const [_showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    try {
      purgeLegacyMockNotifications()
      const savedUser = localStorage.getItem('hajzy_user') || localStorage.getItem('stitch_user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        if (parsed?.id) return getUserNotifications(parsed.id)
      }
      return []
    } catch {
      return []
    }
  })
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)
  const [homeQuickSearch, setHomeQuickSearch] = useState({
    destination: '',
    ...defaultBookingDates,
    guests: 2,
  })
  const [showMapView, setShowMapView] = useState(false)
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [homeFilters, setHomeFilters] = useState({
    maxPrice: 35000,
    ratingMin: 0,
    type: 'all',
    bedrooms: 'any',
    amenities: [],
    sortBy: 'recommended',
  })
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    city: 'الإسكندرية',
    location: '',
    priceValue: '',
    image: '',
    amenities: '',
    description: '',
    bookingInfo: '',
  })
  const [activeRevenueBar, setActiveRevenueBar] = useState(null)
  const propertyFileInputRef = useRef(null)

  const handlePropertyImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast(language === 'en' ? 'Image size must be less than 5MB' : 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت')
      return
    }
    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result
      if (typeof dataUrl === 'string') {
        setPropertyForm((prev) => ({ ...prev, image: dataUrl }))
        showToast(language === 'en' ? 'Photo ready for preview' : 'تم اختيار صورة العقار ومعاينتها بنجاح')
      }
    }
    reader.readAsDataURL(file)
  }

  const [isLoadingData, setIsLoadingData] = useState(true)
  const isOwner = user?.role === 'owner'
  const activeText = {
    homeTitle: t('homeTitle'),
    welcome: t('welcome', { name: user?.name || 'Ziad' }),
    searchPlaceholder: t('searchPlaceholder', { defaultValue: 'ابحث عن شقتك المثالية...' }),
    result: t('result'),
    results: t('results'),
    resultsPlural: t('resultsPlural'),
    favorite: t('favorite'),
    bookNow: t('bookNow'),
    nightly: t('nightly'),
    description: t('description'),
    amenities: t('amenities'),
    checkoutTitle: t('checkoutTitle'),
    paymentMethod: t('paymentMethod'),
    total: t('total'),
    confirmPayment: t('confirmPayment'),
    chat: t('chat'),
    send: t('send'),
    typeMessage: t('typeMessage'),
    language: t('language'),
    propertyAdded: t('propertyAdded'),
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const path = window.location.pathname

    const cityParam = params.get('city')
    const cityPathMatch = path.match(/\/city\/([a-zA-Z0-9_-]+)/)
    const initialCity = cityParam || (cityPathMatch ? cityPathMatch[1] : null)
    if (initialCity) {
      const slug = getCitySlug(initialCity)
      setSelectedCitySlug(slug)
      setActivePage('city')
    }

    if (path.includes('/verify-email')) {
      setCurrentAuthPage('verify')
      setAuthRequired(true)
      return
    }

    if (path.includes('/reset-password') && params.get('token')) {
      setCurrentAuthPage('reset')
      setAuthRequired(true)
      return
    }

    if (path === '/login' || path.startsWith('/login')) {
      setCurrentAuthPage('login')
      setAuthRequired(true)
      return
    }

    if (path === '/signup' || path.startsWith('/signup')) {
      setCurrentAuthPage('signup')
      setAuthRequired(true)
      return
    }

    if (path === '/search' || path.startsWith('/search')) {
      setActivePage('home')
      setAuthRequired(false)
      const searchDest = params.get('destination')
      const searchIn = params.get('checkIn') || params.get('check_in')
      const searchOut = params.get('checkOut') || params.get('check_out')
      const searchGuests = params.get('guests')
      if (searchDest || searchIn || searchOut || searchGuests) {
        setHomeQuickSearch((prev) => ({
          ...prev,
          ...(searchDest ? { destination: searchDest } : {}),
          ...(searchIn ? { checkIn: searchIn } : {}),
          ...(searchOut ? { checkOut: searchOut } : {}),
          ...(searchGuests ? { guests: Number(searchGuests) || 2 } : {}),
        }))
      }
      setTimeout(() => {
        document.getElementById('home-search-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }

    const isPaymentReturn = path.includes('/payment-result') ||
      params.has('success') ||
      params.has('txn_response_code') ||
      params.has('data.message')

    if (isPaymentReturn) {
      const isSuccess = params.get('success') === 'true' ||
        params.get('txn_response_code') === 'APPROVED' ||
        params.get('data.message') === 'Approved'

      const pendingId = localStorage.getItem('hajzy_last_pending_booking_id')
      setAuthRequired(false)

      if (isSuccess) {
        try {
          const raw = localStorage.getItem('hajzy_bookings')
          if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) {
              const updated = list.map((b) => {
                if (b.id === pendingId || (!pendingId && b.status === 'pending_payment')) {
                  return { ...b, status: 'confirmed', paidAt: new Date().toISOString() }
                }
                return b
              })
              localStorage.setItem('hajzy_bookings', JSON.stringify(updated))
              setBookings(updated)
            }
          }
        } catch (e) {
          console.error('Failed to update booking on payment return', e)
        }

        if (pendingId) {
          updateBooking({ id: pendingId, status: 'confirmed' }).catch(() => {})
        }

        setActivePage('bookings')
        setToast(language === 'en' ? 'Payment completed! Your booking is confirmed.' : 'تمت عملية الدفع وتأكيد حجزك بنجاح!')
        addNotification(
          { ar: 'تم تأكيد حجزك والدفع', en: 'Booking & Payment Confirmed' },
          {
            ar: 'تم تأكيد الدفع والحجز بنجاح.',
            en: 'Your payment and booking have been successfully confirmed.',
          },
          'success'
        )

        // Notify property owner of the newly confirmed booking
        try {
          const raw = localStorage.getItem('hajzy_bookings')
          if (raw) {
            const list = JSON.parse(raw)
            const targetBooking = list.find((b) => b.id === pendingId) || list[0]
            if (targetBooking) {
              const targetProp = properties.find((p) => p.id === targetBooking.propertyId)
              const ownerId = targetProp?.ownerId || 'owner-demo'
              createOwnerBookingNotification({
                ownerId,
                property: targetProp || { title: targetBooking.title },
                booking: targetBooking,
                type: 'booking_confirmed',
                guestName: targetBooking.guestName || targetBooking.fullName || '',
              })
              if (ownerId !== 'owner-demo') {
                createOwnerBookingNotification({
                  ownerId: 'owner-demo',
                  property: targetProp || { title: targetBooking.title },
                  booking: targetBooking,
                  type: 'booking_confirmed',
                  guestName: targetBooking.guestName || targetBooking.fullName || '',
                })
              }
            }
          }
        } catch {}
      } else {
        setActivePage('bookings')
        setToast(language === 'en' ? 'Payment was cancelled or failed.' : 'تم إلغاء عملية الدفع أو لم تكتمل.')
      }

      try {
        localStorage.removeItem('hajzy_last_pending_booking_id')
      } catch {}

      window.history.replaceState({}, document.title, window.location.pathname.replace('/payment-result', '') || '/')
    }
  }, [language])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = (e) => {
      const state = e.state
      const params = new URLSearchParams(window.location.search)
      const path = window.location.pathname
      const hash = window.location.hash.replace('#', '')
      const cityParam = params.get('city')
      const cityPathMatch = path.match(/\/city\/([a-zA-Z0-9_-]+)/)
      const targetCity = state?.citySlug || cityParam || (cityPathMatch ? cityPathMatch[1] : null)

      if (state?.page === 'city' || targetCity) {
        setSelectedCitySlug(getCitySlug(targetCity || 'alexandria'))
        setActivePage('city')
      } else if (state?.page) {
        setActivePage(state.page)
        if (state.page === 'home') {
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: homeScrollPositionRef.current, left: 0, behavior: 'auto' })
            document.documentElement.scrollTop = homeScrollPositionRef.current
            document.body.scrollTop = homeScrollPositionRef.current
          })
        }
      } else if (hash && hash !== 'home') {
        setActivePage(hash)
      } else {
        setActivePage('home')
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: homeScrollPositionRef.current, left: 0, behavior: 'auto' })
          document.documentElement.scrollTop = homeScrollPositionRef.current
          document.body.scrollTop = homeScrollPositionRef.current
        })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Do not forcibly override the theme on mount — let ThemeProvider and user preference manage it.

  useEffect(() => {
    const nextLanguage = language === 'en' ? 'en' : 'ar'
    i18n.changeLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage
    document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr'
    document.body.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr'
  }, [language, i18n])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [propertyList, bookingList] = await Promise.all([fetchProperties(), fetchBookings()])
        if (isMounted) {
          const safePropertyList = Array.isArray(propertyList) && propertyList.length ? propertyList : propertySeed
          const safeBookingList = Array.isArray(bookingList) && bookingList.length ? bookingList : []

          if (!Array.isArray(propertyList) || !propertyList.length) {
            localStorage.setItem('hajzy_properties', JSON.stringify(propertySeed))
          }

          setProperties(safePropertyList)
          setBookings(safeBookingList)
          setSelectedProperty(safePropertyList[0])
        }
      } catch (error) {
        console.error('Failed to load app data:', error)
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Pull-to-refresh is intentionally disabled. On some mobile browsers it
  // misidentifies ordinary upward scrolling as a refresh gesture and snaps the
  // customer back to the top of the page.

  useEffect(() => {
    const loaded = loadStoredFavorites(user)
    setFavorites(loaded)
    isFavoritesInitializedRef.current = true
  }, [user?.id, user?.email])

  useEffect(() => {
    if (!isFavoritesInitializedRef.current) {
      isFavoritesInitializedRef.current = true
      return
    }
    try {
      const storageKey = getFavoritesStorageKey(user)
      localStorage.setItem(storageKey, JSON.stringify(favorites))
    } catch {}
  }, [favorites, user?.id, user?.email])

  // Sync notifications when user logs in or logs out
  useEffect(() => {
    purgeLegacyMockNotifications()
    const targetUserId = user?.id || (isOwner ? 'owner-demo' : 'guest')
    const local = getUserNotifications(targetUserId)
    setNotifications(local)
    setOwnerNotifPrefs(getNotificationPreferences(targetUserId))

    if (user?.id) {
      fetchNotificationsApi()
        .then((res) => {
          if (res && Array.isArray(res.notifications)) {
            setNotifications(res.notifications)
            saveUserNotifications(user.id, res.notifications)
          }
        })
        .catch(() => {})
    }
  }, [user?.id, isOwner])

  // Real-time synchronization for notifications: custom events, cross-tab storage, and periodic polling (every 10s)
  useEffect(() => {
    const refreshNotifications = () => {
      const targetUserId = resolveCurrentUserId()
      const list = getUserNotifications(targetUserId)
      setNotifications(list)
    }

    const handleNotificationCreated = (e) => {
      const { userId, notification } = e.detail || {}
      if (!notification) return
      const currentTarget = resolveCurrentUserId()
      // Always process notifications that belong to the current user
      // Also process owner notifications when the owner is logged in
      // Also immediately refresh from localStorage for cross-account notifications
      const isForCurrentUser = userId === currentTarget
      const isForOwner = isOwner && (userId === user?.id || userId === 'owner-demo' || userId === 'owner')
      if (isForCurrentUser || isForOwner) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) return prev
          return [notification, ...prev].slice(0, 50)
        })
      } else {
        // Notification was created for a different user (e.g., owner notification while guest is logged in).
        // We still save it to localStorage (already done by createNotification), so it will appear
        // when that user logs in or on the next poll. No state update needed here.
      }
    }

    const handleStorageChange = (e) => {
      if (e.key && (e.key.startsWith('hajzy_notifications_') || e.key === 'hajzy_bookings')) {
        refreshNotifications()
        if (e.key === 'hajzy_bookings') {
          fetchBookings().then((b) => {
            if (Array.isArray(b)) setBookings(b)
          })
        }
      }
    }

    window.addEventListener('hajzy_notification_created', handleNotificationCreated)
    window.addEventListener('storage', handleStorageChange)
    const pollTimer = setInterval(refreshNotifications, 10000)

    return () => {
      window.removeEventListener('hajzy_notification_created', handleNotificationCreated)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(pollTimer)
    }
  }, [user?.id, isOwner])

  // Check arrival reminder for confirmed bookings within 24h
  useEffect(() => {
    if (user?.id && Array.isArray(bookings) && bookings.length > 0) {
      const reminders = checkAndGenerateArrivalReminders(user.id, bookings)
      if (reminders.length > 0) {
        setNotifications(getUserNotifications(user.id))
      }
    }
  }, [user?.id, bookings])

  // Check price drops for user favorites
  useEffect(() => {
    if (!user?.id || !Array.isArray(favorites) || favorites.length === 0 || !Array.isArray(properties) || properties.length === 0) {
      return
    }
    const priceKey = `hajzy_fav_prices_${user.id}`
    let prevPrices = {}
    try {
      const raw = localStorage.getItem(priceKey)
      if (raw) prevPrices = JSON.parse(raw)
    } catch {}

    const newPrices = { ...prevPrices }
    favorites.forEach((favId) => {
      const prop = properties.find((p) => String(p.id) === String(favId))
      if (prop && typeof prop.priceValue === 'number') {
        const oldPrice = prevPrices[favId]
        if (typeof oldPrice === 'number' && prop.priceValue < oldPrice) {
          const discountPercent = Math.round(((oldPrice - prop.priceValue) / oldPrice) * 100)
          if (discountPercent > 0) {
            addNotification(
              {
                ar: 'انخفض سعر إقامتك المفضلة',
                en: 'Price drop on your favorite stay',
              },
              {
                ar: `تم تخفيض سعر ${prop.title} بنسبة ${discountPercent}% (من ${oldPrice} إلى ${prop.priceValue} ${prop.currency || 'EGP'}).`,
                en: `Price reduced for ${prop.titleEn || prop.title} by ${discountPercent}% (from ${oldPrice} to ${prop.priceValue} ${prop.currency || 'EGP'}).`,
              },
              'info',
              null,
              prop.id
            )
          }
        }
        newPrices[favId] = prop.priceValue
      }
    })

    try {
      localStorage.setItem(priceKey, JSON.stringify(newPrices))
    } catch {}
  }, [favorites, properties, user?.id])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hajzy_guest_mode', String(isGuestMode))
    }
  }, [isGuestMode])

  useEffect(() => {
    if (properties.length && !selectedProperty) {
      setSelectedProperty(properties[0])
    }
  }, [properties, selectedProperty])

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (isOwner && activePage === 'home') {
      setActivePage('owner')
    }

    if (!isOwner && activePage === 'dashboard' && properties.length && !selectedProperty) {
      setSelectedProperty(properties[0])
    }
  }, [isOwner, activePage, properties, selectedProperty])

  useEffect(() => {
    const loadChatMessages = async () => {
      if (!selectedProperty?.id) {
        setChatMessages([])
        return
      }

      const nextMessages = await fetchChatMessages(selectedProperty.id)
      setChatMessages(nextMessages.length ? nextMessages : [
        { id: 'welcome-message', propertyId: selectedProperty.id, sender: 'owner', text: 'مرحباً! كيف يمكننا مساعدتك؟', createdAt: new Date().toISOString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ])
    }

    loadChatMessages()
  }, [selectedProperty?.id])

  const effectiveUser = user || {
    id: 'guest-demo',
    name: '',
    email: 'guest@hajzy.com',
    role: 'user',
  }

  const navigate = (page, property = selectedProperty, citySlug = null) => {
    haptics.trigger('light')

    // Save scroll position when leaving home
    if (activePage === 'home' && page !== 'home') {
      homeScrollPositionRef.current = window.scrollY || document.documentElement.scrollTop || 0
    }

    if (property) {
      setSelectedProperty(property)
    }

    if (page === 'city') {
      const slug = getCitySlug(citySlug || selectedCitySlug || 'alexandria')
      setSelectedCitySlug(slug)
      try {
        window.history.pushState({ page: 'city', citySlug: slug }, '', `?city=${slug}#city`)
      } catch {}
    } else if (page === 'home') {
      try {
        window.history.pushState({ page: 'home' }, '', window.location.pathname + '#home')
      } catch {}
    } else {
      try {
        window.history.pushState({ page }, '', window.location.pathname + '#' + page)
      } catch {}
    }

    if (page === 'profile') {
      setActivePage('account')
    } else {
      if (page === 'checkout') {
        setBookingStep(1)
        setGuestErrors({})
        setGuestFormTouched(false)
      }
      setActivePage(page)
    }

    // Restore scroll position when returning to home, otherwise scroll to top
    if (page === 'home') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: homeScrollPositionRef.current, left: 0, behavior: 'auto' })
        document.documentElement.scrollTop = homeScrollPositionRef.current
        document.body.scrollTop = homeScrollPositionRef.current
      })
    } else {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      })
    }
  }

  const openAuthScreen = (page = 'login') => {
    setAuthRequired(true)
    setCurrentAuthPage(page)
    setIsGuestMode(false)
  }

  const handleLogin = async (email, password, guest = false) => {
    if (guest || email?.guest) {
      setIsGuestMode(true)
      setAuthRequired(false)
      setCurrentAuthPage('login')
      setActivePage('home')
      return { id: 'guest', name: '', email: 'guest@example.com' }
    }

    setIsGuestMode(false)
    const authUser = await login(email, password)
    if (authUser) {
      setAuthRequired(false)
      setCurrentAuthPage('login')
      setActivePage(authUser.role === 'owner' ? 'owner' : 'dashboard')
      return authUser
    }
    return null
  }

  const handleSocialLogin = async (accountOrProvider) => {
    setIsGuestMode(false)
    localStorage.setItem('hajzy_guest_mode', 'false')
    const authUser = await socialLogin(accountOrProvider)
    if (authUser) {
      setAuthRequired(false)
      setCurrentAuthPage('login')
      setActivePage('home')
      showToast(
        language === 'en'
          ? `Welcome, ${authUser.name || 'User'}!`
          : `أهلاً بك يا ${authUser.name || 'ضيفنا'}!`
      )
      return authUser
    }
    return null
  }

  const handleSignup = async (email, password, name) => {
    setIsGuestMode(false)
    const authUser = await signup(email, password, name)
    if (authUser) {
      setAuthRequired(false)
      setCurrentAuthPage('login')
      setActivePage('home')
      return authUser
    }
    return null
  }

  const handleLogout = () => {
    const confirmed = window.confirm(language === 'en' ? 'Are you sure you want to log out?' : 'هل أنت متأكد أنك تريد تسجيل الخروج؟')
    if (!confirmed) {
      return
    }

    if (isGuestMode) {
      setIsGuestMode(false)
      setAuthRequired(true)
      setCurrentAuthPage('login')
      setActivePage('home')
      return
    }

    logout()
    setAuthRequired(true)
    setCurrentAuthPage('login')
    setActivePage('home')
  }

  const handleLanguageToggle = () => {
    haptics.trigger('light')
    const nextLanguage = language === 'ar' ? 'en' : 'ar'
    void i18n.changeLanguage(nextLanguage)
    setLanguage(nextLanguage)
  }

  const handleSupportRequest = () => {
    const mailtoLink = 'mailto:support@hajzy.com?subject=Support%20Request&body=Hello%20Hajzy%20team%2C%0A%0AI%20need%20help%20with%20my%20booking%20experience.'

    try {
      window.location.href = mailtoLink
    } catch (error) {
      console.error('Support link failed', error)
    }

    showToast(language === 'en' ? 'Support request opened' : 'تم فتح طلب الدعم')
  }

  const handleQuickSearchDateChange = (field, value) => {
    setHomeQuickSearch((current) => {
      const nextState = { ...current, [field]: value }

      if (field === 'checkIn') {
        const nextMinOut = getNextDayISO(value)
        if (!nextState.checkOut || nextState.checkOut < nextMinOut) {
          nextState.checkOut = nextMinOut
        }
      }

      if (field === 'checkOut' && nextState.checkIn) {
        const minOut = getNextDayISO(nextState.checkIn)
        if (value < minOut) {
          nextState.checkOut = minOut
        }
      }

      return nextState
    })
  }

  const quickSearchDateError =
    homeQuickSearch.checkIn &&
    homeQuickSearch.checkOut &&
    new Date(homeQuickSearch.checkOut) <= new Date(homeQuickSearch.checkIn)
      ? language === 'en'
        ? 'Check-out must be after check-in.'
        : 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.'
      : ''

  const showToast = (message) => {
    if (!message) return
    setToast(message)
    setOwnerNotice(message)
  }

  useEffect(() => {
    const handlePaymentReturn = (event) => {
      const returnedUrl = event?.detail?.url
      const isPaymentReturn = returnedUrl?.startsWith('com.hajzy.app://payment-result') ||
        returnedUrl?.startsWith('https://hajzy-83y.pages.dev/payment-result')
      if (!isPaymentReturn) return

      let isSuccess = true
      try {
        const urlObj = new URL(returnedUrl)
        if (urlObj.searchParams.get('success') === 'false') {
          isSuccess = false
        }
      } catch {}

      const pendingId = localStorage.getItem('hajzy_last_pending_booking_id')
      setAuthRequired(false)

      if (isSuccess) {
        try {
          const raw = localStorage.getItem('hajzy_bookings')
          if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) {
              const updated = list.map((b) => {
                if (b.id === pendingId || (!pendingId && b.status === 'pending_payment')) {
                  return { ...b, status: 'confirmed', paidAt: new Date().toISOString() }
                }
                return b
              })
              localStorage.setItem('hajzy_bookings', JSON.stringify(updated))
              setBookings(updated)
            }
          }
        } catch {}

        if (pendingId) {
          updateBooking({ id: pendingId, status: 'confirmed' }).catch(() => {})
        }

        setToast(language === 'en'
          ? 'Payment successful! Your booking is confirmed.'
          : 'تم الدفع بنجاح! تم تأكيد حجزك.')
      } else {
        setToast(language === 'en'
          ? 'Payment was cancelled or failed.'
          : 'تم إلغاء عملية الدفع أو لم تكتمل.')
      }

      setActivePage('bookings')
      fetchBookings()
        .then((savedBookings) => setBookings(Array.isArray(savedBookings) ? savedBookings : []))
        .catch((error) => console.warn('Could not refresh bookings after payment return:', error))
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }))
      try { localStorage.removeItem('hajzy_last_pending_booking_id') } catch {}
    }

    window.addEventListener('hajzyPaymentReturn', handlePaymentReturn)
    return () => window.removeEventListener('hajzyPaymentReturn', handlePaymentReturn)
  }, [language])

  const isFavorite = (propertyId) => favorites.some((id) => String(id) === String(propertyId))

  const toggleFavorite = (event, propertyId) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()

    const favoriteId = String(propertyId)
    const alreadySaved = isFavorite(favoriteId)
    haptics.trigger(alreadySaved ? 'light' : 'medium')

    setFavorites((currentFavorites) =>
      alreadySaved
        ? currentFavorites.filter((id) => String(id) !== favoriteId)
        : [...currentFavorites, favoriteId],
    )

    showToast(alreadySaved ? t('removedFromFavorites') : t('addedToFavorites'))
  }

  const runHomeSearch = () => {
    if (quickSearchDateError) {
      showToast(quickSearchDateError)
      return
    }

    const nextFilter = homeQuickSearch.destination || 'all'
    setActiveFilter(nextFilter)
    setSearchTerm('')
    setShowMapView(false)
    setHomeFilters((current) => ({ ...current, type: 'all', bedrooms: 'any', amenities: [] }))

    window.setTimeout(() => {
      document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    showToast(t('searchApplied'))
  }

  const resolveCurrentUserId = () => {
    let currentUserId = user?.id
    if (!currentUserId && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hajzy_user') || localStorage.getItem('stitch_user')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed?.id) currentUserId = parsed.id
        }
      } catch {}
    }
    return currentUserId || 'guest'
  }

  const addNotification = (title, detail, type = 'info', bookingId = null, propertyId = null) => {
    const currentUserId = resolveCurrentUserId()
    const newNotif = createNotification(currentUserId, {
      type,
      title,
      body: detail,
      detail,
      bookingId,
      propertyId,
    })
    setNotifications((currentNotifications) => [
      newNotif,
      ...currentNotifications.filter((n) => n.id !== newNotif.id),
    ].slice(0, 50))
    if (user?.id) {
      createNotificationApi({ title, body: detail, type, bookingId, propertyId }).catch(() => {})
    }
    return newNotif
  }

  const markAllNotificationsRead = () => {
    const currentUserId = resolveCurrentUserId()
    const updated = markAllAsRead(currentUserId)
    setNotifications(updated)
    if (user?.id) {
      markAllNotificationsReadApi().catch(() => {})
    }
  }

  const removeNotification = (notificationId) => {
    const currentUserId = resolveCurrentUserId()
    const updated = deleteNotification(currentUserId, notificationId)
    setNotifications(updated)
    if (user?.id) {
      deleteNotificationApi(notificationId).catch(() => {})
    }
  }

  const unreadNotificationsCount = notifications.filter((notification) => !notification.readAt && !notification.read).length

  const toggleAmenityFilter = (amenity) => {
    setHomeFilters((currentFilters) => {
      const amenities = currentFilters.amenities.includes(amenity)
        ? currentFilters.amenities.filter((item) => item !== amenity)
        : [...currentFilters.amenities, amenity]

      return {
        ...currentFilters,
        amenities,
      }
    })
  }

  const filteredProperties = properties
    .filter((property) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const searchableText = [
        property.title,
        property.titleEn,
        property.location,
        property.locationEn,
        property.city,
        property.cityEn,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)

      const matchesFavorites = activeFilter !== 'favorites' || isFavorite(property.id)

      const matchesFilter = (() => {
        if (activeFilter === 'favorites') return true
        if (activeFilter === 'all' || !activeFilter) return true
        const cityValues = [property.city, property.cityEn].filter(Boolean).map((value) => value.toLowerCase())
        return cityValues.includes(String(activeFilter).toLowerCase())
      })()

      const matchesGuests = Number(property.guests || 2) >= Number(homeQuickSearch.guests || 1)
      const matchesDates = !homeQuickSearch.checkIn || !homeQuickSearch.checkOut || true
      const matchesPrice = !homeFilters.maxPrice || Number(property.priceValue || 0) <= Number(homeFilters.maxPrice)
      const matchesRating = !homeFilters.ratingMin || Number(property.rating || 0) >= Number(homeFilters.ratingMin)
      const matchesType =
        !homeFilters.type ||
        homeFilters.type === 'all' ||
        (() => {
          const type = String(homeFilters.type).toLowerCase()
          const typeText = `${property.type || ''} ${property.title || ''} ${property.titleEn || ''} ${(property.details || []).join(' ')} ${(property.detailsEn || []).join(' ')}`.toLowerCase()
          if (type === 'apartment' || type === 'شقة') return typeText.includes('شقة') || typeText.includes('suite') || typeText.includes('appartment') || typeText.includes('flat') || typeText.includes('apartment')
          if (type === 'villa' || type === 'فيلا' || type === 'chalet' || type === 'شاليه') return typeText.includes('فيلا') || typeText.includes('villa') || typeText.includes('chalet') || typeText.includes('شاليه')
          if (type === 'hotel' || type === 'فندق') return typeText.includes('فندق') || typeText.includes('hotel') || typeText.includes('جناح')
          if (type === 'resort' || type === 'منتجع') return typeText.includes('شاطئ') || typeText.includes('شرم') || typeText.includes('resort') || typeText.includes('بحر') || typeText.includes('منتجع')
          return typeText.includes(type)
        })()
      const matchesBedrooms =
        homeFilters.bedrooms === 'any' ||
        (() => {
          const bedroomCount = parseInt(
            `${property.details.join(' ')} ${property.title}`.match(/\d+/)?.[0] || '0',
            10,
          )
          if (homeFilters.bedrooms === '1') return bedroomCount <= 1
          if (homeFilters.bedrooms === '2') return bedroomCount <= 2
          if (homeFilters.bedrooms === '3-plus') return bedroomCount >= 3
          return true
        })()
      const amenityAliases = {
        'Wi‑Fi': ['wifi', 'wi-fi', 'wi‑fi', 'واي فاي', 'انترنت', 'إنترنت'],
        Parking: ['parking', 'موقف', 'مواقف', 'جراج'],
        Pool: ['pool', 'مسبح', 'حمام سباحة'],
        'Sea View': ['sea view', 'sea', 'إطلالة بحر', 'بحرية', 'على البحر'],
        Breakfast: ['breakfast', 'إفطار', 'فطور'],
        'Air Conditioning': ['air conditioning', 'air', 'تكييف', 'مكيف'],
      }
      const matchesAmenities =
        homeFilters.amenities.length === 0 ||
        homeFilters.amenities.every((amenity) => {
          const aliases = amenityAliases[amenity] || [amenity]
          const haystack = [...(property.amenities || []), ...(property.amenitiesEn || [])].join(' ').toLowerCase()
          return aliases.some((alias) => haystack.includes(String(alias).toLowerCase()))
        })

      return (
        matchesSearch &&
        matchesFavorites &&
        matchesFilter &&
        matchesGuests &&
        matchesDates &&
        matchesPrice &&
        matchesRating &&
        matchesType &&
        matchesBedrooms &&
        matchesAmenities
      )
    })
    .sort((left, right) => {
      if (homeFilters.sortBy === 'price-low') return Number(left.priceValue) - Number(right.priceValue)
      if (homeFilters.sortBy === 'price-high') return Number(right.priceValue) - Number(left.priceValue)
      if (homeFilters.sortBy === 'rating') return Number(right.rating) - Number(left.rating)
      if (homeFilters.sortBy === 'popular') return Number(right.reviews) - Number(left.reviews)
      return Number(right.rating) * 10 + Number(right.reviews) - (Number(left.rating) * 10 + Number(left.reviews))
    })

  useEffect(() => {
    if (!showMapView) {
      return
    }

    const mapProperties = filteredProperties.slice(0, 4)

    if (!selectedMapPropertyId && mapProperties[0]) {
      setSelectedMapPropertyId(mapProperties[0].id)
      return
    }

    if (selectedMapPropertyId && !mapProperties.some((property) => property.id === selectedMapPropertyId)) {
      setSelectedMapPropertyId(mapProperties[0]?.id || null)
    }
  }, [filteredProperties, selectedMapPropertyId, showMapView])

  const stayNights = nightsBetween(bookingDates?.checkIn, bookingDates?.checkOut)

  const AVAILABLE_PROMOS = {
    COAST20: { percent: 20, labelAr: 'خصم الساحل الحصري 20%', labelEn: '20% Coastal Exclusive Deal' },
    HAJZY10: { percent: 10, labelAr: 'خصم حاجزي 10%', labelEn: '10% Hajzy Discount' },
    WELCOME15: { percent: 15, labelAr: 'خصم الضيوف الجدد 15%', labelEn: '15% Welcome Discount' },
    WELCOME: { percent: 10, labelAr: 'خصم الترحيب 10%', labelEn: '10% Welcome Discount' },
    SUMMER20: { percent: 20, labelAr: 'خصم الصيف 20%', labelEn: '20% Summer Discount' },
    EID25: { percent: 25, labelAr: 'خصم العيد 25%', labelEn: '25% Eid Discount' },
  }

  const handleApplyPromoCode = (codeToApply = null) => {
    const rawCode = (typeof codeToApply === 'string' ? codeToApply : promoCodeInput || '').trim().toUpperCase()
    if (!rawCode) {
      setPromoError(language === 'en' ? 'Please enter a promo code' : 'يرجى إدخال كود الخصم أولاً')
      return
    }

    const promo = AVAILABLE_PROMOS[rawCode]
    if (promo) {
      setAppliedPromo({
        code: rawCode,
        percent: promo.percent,
        label: language === 'en' ? promo.labelEn : promo.labelAr,
      })
      setPromoCodeInput(rawCode)
      setPromoError('')
      showToast(
        language === 'en'
          ? `🎉 Promo code ${rawCode} applied! Saved ${promo.percent}%`
          : `🎉 تم تطبيق كود الخصم ${rawCode} بنجاح! وفرت ${promo.percent}%`
      )
    } else {
      setPromoError(
        language === 'en'
          ? 'Invalid or expired promo code. Try COAST20'
          : 'كود الخصم غير صالح أو منتهي الصلاحية. جرّب COAST20'
      )
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromo(null)
    setPromoCodeInput('')
    setPromoError('')
    showToast(language === 'en' ? 'Promo code removed' : 'تمت إزالة كود الخصم')
  }

  const bookingTotal = selectedProperty ? selectedProperty.priceValue * stayNights : 0
  const promoDiscountAmount = appliedPromo ? Math.round((bookingTotal * appliedPromo.percent) / 100) : 0
  const subtotalAfterDiscount = Math.max(0, bookingTotal - promoDiscountAmount)
  const serviceFee = Math.round(subtotalAfterDiscount * 0.08)
  const grandTotal = subtotalAfterDiscount + serviceFee
  const bookingBreakdown = [
    {
      label: language === 'en' ? 'Stay total' : 'إجمالي الإقامة',
      value: bookingTotal,
    },
    ...(appliedPromo ? [{
      label: language === 'en' ? `Promo discount (${appliedPromo.code} -${appliedPromo.percent}%)` : `خصم الكوبون (${appliedPromo.code} -${appliedPromo.percent}%)`,
      value: promoDiscountAmount,
      isDiscount: true,
    }] : []),
    {
      label: language === 'en' ? 'Service fee' : 'رسوم الخدمة',
      value: serviceFee,
    },
    {
      label: language === 'en' ? 'Total due' : 'الإجمالي النهائي',
      value: grandTotal,
      total: true,
    },
  ]
  const getContextualReply = (text, prop) => {
    const lower = String(text || '').toLowerCase()
    if (lower.includes('واي فاي') || lower.includes('wifi') || lower.includes('internet') || lower.includes('نت')) {
      return language === 'en'
        ? 'Yes! We have high-speed Fiber Wi-Fi (100 Mbps) available throughout the property for free.'
        : 'نعم بالتأكيد! يتوفر إنترنت فائق السرعة فايبر (100 ميجا) يغطي كامل الشقة مجاناً.'
    }
    if (lower.includes('وصول') || lower.includes('دخول') || lower.includes('check-in') || lower.includes('مواعيد') || lower.includes('time')) {
      return language === 'en'
        ? 'Check-in is from 3:00 PM and check-out is by 12:00 PM. Early check-in can be arranged upon availability.'
        : 'تسجيل الوصول يبدأ من الساعة 3:00 عصراً والمغادرة حتى 12:00 ظهراً، مع إمكانية الدخول المبكر حسب التوفر.'
    }
    if (lower.includes('موقف') || lower.includes('سيار') || lower.includes('parking') || lower.includes('جراج')) {
      return language === 'en'
        ? 'Free private and secure parking is available on premises for our guests.'
        : 'نعم، يتوفر موقف سيارات مجاني ومؤمن وخاص بضيوف الشقة داخل العقار.'
    }
    if (lower.includes('موقع') || lower.includes('لوكيشن') || lower.includes('location') || lower.includes('مكان') || lower.includes('عنوان')) {
      return language === 'en'
        ? `The property is located at ${prop?.location || 'our verified address'}. We will send you direct GPS coordinates and keyless entry code once booked!`
        : `موقعنا في ${prop?.location || 'العنوان المعتمد'}، وسنرسل لك إحداثيات GPS المباشرة وكود الدخول الذكي فور تأكيد الحجز!`
    }
    return language === 'en'
      ? `Thank you for your message! We are available 24/7 and happy to assist you with anything regarding ${prop?.title || 'your stay'}.`
      : `أهلاً بك! نسعد بخدمتك طوال 24 ساعة للإجابة عن أي استفسار حول ${prop?.title || 'الإقامة'}.`
  }

  const handleSendMessage = async (customMessage = null) => {
    const trimmedMessage = (typeof customMessage === 'string' ? customMessage : chatInput).trim()
    if (!trimmedMessage || !selectedProperty?.id) return

    const newMessage = {
      id: Date.now(),
      propertyId: selectedProperty.id,
      sender: 'user',
      text: trimmedMessage,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const savedMessage = await addChatMessage(newMessage)
    setChatMessages((currentMessages) => [...currentMessages, savedMessage])
    if (!customMessage) setChatInput('')

    const replyText = getContextualReply(trimmedMessage, selectedProperty)

    setTimeout(() => {
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          propertyId: selectedProperty.id,
          sender: 'owner',
          text: replyText,
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }, 450)
  }

  const ownerProperties = isOwner
    ? properties.filter((property) => {
        const isOwnedByCurrentUser = property.ownerId === user?.id
        const isDemoOwnerProperty = user?.role === 'owner' && !property.ownerId
        return isOwnedByCurrentUser || isDemoOwnerProperty
      })
    : []

  const ownerBookings = isOwner
    ? bookings.filter((booking) => {
        const property = properties.find((item) => item.id === booking.propertyId)
        return property && (property.ownerId === user?.id || (!property.ownerId && user?.role === 'owner'))
      })
    : []

  const filteredOwnerBookings = ownerBookings.filter((booking) => {
    if (ownerBookingFilter === 'all') return true
    return booking.status === ownerBookingFilter
  })

  const handleOwnerAcceptBooking = async (bookingId) => {
    const booking = bookings.find((b) => String(b.id) === String(bookingId))
    if (!booking) return
    const updated = await updateBooking({ ...booking, status: 'confirmed' })
    setBookings((prev) => prev.map((item) => (String(item.id) === String(bookingId) ? { ...item, status: 'confirmed' } : item)))
    showToast(language === 'en' ? 'Booking confirmed successfully' : 'تم قبول وتأكيد الحجز بنجاح')

    // Notify guest
    const prop = properties.find((p) => String(p.id) === String(booking.propertyId))
    createNotification(booking.userId || booking.guestId || 'guest', {
      type: 'booking_confirmed',
      title: { ar: 'تم تأكيد حجزك 🌟', en: 'Booking Confirmed 🌟' },
      body: {
        ar: `وافق المالك على حجزك في "${prop?.title || booking.title || 'العقار'}". نتمنى لك إقامة ممتعة!`,
        en: `Owner confirmed your booking at "${prop?.titleEn || booking.title || 'property'}". Enjoy your stay!`,
      },
      bookingId: booking.id,
      propertyId: booking.propertyId,
      status: 'confirmed',
    })
  }

  const handleOwnerRejectBooking = async (bookingId) => {
    const booking = bookings.find((b) => String(b.id) === String(bookingId))
    if (!booking) return
    if (!window.confirm(language === 'en' ? 'Are you sure you want to decline this booking request?' : 'هل أنت متأكد من رغبتك في رفض طلب الحجز هذا؟')) {
      return
    }
    const updated = await updateBooking({ ...booking, status: 'cancelled' })
    setBookings((prev) => prev.map((item) => (String(item.id) === String(bookingId) ? { ...item, status: 'cancelled' } : item)))
    showToast(language === 'en' ? 'Booking request declined' : 'تم رفض طلب الحجز')

    // Notify guest
    const prop = properties.find((p) => String(p.id) === String(booking.propertyId))
    createNotification(booking.userId || booking.guestId || 'guest', {
      type: 'booking_cancelled',
      title: { ar: 'اعتذار عن قبول الحجز ⚠️', en: 'Booking Request Declined ⚠️' },
      body: {
        ar: `نعتذر، تعذر على المالك قبول حجزك في "${prop?.title || booking.title || 'العقار'}" في هذه التواريخ.`,
        en: `Unfortunately, the owner was unable to accept your booking at "${prop?.titleEn || booking.title || 'property'}".`,
      },
      bookingId: booking.id,
      propertyId: booking.propertyId,
      status: 'cancelled',
    })
  }

  const ownerRevenue = ownerBookings.reduce((sum, item) => sum + Number(item.total || 0), 0)

  const resetOwnerForm = () => {
    setOwnerEditingId(null)
    setPropertyForm({
      title: '',
      city: 'الإسكندرية',
      location: '',
      priceValue: '',
      image: '',
      amenities: '',
      description: '',
      bookingInfo: '',
    })
  }

  const handleOwnerQuickAction = (action) => {
    if (action === 'manage') {
      document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      showToast(language === 'en' ? 'You can now manage properties from the form below.' : 'يمكنك الآن إدارة العقارات من نموذج إضافة الشقة.')
      return
    }

    if (action === 'price') {
      document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      showToast(language === 'en' ? 'Price update mode active. You can modify property pricing in the form.' : 'وضع تحديث الأسعار مفعل. يمكنك تعديل سعر أي عقار من النموذج.')
      return
    }

    if (action === 'message') {
      setChatOpen(true)
      showToast(language === 'en' ? 'Welcome message prepared for guests. You can send it from property chat.' : 'تم تجهيز رسالة ترحيب للضيوف، ويمكنك إرسالها من محادثة العقار.')
      return
    }

    if (action === 'report') {
      const csvRows = [
        language === 'en'
          ? ['Property', 'Status', 'Total', 'Check In', 'Check Out']
          : ['العقار', 'الحالة', 'الإجمالي', 'تاريخ الوصول', 'تاريخ المغادرة'],
        ...ownerBookings.map((booking) => [
          booking.title || (language === 'en' ? 'Property' : 'العقار'),
          booking.status === 'confirmed'
            ? (language === 'en' ? 'Confirmed' : 'مؤكد')
            : (language === 'en' ? 'Pending' : 'قيد المراجعة'),
          String(booking.total || 0),
          booking.checkIn || '',
          booking.checkOut || '',
        ]),
      ]

      const csvContent = csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'owner-report.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast(language === 'en' ? 'Bookings report exported successfully.' : 'تم تصدير تقرير الحجوزات بنجاح.')
    }
  }

  const handleOwnerAlertDetails = () => {
    setOwnerBookingFilter('all')
    document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showToast(language === 'en' ? 'Showing all bookings on screen' : 'تم تحديث عرض الحجوزات على الشاشة.')
  }

  const handleViewAllOwnerBookings = () => {
    setOwnerBookingFilter('all')
    document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleViewAllProperties = () => {
    setSearchTerm('')
    setActiveFilter('all')
    setHomeQuickSearch((current) => ({ ...current, destination: '' }))
    navigate('home')
  }

  const handleOwnerEditProperty = (property) => {
    setOwnerEditingId(property.id)
    setPropertyForm({
      title: property.title,
      city: property.city,
      location: property.location,
      priceValue: String(property.priceValue),
      image: property.image || '',
      amenities: Array.isArray(property.amenities) ? property.amenities.join(', ') : '',
      description: property.description || '',
      bookingInfo: property.bookingInfo || '',
    })
    setOwnerNotice('')
  }

  const handleOwnerDeleteProperty = async (propertyId) => {
    if (!window.confirm('هل تريد حذف هذا العقار؟')) {
      return
    }

    await deleteProperty(propertyId)
    setProperties((currentProperties) => {
      const remaining = currentProperties.filter((property) => property.id !== propertyId)
      if (selectedProperty?.id === propertyId) {
        setSelectedProperty(remaining[0] || null)
      }
      return remaining
    })

    if (ownerEditingId === propertyId) {
      resetOwnerForm()
    }

    showToast('تم حذف العقار بنجاح')
  }

  const handleOwnerAddProperty = async (event) => {
    event.preventDefault()

    if (!propertyForm.title || !propertyForm.location || !propertyForm.priceValue) {
      showToast('يرجى تعبئة عنوان الشقة والموقع والسعر قبل الحفظ')
      return
    }

    const sanitizedAmenities = propertyForm.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const sanitizedProperty = {
      title: propertyForm.title,
      location: propertyForm.location,
      city: propertyForm.city,
      priceValue: Number(propertyForm.priceValue),
      currency: 'EGP',
      guests: 2,
      rating: 4.7,
      reviews: 0,
      image:
        propertyForm.image ||
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      details: ['غرفة نوم', 'موقع مميز', 'تجهيز كامل'],
      description: propertyForm.description || 'إعلان جديد أضيف من لوحة المالك، جاهز للحجز فوراً.',
      amenities: sanitizedAmenities.length ? sanitizedAmenities : ['تجهيز كامل', 'موقع ممتاز', 'أمان', 'تجهيز داخلي'],
      bookingInfo: propertyForm.bookingInfo || 'إلغاء مجاني حتى 48 ساعة قبل الوصول.',
      ownerId: user.id,
    }

    const responseProperty = ownerEditingId
      ? await updateProperty({ ...sanitizedProperty, id: ownerEditingId })
      : await addProperty({ ...sanitizedProperty, id: `owner-${Date.now()}` })

    setProperties((currentProperties) => {
      if (ownerEditingId) {
        return currentProperties.map((property) =>
          property.id === ownerEditingId ? responseProperty : property,
        )
      }
      return [responseProperty, ...currentProperties]
    })

    setSelectedProperty(responseProperty)
    showToast(ownerEditingId ? 'تم تحديث الشقة بنجاح' : activeText.propertyAdded)
    resetOwnerForm()
  }

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('هل تريد حذف هذا الحجز؟')) {
      return
    }

    await deleteBooking(bookingId)
    setBookings((currentBookings) => currentBookings.filter((booking) => booking.id !== bookingId))
    showToast('تم حذف الحجز بنجاح')
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('هل تريد إلغاء هذا الحجز؟')) {
      return
    }

    const cancelledBooking = await updateBooking({
      id: bookingId,
      status: 'cancelled',
    })

    setBookings((currentBookings) =>
      currentBookings.map((booking) => (booking.id === bookingId ? { ...booking, status: cancelledBooking?.status || 'cancelled' } : booking)),
    )
    addNotification(
      { ar: 'تم إلغاء الحجز', en: 'Booking Cancelled' },
      { ar: 'تم تحديث حالة الحجز بنجاح وسيتم إبلاغك بأي تغييرات لاحقًا.', en: 'Booking status updated successfully. You will be notified of any changes.' },
      'warning'
    )
    showToast('تم إلغاء الحجز بنجاح')
  }

  const handleBookingStatusToggle = async (booking) => {
    const nextStatus = booking.status === 'confirmed' ? 'pending' : 'confirmed'
    const updatedBooking = await updateBooking({ ...booking, status: nextStatus })
    setBookings((currentBookings) =>
      currentBookings.map((item) => (item.id === updatedBooking.id ? updatedBooking : item)),
    )
    showToast(nextStatus === 'confirmed' ? 'تم تأكيد الحجز' : 'تم إرجاع الحجز إلى قيد المراجعة')
  }

  const handleBookingConfirm = async () => {
    if (!selectedProperty) {
      return
    }

    if (isProcessingPayment || isBookingSubmittingRef.current) {
      return
    }

    const guestValidation = validateGuestForm(guestForm, language)
    if (!guestValidation.isValid) {
      setBookingStep(2)
      setGuestErrors(guestValidation.errors)
      setGuestFormTouched(true)
      showToast(language === 'en' ? 'Please complete your guest details.' : 'يرجى إكمال بيانات الضيف بشكل صحيح.')
      return
    }

    if (paymentMethod === 'wallet') {
      const cleanWallet = cleanPhoneNumber(walletNumber)
      if (!cleanWallet) {
        showToast(
          language === 'en'
            ? 'Please enter your mobile wallet number.'
            : 'يرجى إدخال رقم الهاتف المسجل بالمحفظة الإلكترونية.'
        )
        return
      }
      if (!/^01[0125]\d{8}$/.test(cleanWallet)) {
        showToast(
          language === 'en'
            ? 'Invalid Egyptian wallet number, e.g. 01012345678'
            : 'رقم محفظة غير صحيح، مثال: 01012345678'
        )
        return
      }
    }

    const effectiveInstapayHandle = paymentMethod === 'instapay'
      ? (instapayHandle.trim() || 'hajzy@instapay')
      : null
    if (paymentMethod === 'instapay' && !instapayHandle.trim()) {
      setInstapayHandle('hajzy@instapay')
    }

    const normalizedGuest = guestValidation.normalizedData

    isBookingSubmittingRef.current = true
    setIsProcessingPayment(true)

    try {
      const reference = `#REF-${Math.floor(10000 + Math.random() * 90000)}`

      let paymentSession = null
      let paymobAmount = grandTotal
      if (String(selectedProperty.currency || 'EGP').toUpperCase() !== 'EGP') {
        const ratesToEGP = { USD: 49.5, SAR: 13.2, EUR: 53.5, AED: 13.5 }
        const propCurrency = String(selectedProperty.currency).toUpperCase()
        const rate = ratesToEGP[propCurrency] || 1
        paymobAmount = Math.round(grandTotal * rate)
      }

      // Only attempt Paymob session creation for card payments
      if (paymentMethod === 'card') {
        try {
          paymentSession = await createPaymobPaymentSession({
            amount: paymobAmount,
            currency: 'EGP',
            propertyTitle: selectedProperty.title,
            paymentMethod: 'card',
            // Return to the installed Android app or directly to the current web origin's payment-result
            returnUrl: Capacitor.getPlatform() === 'android'
              ? 'com.hajzy.app://payment-result'
              : (typeof window !== 'undefined' ? `${window.location.origin}/payment-result` : undefined),
          })
        } catch (cardErr) {
          console.warn('Paymob session creation unavailable, proceeding with instant confirmation fallback:', cardErr)
        }
      }

      const newBooking = {
        id: `booking-${Date.now()}`,
        propertyId: selectedProperty.id,
        title: selectedProperty.title,
        location: selectedProperty.location,
        image: selectedProperty.image,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        guests: Number(bookingDates.guests),
        pricePerNight: Number(selectedProperty.priceValue || 0),
        nights: Number(stayNights || 1),
        serviceFee: Number(serviceFee || 0),
        discountAmount: promoDiscountAmount || 0,
        promoCode: appliedPromo?.code || null,
        total: grandTotal,
        currency: selectedProperty.currency,
        status: (paymentMethod === 'card' && paymentSession?.redirectUrl) ? 'pending_payment' : 'confirmed',
        reference,
        paymentMethod,
        userId: user?.id || null,
        fullName: normalizedGuest.fullName,
        phone: normalizedGuest.phone,
        email: normalizedGuest.email,
        notes: normalizedGuest.notes,
        guestName: normalizedGuest.fullName,
        guestPhone: normalizedGuest.phone,
        guestEmail: normalizedGuest.email,
        walletNumber: paymentMethod === 'wallet' ? cleanPhoneNumber(walletNumber) : null,
        instapayHandle: effectiveInstapayHandle,
      }

      if (paymentSession?.redirectUrl && typeof window !== 'undefined') {
        // This write must finish before leaving the app.
        const savedBooking = await addBooking(newBooking)
        try {
          localStorage.setItem('hajzy_last_pending_booking_id', newBooking.id)
          if (!user) {
            localStorage.setItem('hajzy_guest_mode', 'true')
          }
        } catch {}
        setBookings((currentBookings) => [{ ...savedBooking, paymentMethod }, ...currentBookings])
        window.location.href = paymentSession.redirectUrl
        return
      }

      const savedBooking = await addBooking(newBooking)
      const confirmedBooking = { ...savedBooking, paymentMethod }
      setLastBooking(confirmedBooking)
      setBookings((currentBookings) => [confirmedBooking, ...currentBookings])
      addNotification(
        { ar: 'تم تأكيد حجزك', en: 'Booking Confirmed' },
        {
          ar: `تم حجز ${selectedProperty.title} بنجاح، موعد الوصول ${bookingDates.checkIn}، وإجمالي ${formatCurrency(grandTotal, selectedProperty.currency, 'ar')}.`,
          en: `Successfully booked ${selectedProperty.title_en || selectedProperty.title}, arrival on ${bookingDates.checkIn}, total ${formatCurrency(grandTotal, selectedProperty.currency, 'en')}.`,
        },
        'booking_confirmed',
        confirmedBooking.id,
        selectedProperty.id
      )

      // Generate notification for the property owner
      const targetOwnerId = selectedProperty.ownerId || (user?.role === 'owner' ? user.id : 'owner-demo')
      const ownerNotifType = confirmedBooking.status === 'pending' ? 'booking_pending' : 'booking_confirmed'
      createOwnerBookingNotification({
        ownerId: targetOwnerId,
        property: selectedProperty,
        booking: confirmedBooking,
        guestName: normalizedGuest.fullName,
        guestPhone: normalizedGuest.phone,
        guestEmail: normalizedGuest.email,
        dates: bookingDates,
        total: grandTotal,
        currency: selectedProperty.currency,
        type: ownerNotifType,
      })
      if (targetOwnerId !== 'owner-demo') {
        createOwnerBookingNotification({
          ownerId: 'owner-demo',
          property: selectedProperty,
          booking: confirmedBooking,
          guestName: normalizedGuest.fullName,
          guestPhone: normalizedGuest.phone,
          guestEmail: normalizedGuest.email,
          dates: bookingDates,
          total: grandTotal,
          currency: selectedProperty.currency,
          type: ownerNotifType,
        })
      }
      cacheBooking(confirmedBooking, selectedProperty)
      haptics.trigger('heavy')
      navigate('success')
    } catch (error) {
      haptics.trigger('error')
      const fallback = language === 'en'
        ? 'Unable to start the payment. Please try again.'
        : 'تعذر بدء عملية الدفع. يرجى المحاولة مرة أخرى.'
      showToast(error?.message || fallback)
    } finally {
      isBookingSubmittingRef.current = false
      setIsProcessingPayment(false)
    }
  }

  const pendingOwnerBookingsCount = ownerBookings.filter((b) => b.status === 'pending').length

  const renderOwnerPage = () => (
    <div className="page-shell owner-shell">
      <div className="owner-dashboard-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <span className="owner-dashboard-kicker">Owner Portal</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {language === 'en' ? 'Owner Dashboard' : 'لوحة تحكم المالك'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'en'
              ? `Welcome back, ${user?.name || user?.fullName || 'Owner'} • Manage stays, bookings and revenue`
              : `مرحباً بك، ${user?.name || user?.fullName || 'المالك'} • إدارة العقارات والطلبات والأرباح في مكان واحد`}
          </p>
        </div>
        <div className="owner-header-actions flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500 transition"
            onClick={() => document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>{language === 'en' ? 'Add New Property' : 'إضافة شقة جديدة'}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            onClick={() => navigate('owner-settings')}
          >
            <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">tune</span>
            <span>{language === 'en' ? 'Owner Settings' : 'إعدادات المالك'}</span>
          </button>
        </div>
      </div>

      <div className="owner-summary-grid-wrap">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="owner-summary-card accent">
            <div className="owner-card-topline">
              <p>{language === 'en' ? 'Total Properties' : 'إجمالي العقارات'}</p>
              <span className="owner-stat-icon material-symbols-outlined">apartment</span>
            </div>
            <strong>{formatNumber(ownerProperties.length)}</strong>
            <small>+{formatNumber(Math.max(1, Math.round(ownerProperties.length * 0.3)))} {language === 'en' ? 'this month' : 'هذا الشهر'}</small>
          </div>

          <div
            onClick={() => {
              setOwnerBookingFilter('pending')
              document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="owner-summary-card warn cursor-pointer hover:shadow-md transition"
          >
            <div className="owner-card-topline">
              <p>{language === 'en' ? 'Pending Requests' : 'الطلبات المعلقة'}</p>
              <span className="owner-stat-icon material-symbols-outlined">pending_actions</span>
            </div>
            <strong>{formatNumber(pendingOwnerBookingsCount)}</strong>
            <small>{pendingOwnerBookingsCount ? `${formatNumber(pendingOwnerBookingsCount)} ${language === 'en' ? 'need review' : 'تحتاج مراجعة'}` : (language === 'en' ? 'No pending requests' : 'لا توجد طلبات معلقة')}</small>
          </div>

          <div className="owner-summary-card success">
            <div className="owner-card-topline">
              <p>{language === 'en' ? 'Total Revenue' : 'إجمالي الإيرادات'}</p>
              <span className="owner-stat-icon material-symbols-outlined">payments</span>
            </div>
            <strong>{formatCurrency(ownerRevenue, 'EGP', language)}</strong>
            <small>+18.4% {language === 'en' ? 'vs last week' : 'مقارنة بالأسبوع الماضي'}</small>
          </div>

          <div className="owner-summary-card accent">
            <div className="owner-card-topline">
              <p>{language === 'en' ? 'Host Rating' : 'تقييم المضيف'}</p>
              <span className="owner-stat-icon material-symbols-outlined text-amber-500">star</span>
            </div>
            <strong>{formatNumber(4.9, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ★</strong>
            <small>{language === 'en' ? 'Guest satisfaction (12+ reviews)' : 'متوسط رضا الضيوف (12+ تقييم)'}</small>
          </div>
        </div>
      </div>

      <div className="owner-action-rail" role="toolbar" aria-label={language === 'en' ? 'Quick actions' : 'إجراءات سريعة'}>
        <button type="button" className="secondary-button small-button" onClick={() => document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <span className="material-symbols-outlined">add</span>
          <span>{language === 'en' ? 'Add Property' : 'إضافة عقار'}</span>
        </button>
        <button
          type="button"
          className="secondary-button small-button"
          onClick={() => {
            setOwnerBookingFilter('pending')
            document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <span className="material-symbols-outlined">pending_actions</span>
          <span>{language === 'en' ? `Review Requests (${formatNumber(pendingOwnerBookingsCount)})` : `مراجعة الطلبات (${formatNumber(pendingOwnerBookingsCount)})`}</span>
        </button>
        <button
          type="button"
          className="secondary-button small-button"
          onClick={() => {
            setOwnerBookingFilter('all')
            document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <span className="material-symbols-outlined">list_alt</span>
          <span>{language === 'en' ? `All Bookings (${formatNumber(ownerBookings.length)})` : `كل الحجوزات (${formatNumber(ownerBookings.length)})`}</span>
        </button>
        <button type="button" className="secondary-button small-button" onClick={() => handleOwnerQuickAction('report')}>
          <span className="material-symbols-outlined">download</span>
          <span>{language === 'en' ? 'Export Report' : 'تصدير تقرير'}</span>
        </button>
        <button type="button" className="secondary-button small-button" onClick={() => navigate('owner-settings')}>
          <span className="material-symbols-outlined">settings</span>
          <span>{language === 'en' ? 'Operations Settings' : 'إعدادات التشغيل'}</span>
        </button>
      </div>

      <div className="owner-feature-banner">
        <div className="owner-feature-main">
          <span className="owner-feature-kicker">{language === 'en' ? 'Weekly High Demand' : 'أعلى طلب هذا الأسبوع'}</span>
          <h3 className="m-0 text-lg sm:text-xl font-bold">{language === 'en' ? 'Top demand in your properties' : 'إقبال قياسي على وحداتك هذا الأسبوع'}</h3>
          <p className="text-xs text-emerald-100/80 m-0 mt-1">
            {language === 'en'
              ? 'Peak booking demand detected in your stays. Review new requests and adjust weekend rates.'
              : 'تم رصد زيادة في معدل الحجوزات لوحداتك — راجع الطلبات الجديدة واستفد من تعديل أسعار الويك إند.'}
          </p>
        </div>
        <div className="owner-feature-actions-wrap flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="owner-feature-pills">
            <span>{language === 'en' ? 'Occupancy 78%' : 'إشغال 78%'}</span>
            <span>{language === 'en' ? 'Confirmed 84%' : 'حجوزات مؤكدة 84%'}</span>
            <span>{language === 'en' ? 'Rating 4.9 ★' : 'تقييم 4.9 ★'}</span>
          </div>
          <button
            type="button"
            className="owner-feature-cta-button inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer"
            onClick={() => document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span>{language === 'en' ? 'Review Bookings & Demand' : 'مراجعة الطلبات والحجوزات'}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className="owner-overview">
        <div className="owner-overview-card wide">
          <div className="owner-overview-header">
            <h3>{language === 'en' ? 'Quick Overview' : 'نظرة سريعة'}</h3>
            <span className="status-pill">{language === 'en' ? 'Updated' : 'محدث الآن'}</span>
          </div>
          <div className="owner-metrics-grid">
            <div>
              <span>{language === 'en' ? 'Avg Occupancy' : 'متوسط الإشغال'}</span>
              <strong>{formatNumber(78)}%</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Top Destination' : 'أعلى مدينة'}</span>
              <strong>{language === 'en' ? 'Alexandria' : 'الإسكندرية'}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Monthly Revenue' : 'إيراد هذا الشهر'}</span>
              <strong>{formatCurrency(ownerRevenue, 'EGP', language)}</strong>
            </div>
          </div>
          <div className="owner-progress-list">
            <div>
              <div className="label-row">
                <span>{language === 'en' ? 'Confirmed Requests' : 'الطلبات المؤكدة'}</span>
                <strong>{formatNumber(84)}%</strong>
              </div>
              <div className="progress-bar"><span style={{ width: '84%' }}></span></div>
            </div>
            <div>
              <div className="label-row">
                <span>{language === 'en' ? 'Monthly Occupancy' : 'الإشغال هذا الشهر'}</span>
                <strong>{formatNumber(71)}%</strong>
              </div>
              <div className="progress-bar"><span style={{ width: '71%' }}></span></div>
            </div>
          </div>
        </div>

        <div className="owner-overview-card">
          <div className="owner-overview-header relative">
            <h3>{language === 'en' ? 'Reviews' : 'التقييمات'}</h3>
            <div className="relative inline-flex items-center gap-1.5">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                {language === 'en' ? 'vs last month' : 'مقارنة بالشهر الماضي'}
              </span>
              <button
                type="button"
                className="status-pill neutral cursor-pointer inline-flex items-center gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition"
                onClick={() => setShowReviewsTooltip((prev) => !prev)}
                title={language === 'en' ? `+${formatNumber(12)}% increase in guest reviews count compared to last month` : `+${formatNumber(12)}% زيادة في عدد تقييمات الضيوف مقارنة بالشهر الماضي`}
                aria-label={language === 'en' ? `+${formatNumber(12)}% vs last month` : `+${formatNumber(12)}% مقارنة بالشهر الماضي`}
              >
                <span>+{formatNumber(12)}%</span>
                <span className="material-symbols-outlined text-[13px] text-slate-400">info</span>
              </button>

              {showReviewsTooltip && (
                <div className="absolute top-full mt-2 ltr:right-0 rtl:left-0 z-30 w-56 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-slate-700 animate-fadeIn">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <strong className="text-emerald-400 font-bold">
                      {language === 'en' ? `+${formatNumber(12)}% Reviews Growth` : `+${formatNumber(12)}% نمو التقييمات`}
                    </strong>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowReviewsTooltip(false)
                      }}
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                  <p className="m-0 text-slate-300">
                    {language === 'en'
                      ? `${formatNumber(12)}% increase in the number of guest reviews compared to the previous 30-day period.`
                      : `زيادة بنسبة ${formatNumber(12)}% في إجمالي عدد تقييمات الضيوف مقارنة بفترة الـ 30 يوماً السابقة.`}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="rating-score-box">
            <strong>{formatNumber(4.9, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
            <span>{language === 'en' ? 'Average Guest Rating' : 'متوسط تقييم الضيوف'}</span>
          </div>
          <ul className="mini-score-list">
            <li><span>{language === 'en' ? 'Cleanliness' : 'النظافة'}</span><strong>{formatNumber(4.9, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong></li>
            <li><span>{language === 'en' ? 'Location' : 'الموقع'}</span><strong>{formatNumber(4.8, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong></li>
            <li><span>{language === 'en' ? 'Communication' : 'التواصل'}</span><strong>{formatNumber(5.0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong></li>
          </ul>
        </div>
      </div>

      {/* Interactive Host Calendar & Seasonal Pricing Management */}
      <HostCalendar
        language={language}
        basePrice={ownerProperties[0]?.priceValue || 2800}
        currency={ownerProperties[0]?.currency || 'EGP'}
        propertyTitle={ownerProperties[0]?.title || (language === 'en' ? 'My Properties' : 'عقاراتي')}
      />

      <div className="owner-operational-panel">
        <div className="owner-overview-header">
          <h3>{language === 'en' ? 'Operational Alerts' : 'تنبيهات التشغيل'}</h3>
          <span className="status-pill neutral">{language === 'en' ? 'Today' : 'اليوم'}</span>
        </div>

        {pendingOwnerBookingsCount > 0 ? (
          <div className="owner-alert-row urgent-alert">
            <div>
              <span className="material-symbols-outlined text-amber-600">notifications_active</span>
              <div>
                <strong>
                  {language === 'en'
                    ? `${formatNumber(pendingOwnerBookingsCount)} new ${pendingOwnerBookingsCount === 1 ? 'booking request' : 'booking requests'}`
                    : `${formatNumber(pendingOwnerBookingsCount)} ${pendingOwnerBookingsCount === 1 ? 'طلب حجز جديد' : pendingOwnerBookingsCount === 2 ? 'طلبا حجز جديدان' : 'طلبات حجز جديدة'}`}
                </strong>
                <small>
                  {language === 'en' ? 'Awaiting your review and approval' : 'تحتاج إلى مراجعة وتأكيد من المالك'}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => {
                setOwnerBookingFilter('pending')
                document.getElementById('owner-bookings-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {language === 'en' ? 'Review' : 'مراجعة'}
            </button>
          </div>
        ) : (
          <div className="owner-alert-row success-alert">
            <div>
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <div>
                <strong>{language === 'en' ? 'All operations up to date' : 'لا توجد طلبات معلقة'}</strong>
                <small>
                  {language === 'en'
                    ? `${formatNumber(ownerBookings.length)} bookings confirmed & active`
                    : `تمت مراجعة كافة الطلبات (${formatNumber(ownerBookings.length)} حجز مؤكد)`}
                </small>
              </div>
            </div>
            <span className="status-pill success">{language === 'en' ? 'Up to date' : 'منتظم'}</span>
          </div>
        )}

        <div className="owner-alert-row">
          <div>
            <span className="material-symbols-outlined">trending_up</span>
            <div>
              <strong>{language === 'en' ? 'Weekend Pricing Optimization' : 'تحديث أسعار السكن'}</strong>
              <small>
                {language === 'en'
                  ? 'Recommended weekend surge based on current city occupancy'
                  : 'توصية بزيادة 15% في عطلة نهاية الأسبوع وفق نسب الإقبال'}
              </small>
            </div>
          </div>
          <button type="button" className="text-button" onClick={handleOwnerAlertDetails}>
            {language === 'en' ? 'Details' : 'تفاصيل'}
          </button>
        </div>
      </div>

      <div className="owner-quick-actions">
        <button type="button" className="primary-button" onClick={() => handleOwnerQuickAction('manage')}>
          {language === 'en' ? 'Manage Properties' : 'إدارة العقارات'}
        </button>
        <button type="button" className="secondary-button" onClick={() => handleOwnerQuickAction('price')}>
          {language === 'en' ? 'Update Prices' : 'تحديث الأسعار'}
        </button>
        <button type="button" className="secondary-button" onClick={() => handleOwnerQuickAction('message')}>
          {language === 'en' ? 'Send Message' : 'إرسال رسالة'}
        </button>
        <button type="button" className="secondary-button" onClick={() => handleOwnerQuickAction('report')}>
          {language === 'en' ? 'Export Report' : 'تصدير تقرير'}
        </button>
      </div>

      <div className="owner-analytics-surface relative">
        <div className="owner-insights-header flex items-center justify-between mb-3">
          <div>
            <h3 className="m-0 text-base font-bold text-slate-900 dark:text-white">
              {language === 'en' ? 'Property Revenue' : 'إيرادات العقارات'}
            </h3>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {language === 'en' ? 'Historical revenue breakdown (last 30 days)' : 'تحليل الإيرادات مقسمة على فترات خلال آخر 30 يوماً'}
            </span>
          </div>
          <span className="status-pill neutral">{language === 'en' ? 'Last 30 Days' : 'آخر 30 يوم'}</span>
        </div>

        {/* Dynamic Tooltip on Bar Click/Hover */}
        {activeRevenueBar !== null && (
          <div className="mb-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between border border-slate-700 animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>
                <strong>{language === 'en' ? 'Period:' : 'الفترة:'}</strong> {[
                  { ar: '1 - 3 سبتمبر', en: 'Sep 1 - 3' },
                  { ar: '4 - 6 سبتمبر', en: 'Sep 4 - 6' },
                  { ar: '7 - 9 سبتمبر', en: 'Sep 7 - 9' },
                  { ar: '10 - 12 سبتمبر', en: 'Sep 10 - 12' },
                  { ar: '13 - 15 سبتمبر', en: 'Sep 13 - 15' },
                  { ar: '16 - 18 سبتمبر', en: 'Sep 16 - 18' },
                  { ar: '19 - 21 سبتمبر', en: 'Sep 19 - 21' },
                  { ar: '22 - 24 سبتمبر', en: 'Sep 22 - 24' },
                  { ar: '25 - 28 سبتمبر', en: 'Sep 25 - 28' },
                ][activeRevenueBar]?.[language === 'en' ? 'en' : 'ar']}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <strong className="text-emerald-400 font-bold text-sm">
                {formatCurrency([
                  42000, 58000, 49000, 63000, 72000, 88000, 96000, 82000, 68000,
                ][activeRevenueBar], 'EGP', language)}
              </strong>
              <button
                type="button"
                className="text-slate-400 hover:text-white"
                onClick={() => setActiveRevenueBar(null)}
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
          </div>
        )}

        <div className="owner-analytics-graph">
          {[
            { labelAr: '1-3 سبت', labelEn: '1-3 Sep', value: 42, amount: 42000 },
            { labelAr: '4-6 سبت', labelEn: '4-6 Sep', value: 58, amount: 58000 },
            { labelAr: '7-9 سبت', labelEn: '7-9 Sep', value: 49, amount: 49000 },
            { labelAr: '10-12', labelEn: '10-12', value: 63, amount: 63000 },
            { labelAr: '13-15', labelEn: '13-15', value: 72, amount: 72000 },
            { labelAr: '16-18', labelEn: '16-18', value: 88, amount: 88000 },
            { labelAr: '19-21', labelEn: '19-21', value: 96, amount: 96000 },
            { labelAr: '22-24', labelEn: '22-24', value: 82, amount: 82000 },
            { labelAr: '25-28', labelEn: '25-28', value: 68, amount: 68000 },
          ].map((bar, index) => {
            const isSelected = activeRevenueBar === index
            return (
              <div
                key={bar.labelAr + index}
                className={`owner-analytics-bar-wrap cursor-pointer group ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveRevenueBar(isSelected ? null : index)}
                onMouseEnter={() => setActiveRevenueBar(index)}
                title={`${language === 'en' ? bar.labelEn : bar.labelAr}: ${formatCurrency(bar.amount, 'EGP', language)}`}
              >
                <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {formatNumber(bar.value)}k
                </span>
                <div
                  className={`owner-analytics-bar transition-all duration-200 ${isSelected ? 'brightness-125 shadow-md ring-2 ring-emerald-400' : 'group-hover:brightness-110'}`}
                  style={{ height: `${bar.value}%` }}
                />
                <span className={`owner-analytics-x-label text-[9px] font-semibold tracking-tighter mt-1 whitespace-nowrap ${isSelected ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-400'}`}>
                  {language === 'en' ? bar.labelEn : bar.labelAr}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 px-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
          <span>{language === 'en' ? '← Early Sep' : '← بداية الشهر'}</span>
          <span className="text-slate-500 font-medium">{language === 'en' ? 'Tap any bar for exact figures' : 'اضغط على أي عمود لمعرفة المبلغ الدقيق'}</span>
          <span>{language === 'en' ? 'Today →' : 'اليوم →'}</span>
        </div>
      </div>

      <div className="owner-analytics-grid">
        <div className="owner-analytics-card">
          <div className="owner-overview-header">
            <h3>{language === 'en' ? 'Recent Bookings' : 'أحدث الحجوزات'}</h3>
            <button type="button" className="text-button" onClick={handleViewAllOwnerBookings}>
              {language === 'en' ? 'View All' : 'عرض الكل'}
            </button>
          </div>
          <div className="mini-booking-list">
            {ownerBookings.length ? ownerBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="mini-booking-item">
                <div>
                  <strong>{booking.title}</strong>
                  <span>{booking.location}</span>
                </div>
                <div>
                  <strong>{formatCurrency(booking.total, booking.currency, language)}</strong>
                  <span>{booking.status === 'confirmed' ? (language === 'en' ? 'Confirmed' : 'مؤكد') : (language === 'en' ? 'Pending' : 'قيد المراجعة')}</span>
                </div>
              </div>
            )) : (
              <div className="empty-inline">{language === 'en' ? 'No bookings yet.' : 'لا توجد حجوزات حتى الآن.'}</div>
            )}
          </div>
        </div>

        <div className="owner-analytics-card">
          <div className="owner-overview-header">
            <h3>{language === 'en' ? 'Quick Tasks' : 'مهام سريعة'}</h3>
            <span className="status-pill neutral">{language === 'en' ? 'Today' : 'اليوم'}</span>
          </div>
          <ul className="owner-task-list">
            <li>{language === 'en' ? 'Review new booking requests' : 'متابعة طلبات الحجز الجديدة'}</li>
            <li><span className="material-symbols-outlined">inventory_2</span>{language === 'en' ? 'Update main property description' : 'تحديث وصف الشقة الرئيسية'}</li>
            <li><span className="material-symbols-outlined">campaign</span>{language === 'en' ? 'Send welcome message to guests' : 'إرسال رسالة ترحيب للضيوف'}</li>
            <li><span className="material-symbols-outlined">payments</span>{language === 'en' ? 'Audit monthly revenue statements' : 'مراجعة الإيرادات الشهرية'}</li>
          </ul>
        </div>
      </div>

      <div className="owner-leading-listings">
        <div className="owner-overview-header">
          <h3>{language === 'en' ? 'Top Performing Properties' : 'أفضل العقارات أداءً'}</h3>
          <span className="status-pill neutral">{language === 'en' ? 'This Week' : 'هذا الأسبوع'}</span>
        </div>
        <div className="owner-listing-strip">
          {properties.slice(0, 3).map((property) => (
            <div key={property.id} className="owner-listing-card">
              <img src={property.image} alt={property.title} onError={handleStayImageError} />
              <div className="owner-listing-copy">
                <strong>{property.title}</strong>
                <span>{property.city}</span>
              </div>
              <div className="owner-listing-meta">
                <span>{formatNumber(property.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}★</span>
                <strong>{formatCurrency(property.priceValue, property.currency, language)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="owner-summary-grid">
        <div className="owner-summary-card">
          <span>{language === 'en' ? 'Avg Occupancy' : 'متوسط الإشغال'}</span>
          <strong>{formatNumber(78)}%</strong>
          <small>{language === 'en' ? 'Past 30 days' : 'منذ آخر 30 يوم'}</small>
        </div>
        <div className="owner-summary-card">
          <span>{language === 'en' ? 'Booking Rate' : 'معدل الحجز'}</span>
          <strong>{formatNumber(14)}%</strong>
          <small>{language === 'en' ? 'Conversion rate' : 'نسبة التحويل'}</small>
        </div>
        <div className="owner-summary-card">
          <span>{language === 'en' ? 'Host Response' : 'استجابة المالك'}</span>
          <strong>{formatNumber(1.2, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}h</strong>
          <small>{language === 'en' ? 'Average reply time' : 'متوسط الرد'}</small>
        </div>
      </div>

      <div className="owner-main-panel">
        <div className="owner-main-panel-header">
          <div>
            <h3 className="m-0 text-base font-bold text-slate-900 dark:text-white">
              {language === 'en' ? 'Weekly Occupancy Rate' : 'إحصاءات الإقبال ونسبة الإشغال'}
            </h3>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {language === 'en' ? 'Daily visitor and booking traction' : 'معدل تفاعل وحجوزات الضيوف اليومية'}
            </span>
          </div>
          <span className="status-pill neutral">{language === 'en' ? 'Last 7 Days' : 'آخر 7 أيام'}</span>
        </div>
        <div className="owner-chart">
          {[
            { dayAr: 'السبت', dayEn: 'Sat', value: 48 },
            { dayAr: 'الأحد', dayEn: 'Sun', value: 72 },
            { dayAr: 'الإثنين', dayEn: 'Mon', value: 58 },
            { dayAr: 'الثلاثاء', dayEn: 'Tue', value: 90 },
            { dayAr: 'الأربعاء', dayEn: 'Wed', value: 84 },
            { dayAr: 'الخميس', dayEn: 'Thu', value: 96 },
            { dayAr: 'الجمعة', dayEn: 'Fri', value: 76 },
          ].map((item, index) => (
            <div key={item.dayAr + index} className="owner-chart-bar-wrap" title={`${language === 'en' ? item.dayEn : item.dayAr}: ${formatNumber(item.value)}%`}>
              <span className="owner-chart-val text-[11px] font-bold text-slate-600 dark:text-slate-400">{formatNumber(item.value)}%</span>
              <div className="owner-chart-bar" style={{ height: `${item.value}%` }}></div>
              <span className="owner-chart-day-label text-[10px] font-bold text-slate-500 mt-1">
                {language === 'en' ? item.dayEn : item.dayAr}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="owner-table-card">
        <div className="owner-overview-header">
          <h3>{language === 'en' ? 'Bookings List' : 'قائمة الحجوزات'}</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Guest / Property' : 'العميل'}</th>
                <th>{language === 'en' ? 'Location' : 'العقار'}</th>
                <th>{language === 'en' ? 'Dates' : 'التواريخ'}</th>
                <th>{language === 'en' ? 'Total' : 'الإجمالي'}</th>
                <th>{language === 'en' ? 'Status' : 'الحالة'}</th>
              </tr>
            </thead>
            <tbody>
              {ownerBookings.length ? ownerBookings.slice(0, 5).map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.title || (language === 'en' ? 'Guest' : 'زائر')}</td>
                  <td>{booking.location || (language === 'en' ? 'Location' : 'موقع العقار')}</td>
                  <td>{formatDate(booking.checkIn, language)} - {formatDate(booking.checkOut, language)}</td>
                  <td>{formatCurrency(booking.total, booking.currency, language)}</td>
                  <td>
                    <span className={booking.status === 'confirmed' ? 'status-badge confirmed' : 'status-badge pending'}>
                      {booking.status === 'confirmed' ? (language === 'en' ? 'Confirmed' : 'مؤكد') : (language === 'en' ? 'Pending Review' : 'قيد المراجعة')}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="empty-table">{language === 'en' ? 'No bookings yet.' : 'لا توجد حجوزات حتى الآن.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form id="owner-form" className="owner-form" onSubmit={handleOwnerAddProperty}>
        <div className="owner-form-head">
          <div>
            <h3 className="m-0 text-lg font-bold text-slate-900 dark:text-white">
              {ownerEditingId ? (language === 'en' ? 'Edit Property' : 'تعديل الشقة') : (language === 'en' ? 'Add New Property' : 'إضافة شقة جديدة')}
            </h3>
            <span className="text-xs text-slate-500 block mt-0.5">
              {language === 'en' ? 'Fill details to publish or update your listing' : 'أدخل تفاصيل الوحدة لنشرها واستقبال طلبات الحجز'}
            </span>
          </div>
          {ownerEditingId && (
            <button type="button" className="secondary-button small-button" onClick={resetOwnerForm}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </button>
          )}
        </div>

        {ownerNotice && <div className="success-banner">{ownerNotice}</div>}

        <div className="owner-grid">
          <label>
            {language === 'en' ? 'Property Title' : 'عنوان الشقة'}
            <input
              type="text"
              value={propertyForm.title}
              onChange={(event) => setPropertyForm({ ...propertyForm, title: event.target.value })}
              placeholder={language === 'en' ? 'e.g. Luxury Seafront Suite' : 'اسم الشقة'}
            />
          </label>
          <label>
            {language === 'en' ? 'City' : 'المدينة'}
            <select
              value={propertyForm.city}
              onChange={(event) => setPropertyForm({ ...propertyForm, city: event.target.value })}
            >
              {filterOptions.slice(1).map((city) => (
                <option key={city.id} value={city.label}>
                  {city.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {language === 'en' ? 'Detailed Location' : 'الموقع التفصيلي'}
            <input
              type="text"
              value={propertyForm.location}
              onChange={(event) => setPropertyForm({ ...propertyForm, location: event.target.value })}
              placeholder={language === 'en' ? 'e.g. Nile Corniche, Cairo' : 'مثال: شارع النيل، القاهرة'}
            />
          </label>
          <label>
            {language === 'en' ? 'Rate / Night (EGP)' : 'السعر / يوم (ج.م)'}
            <input
              type="number"
              min="0"
              value={propertyForm.priceValue}
              onChange={(event) => setPropertyForm({ ...propertyForm, priceValue: event.target.value })}
              placeholder="مثال: 2500"
            />
          </label>

          {/* User-friendly image upload & preview replacing raw URL */}
          <div className="wide owner-image-upload-section">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'en' ? 'Property Photo' : 'صورة العقار'}
            </span>

            {/* Hidden file input */}
            <input
              ref={propertyFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePropertyImageUpload}
            />

            {propertyForm.image ? (
              <div className="owner-image-preview-card p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row items-center gap-3">
                <img
                  src={propertyForm.image}
                  alt="Property Preview"
                  className="w-24 h-20 rounded-xl object-cover border border-emerald-300 shadow-sm shrink-0"
                  onError={handleStayImageError}
                />
                <div className="flex-1 text-right sm:text-start min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                    <span>{language === 'en' ? 'Photo ready for listing' : 'تم اختيار صورة العقار بنجاح'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 m-0 truncate">
                    {propertyForm.image.startsWith('data:')
                      ? (language === 'en' ? 'Uploaded from device' : 'تم الرفع من ملفات الجهاز')
                      : propertyForm.image}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      className="secondary-button small-button text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      onClick={() => propertyFileInputRef.current?.click()}
                    >
                      <span className="material-symbols-outlined text-xs">photo_camera</span>
                      <span>{language === 'en' ? 'Change Photo' : 'تغيير الصورة'}</span>
                    </button>
                    <button
                      type="button"
                      className="danger-button small-button text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      onClick={() => setPropertyForm((prev) => ({ ...prev, image: '' }))}
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      <span>{language === 'en' ? 'Remove' : 'حذف'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="owner-upload-dropzone p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-500 transition cursor-pointer text-center flex flex-col items-center justify-center gap-2"
                onClick={() => propertyFileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                </div>
                <div>
                  <strong className="block text-sm text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Upload photo from your device' : 'اضغط لرفع صورة الشقة من جهازك'}
                  </strong>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {language === 'en' ? 'Supports JPG, PNG, WebP (Max 5MB)' : 'يدعم صيغ JPG، PNG، WebP (حتى 5 ميجابايت)'}
                  </span>
                </div>
                <button
                  type="button"
                  className="secondary-button small-button text-xs py-1.5 px-3.5 mt-1 inline-flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    propertyFileInputRef.current?.click()
                  }}
                >
                  <span className="material-symbols-outlined text-xs">upload_file</span>
                  <span>{language === 'en' ? 'Choose Image' : 'اختيار صورة'}</span>
                </button>
              </div>
            )}

            {/* Optional URL input toggle for power users */}
            <details className="mt-2 text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-emerald-600 transition">
                {language === 'en' ? 'Or enter direct image URL' : 'أو إدخال رابط صورة خارجي (اختياري)'}
              </summary>
              <input
                type="url"
                value={propertyForm.image}
                onChange={(event) => setPropertyForm({ ...propertyForm, image: event.target.value })}
                placeholder="https://..."
                className="mt-1.5 w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </details>
          </div>

          <label className="wide">
            {language === 'en' ? 'Amenities' : 'المزايا'}
            <input
              type="text"
              value={propertyForm.amenities}
              onChange={(event) => setPropertyForm({ ...propertyForm, amenities: event.target.value })}
              placeholder={language === 'en' ? 'e.g. WiFi, Pool, Sea View, Parking' : 'مثل: إنترنت, موقف, نوافذ واسعة'}
            />
          </label>
          <label className="wide">
            {language === 'en' ? 'Description' : 'الوصف'}
            <textarea
              rows="3"
              value={propertyForm.description}
              onChange={(event) => setPropertyForm({ ...propertyForm, description: event.target.value })}
              placeholder={language === 'en' ? 'Write an appealing property description' : 'اكتب وصف الشقة بشكل جذاب'}
            />
          </label>
          <label className="wide">
            {language === 'en' ? 'Booking Policies' : 'معلومات الحجز'}
            <textarea
              rows="3"
              value={propertyForm.bookingInfo}
              onChange={(event) => setPropertyForm({ ...propertyForm, bookingInfo: event.target.value })}
              placeholder={language === 'en' ? 'e.g. Free cancellation up to 48 hours prior to arrival' : 'مثل: إلغاء مجاني حتى 48 ساعة قبل الوصول'}
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          {ownerEditingId ? (language === 'en' ? 'Save Changes' : 'حفظ التعديلات') : (language === 'en' ? 'Add Property' : 'إضافة الشقة')}
        </button>
      </form>

      <div className="owner-listings">
        <div className="owner-form-head">
          <div>
            <h3 className="m-0 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {language === 'en' ? 'Managed Properties' : 'الشقق المضافة'}
            </h3>
            <span className="text-xs text-slate-500">
              {language === 'en' ? `${ownerProperties.length} active listings` : `${ownerProperties.length} عقارات مسجلة`}
            </span>
          </div>
        </div>

        {ownerProperties.length === 0 ? (
          <div className="owner-empty-state">
            <span className="material-symbols-outlined">apartment</span>
            <p>{language === 'en' ? 'No properties listed yet. Add your first listing.' : 'لا توجد شقق مضافة بعد، أضف أول إعلان لك.'}</p>
          </div>
        ) : (
          ownerProperties.map((property) => (
            <article key={property.id} className="owner-card">
              <img
                src={property.image}
                alt={property.title}
                onError={handleStayImageError}
                className="owner-card-thumb"
              />
              <div className="owner-card-body">
                <div className="owner-card-info">
                  <h4 title={property.title}>{property.title}</h4>
                  <p title={property.location}>{property.location}</p>
                  <strong>{formatCurrency(property.priceValue, property.currency, language)}</strong>
                </div>
                <div className="owner-actions">
                  <button
                    type="button"
                    className="secondary-button small-button"
                    onClick={() => handleOwnerEditProperty(property)}
                  >
                    {language === 'en' ? 'Edit' : 'تعديل'}
                  </button>
                  <button
                    type="button"
                    className="danger-button small-button"
                    onClick={() => handleOwnerDeleteProperty(property.id)}
                  >
                    {language === 'en' ? 'Delete' : 'حذف'}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div id="owner-bookings-section" className="owner-listings owner-bookings-panel">
        <div className="owner-form-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="m-0 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {language === 'en' ? 'Booking Requests' : 'طلبات الحجز'}
            </h3>
            <span className="text-xs text-slate-500">
              {language === 'en'
                ? `Showing ${filteredOwnerBookings.length} bookings`
                : `عرض ${filteredOwnerBookings.length} من الحجوزات`}
            </span>
          </div>

          {/* Unified Segmented Control */}
          <div className="booking-segmented-control" role="tablist" aria-label={language === 'en' ? 'Filter bookings' : 'تصفية الحجوزات'}>
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All', count: ownerBookings.length },
              { id: 'confirmed', labelAr: 'مؤكد', labelEn: 'Confirmed', count: ownerBookings.filter(b => b.status === 'confirmed').length },
              { id: 'pending', labelAr: 'قيد المراجعة', labelEn: 'Pending', count: pendingOwnerBookingsCount },
            ].map((tab) => {
              const isActive = ownerBookingFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`booking-segmented-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setOwnerBookingFilter(tab.id)}
                >
                  <span>{language === 'en' ? tab.labelEn : tab.labelAr}</span>
                  <span className={`booking-count-badge ${isActive ? 'active' : ''}`}>
                    {formatNumber(tab.count)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {filteredOwnerBookings.length === 0 ? (
          <div className="owner-empty-state">
            <span className="material-symbols-outlined">calendar_month</span>
            <p>
              {ownerBookings.length === 0
                ? (language === 'en' ? 'No bookings received yet.' : 'لا توجد أي حجوزات واردة حتى الآن.')
                : (language === 'en'
                    ? `No bookings found under "${ownerBookingFilter === 'pending' ? 'Pending' : 'Confirmed'}".`
                    : `لا توجد حجوزات تحت تصنيف "${ownerBookingFilter === 'pending' ? 'قيد المراجعة' : 'مؤكد'}".`)}
            </p>
            {ownerBookings.length > 0 && ownerBookingFilter !== 'all' && (
              <button
                type="button"
                className="secondary-button small-button mt-2"
                onClick={() => setOwnerBookingFilter('all')}
              >
                {language === 'en' ? `View all bookings (${formatNumber(ownerBookings.length)})` : `عرض كل الحجوزات (${formatNumber(ownerBookings.length)})`}
              </button>
            )}
          </div>
        ) : (
          filteredOwnerBookings.map((booking) => (
            <article key={booking.id} className="booking-card owner-booking-card">
              <div className="booking-image">
                <img src={booking.image} alt={booking.title} onError={handleStayImageError} />
                <span className={`status ${booking.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                  {booking.status === 'confirmed' ? (language === 'en' ? 'Confirmed' : 'مؤكدة') : (language === 'en' ? 'Pending Review' : 'قيد المراجعة')}
                </span>
              </div>
              <div className="booking-body">
                <div className="booking-head">
                  <div>
                    <h3>{booking.title}</h3>
                    <p>{booking.location}</p>
                    {booking.guestName && (
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        {language === 'en' ? `Guest: ${booking.guestName}` : `النزيل: ${booking.guestName}`}
                        {booking.guestPhone ? ` (${booking.guestPhone})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="booking-footer">
                  <div>
                    <small>
                      {language === 'en' ? `From ${formatDate(booking.checkIn, language)} to ${formatDate(booking.checkOut, language)}` : `من ${formatDate(booking.checkIn, language)} إلى ${formatDate(booking.checkOut, language)}`}
                    </small>
                    <strong>{formatCurrency(booking.total, booking.currency, language)}</strong>
                  </div>
                </div>
                <div className="owner-booking-actions">
                  {booking.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="primary-button small-button"
                        onClick={() => handleOwnerAcceptBooking(booking.id)}
                      >
                        <span className="material-symbols-outlined text-xs">check</span>
                        <span>{language === 'en' ? 'Accept Booking' : 'قبول الحجز'}</span>
                      </button>
                      <button
                        type="button"
                        className="danger-button small-button"
                        onClick={() => handleOwnerRejectBooking(booking.id)}
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                        <span>{language === 'en' ? 'Decline' : 'رفض'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="secondary-button small-button"
                        onClick={() => handleBookingStatusToggle(booking)}
                      >
                        {language === 'en' ? 'Move to Pending' : 'إرجاع إلى قيد المراجعة'}
                      </button>
                      <button
                        type="button"
                        className="danger-button small-button"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        {language === 'en' ? 'Cancel' : 'إلغاء'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )

  const getPropertyTitle = (p) => (!p ? '' : language === 'en' ? (p.titleEn || p.title) : p.title)
  const getPropertyLocation = (p) => (!p ? '' : language === 'en' ? (p.locationEn || p.location) : p.location)
  const getPropertyCity = (p) => (!p ? '' : language === 'en' ? (p.cityEn || p.city) : p.city)
  const getPropertyDescription = (p) => (!p ? '' : language === 'en' ? (p.descriptionEn || p.description) : p.description)
  const getPropertyDetails = (p) => (!p ? [] : (language === 'en' && p.detailsEn) ? p.detailsEn : (p.details || []))
  const getPropertyAmenities = (p) => (!p ? [] : (language === 'en' && p.amenitiesEn) ? p.amenitiesEn : (p.amenities || []))

  const getCityStats = (cityKey, slug, defaultCount, defaultMinPrice) => {
    const matched = properties.filter((p) => {
      const pSlug = p.cityId || p.citySlug || getCitySlug(p.city) || getCitySlug(p.cityEn)
      return pSlug === slug || (p.city && p.city.includes(cityKey))
    })
    const count = matched.length
    const prices = matched.map((p) => Number(p.priceValue || 0)).filter((p) => p > 0)
    const minPrice = prices.length ? Math.min(...prices) : defaultMinPrice
    return {
      count: count > 0 ? count : defaultCount,
      minPrice,
    }
  }

  const alexStats = getCityStats('الإسكندرية', 'alexandria', 42, 3100)
  const cairoStats = getCityStats('القاهرة', 'cairo', 68, 3600)
  const gizaStats = getCityStats('الجيزة', 'giza', 29, 2950)
  const hurghadaStats = getCityStats('الغردقة', 'hurghada', 35, 3400)
  const sharmStats = getCityStats('شرم الشيخ', 'sharm-el-sheikh', 31, 3900)

  const destinationCards = [
    {
      cityKey: 'الإسكندرية',
      slug: 'alexandria',
      city: language === 'en' ? 'Alexandria' : 'الإسكندرية',
      label: language === 'en' ? 'Sea breeze' : 'نسيم البحر',
      price: language === 'en' ? `From ${alexStats.minPrice.toLocaleString()} EGP` : `من ${alexStats.minPrice.toLocaleString()} ج.م`,
      image: CITY_PHOTOS['الإسكندرية'],
      staysCount: alexStats.count,
      badge: language === 'en' ? 'Trending' : 'الأكثر طلباً',
    },
    {
      cityKey: 'القاهرة',
      slug: 'cairo',
      city: language === 'en' ? 'Cairo' : 'القاهرة',
      label: language === 'en' ? 'Nile & city' : 'النيل والمدينة',
      price: language === 'en' ? `From ${cairoStats.minPrice.toLocaleString()} EGP` : `من ${cairoStats.minPrice.toLocaleString()} ج.م`,
      image: CITY_PHOTOS['القاهرة'],
      staysCount: cairoStats.count,
      badge: language === 'en' ? 'Popular' : 'شائع',
    },
    {
      cityKey: 'الجيزة',
      slug: 'giza',
      city: language === 'en' ? 'Giza' : 'الجيزة',
      label: language === 'en' ? 'Pyramids view' : 'إطلالة الأهرامات',
      price: language === 'en' ? `From ${gizaStats.minPrice.toLocaleString()} EGP` : `من ${gizaStats.minPrice.toLocaleString()} ج.م`,
      image: CITY_PHOTOS['الجيزة'],
      staysCount: gizaStats.count,
    },
    {
      cityKey: 'الغردقة',
      slug: 'hurghada',
      city: language === 'en' ? 'Hurghada' : 'الغردقة',
      label: language === 'en' ? 'Red Sea luxury' : 'فخامة البحر الأحمر',
      price: language === 'en' ? `From ${hurghadaStats.minPrice.toLocaleString()} EGP` : `من ${hurghadaStats.minPrice.toLocaleString()} ج.م`,
      image: CITY_PHOTOS['الغردقة'],
      staysCount: hurghadaStats.count,
      badge: language === 'en' ? 'Beach' : 'شاطئ',
    },
    {
      cityKey: 'شرم الشيخ',
      slug: 'sharm-el-sheikh',
      city: language === 'en' ? 'Sharm El-Sheikh' : 'شرم الشيخ',
      label: language === 'en' ? 'Bay & reefs' : 'الخلجان والشعاب',
      price: language === 'en' ? `From ${sharmStats.minPrice.toLocaleString()} EGP` : `من ${sharmStats.minPrice.toLocaleString()} ج.م`,
      image: CITY_PHOTOS['شرم الشيخ'],
      staysCount: sharmStats.count,
    },
  ]

  const destinationOptions = [
    { id: 'الإسكندرية', label: language === 'en' ? 'Alexandria' : 'الإسكندرية' },
    { id: 'القاهرة', label: language === 'en' ? 'Cairo' : 'القاهرة' },
    { id: 'الجيزة', label: language === 'en' ? 'Giza' : 'الجيزة' },
    { id: 'الغردقة', label: language === 'en' ? 'Hurghada' : 'الغردقة' },
    { id: 'شرم الشيخ', label: language === 'en' ? 'Sharm El-Sheikh' : 'شرم الشيخ' },
  ]

  const filterOptions = [
    { id: 'all', label: language === 'en' ? 'All' : 'الكل' },
    { id: 'favorites', label: language === 'en' ? 'Favorites ❤️' : 'المفضلة ❤️' },
    { id: 'الإسكندرية', label: language === 'en' ? 'Alexandria' : 'الإسكندرية' },
    { id: 'القاهرة', label: language === 'en' ? 'Cairo' : 'القاهرة' },
    { id: 'الجيزة', label: language === 'en' ? 'Giza' : 'الجيزة' },
    { id: 'الغردقة', label: language === 'en' ? 'Hurghada' : 'الغردقة' },
    { id: 'شرم الشيخ', label: language === 'en' ? 'Sharm El-Sheikh' : 'شرم الشيخ' },
  ]

  const homeHighlights = [
    { icon: 'verified', title: language === 'en' ? 'Verified stays' : 'إقامة موثقة', text: language === 'en' ? 'Every home is checked before you book.' : 'كل العقار يتم التحقق منه قبل الحجز.' },
    { icon: 'payments', title: language === 'en' ? 'Secure payment' : 'دفع آمن', text: language === 'en' ? 'Pay in minutes with protected checkout.' : 'ادفع بسهولة وبأمان عبر الدفع الآمن.' },
    { icon: 'event_available', title: language === 'en' ? 'Flexible cancellation' : 'إلغاء مرن', text: language === 'en' ? 'Clear cancellation options before arrival.' : 'خيارات إلغاء واضحة ومريحة قبل الوصول.' },
  ]

  const renderHomePage = () => {
    const topThree = filteredProperties.slice(0, 3)
    const mapProperties = filteredProperties.slice(0, 4)
    const selectedMapProperty =
      mapProperties.find((property) => property.id === selectedMapPropertyId) || mapProperties[0] || null

    return (
      <div className="page-shell home-shell">
        <div className="home-header home-header-compact">
          <div className="home-header-copy">
            <h2>{t('welcome', { name: user?.name || 'Ziad' })} 👋</h2>
            <p>{t('home.subtitle')}</p>
          </div>
        </div>

        <div className="home-compact-search">
          <div className="search-panel home-search-panel">
            <div className="search-panel-header">
              <div>
                <span className="search-panel-kicker">{language === 'en' ? 'Find your stay' : 'ابحث عن الإقامة'}</span>
                <h3>{language === 'en' ? 'Where are you going?' : 'إلى أين تريد الذهاب؟'}</h3>
              </div>
            </div>

            <form
              id="home-search-form"
              role="search"
              aria-label={language === 'en' ? 'Search availability' : 'البحث عن الإتاحة'}
              data-testid="search-form"
              onSubmit={(event) => {
                event.preventDefault()
                runHomeSearch()
              }}
            >
              <div className="search-panel-row search-destination-row">
                <label htmlFor="destination" className="search-field">
                  <span>{language === 'en' ? 'Destination' : 'الوجهة'}</span>
                  <div className="input-with-icon">
                    <span className="field-icon material-symbols-outlined">location_on</span>
                    <select
                      id="destination"
                      name="destination"
                      data-testid="search-destination"
                      aria-label={language === 'en' ? 'Destination' : 'الوجهة'}
                      value={homeQuickSearch.destination}
                      onChange={(event) => {
                        setHomeQuickSearch((current) => ({ ...current, destination: event.target.value }))
                      }}
                    >
                      <option value="">{language === 'en' ? 'Any city' : 'أي مدينة'}</option>
                      {destinationOptions.map((city) => (
                        <option key={city.id} value={city.id}>{city.label}</option>
                      ))}
                    </select>
                  </div>
                </label>
                <button
                  type="button"
                  className="secondary-button search-filter-button"
                  data-testid="filter-toggle-button"
                  aria-label={language === 'en' ? 'Filters' : 'تصفية'}
                  aria-expanded={showFilterPanel}
                  onClick={() => setShowFilterPanel((open) => !open)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">tune</span>
                </button>
              </div>

              <div className="search-panel-row search-dates-row">
                <label htmlFor="check-in" className="search-field">
                  <span>{language === 'en' ? 'Check-in' : 'تاريخ الوصول'}</span>
                  <div
                    className="input-with-icon search-date-field"
                    onClick={(e) => {
                      try {
                        e.currentTarget.querySelector('input[type="date"]')?.showPicker?.()
                      } catch (err) {}
                    }}
                  >
                    <span className="field-icon material-symbols-outlined" aria-hidden="true">calendar_month</span>
                    <div className="search-date-display" aria-hidden="true">
                      {formatDisplayDMY(homeQuickSearch.checkIn)}
                    </div>
                    <input
                      id="check-in"
                      name="checkIn"
                      data-testid="search-checkin"
                      aria-label={language === 'en' ? 'Check-in' : 'تاريخ الوصول'}
                      type="date"
                      min={formatISODate(new Date())}
                      value={homeQuickSearch.checkIn}
                      onChange={(event) => handleQuickSearchDateChange('checkIn', event.target.value)}
                      className="search-date-native-input"
                    />
                  </div>
                </label>
                <label htmlFor="check-out" className="search-field">
                  <span>{language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}</span>
                  <div
                    className="input-with-icon search-date-field"
                    onClick={(e) => {
                      try {
                        e.currentTarget.querySelector('input[type="date"]')?.showPicker?.()
                      } catch (err) {}
                    }}
                  >
                    <span className="field-icon material-symbols-outlined" aria-hidden="true">calendar_month</span>
                    <div className="search-date-display" aria-hidden="true">
                      {formatDisplayDMY(homeQuickSearch.checkOut)}
                    </div>
                    <input
                      id="check-out"
                      name="checkOut"
                      data-testid="search-checkout"
                      aria-label={language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}
                      type="date"
                      min={getNextDayISO(homeQuickSearch.checkIn)}
                      value={homeQuickSearch.checkOut}
                      onChange={(event) => handleQuickSearchDateChange('checkOut', event.target.value)}
                      className="search-date-native-input"
                    />
                  </div>
                </label>
              </div>

              {quickSearchDateError && <div className="field-error-banner">{quickSearchDateError}</div>}

              <div className="search-panel-row compact">
                <label htmlFor="guests" className="search-field">
                  <span>{language === 'en' ? 'Guests' : 'عدد الضيوف'}</span>
                  <div className="input-with-icon compact-icon">
                    <span className="field-icon material-symbols-outlined">group</span>
                    <select
                      id="guests"
                      name="guests"
                      data-testid="search-guests"
                      aria-label={language === 'en' ? 'Guests' : 'عدد الضيوف'}
                      value={homeQuickSearch.guests}
                      onChange={(event) => setHomeQuickSearch((current) => ({ ...current, guests: Number(event.target.value) }))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((guest) => (
                        <option key={guest} value={guest}>
                          {pluralize(guest, 'guest', language)}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="primary-button search-submit-button"
                data-testid="search-submit"
                aria-label={language === 'en' ? 'Search' : 'بحث'}
              >
                {t('search')}
              </button>
            </form>
          </div>

          {showFilterPanel && (
            <div id="home-filter-drawer" className="filter-drawer">
              <div className="filter-drawer-grid">
                <div className="filter-section">
                  <label>
                    <span>{language === 'en' ? 'Max price' : 'الحد الأقصى للسعر'}</span>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="500"
                      value={homeFilters.maxPrice}
                      onChange={(event) => setHomeFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))}
                    />
                    <strong>{formatCurrency(homeFilters.maxPrice, 'EGP', language)}</strong>
                  </label>
                </div>
                <div className="filter-section">
                  <label>
                    <span>{language === 'en' ? 'Minimum rating' : 'التقييم الأدنى'}</span>
                    <select
                      data-testid="filter-rating-select"
                      value={homeFilters.ratingMin}
                      onChange={(event) => setHomeFilters((current) => ({ ...current, ratingMin: Number(event.target.value) }))}
                    >
                      <option value={0}>{language === 'en' ? 'All (Any rating)' : 'الكل (أي تقييم)'}</option>
                      <option value={4}>4.0+</option>
                      <option value={4.5}>4.5+</option>
                      <option value={4.7}>4.7+</option>
                      <option value={4.9}>4.9+</option>
                    </select>
                  </label>
                </div>
                <div className="filter-section">
                  <span>{language === 'en' ? 'Property type' : 'نوع الإقامة'}</span>
                  <div className="segmented-options">
                    {['all', 'apartment', 'villa', 'hotel', 'resort'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={homeFilters.type === option ? 'chip active' : 'chip'}
                        onClick={() => setHomeFilters((current) => ({ ...current, type: option }))}
                      >
                        {option === 'all' ? (language === 'en' ? 'All' : 'الكل') : option === 'apartment' ? (language === 'en' ? 'Apartment' : 'شقة') : option === 'villa' ? (language === 'en' ? 'Villa' : 'فيلا') : option === 'hotel' ? (language === 'en' ? 'Hotel' : 'فندق') : (language === 'en' ? 'Resort' : 'منتجع')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-section">
                  <span>{language === 'en' ? 'Bedrooms' : 'عدد الغرف'}</span>
                  <div className="segmented-options">
                    {['any', '1', '2', '3-plus'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={homeFilters.bedrooms === option ? 'chip active' : 'chip'}
                        onClick={() => setHomeFilters((current) => ({ ...current, bedrooms: option }))}
                      >
                        {option === 'any' ? (language === 'en' ? 'Any' : 'أي') : option === '1' ? '1' : option === '2' ? '2' : '3+'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-section wide-section">
                  <span>{language === 'en' ? 'Amenities' : 'المرافق'}</span>
                  <div className="amenity-grid">
                    {['Wi‑Fi', 'Parking', 'Pool', 'Sea View', 'Breakfast', 'Air Conditioning'].map((amenity) => {
                      const amenityLabels = {
                        'Wi‑Fi': 'واي فاي',
                        Parking: 'موقف سيارات',
                        Pool: 'مسبح',
                        'Sea View': 'إطلالة بحرية',
                        Breakfast: 'إفطار',
                        'Air Conditioning': 'تكييف',
                      }

                      return (
                      <label key={amenity} className="amenity-toggle">
                        <input
                          type="checkbox"
                          checked={homeFilters.amenities.includes(amenity)}
                          onChange={() => toggleAmenityFilter(amenity)}
                        />
                        <span>{language === 'en' ? amenity : amenityLabels[amenity]}</span>
                      </label>
                      )
                    })}
                  </div>
                </div>
                <div className="filter-section">
                  <label>
                    <span>{language === 'en' ? 'Sort by' : 'ترتيب حسب'}</span>
                    <select
                      value={homeFilters.sortBy}
                      onChange={(event) => setHomeFilters((current) => ({ ...current, sortBy: event.target.value }))}
                    >
                      <option value="recommended">{language === 'en' ? 'Recommended' : 'موصى به'}</option>
                      <option value="rating">{language === 'en' ? 'Top rated' : 'الأعلى تقييمًا'}</option>
                      <option value="price-low">{language === 'en' ? 'Lowest price' : 'الأقل سعرًا'}</option>
                      <option value="price-high">{language === 'en' ? 'Highest price' : 'الأعلى سعرًا'}</option>
                      <option value="popular">{language === 'en' ? 'Most booked' : 'الأكثر حجزًا'}</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="exclusive-deal-banner rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.005] active:scale-[0.995]"
          onClick={() => setShowDealModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowDealModal(true)}
          aria-label={language === 'en' ? 'Open promotional offer details' : 'عرض تفاصيل العرض الترويجي'}
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              <span>🔥</span>
              <span>{language === 'en' ? 'Limited Time Offer' : 'عرض حصري لفترة محدودة'}</span>
            </div>
            <h4 className="text-lg font-black tracking-tight">
              {language === 'en' ? 'Save up to 20% on luxury coastal stays' : 'وفر حتى 20% على أفخم الفيلات والشاليهات الساحلية'}
            </h4>
            <p className="text-xs text-white/85">
              {language === 'en' ? 'Instant confirmation with free cancellation options' : 'تأكيد فوري مع خيارات إلغاء مرنة وضمان أفضل سعر'}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-2xl bg-white px-5 py-2.5 text-xs font-extrabold text-emerald-800 shadow-md hover:bg-emerald-50 transition active:scale-95 flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
              setShowDealModal(true)
            }}
          >
            <span className="material-symbols-outlined text-sm">local_fire_department</span>
            <span>{language === 'en' ? 'Explore Deals' : 'استفد من العرض'}</span>
          </button>
        </div>

        <div className="mini-city-grid">
          {destinationCards.map((item) => (
            <a
              key={item.cityKey}
              href={`?city=${item.slug}`}
              className="mini-city-card"
              role="button"
              tabIndex={0}
              aria-label={`${item.city}, ${item.label}, ${pluralize(item.staysCount, 'stay', language)}`}
              onClick={(e) => {
                e.preventDefault()
                navigate('city', null, item.slug)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('city', null, item.slug)
                }
              }}
            >
              <img src={item.image} alt={item.city} onError={handleStayImageError} loading="lazy" />
              <div className="city-card-copy">
                <div className="flex items-center justify-between gap-1">
                  <span>{item.city}</span>
                  {item.badge && (
                    <span className="rounded-full bg-emerald-600/90 text-white text-[9px] font-black px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
                <small>{item.label} • {pluralize(item.staysCount, 'stay', language)}</small>
                <strong>{item.price}</strong>
              </div>
            </a>
          ))}
        </div>

        <div className="featured-collection">
          <div className="section-head-row">
            <h3>{language === 'en' ? 'Selected stays' : 'عروض مختارة'}</h3>
            <button type="button" className="text-button" onClick={handleViewAllProperties}>{language === 'en' ? 'View all' : 'عرض الكل'}</button>
          </div>
          <div className="collection-strip">
            {topThree.map((property) => (
              <button
                key={property.id}
                type="button"
                className="collection-item"
                onClick={() => navigate('details', property)}
              >
                <div className="collection-item-image">
                  <img
                    src={property.image}
                    alt={getPropertyTitle(property)}
                    onError={handleStayImageError}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <span>{getPropertyCity(property)}</span>
                  <strong>{getPropertyTitle(property)}</strong>
                  <small>{formatCurrency(property.priceValue, property.currency, language)} / {language === 'en' ? 'night' : 'ليلة'}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        {filteredProperties.length > 0 && (
          <div className="home-section-head" id="home-results">
            <div className="home-section-title-wrap">
              <h3>{language === 'en' ? 'Most booked this week' : 'الأكثر حجزًا هذا الأسبوع'}</h3>
              <span className="home-results-pill">
                {pluralize(filteredProperties.length, 'result', language)}
              </span>
            </div>
            <div className="view-toggle">
              <button type="button" className={!showMapView ? 'active' : ''} onClick={() => setShowMapView(false)}>
                {language === 'en' ? 'List' : 'قائمة'}
              </button>
              <button type="button" className={showMapView ? 'active' : ''} onClick={() => setShowMapView(true)}>
                {language === 'en' ? 'Map' : 'خريطة'}
              </button>
            </div>
          </div>
        )}

        {showMapView && (
          <div className="map-spotlight">
            <div className="map-surface">
              <iframe
                title="Map view"
                src="https://www.openstreetmap.org/export/embed.html?bbox=29.65%2C31.00%2C31.50%2C32.20&layer=mapnik"
                loading="lazy"
              />
              {mapProperties.map((property, index) => {
                const isSelected = selectedMapProperty?.id === property.id

                return (
                  <button
                    key={property.id}
                    type="button"
                    className={isSelected ? 'map-pin active' : 'map-pin'}
                    style={{
                      top: `${18 + index * 22}%`,
                      left: `${22 + index * 20}%`,
                    }}
                    onClick={() => setSelectedMapPropertyId(property.id)}
                    aria-label={getPropertyTitle(property)}
                  >
                    <small>{formatCurrency(property.priceValue, property.currency, language)}</small>
                  </button>
                )
              })}
            </div>

            {selectedMapProperty && (
              <div className="map-property-highlight">
                <img src={selectedMapProperty.image} alt={getPropertyTitle(selectedMapProperty)} onError={handleStayImageError} />
                <div className="map-property-copy">
                  <span>{getPropertyCity(selectedMapProperty)}</span>
                  <strong>{getPropertyTitle(selectedMapProperty)}</strong>
                  <small>{formatCurrency(selectedMapProperty.priceValue, selectedMapProperty.currency, language)} / {language === 'en' ? 'night' : 'ليلة'}</small>
                </div>
                <button type="button" className="primary-button small-button" onClick={() => navigate('details', selectedMapProperty)}>
                  {language === 'en' ? 'View details' : 'عرض التفاصيل'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="filter-chips flex gap-3 overflow-x-auto py-2 my-3" role="tablist" aria-label={language === 'en' ? 'Filter properties by destination' : 'تصفية الإقامات حسب الوجهة'}>
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === option.id}
              className={`chip shrink-0 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                activeFilter === option.id ? 'active' : ''
              }`}
              onClick={() => {
                setHomeQuickSearch((current) => ({
                  ...current,
                  destination: option.id === 'all' || option.id === 'favorites' ? '' : option.id,
                }))
                setActiveFilter(option.id)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filteredProperties.length === 0 ? (
        <div className="empty-state" id="home-results">
          <span className="material-symbols-outlined">travel_explore</span>
          <h3>{language === 'en' ? 'No matching results' : 'لا توجد نتائج مطابقة'}</h3>
          <p>{language === 'en' ? 'Try a different search or choose another filter.' : 'جرّب بحثاً مختلفاً أو اختر فلتر آخر.'}</p>
        </div>
      ) : (
        <div className="property-list">
          {filteredProperties.map((property) => (
            <article
              key={property.id}
              className="property-card property-card-modern"
              data-testid="property-card"
              data-property-id={property.id}
              aria-label={getPropertyTitle(property)}
              onClick={(event) => {
                if (event.target.closest('button') || event.target.closest('a')) return
                navigate('details', property)
              }}
            >
              <div className="image-wrap">
                <img src={property.image} alt={getPropertyTitle(property)} onError={handleStayImageError} />
                <button
                  type="button"
                  className={isFavorite(property.id) ? 'favorite-button active' : 'favorite-button'}
                  aria-label={language === 'en' ? 'Add to favorites' : 'إضافة للمفضلة'}
                  onClick={(event) => toggleFavorite(event, property.id)}
                >
                  <HeartIcon filled={isFavorite(property.id)} size={20} />
                </button>
                <div className="rating-badge">
                  <span className="material-symbols-outlined">star</span>
                  <span>{property.rating}</span>
                  <small>({property.reviews})</small>
                </div>
              </div>

              <div className="card-body">
                <div className="card-topline">
                  <span className="property-badge">{language === 'en' ? 'Luxury stay' : 'إقامة فاخرة'}</span>
                  <span className="property-availability">{language === 'en' ? 'Available now' : 'متاح الآن'}</span>
                </div>

                <div className="title-block">
                  <h3>
                    <a
                      href={`#property-${property.id}`}
                      className="property-link"
                      data-testid="property-link"
                      onClick={(event) => {
                        event.preventDefault()
                        navigate('details', property)
                      }}
                    >
                      {getPropertyTitle(property)}
                    </a>
                  </h3>
                  <p>
                    <span className="material-symbols-outlined">location_on</span>
                    {getPropertyLocation(property)}
                  </p>
                </div>

                <div className="property-meta-row">
                  <span><span className="material-symbols-outlined">group</span> {pluralize(property.guests || 2, 'guest', language)}</span>
                  <span><span className="material-symbols-outlined">wifi</span> Wi‑Fi</span>
                  <span><span className="material-symbols-outlined">local_parking</span> {language === 'en' ? 'Parking' : 'موقف'}</span>
                </div>

                <div className="tag-row">
                  {getPropertyDetails(property).map((detail, index) => (
                    <span key={`${detail}-${index}`}>{detail}</span>
                  ))}
                </div>

                <div className="price-row">
                  <div className="price-box">
                    <strong>{formatCurrency(property.priceValue, property.currency, language)}</strong>
                    <span>{language === 'en' ? ' / night' : ' / ليلة'}</span>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    data-testid="book-now-button"
                    onClick={() => navigate('details', property)}
                  >
                    {language === 'en' ? 'Book now' : 'احجز الآن'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="home-feature-grid">
        {homeHighlights.map((item, index) => (
          <div key={`${item.title}-${index}`} className="feature-card">
            <span className="material-symbols-outlined">{item.icon}</span>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="value-grid">
        <div className="value-card">
          <span className="material-symbols-outlined">shield</span>
          <div>
            <strong>{language === 'en' ? 'Verified stays' : 'إقامة موثقة'}</strong>
            <small>{language === 'en' ? 'Guest-safe booking' : 'حجز آمن للضيوف'}</small>
          </div>
        </div>
        <div className="value-card">
          <span className="material-symbols-outlined">payments</span>
          <div>
            <strong>{language === 'en' ? 'Safe payment' : 'دفع آمن'}</strong>
            <small>{language === 'en' ? 'Protected checkout' : 'دفع محمي ومتعدد'}</small>
          </div>
        </div>
        <div className="value-card">
          <span className="material-symbols-outlined">support_agent</span>
          <div>
            <strong>{language === 'en' ? '24/7 Concierge' : 'كونسيرج 24/7'}</strong>
            <small>{language === 'en' ? 'VIP guest support' : 'خدمة ضيوف فورية'}</small>
          </div>
        </div>
        <div className="value-card">
          <span className="material-symbols-outlined">event_available</span>
          <div>
            <strong>{language === 'en' ? 'Flexible cancel' : 'إلغاء مرن'}</strong>
            <small>{language === 'en' ? 'Easy before arrival' : 'سهل قبل الوصول'}</small>
          </div>
        </div>
      </div>
    </div>
    )
  }

  const renderDetailsPage = () => {
    if (!selectedProperty) {
      return <div className="loading-state"><div className="loader-small" /><p>{language === 'en' ? 'Loading property details...' : 'جاري تحميل تفاصيل الشقة...'}</p></div>
    }

    const detailHighlights = [
      { icon: 'bed', title: language === 'en' ? 'Bedrooms' : 'غرف نوم', value: language === 'en' ? '2 bedrooms' : '2 غرفة' },
      { icon: 'wifi', title: language === 'en' ? 'Internet' : 'الإنترنت', value: language === 'en' ? 'Fast Wi‑Fi' : 'Wi‑Fi سريع' },
      { icon: 'local_parking', title: language === 'en' ? 'Parking' : 'موقف', value: language === 'en' ? 'Free' : 'مجاناً' },
      { icon: 'schedule', title: language === 'en' ? 'Check-in' : 'الدخول', value: language === 'en' ? 'From 3:00 PM' : 'من 3:00 PM' },
    ]

    const galleryImages = (selectedProperty.images?.length
      ? selectedProperty.images
      : [
          selectedProperty.image,
          FALLBACK_STAY_PHOTO,
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        ]
    ).filter(Boolean).slice(0, 8)

    const guestReviews = [
      { name: 'سارة م.', rating: 5, text: 'الاستقبال ممتاز، الشقة فاخرة جدًا والهدوء رائع.', trip: 'إقامة 3 ليالٍ' },
      { name: 'محمد ع.', rating: 5, text: 'الموقع مثالي، وسهولة الوصول للمتنزهات ومقاهي المدينة كانت مميزة.', trip: 'عائلة' },
      { name: 'ليلى ج.', rating: 4, text: 'المنظر جميل جدًا والتجهيز أنيق، والمالك سريع جدًا في الرد.', trip: 'رحلة عمل' },
    ]

    const propertyPricePreview = [
      { label: language === 'en' ? 'Price per night' : 'السعر لكل ليلة', value: formatCurrency(selectedProperty.priceValue, selectedProperty.currency, language) },
      { label: language === 'en' ? 'Stay length' : 'مدة الإقامة', value: pluralize(stayNights, 'night', language) },
      { label: language === 'en' ? 'Estimated total' : 'الإجمالي المتوقع', value: formatCurrency(grandTotal, selectedProperty.currency, language) },
    ]

    const mapCenter = selectedProperty.coordinates || { lat: 30.0333, lng: 31.2333 }

    return (
      <div className="page-shell detail-shell" data-testid="property-details-view">
        <section className="gallery-hero">
          <button
            type="button"
            className="gallery-arrow left"
            aria-label={language === 'en' ? 'Previous image' : 'الصورة السابقة'}
            onClick={() => setSelectedGalleryIndex((selectedGalleryIndex - 1 + galleryImages.length) % galleryImages.length)}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <img key={selectedGalleryIndex} src={galleryImages[selectedGalleryIndex] || galleryImages[0]} alt={getPropertyTitle(selectedProperty)} onError={handleStayImageError} />

          <button
            type="button"
            className="gallery-arrow right"
            aria-label={language === 'en' ? 'Next image' : 'الصورة التالية'}
            onClick={() => setSelectedGalleryIndex((selectedGalleryIndex + 1) % galleryImages.length)}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <button
            type="button"
            className={isFavorite(selectedProperty.id) ? 'gallery-fav active' : 'gallery-fav'}
            aria-label={language === 'en' ? 'Add to favorites' : 'إضافة للمفضلة'}
            onClick={(event) => toggleFavorite(event, selectedProperty.id)}
          >
            <HeartIcon filled={isFavorite(selectedProperty.id)} size={22} />
          </button>

          <button
            type="button"
            className="gallery-share"
            aria-label={language === 'en' ? 'Share stay' : 'مشاركة الإقامة'}
            onClick={async (event) => {
              event.stopPropagation()
              haptics.trigger('light')
              await shareProperty({
                title: selectedProperty.title,
                titleEn: selectedProperty.title_en,
                city: selectedProperty.city || selectedProperty.location,
                price: selectedProperty.priceValue,
                currency: selectedProperty.currency,
                url: typeof window !== 'undefined' ? window.location.href : '',
                language,
              })
            }}
          >
            <span className="material-symbols-outlined">share</span>
          </button>

          <div className="gallery-index-badge">{selectedGalleryIndex + 1} / {galleryImages.length}</div>

          <div className="gallery-price-overlay">
            <div className="gallery-price-left">
              <small>{language === 'en' ? 'From' : 'من'}</small>
              <strong>{formatCurrency(selectedProperty.priceValue, selectedProperty.currency, language)}</strong>
              <span className="muted">{language === 'en' ? '/ night' : ' / ليلة'}</span>
            </div>
            <div className="gallery-price-right">
              <small>{language === 'en' ? 'Estimated total' : 'الإجمالي المتوقع'}</small>
              <strong>{formatCurrency(grandTotal, selectedProperty.currency, language)}</strong>
            </div>
          </div>

          <div className="gallery-dots">
            {galleryImages.map((image, index) => (
              <span key={image + index} className={index === selectedGalleryIndex ? 'active' : ''} onClick={() => setSelectedGalleryIndex(index)}></span>
            ))}
          </div>
        </section>

        <div className="gallery-strip">
          {galleryImages.map((image, index) => (
            <button key={image + index} type="button" className={index === selectedGalleryIndex ? 'gallery-thumb active' : 'gallery-thumb'} onClick={() => setSelectedGalleryIndex(index)}>
              <img src={image} alt={`${getPropertyTitle(selectedProperty)} ${index + 1}`} onError={handleStayImageError} />
            </button>
          ))}
        </div>

        <section className="details-card">
          <div className="details-header">
            <div>
              <h2>{getPropertyTitle(selectedProperty)}</h2>
              <p>
                <span className="material-symbols-outlined">location_on</span>
                {getPropertyLocation(selectedProperty)}
              </p>
            </div>
            <div className="rating-chip">
              <span className="material-symbols-outlined">star</span>
              <span>{selectedProperty.rating}</span>
            </div>
          </div>

          <div className="tag-row">
            {getPropertyDetails(selectedProperty).map((detail, index) => (
              <span key={`${detail}-${index}`}>{detail}</span>
            ))}
          </div>

          <div className="price-action">
            <div>
              <small>{language === 'en' ? 'Price per night' : 'السعر لكل ليلة'}</small>
              <strong>{formatCurrency(selectedProperty.priceValue, selectedProperty.currency, language)}</strong>
            </div>
            <button
              type="button"
              className="primary-button"
              data-testid="details-book-now"
              onClick={() => navigate('checkout')}
            >
              {language === 'en' ? 'Book now' : 'احجز الآن'}
            </button>
          </div>
        </section>

        <section className="detail-summary-grid">
          {propertyPricePreview.map((item, index) => (
            <div key={`${item.label}-${index}`} className="detail-summary-card">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        <section className="detail-highlight-grid">
          {detailHighlights.map((item, index) => (
            <div key={`${item.title}-${index}`} className="detail-highlight-card">
              <span className="material-symbols-outlined">{item.icon}</span>
              <div>
                <small>{item.title}</small>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </section>

        <section className="detail-showcase-grid">
          <div className="detail-map-card">
            <div className="detail-card-head">
              <h3>{language === 'en' ? 'Location & neighborhood' : 'الموقع والحي'}</h3>
              <span className="status-pill neutral">{getPropertyCity(selectedProperty)}</span>
            </div>
            <div className="map-visual detail-map-visual">
              <MapView coordinates={mapCenter} zoom={14} markerLabel={getPropertyTitle(selectedProperty)} />
              <div className="detail-map-actions">
                <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapCenter.lat + ',' + mapCenter.lng)}`}>
                  {language === 'en' ? 'Open in Maps' : 'افتح في الخرائط'}
                </a>
              </div>
            </div>
            <div className="detail-location-row">
              <span className="material-symbols-outlined">location_on</span>
              <div>
                <strong>{getPropertyCity(selectedProperty)}</strong>
                <small>{getPropertyLocation(selectedProperty)}</small>
              </div>
            </div>
            <p>{language === 'en' ? `The property is in ${getPropertyLocation(selectedProperty)}, near shops, cafés, and key tourist attractions, with quick access to the area’s highlights.` : `يقع العقار في ${selectedProperty.location}، بالقرب من المحلات، المقاهي، والمناطق السياحية الأساسية، مع وصول سريع إلى أبرز المعالم في المنطقة.`}</p>
          </div>

          <div className="detail-similar-card">
            <div className="detail-card-head">
              <h3>{language === 'en' ? 'Similar stays' : 'عقارات مشابهة'}</h3>
              <button type="button" className="text-button" onClick={handleViewAllProperties}>{language === 'en' ? 'View all' : 'عرض الكل'}</button>
            </div>
            <div className="similar-stays">
              {properties.slice(0, 3).map((property) => (
                <button key={property.id} type="button" className="similar-stay-item" onClick={() => navigate('details', property)}>
                  <img src={property.image} alt={getPropertyTitle(property)} onError={handleStayImageError} />
                  <div>
                    <strong>{getPropertyTitle(property)}</strong>
                    <span>{getPropertyLocation(property)}</span>
                    <small>{formatCurrency(property.priceValue, property.currency, language)} / {language === 'en' ? 'night' : 'ليلة'}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Neighborhood & Nearby Services Explorer */}
        <section className="detail-neighborhood-section">
          <NeighborhoodExplorer
            location={getPropertyLocation(selectedProperty) || getPropertyCity(selectedProperty)}
            coordinates={mapCenter}
            language={language}
          />
        </section>

        <section className="detail-trust-grid">
          <div className="detail-review-card">
            <div className="detail-card-head">
              <h3>{language === 'en' ? 'Guest reviews' : 'تقييمات الضيوف'}</h3>
              <span className="rating-chip small"><span className="material-symbols-outlined">star</span>{selectedProperty.rating}</span>
            </div>
            <div className="review-score-box">
              <strong>{selectedProperty.rating}</strong>
              <span>{language === 'en' ? 'out of 5.0' : 'من 5.0'}</span>
            </div>
            <div className="review-bars">
              {[92, 76, 68, 52, 28].map((value, index) => (
                <div key={`${value}-${index}`} className="review-bar-row">
                  <span>{5 - index}</span>
                  <div className="review-line"><span style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-host-card">
            <div className="detail-card-head">
              <h3>{language === 'en' ? 'Host' : 'المضيف'}</h3>
              <span className="status-pill neutral">{language === 'en' ? 'Online now' : 'متصل الآن'}</span>
            </div>
            <div className="host-summary">
              <div className="host-avatar">A</div>
              <div>
               <strong>{language === 'en' ? 'Ahmed Al-Qahtani' : 'أحمد القحطاني'}</strong>
               <small>{language === 'en' ? 'Trusted host • 4 years' : 'مضيف موثوق • 4 سنوات'}</small>
              </div>
            </div>
            <ul className="host-details-list">
              <li><span className="material-symbols-outlined">check_circle</span>{language === 'en' ? 'Fast replies within 10 minutes' : 'استجابة سريعة خلال 10 دقائق'}</li>
              <li><span className="material-symbols-outlined">shield</span>{language === 'en' ? 'Verified and secure bookings' : 'حجوزات موثقة وآمنة'}</li>
              <li><span className="material-symbols-outlined">support_agent</span>{language === 'en' ? 'Support throughout the stay' : 'دعم طوال مدة الإقامة'}</li>
            </ul>
            <div className="host-actions">
              <div>
               <button type="button" className="primary-button" onClick={() => navigate('chat', selectedProperty)}>
                 {language === 'en' ? 'Message host' : 'مراسلة المالك'}
               </button>
               <button type="button" className="secondary-button" onClick={() => navigate('reviews', selectedProperty)}>
                 {language === 'en' ? 'View reviews' : 'عرض التقييمات'}
               </button>
                            </div>
            </div>
          </div>
        </section>

        <section className="content-section review-list-section">
          <div className="detail-card-head">
            <h3>{language === 'en' ? 'Guest reviews' : 'تقييمات النزلاء'}</h3>
            <span className="rating-chip small"><span className="material-symbols-outlined">star</span>{selectedProperty.rating}</span>
          </div>
          <div className="guest-review-list">
            {guestReviews.map((review) => (
              <article key={review.name} className="guest-review-item">
                <div className="guest-review-topline">
                  <strong>{review.name}</strong>
                  <span>{'★'.repeat(review.rating)}{review.rating < 5 ? '☆' : ''}</span>
                </div>
                <small>{review.trip}</small>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <h3>{activeText.description}</h3>
          <p>{getPropertyDescription(selectedProperty)}</p>
        </section>

        <section className="content-section amenity-grid">
          <h3>{activeText.amenities}</h3>
          <div className="amenities">
            {getPropertyAmenities(selectedProperty).map((amenity) => (
              <div key={amenity}>
                <span className="material-symbols-outlined">check_circle</span>
                {amenity}
              </div>
            ))}
          </div>
        </section>

        <section className="content-section booking-preview-card">
          <h3>{language === 'en' ? 'Booking info' : 'معلومات الحجز'}</h3>
          <div className="booking-preview-grid">
            <div>
              <span>{language === 'en' ? 'Free cancellation' : 'إلغاء مجاني'}</span>
              <strong>{selectedProperty.bookingInfo || (language === 'en' ? 'Up to 48 hours before arrival' : 'حتى 48 ساعة قبل الوصول')}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Payment' : 'الدفع'}</span>
              <strong>{language === 'en' ? 'Secure and confirmed instantly' : 'آمن ومؤكد فورياً'}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Neighborhood' : 'الحي'}</span>
              <strong>{language === 'en' ? 'Close to shops and cafés' : 'قريب من المحلات والمقاهي'}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Rating' : 'التقييم'}</span>
              <strong>{language === 'en' ? `${selectedProperty.rating}/5 from guests` : `${selectedProperty.rating}/5 من الضيوف`}</strong>
            </div>
          </div>
        </section>

        <section className="content-section policy-panel">
          <h3>{language === 'en' ? 'Stay policies' : 'سياسات الإقامة'}</h3>
          <ul className="policy-list">
            <li><span className="material-symbols-outlined">schedule</span>{language === 'en' ? 'Check-in from 3:00 PM' : 'تسجيل الوصول من الساعة 3:00 مساءً'}</li>
            <li><span className="material-symbols-outlined">logout</span>{language === 'en' ? 'Check-out by 12:00 PM' : 'تسجيل المغادرة حتى الساعة 12:00 ظهراً'}</li>
            <li><span className="material-symbols-outlined">pets</span>{language === 'en' ? 'Pets allowed in select units' : 'الحيوانات الأليفة مسموحة في بعض الوحدات'}</li>
            <li><span className="material-symbols-outlined">smoke_free</span>{language === 'en' ? 'No smoking inside the units' : 'ممنوع التدخين داخل الوحدات'}</li>
          </ul>
        </section>

        <section className="content-section chat-section">
          <div className="chat-header">
            <h3>{activeText.chat}</h3>
            <button type="button" className="secondary-button small-button" onClick={() => setChatOpen((open) => !open)}>
              {language === 'en' ? (chatOpen ? 'Hide' : 'Open') : (chatOpen ? 'إغلاق' : 'فتح')}
            </button>
          </div>

          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-thread">
                {chatMessages.map((message) => (
                  <div key={message.id} className={message.sender === 'user' ? 'chat-bubble user' : 'chat-bubble owner'}>
                    <span>{message.text}</span>
                    <small>{message.time}</small>
                  </div>
                ))}
              </div>
              <div className="chat-suggestions flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                {[
                  { ar: 'مواعيد الوصول؟', en: 'Check-in times?' },
                  { ar: 'سرعة الواي فاي؟', en: 'Wi-Fi speed?' },
                  { ar: 'موقف السيارات؟', en: 'Parking available?' },
                  { ar: 'الموقع الدقيق؟', en: 'Exact location?' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(language === 'en' ? item.en : item.ar)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 transition shadow-sm"
                  >
                    {language === 'en' ? item.en : item.ar}
                  </button>
                ))}
              </div>
              <div className="chat-compose">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={activeText.typeMessage}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                />
                <button type="button" className="primary-button" onClick={() => handleSendMessage()}>
                  {activeText.send}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="detail-sticky-bar">
          <div>
            <small>{language === 'en' ? 'From' : 'من'}</small>
            <strong>{formatCurrency(selectedProperty.priceValue, selectedProperty.currency)}</strong>
            <span>{language === 'en' ? '/ night' : ' / ليلة'}</span>
          </div>
          <button type="button" className="primary-button" onClick={() => navigate('checkout')}>
            {language === 'en' ? 'Book now' : 'احجز الآن'}
          </button>
        </div>
      </div>
    )
  }

  const today = new Date()
  const todayStr = formatISODate(today)
  const monthDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
  const currentYear = monthDate.getFullYear()
  const currentMonth = monthDate.getMonth()

  // Week starts on Saturday (السبت) in Arabic RTL standard
  // (monthDate.getDay() + 1) % 7 correctly aligns Saturday to column index 0
  const startWeekOffset = (monthDate.getDay() + 1) % 7
  const firstVisibleDate = new Date(currentYear, currentMonth, 1 - startWeekOffset)

  const visibleDates = []
  for (let index = 0; index < 42; index += 1) {
    const d = new Date(firstVisibleDate.getFullYear(), firstVisibleDate.getMonth(), firstVisibleDate.getDate() + index)
    const isoString = formatISODate(d)
    const isCurrentMonth = d.getMonth() === currentMonth
    const isPast = isoString < todayStr
    const isBooked = Array.isArray(selectedProperty?.bookedDates) && selectedProperty.bookedDates.includes(isoString)

    visibleDates.push({
      date: d,
      dayNumber: d.getDate(),
      isoString,
      isCurrentMonth,
      isPast,
      isBooked,
      isDisabled: !isCurrentMonth || isPast || isBooked,
    })
  }

  const handleCalendarDateSelect = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return
    if (dateString < todayStr) return

    // 1. If no checkIn or both are chosen, first click sets checkIn and clears checkOut
    if (!bookingDates.checkIn || (bookingDates.checkIn && bookingDates.checkOut)) {
      setBookingDates((currentDates) => ({
        ...currentDates,
        checkIn: dateString,
        checkOut: '',
      }))
      return
    }

    // 2. If second click is on or before checkIn, reset checkIn to this day
    if (dateString <= bookingDates.checkIn) {
      setBookingDates((currentDates) => ({
        ...currentDates,
        checkIn: dateString,
        checkOut: '',
      }))
      return
    }

    // 3. Second click strictly after checkIn: sets checkOut (minimum 1 night)
    setBookingDates((currentDates) => ({
      ...currentDates,
      checkOut: dateString,
    }))
  }

  useEffect(() => {
    if (user) {
      setGuestForm((current) => {
        const hasData = current.fullName || current.phone || current.email
        if (!hasData) {
          const prefilled = {
            fullName: user.fullName || user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            notes: current.notes || '',
          }
          try {
            sessionStorage.setItem('hajzy_booking_guest_info', JSON.stringify(prefilled))
          } catch {}
          return prefilled
        }
        return current
      })
    }
  }, [user])

  useEffect(() => {
    try {
      if (guestForm.phone && !walletNumber) {
        const clean = normalizePhone(guestForm.phone)
        if (/^01[0125]\d{8}$/.test(clean)) {
          setWalletNumber(clean)
        } else if (/^(\+20|0020)1[0125]\d{8}$/.test(clean)) {
          const local = clean.startsWith('0020') ? `0${clean.slice(4)}` : `0${clean.slice(3)}`
          setWalletNumber(local)
        } else if (/^201[0125]\d{8}$/.test(clean)) {
          setWalletNumber(`0${clean.slice(2)}`)
        }
      }
    } catch (err) {
      console.error('Failed to sync wallet number from phone:', err)
    }
  }, [guestForm.phone, walletNumber])

  const handleGuestFieldBlur = (field) => {
    if (field === 'fullName') {
      const valRes = validateFullName(guestForm.fullName, language)
      setGuestErrors((prev) => ({
        ...prev,
        fullName: valRes.isValid ? '' : valRes.error,
      }))
    } else if (field === 'phone') {
      const valRes = validatePhone(guestForm.phone, language)
      setGuestErrors((prev) => ({
        ...prev,
        phone: valRes.isValid ? '' : valRes.error,
      }))
    } else if (field === 'email') {
      const valRes = validateEmail(guestForm.email, language)
      setGuestErrors((prev) => ({
        ...prev,
        email: valRes.isValid ? '' : valRes.error,
      }))
    }
  }

  const handleGuestFieldChange = (field, value) => {
    const nextForm = { ...guestForm, [field]: value }
    setGuestForm(nextForm)
    try {
      sessionStorage.setItem('hajzy_booking_guest_info', JSON.stringify(nextForm))
    } catch {}

    // Only validate live during typing after first failed submit attempt or if the field already had an error
    if (guestFormTouched || guestErrors[field]) {
      if (field === 'fullName') {
        const valRes = validateFullName(value, language)
        setGuestErrors((prev) => ({
          ...prev,
          fullName: valRes.isValid ? '' : valRes.error,
        }))
      } else if (field === 'phone') {
        const valRes = validatePhone(value, language)
        setGuestErrors((prev) => ({
          ...prev,
          phone: valRes.isValid ? '' : valRes.error,
        }))
      } else if (field === 'email') {
        const valRes = validateEmail(value, language)
        setGuestErrors((prev) => ({
          ...prev,
          email: valRes.isValid ? '' : valRes.error,
        }))
      }
    }
  }

  const handleStepNavigation = (targetStep) => {
    if (targetStep === bookingStep) return

    // Going backwards is always allowed, preserving input values
    if (targetStep < bookingStep) {
      setBookingStep(targetStep)
      return
    }

    // Checking step 1 dates validity before proceeding to 2 or 3
    const isStep1Valid = Boolean(
      bookingDates?.checkIn &&
      bookingDates?.checkOut &&
      nightsBetween(bookingDates.checkIn, bookingDates.checkOut) >= 1
    )

    if (!isStep1Valid) {
      showToast(
        language === 'en'
          ? 'Please select check-in and check-out dates.'
          : 'اختر تاريخ الوصول والمغادرة'
      )
      setBookingStep(1)
      return
    }

    const minRequiredNights = Number(selectedProperty?.minNights || selectedProperty?.min_nights || 1)
    if (stayNights < minRequiredNights) {
      showToast(
        language === 'en'
          ? `Minimum stay is ${pluralize(minRequiredNights, 'night', 'en')}.`
          : `الحد الأدنى للإقامة في هذا العقار هو ${pluralize(minRequiredNights, 'night', 'ar')}.`
      )
      setBookingStep(1)
      return
    }

    if (targetStep === 2) {
      setBookingStep(2)
      return
    }

    if (targetStep === 3) {
      // Must validate guest information completely before advancing to payment
      const validation = validateGuestForm(guestForm, language)
      if (!validation.isValid) {
        setGuestErrors(validation.errors)
        setGuestFormTouched(true)
        setBookingStep(2)
        showToast(
          language === 'en'
            ? 'Please fill in all required guest details.'
            : 'يرجى ملء جميع بيانات الضيف الإجبارية بشكل صحيح.'
        )
        setTimeout(() => {
          if (validation.firstInvalidField === 'fullName' && guestNameRef.current) {
            guestNameRef.current.focus()
            guestNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } else if (validation.firstInvalidField === 'phone' && guestPhoneRef.current) {
            guestPhoneRef.current.focus()
            guestPhoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } else if (validation.firstInvalidField === 'email' && guestEmailRef.current) {
            guestEmailRef.current.focus()
            guestEmailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 50)
        return
      }

      setGuestForm(validation.normalizedData)
      try {
        sessionStorage.setItem('hajzy_booking_guest_info', JSON.stringify(validation.normalizedData))
      } catch {}
      setGuestErrors({})
      setBookingStep(3)
    }
  }

  const handleProceedToPayment = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (isSubmittingStep2Ref.current) return
    isSubmittingStep2Ref.current = true

    const isStep1Valid = Boolean(
      bookingDates?.checkIn &&
      bookingDates?.checkOut &&
      nightsBetween(bookingDates.checkIn, bookingDates.checkOut) >= 1
    )

    if (!isStep1Valid) {
      showToast(
        language === 'en'
          ? 'Please select check-in and check-out dates.'
          : 'اختر تاريخ الوصول والمغادرة'
      )
      setBookingStep(1)
      isSubmittingStep2Ref.current = false
      return
    }

    const validation = validateGuestForm(guestForm, language)
    if (!validation.isValid) {
      setGuestErrors(validation.errors)
      setGuestFormTouched(true)
      haptics.trigger('error')

      setTimeout(() => {
        if (validation.firstInvalidField === 'fullName' && guestNameRef.current) {
          guestNameRef.current.focus()
          guestNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (validation.firstInvalidField === 'phone' && guestPhoneRef.current) {
          guestPhoneRef.current.focus()
          guestPhoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (validation.firstInvalidField === 'email' && guestEmailRef.current) {
          guestEmailRef.current.focus()
          guestEmailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)

      isSubmittingStep2Ref.current = false
      return
    }

    // If all valid, normalize and save data
    setGuestForm(validation.normalizedData)
    try {
      sessionStorage.setItem('hajzy_booking_guest_info', JSON.stringify(validation.normalizedData))
    } catch {}
    setGuestErrors({})
    haptics.trigger('light')
    setBookingStep(3)

    setTimeout(() => {
      isSubmittingStep2Ref.current = false
    }, 400)
  }

  useEffect(() => {
    if (activePage !== 'checkout') return

    if (bookingStep === 3) {
      const validation = validateGuestForm(guestForm, language)
      if (!validation.isValid) {
        setBookingStep(2)
        setGuestErrors(validation.errors)
        setGuestFormTouched(true)
      }
    } else if (bookingStep === 2) {
      const isStep1Valid = Boolean(
        bookingDates?.checkIn &&
        bookingDates?.checkOut &&
        nightsBetween(bookingDates.checkIn, bookingDates.checkOut) >= 1
      )
      if (!isStep1Valid) {
        setBookingStep(1)
      }
    }
  }, [activePage, bookingStep, guestForm, language, bookingDates])

  const renderCheckoutPage = () => {
    const stepTitles = [
      language === 'en' ? 'Stay details' : 'تفاصيل الإقامة',
      language === 'en' ? 'Guest info' : 'بيانات الضيف',
      language === 'en' ? 'Payment' : 'الدفع',
    ]
    const calendarWeekdays =
      language === 'en'
        ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        : ['سبت', 'أحد', 'إثن', 'ثلاث', 'أرب', 'خم', 'جم']
    const monthFormatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-EG', { month: 'long', year: 'numeric' })
    const minRequiredNights = Number(selectedProperty?.minNights || selectedProperty?.min_nights || 1)
    const isPastMonthDisabled =
      calendarMonth.getFullYear() <= today.getFullYear() &&
      calendarMonth.getMonth() <= today.getMonth()

    return (
      <ErrorBoundary
        fallback={({ error, retry, reload }) => (
          <div className="page-shell checkout-shell">
            <section className="checkout-card" role="alert" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '12px' }}>
                warning
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                {language === 'en' ? 'An error occurred, please try again' : 'حدث خطأ، حاول مرة أخرى'}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {error?.message || (language === 'en' ? 'Please reload or retry.' : 'يرجى المحاولة مجدداً أو إعادة تحميل الصفحة.')}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button type="button" className="secondary-button" onClick={retry}>
                  {language === 'en' ? 'Try again' : 'إعادة المحاولة'}
                </button>
                <button type="button" className="primary-button" onClick={reload}>
                  {language === 'en' ? 'Reload page' : 'إعادة تحميل'}
                </button>
              </div>
            </section>
          </div>
        )}
      >
        <div className="page-shell checkout-shell">
          <section className="checkout-card">
            <div className="checkout-image">
              <img src={selectedProperty.image} alt={getPropertyTitle(selectedProperty)} onError={handleStayImageError} />
            </div>

            <div className="checkout-body">
              <div className="booking-progress-steps" role="tablist" aria-label={language === 'en' ? 'Booking steps' : 'خطوات الحجز'}>
                {stepTitles.map((title, index) => {
                  const stepNum = index + 1
                  const isActive = bookingStep === stepNum
                  const isCompleted = bookingStep > stepNum
                  return (
                    <button
                      key={title}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={[
                        isActive ? 'active' : '',
                        isCompleted ? 'completed' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleStepNavigation(stepNum)}
                    >
                      {stepNum}. {title}
                    </button>
                  )
                })}
              </div>

              <div className="details-header compact">
                <div>
                  <h2>{getPropertyTitle(selectedProperty)}</h2>
                  <p>{getPropertyLocation(selectedProperty)}</p>
                </div>
                <div className="rating-chip">
                  <span className="material-symbols-outlined">star</span>
                  <span>{selectedProperty.rating}</span>
                </div>
              </div>

              {bookingStep === 1 && (
                <>
                  <div className="info-grid">
                    <div className="info-box">
                      <span>{language === 'en' ? 'Check-in date' : 'تاريخ الوصول'}</span>
                      <div
                        className="date-picker-field"
                        onClick={(e) => {
                          try {
                            e.currentTarget.querySelector('input[type="date"]')?.showPicker?.()
                          } catch (err) {}
                        }}
                      >
                        <div className="date-picker-display">
                          <span className="material-symbols-outlined date-icon">calendar_today</span>
                          <span className="date-text">{formatDate(bookingDates.checkIn, language)}</span>
                        </div>
                        <input
                          type="date"
                          className="date-picker-native-input"
                          min={todayStr}
                          value={bookingDates.checkIn || ''}
                          onChange={(event) => {
                            const val = event.target.value
                            setBookingDates((currentDates) => {
                              let nextCheckOut = currentDates.checkOut
                              if (nextCheckOut && val >= nextCheckOut) {
                                nextCheckOut = ''
                              }
                              return {
                                ...currentDates,
                                checkIn: val,
                                checkOut: nextCheckOut,
                              }
                            })
                            if (val) {
                              const d = parseISODate(val)
                              if (d) setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
                            }
                          }}
                          aria-label={language === 'en' ? 'Check-in date' : 'تاريخ الوصول'}
                        />
                      </div>
                    </div>
                    <div className="info-box">
                      <span>{language === 'en' ? 'Check-out date' : 'تاريخ المغادرة'}</span>
                      <div
                        className="date-picker-field"
                        onClick={(e) => {
                          try {
                            e.currentTarget.querySelector('input[type="date"]')?.showPicker?.()
                          } catch (err) {}
                        }}
                      >
                        <div className="date-picker-display">
                          <span className="material-symbols-outlined date-icon">calendar_today</span>
                          <span className="date-text">{formatDate(bookingDates.checkOut, language)}</span>
                        </div>
                        <input
                          type="date"
                          className="date-picker-native-input"
                          min={bookingDates.checkIn || todayStr}
                          value={bookingDates.checkOut || ''}
                          onChange={(event) => {
                            const val = event.target.value
                            setBookingDates((currentDates) => ({
                              ...currentDates,
                              checkOut: val,
                            }))
                            if (val) {
                              const d = parseISODate(val)
                              if (d) setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
                            }
                          }}
                          aria-label={language === 'en' ? 'Check-out date' : 'تاريخ المغادرة'}
                        />
                      </div>
                    </div>
                    <div className="info-box">
                      <span>{language === 'en' ? 'Guests' : 'الضيوف'}</span>
                      <select
                        value={bookingDates.guests}
                        onChange={(event) =>
                          setBookingDates((currentDates) => ({
                            ...currentDates,
                            guests: Number(event.target.value),
                          }))
                        }
                      >
                        <option value={1}>{pluralize(1, 'guest', language)}</option>
                        <option value={2}>{pluralize(2, 'guest', language)}</option>
                        <option value={3}>{pluralize(3, 'guest', language)}</option>
                        <option value={4}>{pluralize(4, 'guest', language)}</option>
                      </select>
                    </div>
                    <div className="info-box">
                      <span>{language === 'en' ? 'Nights' : 'عدد الليالي'}</span>
                      <strong>
                        {stayNights > 0
                          ? pluralize(stayNights, 'night', language)
                          : language === 'en'
                            ? 'Select dates'
                            : 'حدد التواريخ'}
                      </strong>
                      {minRequiredNights > 1 && (
                        <small className={`block text-[11px] mt-0.5 ${stayNights > 0 && stayNights < minRequiredNights ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500'}`}>
                          {language === 'en' ? `Min. ${pluralize(minRequiredNights, 'night', 'en')}` : `الحد الأدنى: ${pluralize(minRequiredNights, 'night', 'ar')}`}
                        </small>
                      )}
                    </div>
                  </div>

                  {stayNights > 0 && stayNights < minRequiredNights && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 my-2">
                      <span className="material-symbols-outlined text-base text-amber-600 shrink-0">info</span>
                      <span>
                        {language === 'en'
                          ? `This property requires a minimum stay of ${pluralize(minRequiredNights, 'night', 'en')}.`
                          : `يشترط هذا العقار حداً أدنى للإقامة قدره ${pluralize(minRequiredNights, 'night', 'ar')}. يرجى تمديد موعد المغادرة للمتابعة.`}
                      </span>
                    </div>
                  )}

                  <div className="calendar-picker" dir={language === 'en' ? 'ltr' : 'rtl'}>
                    <div className="calendar-header">
                      <button
                        type="button"
                        className="calendar-arrow"
                        disabled={isPastMonthDisabled}
                        aria-disabled={isPastMonthDisabled}
                        onClick={() => setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        aria-label={language === 'en' ? 'Previous month' : 'الشهر السابق'}
                      >
                        <span className="material-symbols-outlined">
                          {language === 'en' ? 'chevron_left' : 'chevron_right'}
                        </span>
                      </button>
                      <strong>{monthFormatter.format(monthDate)}</strong>
                      <button
                        type="button"
                        className="calendar-arrow"
                        onClick={() => setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        aria-label={language === 'en' ? 'Next month' : 'الشهر التالي'}
                      >
                        <span className="material-symbols-outlined">
                          {language === 'en' ? 'chevron_right' : 'chevron_left'}
                        </span>
                      </button>
                    </div>

                    <div className="calendar-weekdays">
                      {calendarWeekdays.map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>

                    <div className="calendar-grid">
                      {visibleDates.map((item) => {
                        const isStart = Boolean(bookingDates.checkIn && item.isoString === bookingDates.checkIn)
                        const isEnd = Boolean(bookingDates.checkOut && item.isoString === bookingDates.checkOut)
                        const isSelected = isStart || isEnd
                        const inRange = Boolean(
                          bookingDates.checkIn &&
                          bookingDates.checkOut &&
                          item.isoString > bookingDates.checkIn &&
                          item.isoString < bookingDates.checkOut
                        )

                        return (
                          <button
                            key={item.isoString}
                            type="button"
                            disabled={item.isDisabled}
                            aria-disabled={item.isDisabled}
                            aria-label={`${item.isoString}${isSelected ? ' Selected' : ''}${item.isDisabled ? ' Unavailable' : ''}`}
                            className={[
                              'calendar-day',
                              item.isCurrentMonth ? '' : 'muted',
                              item.isPast ? 'past' : '',
                              item.isBooked ? 'booked' : '',
                              isSelected ? 'selected' : '',
                              isStart ? 'range-start' : '',
                              isEnd ? 'range-end' : '',
                              inRange ? 'in-range' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !item.isDisabled && handleCalendarDateSelect(item.isoString)}
                          >
                            {item.dayNumber}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="checkout-actions">
                    <button type="button" className="secondary-button" onClick={() => navigate('details')}>
                      {language === 'en' ? 'Back' : 'رجوع'}
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      data-testid="checkout-step1-continue"
                      onClick={() => handleStepNavigation(2)}
                    >
                      {language === 'en' ? 'Continue' : 'متابعة'}
                    </button>
                  </div>
                </>
              )}

            {bookingStep === 2 && (
              <>
                <div className="guest-form-grid" noValidate>
                  <label htmlFor="guest-full-name">
                    <span className="field-label-text">
                      {language === 'en' ? 'Full name' : 'الاسم الكامل'}
                      <span className="required-star" aria-hidden="true">*</span>
                    </span>
                    <input
                      id="guest-full-name"
                      data-testid="guest-fullname"
                      ref={guestNameRef}
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(guestErrors.fullName)}
                      aria-describedby={guestErrors.fullName ? 'guest-fullname-error' : undefined}
                      className={guestErrors.fullName ? 'has-error' : ''}
                      value={guestForm.fullName}
                      onChange={(event) => handleGuestFieldChange('fullName', event.target.value)}
                      onBlur={() => handleGuestFieldBlur('fullName')}
                      placeholder={language === 'en' ? 'Your full name' : 'الاسم الكامل'}
                    />
                    {guestErrors.fullName && (
                      <span id="guest-fullname-error" className="field-error-message" role="alert">
                        <span className="material-symbols-outlined field-error-icon">error</span>
                        <span>{guestErrors.fullName}</span>
                      </span>
                    )}
                  </label>

                  <label htmlFor="guest-phone">
                    <span className="field-label-text">
                      {language === 'en' ? 'Phone' : 'رقم الهاتف'}
                      <span className="required-star" aria-hidden="true">*</span>
                    </span>
                    <input
                      id="guest-phone"
                      data-testid="guest-phone"
                      ref={guestPhoneRef}
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(guestErrors.phone)}
                      aria-describedby={guestErrors.phone ? 'guest-phone-error' : undefined}
                      className={`guest-input-phone ${guestErrors.phone ? 'has-error' : ''}`}
                      style={{ textAlign: 'start' }}
                      value={guestForm.phone}
                      onChange={(event) => handleGuestFieldChange('phone', event.target.value)}
                      onBlur={() => handleGuestFieldBlur('phone')}
                      placeholder={language === 'en' ? '+20 1xx xxx xxxx' : '01xxxxxxxxx'}
                    />
                    {guestErrors.phone && (
                      <span id="guest-phone-error" className="field-error-message" role="alert">
                        <span className="material-symbols-outlined field-error-icon">error</span>
                        <span>{guestErrors.phone}</span>
                      </span>
                    )}
                  </label>

                  <label htmlFor="guest-email">
                    <span className="field-label-text">
                      {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                      <span className="required-star" aria-hidden="true">*</span>
                    </span>
                    <input
                      id="guest-email"
                      data-testid="guest-email"
                      ref={guestEmailRef}
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      dir="ltr"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(guestErrors.email)}
                      aria-describedby={guestErrors.email ? 'guest-email-error' : undefined}
                      className={`guest-input-email ${guestErrors.email ? 'has-error' : ''}`}
                      style={{ textAlign: 'start' }}
                      value={guestForm.email}
                      onChange={(event) => handleGuestFieldChange('email', event.target.value)}
                      onBlur={() => handleGuestFieldBlur('email')}
                      placeholder="name@example.com"
                    />
                    {guestErrors.email && (
                      <span id="guest-email-error" className="field-error-message" role="alert">
                        <span className="material-symbols-outlined field-error-icon">error</span>
                        <span>{guestErrors.email}</span>
                      </span>
                    )}
                  </label>

                  <label htmlFor="guest-notes" className="full-width">
                    <span>{language === 'en' ? 'Notes' : 'ملاحظات'}</span>
                    <textarea
                      id="guest-notes"
                      name="notes"
                      rows="4"
                      value={guestForm.notes}
                      onChange={(event) => handleGuestFieldChange('notes', event.target.value)}
                      placeholder={language === 'en' ? 'Any arrival notes or preferences (optional)' : 'أي ملاحظات أو تفضيلات الوصول (اختياري)'}
                    />
                  </label>
                </div>

                <div className="checkout-actions">
                  <button type="button" className="secondary-button" onClick={() => setBookingStep(1)}>
                    {language === 'en' ? 'Back' : 'رجوع'}
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    data-testid="checkout-step2-continue"
                    onClick={handleProceedToPayment}
                  >
                    {language === 'en' ? 'Continue to payment' : 'متابعة للدفع'}
                  </button>
                </div>
              </>
            )}

            {bookingStep === 3 && (
              <>
                <section className="booking-trust-panel compact-panel">
                  <div className="booking-trust-header">
                    <div>
                      <span className="summary-kicker">{language === 'en' ? 'Hajzy promise' : 'وعد حاجزي'}</span>
                      <h3>{language === 'en' ? 'Booking with confidence' : 'حجز بطمأنينة'}</h3>
                    </div>
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div className="trust-points">
                    <div>
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>{language === 'en' ? 'Free cancellation' : 'إلغاء مجاني'}</span>
                    </div>
                    <div>
                      <span className="material-symbols-outlined">support_agent</span>
                      <span>{language === 'en' ? 'Instant host response' : 'استجابة فورية من المالك'}</span>
                    </div>
                    <div>
                      <span className="material-symbols-outlined">shield</span>
                      <span>{language === 'en' ? 'Secure payment flow' : 'تجربة دفع آمنة'}</span>
                    </div>
                  </div>
                </section>

                {/* Split Bill with Friends Feature Banner */}
                <div className="split-payment-trigger-card">
                  <div className="split-trigger-copy">
                    <span className="split-badge">{language === 'en' ? '✨ New Feature' : '✨ ميزة جديدة'}</span>
                    <strong>{language === 'en' ? 'Traveling with a group or friends?' : 'مسافر مع عائلة أو أصدقاء؟'}</strong>
                    <p>{language === 'en' ? 'Split the booking total and share a payment link instantly.' : 'قسّم إجمالي الحجز وشارك رابط الدفع معهم في ثوانٍ.'}</p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button split-trigger-btn"
                    onClick={() => setIsSplitModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">group_work</span>
                    <span>{language === 'en' ? 'Split Payment' : 'تقسيم الفاتورة'}</span>
                  </button>
                </div>

                <section className="payment-card compact-payment">
                  <h3>{activeText.paymentMethod}</h3>

                  {/* InstaPay */}
                  <label className={`payment-option ${paymentMethod === 'instapay' ? 'selected' : ''}`}>
                    <div className="label-wrap">
                      <span className="material-symbols-outlined text-emerald-600">bolt</span>
                      <div>
                        <strong>{language === 'en' ? 'InstaPay (Fast Egyptian Transfer)' : 'إنستاباي (InstaPay)'}</strong>
                        <small className="block text-slate-500">{language === 'en' ? 'Instant bank-to-bank transfer via IPA / Phone' : 'تحويل لحظي مباشر عبر عنوان الدفع IPA أو الهاتف'}</small>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      data-testid="payment-instapay"
                      checked={paymentMethod === 'instapay'}
                      onChange={() => setPaymentMethod('instapay')}
                    />
                  </label>

                  {paymentMethod === 'instapay' && (
                    <div className="payment-subpanel">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'en' ? 'Your InstaPay IPA Address / Mobile' : 'عنوان الدفع اللحظي (IPA) أو رقم الهاتف'}
                      </label>
                      <input
                        type="text"
                        data-testid="instapay-handle"
                        value={instapayHandle}
                        onChange={(e) => setInstapayHandle(e.target.value)}
                        placeholder="username@instapay"
                        className="w-full text-sm p-2.5 rounded-lg border border-slate-200"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg">
                        <span>{language === 'en' ? 'Official Receiver: hajzy@instapay' : 'الحساب المعتمد للاستقبال: hajzy@instapay'}</span>
                        <span className="material-symbols-outlined text-sm">verified</span>
                      </div>
                    </div>
                  )}

                  {/* Vodafone Cash & Wallets */}
                  <label className={`payment-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
                    <div className="label-wrap">
                      <span className="material-symbols-outlined text-rose-600">phone_android</span>
                      <div>
                        <strong>{language === 'en' ? 'Vodafone Cash & Mobile Wallets' : 'فودافون كاش والمحافظ الإلكترونية'}</strong>
                        <small className="block text-slate-500">{language === 'en' ? 'Vodafone, Orange, Etisalat, WE Cash' : 'فودافون، أورنج، اتصالات، وي كاش'}</small>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      data-testid="payment-wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                    />
                  </label>

                  {paymentMethod === 'wallet' && (
                    <div className="payment-subpanel">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'en' ? 'Wallet Mobile Number' : 'رقم الهاتف المسجل بالمحفظة'}
                      </label>
                      <input
                        type="tel"
                        data-testid="wallet-number"
                        value={walletNumber}
                        onChange={(e) => setWalletNumber(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full text-sm p-2.5 rounded-lg border border-slate-200"
                      />
                      <small className="text-[11px] text-slate-500 mt-1 block">
                        {language === 'en' ? 'You will receive an OTP confirmation prompt on your phone.' : 'ستصلك رسالة تأكيد وطلب الرقم السري على هاتفك لإتمام الخصم.'}
                      </small>
                    </div>
                  )}

                  {/* Fawry */}
                  <label className={`payment-option ${paymentMethod === 'fawry' ? 'selected' : ''}`}>
                    <div className="label-wrap">
                      <span className="material-symbols-outlined text-amber-600">store</span>
                      <div>
                        <strong>{language === 'en' ? 'Fawry Pay' : 'فوري (Fawry Pay)'}</strong>
                        <small className="block text-slate-500">{language === 'en' ? 'Pay at any Fawry retail kiosk nationwide' : 'الدفع في أي ماكينة فوري بكود مرجعي'}</small>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      data-testid="payment-fawry"
                      checked={paymentMethod === 'fawry'}
                      onChange={() => setPaymentMethod('fawry')}
                    />
                  </label>

                  {paymentMethod === 'fawry' && (
                    <div className="payment-subpanel">
                      <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div>
                          <small className="block text-[11px] text-amber-800 dark:text-amber-300">{language === 'en' ? 'Fawry Reference Code (Valid 24h)' : 'الرقم المرجعي لفوري (صالح 24 ساعة)'}</small>
                          <strong className="text-base font-mono text-amber-950 dark:text-amber-200">{fawryRefCode}</strong>
                        </div>
                        <button
                          type="button"
                          className="secondary-button small-button text-xs"
                          onClick={() => {
                            navigator.clipboard?.writeText(fawryRefCode)
                            setToast(language === 'en' ? 'Fawry code copied!' : 'تم نسخ كود فوري!')
                          }}
                        >
                          {language === 'en' ? 'Copy Code' : 'نسخ الكود'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Credit Card / Apple Pay */}
                  <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <div className="label-wrap">
                      <span className="material-symbols-outlined text-sky-600">credit_card</span>
                      <div>
                        <strong>{language === 'en' ? 'Credit / Debit Cards & Apple Pay' : 'بطاقات بنكية / ميزة / Apple Pay'}</strong>
                        <small className="block text-slate-500">Visa, MasterCard, Meeza</small>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      data-testid="payment-card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                  </label>

                  {paymentMethod === 'card' && selectedProperty?.currency && selectedProperty.currency !== 'EGP' && (
                    <div className="payment-subpanel">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs border border-sky-100 dark:border-sky-900">
                        <span className="material-symbols-outlined text-base text-sky-600 shrink-0">currency_exchange</span>
                        <span>
                          {language === 'en'
                            ? 'Card payments are processed securely in EGP via Paymob at official bank exchange rates.'
                            : 'تتم معالجة الدفع بالبطاقة بأمان بالجنيه المصري (EGP) عبر بوابة Paymob طبقاً لسعر الصرف البنكي الرسمي.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cash on arrival */}
                  <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <div className="label-wrap">
                      <span className="material-symbols-outlined text-slate-600">payments</span>
                      <div>
                        <strong>{language === 'en' ? 'Cash on arrival' : 'الدفع نقداً عند الوصول'}</strong>
                        <small className="block text-slate-500">{language === 'en' ? 'Pay directly to host at check-in' : 'الدفع للمالك مباشرة عند استلام المفتاح'}</small>
                      </div>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  </label>
                </section>

                {/* Promo / Discount Code Card */}
                <section className="promo-code-card">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">local_offer</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {language === 'en' ? 'Promo Code / Discount' : 'كود الخصم / كوبون التخفيض'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'Have a voucher code? Apply it before payment.' : 'هل لديك كود خصم؟ طبقه هنا لتخفيض الفاتورة قبل الدفع.'}
                      </p>
                    </div>
                  </div>

                  {appliedPromo ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                        <div>
                          <strong className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                            {appliedPromo.code} ({appliedPromo.percent}% {language === 'en' ? 'OFF' : 'خصم'})
                          </strong>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            {language === 'en'
                              ? `Saved ${formatCurrency(promoDiscountAmount, selectedProperty?.currency, language)} on this stay`
                              : `وفرت ${formatCurrency(promoDiscountAmount, selectedProperty?.currency, language)} من إجمالي الحجز`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline px-2 py-1"
                        onClick={handleRemovePromoCode}
                      >
                        {language === 'en' ? 'Remove' : 'إلغاء'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <div className="promo-input-group">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => {
                            setPromoCodeInput(e.target.value.toUpperCase())
                            if (promoError) setPromoError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyPromoCode()
                            }
                          }}
                          placeholder={language === 'en' ? 'e.g. COAST20' : 'مثال: COAST20'}
                          className="promo-input-field"
                        />
                        <button
                          type="button"
                          className="promo-apply-btn"
                          onClick={() => handleApplyPromoCode()}
                        >
                          {language === 'en' ? 'Apply' : 'تطبيق'}
                        </button>
                      </div>

                      {promoError && (
                        <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">error</span>
                          <span>{promoError}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 pt-0.5">
                        <span className="text-[11px]">{language === 'en' ? 'Available code:' : 'كود متاح:'}</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPromoCode('COAST20')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 hover:bg-emerald-200/70 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold transition"
                        >
                          <span>COAST20</span>
                          <span className="text-[10px] font-sans font-normal opacity-85">({language === 'en' ? '20% off' : 'خصم 20%'})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="booking-summary-sheet compact-summary">
                  <div className="booking-summary-header">
                    <div>
                      <span className="summary-kicker">{language === 'en' ? 'Trip details' : 'تفاصيل الرحلة'}</span>
                      <h3>{getPropertyTitle(selectedProperty)}</h3>
                    </div>
                    <div className="summary-rating">
                      <span className="material-symbols-outlined">star</span>
                      <span>{selectedProperty.rating}</span>
                    </div>
                  </div>

                  <div className="booking-meta-grid">
                    <div className="meta-tile">
                      <small>{language === 'en' ? 'Check-in' : 'تاريخ الوصول'}</small>
                      <strong>{formatDate(bookingDates.checkIn, language)}</strong>
                    </div>
                    <div className="meta-tile">
                      <small>{language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}</small>
                      <strong>{formatDate(bookingDates.checkOut, language)}</strong>
                    </div>
                    <div className="meta-tile">
                      <small>{language === 'en' ? 'Guests' : 'الضيوف'}</small>
                      <strong>{pluralize(bookingDates.guests, 'guest', language)}</strong>
                    </div>
                    <div className="meta-tile accent">
                      <small>{language === 'en' ? 'Nights' : 'الليالي'}</small>
                      <strong>{pluralize(stayNights, 'night', language)}</strong>
                    </div>
                  </div>

                  <div className="booking-price-list">
                    {bookingBreakdown.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className={item.total ? 'booking-price-row total' : item.isDiscount ? 'booking-price-row discount text-emerald-600 dark:text-emerald-400 font-semibold' : 'booking-price-row'}
                      >
                        <span>{item.label}</span>
                        <strong>
                          {item.isDiscount
                            ? `-${formatCurrency(item.value, selectedProperty.currency, language)}`
                            : formatCurrency(item.value, selectedProperty.currency, language)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="checkout-actions">
                  <button type="button" className="secondary-button" onClick={() => setBookingStep(2)}>
                    {language === 'en' ? 'Back' : 'رجوع'}
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    data-testid="confirm-booking-button"
                    onClick={handleBookingConfirm}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (language === 'en' ? 'Processing payment...' : 'جارٍ تجهيز الدفع...') : activeText.confirmPayment}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </ErrorBoundary>
  )
  }

  const renderSuccessPage = () => {
    const currentBooking = lastBooking ?? bookings[0]

    return (
      <div className="page-shell success-shell" data-testid="booking-success-view">
        <div className="success-card">
          <div className="success-icon" aria-hidden="true"></div>
          <h2 data-testid="booking-confirmation-heading">{language === 'en' ? 'Booking confirmed successfully' : 'تم تأكيد الحجز بنجاح'}</h2>
          <p>{language === 'en' ? 'Thank you for choosing the right stay. We look forward to welcoming you.' : 'شكراً لاختيارك الشقة المناسبة. نتطلع للترحيب بك.'}</p>

          <div className="reference-row">
            <span>{language === 'en' ? 'Reference number:' : 'رقم المرجع:'}</span>
            <div className="reference-box">
              <strong>{currentBooking.reference ?? '#REF-98765'}</strong>
              <span className="material-symbols-outlined">content_copy</span>
            </div>
          </div>

          <div className="booking-summary">
            <div>
              <span>{language === 'en' ? 'Check-in' : 'تاريخ الوصول'}</span>
              <strong>{formatDate(currentBooking.checkIn, language)}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}</span>
              <strong>{formatDate(currentBooking.checkOut, language)}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Total amount' : 'إجمالي المبلغ'}</span>
              <strong>{formatCurrency(currentBooking.total, currentBooking.currency, language)}</strong>
            </div>
          </div>

          <div className="offline-ready-badge">
            <span className="material-symbols-outlined text-sm">offline_pin</span>
            <span>
              {language === 'en'
                ? 'Saved offline — access your booking & check-in details even with weak signal.'
                : 'محفوظ للعمل بدون إنترنت — يمكنك الوصول لبيانات الحجز وتعليمات الدخول في أي وقت.'}
            </span>
          </div>

          <div className="success-actions">
            <button className="primary-button" onClick={() => setSelectedInvoiceBooking(currentBooking)}>
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              <span>{language === 'en' ? 'Official Invoice' : 'الفاتورة الرسمية'}</span>
            </button>
            <button
              type="button"
              className="secondary-button flex items-center justify-center gap-1.5"
              onClick={async () => {
                haptics.trigger('light')
                await shareBooking({
                  reference: currentBooking?.reference,
                  propertyTitle: selectedProperty?.title || currentBooking?.title,
                  propertyTitleEn: selectedProperty?.title_en || currentBooking?.title_en,
                  checkIn: currentBooking?.checkIn,
                  checkOut: currentBooking?.checkOut,
                  total: currentBooking?.total,
                  currency: currentBooking?.currency,
                  language,
                })
              }}
            >
              <span className="material-symbols-outlined text-sm">share</span>
              <span>{language === 'en' ? 'Share Booking' : 'مشاركة الحجز'}</span>
            </button>
            <button className="secondary-button" onClick={() => navigate('bookings')}>
              {language === 'en' ? 'My bookings' : 'حجوزاتي'}
            </button>
            <button className="secondary-button" onClick={() => navigate('home')}>
              {language === 'en' ? 'Home' : 'الرئيسية'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderNotificationsPage = () => {
    const getNotificationIcon = (type) => {
      if (type === 'success' || type === 'booking_confirmed') return 'check_circle'
      if (type === 'warning' || type === 'checkin_reminder') return 'schedule'
      if (type === 'price_drop') return 'trending_down'
      return 'info'
    }

    return (
      <div className="page-shell notifications-shell">
        {notifications.length > 0 && (
          <div className="notification-toolbar">
            <div className="notification-toolbar-info">
              <span className="notification-count-tag">
                {language === 'en'
                  ? `${notifications.length} ${notifications.length === 1 ? 'Notification' : 'Notifications'}`
                  : `${notifications.length} إشعارات`}
              </span>
            </div>
            <button type="button" className="secondary-button small-button" onClick={markAllNotificationsRead}>
              {language === 'en' ? 'Mark all as read' : 'تحديد الكل كمقروء'}
            </button>
          </div>
        )}

        <div className="notification-list-page">
          {notifications.length === 0 ? (
            <div className="empty-notifications-state">
              <span className="material-symbols-outlined empty-icon">notifications_none</span>
              <h3>{language === 'en' ? 'No notifications at the moment' : 'لا توجد إشعارات حالياً'}</h3>
              <p>
                {language === 'en'
                  ? 'We will notify you here about booking confirmations and price updates.'
                  : 'سنخبرك هنا بتأكيدات الحجز وتحديثات الأسعار.'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const localizedTitle = getLocalizedNotificationText(notification.title, language)
              const localizedDetail = getLocalizedNotificationText(notification.body || notification.detail, language)
              const localizedTime = notification.createdAt
                ? formatRelativeTime(notification.createdAt, language)
                : getLocalizedNotificationText(notification.time, language)

              const typeClass = notification.type === 'booking_confirmed' ? 'success'
                : notification.type === 'checkin_reminder' ? 'warning'
                : notification.type === 'price_drop' ? 'info'
                : (notification.type || 'info')

              const isRead = Boolean(notification.readAt || notification.read)

              return (
                <div key={notification.id} className={`notification-item-page ${typeClass} ${isRead ? 'read' : 'unread'}`}>
                  {!isRead && <span className="notification-dot" aria-hidden="true" />}
                  <div className={`notification-icon-wrap ${typeClass}`}>
                    <span className="material-symbols-outlined">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="notification-copy">
                    <strong>{localizedTitle}</strong>
                    <p>{localizedDetail}</p>
                    <small>{localizedTime}</small>
                  </div>
                  <button
                    type="button"
                    className="notification-delete"
                    onClick={() => removeNotification(notification.id)}
                    aria-label={language === 'en' ? 'Delete notification' : 'حذف الإشعار'}
                    title={language === 'en' ? 'Delete notification' : 'حذف الإشعار'}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const renderBookingsPage = () => {
    const safeBookings = getSafeBookings(bookings)

    const visibleBookings = safeBookings.filter((booking) => {
      const normalizedStatus = normalizeBookingStatus(booking?.status)
      const checkOutValue = booking?.checkOut || booking?.checkIn || new Date().toISOString()
      const checkOutDate = new Date(checkOutValue)
      const now = new Date()

      if (bookingFilter === 'upcoming') {
        return normalizedStatus !== 'cancelled' && !Number.isNaN(checkOutDate.getTime()) && checkOutDate >= now
      }

      if (bookingFilter === 'past') {
        return normalizedStatus !== 'cancelled' && !Number.isNaN(checkOutDate.getTime()) && checkOutDate < now
      }

      if (bookingFilter === 'cancelled') {
        return normalizedStatus === 'cancelled'
      }

      return true
    }).sort((bookingA, bookingB) => {
      const arrivalA = new Date(bookingA?.checkIn || bookingA?.checkOut || '').getTime()
      const arrivalB = new Date(bookingB?.checkIn || bookingB?.checkOut || '').getTime()

      if (Number.isNaN(arrivalA)) return Number.isNaN(arrivalB) ? 0 : 1
      if (Number.isNaN(arrivalB)) return -1
      return arrivalA - arrivalB
    })

    const activeCount = safeBookings.filter((b) => {
      const s = normalizeBookingStatus(b?.status)
      const co = new Date(b?.checkOut || b?.checkIn || Date.now())
      return s !== 'cancelled' && !Number.isNaN(co.getTime()) && co >= new Date()
    }).length
    const pastCount = safeBookings.filter((b) => {
      const s = normalizeBookingStatus(b?.status)
      const co = new Date(b?.checkOut || b?.checkIn || Date.now())
      return s !== 'cancelled' && !Number.isNaN(co.getTime()) && co < new Date()
    }).length
    const cancelledCount = safeBookings.filter((b) => normalizeBookingStatus(b?.status) === 'cancelled').length

    return (
      <div className="page-shell bookings-shell">
        {/* Interactive Filter Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5" role="tablist" aria-label={language === 'en' ? 'Filter bookings' : 'تصفية الحجوزات'}>
          <button
            type="button"
            role="tab"
            aria-selected={bookingFilter === 'upcoming'}
            onClick={() => {
              haptics.trigger('light')
              setBookingFilter('upcoming')
            }}
            className={`rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer ${
              bookingFilter === 'upcoming'
                ? 'border-2 border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 dark:border-emerald-500 shadow-sm'
                : 'border border-slate-200/90 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`text-lg sm:text-2xl font-black ${bookingFilter === 'upcoming' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {activeCount}
            </div>
            <div className={`text-xs sm:text-sm font-bold mt-0.5 ${bookingFilter === 'upcoming' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {language === 'en' ? 'Upcoming' : 'القادمة'}
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={bookingFilter === 'past'}
            onClick={() => {
              haptics.trigger('light')
              setBookingFilter('past')
            }}
            className={`rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer ${
              bookingFilter === 'past'
                ? 'border-2 border-teal-600 bg-teal-50/80 dark:bg-teal-950/50 dark:border-teal-500 shadow-sm'
                : 'border border-slate-200/90 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`text-lg sm:text-2xl font-black ${bookingFilter === 'past' ? 'text-teal-700 dark:text-teal-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {pastCount}
            </div>
            <div className={`text-xs sm:text-sm font-bold mt-0.5 ${bookingFilter === 'past' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {language === 'en' ? 'Past Stays' : 'السابقة'}
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={bookingFilter === 'cancelled'}
            onClick={() => {
              haptics.trigger('light')
              setBookingFilter('cancelled')
            }}
            className={`rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer ${
              bookingFilter === 'cancelled'
                ? 'border-2 border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 dark:border-rose-500 shadow-sm'
                : 'border border-slate-200/90 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`text-lg sm:text-2xl font-black ${bookingFilter === 'cancelled' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {cancelledCount}
            </div>
            <div className={`text-xs sm:text-sm font-bold mt-0.5 ${bookingFilter === 'cancelled' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {language === 'en' ? 'Cancelled' : 'الملغاة'}
            </div>
          </button>
        </div>

        {isOffline && (
          <div className="offline-banner" role="status">
            <div className="offline-banner-icon">
              <span className="material-symbols-outlined">cloud_off</span>
            </div>
            <div className="offline-banner-text">
              <strong>{language === 'en' ? 'Offline Mode Active' : 'وضع عدم الاتصال بالإنترنت'}</strong>
              <p>
                {language === 'en'
                  ? 'Showing saved bookings and verified check-in instructions stored on this device.'
                  : 'بيانات حجزك الأخير وتعليمات الدخول الذاتي متاحة وتعمل بدون إنترنت.'}
              </p>
            </div>
          </div>
        )}

        {offlineBooking && (
          <div className="offline-booking-card">
            <div className="offline-card-badge">
              <span className="material-symbols-outlined text-xs">offline_pin</span>
              <span>{language === 'en' ? 'Offline Fast Pass' : 'سند الدخول بدون إنترنت'}</span>
            </div>
            <div className="offline-card-content">
              <div>
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'en' ? 'Saved stay on device' : 'إقامة محفوظة على هاتفك'}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {offlineBooking.propertyTitle}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {offlineBooking.reference || '#REF-OFFLINE'}
                </p>
              </div>
              <div className="offline-card-actions">
                <button
                  type="button"
                  className="secondary-button small-button flex items-center gap-1"
                  onClick={() => {
                    haptics.trigger('light')
                    setSelectedInvoiceBooking(offlineBooking)
                  }}
                  title={language === 'en' ? 'View offline voucher' : 'عرض السند بدون إنترنت'}
                >
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                  <span>{language === 'en' ? 'Voucher' : 'السند'}</span>
                </button>
                <button
                  type="button"
                  className="secondary-button small-button flex items-center gap-1"
                  onClick={async () => {
                    haptics.trigger('light')
                    await shareBooking({
                      reference: offlineBooking.reference,
                      propertyTitle: offlineBooking.propertyTitle,
                      propertyTitleEn: offlineBooking.propertyTitleEn,
                      checkIn: offlineBooking.checkIn,
                      checkOut: offlineBooking.checkOut,
                      total: offlineBooking.total,
                      currency: offlineBooking.currency,
                      language,
                    })
                  }}
                >
                  <span className="material-symbols-outlined text-sm">share</span>
                  <span>{language === 'en' ? 'Share' : 'مشاركة'}</span>
                </button>
              </div>
            </div>
            {offlineBooking.selfCheckInInstructions && (
              <div className="offline-checkin-tip">
                <span className="material-symbols-outlined text-sm text-amber-500">key</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {offlineBooking.selfCheckInInstructions}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="booking-list">
          {visibleBookings.length === 0 ? (
            <div className="empty-booking-state">
              <div className="empty-illustration"><span className="material-symbols-outlined">calendar_month</span></div>
              <h3>{language === 'en' ? 'No bookings yet' : 'لا توجد حجوزات'}</h3>
              <p>{language === 'en' ? "You don't have any bookings in this section." : 'لا توجد حجوزات في هذا القسم حالياً.'}</p>
              <button className="primary-button" onClick={() => navigate('home')}>{language === 'en' ? 'Browse stays' : 'تصفح الإقامات'}</button>
            </div>
          ) : (
            visibleBookings.map((booking, index) => {
              const normalizedStatus = normalizeBookingStatus(booking?.status)
              const property = properties.find((item) => String(item.id) === String(booking?.propertyId)) ?? selectedProperty

              const checkInVal = booking?.checkIn || ''
              const checkOutVal = booking?.checkOut || booking?.checkIn || ''
              const nights = (checkInVal && checkOutVal && !Number.isNaN(new Date(checkInVal).getTime()) && !Number.isNaN(new Date(checkOutVal).getTime()))
                ? Math.max(1, Math.round((new Date(checkOutVal) - new Date(checkInVal)) / (1000 * 60 * 60 * 24)))
                : (booking?.nights || 1)

              const pricing = calculateBookingPricing({
                pricePerNight: booking?.pricePerNight || property?.priceValue,
                nights,
                discountAmount: booking?.discountAmount,
                serviceFee: booking?.serviceFee,
                total: booking?.total,
              })

              const displayDateRange = checkInVal || checkOutVal
                ? `${booking?.checkIn ? formatDate(booking.checkIn, language) : '—'} ${language === 'en' ? 'to' : 'إلى'} ${booking?.checkOut ? formatDate(booking.checkOut, language) : '—'}`
                : '—'
              const bookingReference = booking?.reference && booking.reference !== '#REF-00000'
                ? booking.reference
                : `#HZ-${booking?.id || index + 1}`
              const today = formatISODate(new Date())
              const isCancelled = normalizedStatus === 'cancelled'
              const currentProgressStep = isCancelled
                ? -1
                : normalizedStatus !== 'confirmed'
                  ? 0
                  : checkInVal && checkInVal <= today
                    ? checkOutVal && checkOutVal <= today ? 3 : 2
                    : 1
              const progressSteps = [
                { key: 'booked', label: t('bookingProgress.steps.booked') },
                { key: 'confirmed', label: t('bookingProgress.steps.confirmed') },
                { key: 'checkIn', label: t('bookingProgress.steps.checkIn') },
                { key: 'checkOut', label: t('bookingProgress.steps.checkOut') },
              ]

              return (
                <article key={booking.id || `${booking.propertyId || 'booking'}-${index}`} className="booking-card">
                  <div className="booking-image">
                    <img src={booking.image || property?.image} alt={getPropertyTitle(property) || booking.title || 'Booking'} onError={handleStayImageError} />
                    <span className={`status ${normalizedStatus === 'confirmed' ? 'confirmed' : normalizedStatus === 'cancelled' ? 'cancelled' : 'pending'}`}>
                      {normalizedStatus === 'confirmed' ? (language === 'en' ? 'Confirmed' : 'مؤكدة') : normalizedStatus === 'cancelled' ? (language === 'en' ? 'Cancelled' : 'ملغية') : (language === 'en' ? 'Pending review' : 'قيد المراجعة')}
                    </span>
                  </div>
                  <div className="booking-body">
                    <div className="booking-head">
                      <div>
                        <h3>{getPropertyTitle(property) || booking.title || (language === 'en' ? 'Stay' : 'إقامة')}</h3>
                        <div className="booking-reservation-reference">{bookingReference}</div>
                        <p>{getPropertyLocation(property) || booking.location || (language === 'en' ? 'Location not available' : 'موقع غير متوفر')}</p>
                      </div>
                      <div className="rating-chip small">
                        <span className="material-symbols-outlined">star</span>
                        <span>{property?.rating ?? 4.8}</span>
                      </div>
                    </div>

                    {/* Visual Status Progress Tracker */}
                    <div className="booking-progress-track my-2.5 px-1" role="group" aria-label={t('bookingProgress.label')}>
                      <div className="booking-progress-labels">
                        {progressSteps.map((step, stepIndex) => {
                          const stepState = isCancelled
                            ? 'cancelled'
                            : stepIndex === currentProgressStep
                              ? 'current'
                              : stepIndex < currentProgressStep
                                ? 'complete'
                                : 'upcoming'

                          return (
                            <span
                              key={step.key}
                              className="booking-progress-label"
                              data-state={stepState}
                              aria-current={stepState === 'current' ? 'step' : undefined}
                            >
                              {step.label}
                            </span>
                          )
                        })}
                      </div>
                      <div className="booking-progress-dots" aria-hidden="true">
                        <div className="booking-progress-line">
                          <span
                            className={isCancelled ? 'booking-progress-fill cancelled' : 'booking-progress-fill'}
                            style={{ width: isCancelled ? '100%' : `${(Math.max(0, currentProgressStep) / (progressSteps.length - 1)) * 100}%` }}
                          />
                        </div>
                        {progressSteps.map((step, stepIndex) => (
                          <span
                            key={step.key}
                            className="booking-progress-dot"
                            data-state={
                              isCancelled
                                ? 'cancelled'
                                : stepIndex === currentProgressStep
                                  ? 'current'
                                  : stepIndex < currentProgressStep
                                    ? 'complete'
                                    : 'upcoming'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="booking-footer">
                      <div className="booking-details">
                        <div className="booking-date-summary">
                          <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                          <span className="booking-date-range">{displayDateRange}</span>
                          <small>{pluralize(pricing.nights, 'night', language)}</small>
                        </div>
                        <div className="booking-pricing flex flex-col items-start gap-0.5">
                          <div className="flex items-baseline gap-2">
                            <span className="per-night">
                              {formatCurrency(pricing.pricePerNight, booking.currency || property?.currency || 'EGP', language)} {language === 'en' ? '/ night' : '/ ليلة'}
                            </span>
                            <strong className="booking-total">
                              {formatCurrency(pricing.total, booking.currency || property?.currency || 'EGP', language)}
                            </strong>
                          </div>
                          <span className="booking-breakdown-details text-[11px] text-slate-500 dark:text-slate-400">
                            {formatCurrency(pricing.pricePerNight, booking.currency || property?.currency || 'EGP', language)} × {pluralize(pricing.nights, 'night', language)}
                            {pricing.serviceFee > 0 && ` + ${formatCurrency(pricing.serviceFee, booking.currency || property?.currency || 'EGP', language)} ${language === 'en' ? 'fees' : 'رسوم'}`}
                            {pricing.discountAmount > 0 && ` - ${formatCurrency(pricing.discountAmount, booking.currency || property?.currency || 'EGP', language)} ${language === 'en' ? 'discount' : 'خصم'}`}
                          </span>
                        </div>
                      </div>

                      <div className="booking-actions relative flex items-center gap-2">
                        <button
                          className="primary-button small-button booking-cta"
                          onClick={() => navigate('details', property ?? selectedProperty)}
                        >
                          {language === 'en' ? 'Details' : 'التفاصيل'}
                        </button>

                        <button
                          type="button"
                          className="secondary-button small-button booking-receipt"
                          onClick={() => setSelectedInvoiceBooking(booking)}
                          title={language === 'en' ? 'View Invoice' : 'عرض الفاتورة'}
                        >
                          {language === 'en' ? 'Invoice' : 'الفاتورة'}
                        </button>

                        {/* 3-Dots Action Trigger for mobile-friendly full action sheet */}
                        <button
                          type="button"
                          className="secondary-button small-button booking-actions-more"
                          onClick={() => setActiveBookingActionsTarget({ booking, property, normalizedStatus })}
                          aria-label={language === 'en' ? 'More booking actions' : 'خيارات الحجز الإضافية'}
                          title={language === 'en' ? 'More actions' : 'خيارات إضافية'}
                        >
                          <span className="material-symbols-outlined text-lg leading-none">more_vert</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const renderProfilePage = () => {
    const savedProperties = properties.filter((property) => isFavorite(property.id))
    const profileName = user?.name || (language === 'en' ? 'Guest user' : 'مستخدم ضيف')
    const profileEmail = user?.email || 'guest@hajzy.com'
    const initials = profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'ح'

    return (
      <div className="page-shell profile-shell">
        <section className="profile-header">
          <div className="profile-user-top">
            <div className="profile-avatar" aria-label="Profile avatar">
              <span>{initials}</span>
            </div>
            <div className="profile-meta">
              <h2>{profileName}</h2>
              <p>{profileEmail}</p>
            </div>
          </div>

          <div className="profile-metrics">
            <div className="profile-metric-card">
              <small>{language === 'en' ? 'Saved' : 'محفوظة'}</small>
              <strong>{favorites.length}</strong>
            </div>
            <div className="profile-metric-card">
              <small>{language === 'en' ? 'Trips' : 'رحلات'}</small>
              <strong>{getSafeBookings(bookings).length || 0}</strong>
            </div>
            <div className="profile-metric-card">
              <small>{language === 'en' ? 'Member' : 'عضوية'}</small>
              <strong>{language === 'en' ? 'Gold' : 'ذهبية'}</strong>
            </div>
          </div>
        </section>

        <section className="profile-favorites-card">
          <div className="section-head-row">
            <h3>{language === 'en' ? 'Saved stays' : 'الإقامات المحفوظة'}</h3>
            <button type="button" className="text-button" onClick={() => navigate('home')}>
              {language === 'en' ? 'Browse' : 'تصفح'}
            </button>
          </div>

          {savedProperties.length === 0 ? (
            <div className="empty-inline">
              {language === 'en' ? 'No saved stays yet.' : 'لا توجد أماكن محفوظة بعد.'}
            </div>
          ) : (
            <div className="favorite-strip">
              {savedProperties.slice(0, 3).map((property) => (
                <button key={property.id} type="button" className="favorite-item" onClick={() => navigate('details', property)}>
                  <img src={property.image} alt={property.title} onError={handleStayImageError} />
                  <div>
                    <strong>{property.title}</strong>
                    <small>{property.location}</small>
                    <span>{formatCurrency(property.priceValue, property.currency)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="profile-list">
          <button className="profile-item" onClick={() => navigate('home')}>
            <span className="material-symbols-outlined">person</span>
            <span>{language === 'en' ? 'Personal info' : 'المعلومات الشخصية'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
          <button className="profile-item" onClick={() => navigate('bookings')}>
            <span className="material-symbols-outlined">favorite</span>
            <span>{language === 'en' ? 'My bookings' : 'حجوزاتي'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
          <button className="profile-item" onClick={() => navigate('home')}>
            <span className="material-symbols-outlined">settings</span>
            <span>{language === 'en' ? 'Settings' : 'الإعدادات'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
          {!user ? (
            <button className="profile-item" onClick={() => openAuthScreen('login')}>
              <span className="material-symbols-outlined">login</span>
              <span>{language === 'en' ? 'Log in' : 'تسجيل الدخول'}</span>
              <span className="material-symbols-outlined chevron">chevron_left</span>
            </button>
          ) : (
            <button className="profile-item logout" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              <span>{language === 'en' ? 'Log out' : 'تسجيل الخروج'}</span>
              <span className="material-symbols-outlined chevron">chevron_left</span>
            </button>
          )}
        </section>
      </div>
    )
  }

  const renderOwnerSettingsPage = () => (
    <div className="page-shell owner-shell settings-shell">
      <div className="settings-card dark:!bg-slate-900/90 dark:!border-slate-800">
        <div className="settings-header">
          <div className="avatar-wrap small-avatar">
            <img src={user?.avatar || 'https://via.placeholder.com/96'} alt={language === 'en' ? 'Property Owner' : 'مالك العقارات'} />
          </div>
          <div>
            <h3 className="dark:!text-white">{user?.name}</h3>
            <p className="dark:!text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="setting-box dark:!bg-slate-800/60 dark:!border-slate-700/60">
            <span className="dark:!text-slate-400">{language === 'en' ? 'Role' : 'الدور'}</span>
            <strong className="dark:!text-white">{language === 'en' ? 'Property Owner' : 'مالك عقارات'}</strong>
          </div>
          <div className="setting-box dark:!bg-slate-800/60 dark:!border-slate-700/60">
            <span className="dark:!text-slate-400">{language === 'en' ? 'Connection Status' : 'حالة الاتصال'}</span>
            <strong className="dark:!text-emerald-400">
              {hasSupabaseConnection 
                ? (language === 'en' ? 'Connected to Supabase' : 'متصل بـ Supabase') 
                : (language === 'en' ? 'Local Demo Mode' : 'وضع تجريبي محلي')}
            </strong>
          </div>
          <div className="setting-box wide-setting dark:!bg-slate-800/60 dark:!border-slate-700/60">
            <span className="dark:!text-slate-400">{language === 'en' ? 'Project Config' : 'مفتاح المشروع'}</span>
            <strong className="dark:!text-slate-200">
              {hasSupabaseConnection 
                ? (language === 'en' ? 'Environment initialized successfully' : 'تمت تهيئة البيئة بنجاح') 
                : (language === 'en' ? 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' : 'أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY')}
            </strong>
          </div>
        </div>

        <div className="settings-actions">
          <button className="primary-button" onClick={() => navigate('owner')}>
            {language === 'en' ? 'Back to Dashboard' : 'العودة للوحة التحكم'}
          </button>
          <button className="secondary-button dark:!bg-rose-950/40 dark:!border-rose-900/50 dark:!text-rose-400 hover:dark:!bg-rose-900/50" onClick={handleLogout}>
            {language === 'en' ? 'Log Out' : 'تسجيل الخروج'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderAuthPage = () => {
    if (currentAuthPage === 'signup') {
      return (
        <SignupPage
          language={language}
          onToggleLanguage={handleLanguageToggle}
          onSignup={handleSignup}
          onSwitchToLogin={() => setCurrentAuthPage('login')}
          onSocialLogin={handleSocialLogin}
        />
      )
    }

    if (currentAuthPage === 'forgot') {
      return (
        <ForgotPasswordPage
          language={language}
          onToggleLanguage={handleLanguageToggle}
          onBackToLogin={() => setCurrentAuthPage('login')}
          onSwitchToSignup={() => setCurrentAuthPage('signup')}
        />
      )
    }

    if (currentAuthPage === 'reset') {
      return (
        <ResetPasswordPage
          language={language}
          onToggleLanguage={handleLanguageToggle}
          onBackToLogin={() => setCurrentAuthPage('login')}
        />
      )
    }

    if (currentAuthPage === 'verify') {
      return (
        <VerifyEmailPage
          language={language}
          onBackToLogin={() => setCurrentAuthPage('login')}
        />
      )
    }

    if (currentAuthPage === 'marketing') {
      return (
        <Suspense fallback={<LuxuryPageSkeleton />}>
          <MarketingPage
            language={language}
            onOpenLogin={handleMarketingOpenLogin}
            onBrowseGuest={handleMarketingBrowseGuest}
          />
        </Suspense>
      )
    }

    return (
      <LoginPage
        language={language}
        onToggleLanguage={handleLanguageToggle}
        onLogin={handleLogin}
        onSwitchToSignup={() => setCurrentAuthPage('signup')}
        onSwitchToForgotPassword={() => setCurrentAuthPage('forgot')}
        onSocialLogin={handleSocialLogin}
        onContinueAsGuest={handleMarketingBrowseGuest}
      />
    )
  }

  const renderFavoritesPage = () => {
    const savedProperties = properties.filter((property) => isFavorite(property.id))

    return (
      <div className="page-shell favorites-shell max-w-5xl mx-auto px-4 py-6">
        <div className="section-head-row mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="material-symbols-outlined text-rose-500 text-3xl">favorite</span>
              <span>{language === 'en' ? 'Favorite Stays' : 'الإقامات المفضلة'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'en'
                ? `${pluralize(savedProperties.length, 'stay', 'en')} saved to your wishlist`
                : `${pluralize(savedProperties.length, 'stay', 'ar')} محفوظة في قائمتك المفضلة`}
            </p>
          </div>
          {savedProperties.length > 0 && (
            <button
              type="button"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              onClick={() => navigate('home')}
            >
              {language === 'en' ? '+ Explore more' : '+ استكشف المزيد'}
            </button>
          )}
        </div>

        {savedProperties.length === 0 ? (
          <div className="empty-state-card text-center p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 my-8 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/50">
              <span className="material-symbols-outlined text-4xl">favorite_border</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {language === 'en' ? 'No favorites saved yet' : 'لم تقم بحفظ أي إقامات بعد'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
              {language === 'en'
                ? 'Tap the heart icon on any luxury villa or chalet to save it here for quick access later.'
                : 'اضغط على رمز القلب في أي فيلا أو شاليه لإضافته إلى قائمتك المفضلة والرجوع إليه بسهولة في أي وقت.'}
            </p>
            <button
              type="button"
              className="primary-button inline-flex items-center gap-2 px-6 py-3"
              onClick={() => navigate('home')}
            >
              <span className="material-symbols-outlined text-base">explore</span>
              <span>{language === 'en' ? 'Explore Stays' : 'استكشف الإقامات'}</span>
            </button>
          </div>
        ) : (
          <div className="property-list">
            {savedProperties.map((property) => (
              <article
                key={property.id}
                className="property-card cursor-pointer"
                onClick={() => navigate('details', property)}
              >
                <div className="property-media">
                  <img src={property.image} alt={getPropertyTitle(property)} onError={handleStayImageError} />
                  <button
                    type="button"
                    className="favorite-button active"
                    aria-label={language === 'en' ? 'Remove from favorites' : 'إزالة من المفضلة'}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleFavorite(event, property.id)
                    }}
                  >
                    <HeartIcon filled={true} size={20} />
                  </button>
                </div>
                <div className="property-body">
                  <div className="property-header">
                    <div>
                      <h4>{getPropertyTitle(property)}</h4>
                      <p>{getPropertyLocation(property)}</p>
                    </div>
                    <div className="rating-chip">
                      <span className="material-symbols-outlined">star</span>
                      <span>{property.rating}</span>
                    </div>
                  </div>
                  <div className="property-footer">
                    <div className="property-price">
                      <strong>{formatCurrency(property.priceValue, property.currency, language)}</strong>
                      <span>/ {language === 'en' ? 'night' : 'ليلة'}</span>
                    </div>
                    <button
                      type="button"
                      className="primary-button small-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('details', property)
                      }}
                    >
                      {language === 'en' ? 'Book now' : 'احجز الآن'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderAccountPage = () => {
    return (
      <div className="page-shell account-shell max-w-5xl mx-auto pb-16">
        {/* Modern Segmented Tab Switcher */}
        <div className="flex items-center justify-center pt-3 pb-4 px-4 sticky top-14 z-20 bg-[#FBF9F5]/90 dark:bg-[#090B0D]/90 backdrop-blur-md">
          <div className="inline-flex rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 p-1 border border-slate-300/60 dark:border-slate-700/60 shadow-inner">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all ${
                accountTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setAccountTab('overview')}
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              <span>{language === 'en' ? 'Activity & Club' : 'نشاطي ونقاطي'}</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all ${
                accountTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setAccountTab('settings')}
            >
              <span className="material-symbols-outlined text-sm">manage_accounts</span>
              <span>{language === 'en' ? 'Profile & Settings' : 'البيانات والإعدادات'}</span>
            </button>
          </div>
        </div>

        {accountTab === 'overview' ? (
          <ErrorBoundary>
            <DashboardPage
              user={user}
              bookings={bookings}
              properties={properties}
              favorites={favorites}
              language={language}
              onNavigate={(dest, item) => {
                if (dest === 'profile') {
                  setAccountTab('settings')
                } else {
                  navigate(dest, item)
                }
              }}
              onLogout={handleLogout}
              onSupportRequest={handleSupportRequest}
            />
          </ErrorBoundary>
        ) : (
          <ProfilePage
            user={user || effectiveUser}
            bookings={bookings}
            language={language}
            onEdit={() => navigate('profile-edit')}
            onUpdateProfile={updateProfile}
            onToggleLanguage={handleLanguageToggle}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        )}
      </div>
    )
  }

  const renderPageContent = () => {
    if (activePage === 'notifications') return renderNotificationsPage()
    if (isOwner && activePage === 'owner-settings') return renderOwnerSettingsPage()
    if (isOwner && (activePage === 'owner' || activePage === 'dashboard' || activePage === 'home')) {
      return renderOwnerPage()
    }
    if (activePage === 'favorites') return renderFavoritesPage()
    if (activePage === 'dashboard') {
      return (
        <ErrorBoundary>
          <DashboardPage
            user={user}
            bookings={bookings}
            properties={properties}
            favorites={favorites}
            language={language}
            onNavigate={navigate}
            onLogout={handleLogout}
            onSupportRequest={handleSupportRequest}
          />
        </ErrorBoundary>
      )
    }
    if (activePage === 'account' || activePage === 'profile') {
      return (
        <ProfilePage
          user={user || effectiveUser}
          bookings={bookings}
          language={language}
          onEdit={() => navigate('profile-edit')}
          onUpdateProfile={updateProfile}
          onToggleLanguage={handleLanguageToggle}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      )
    }
    if (activePage === 'home') {
      return renderHomePage()
    }
    if (activePage === 'city') {
      return (
        <CityPage
          citySlug={selectedCitySlug}
          properties={properties}
          isLoading={isLoadingData}
          language={language}
          onBack={() => navigate('home')}
          onSelectProperty={(prop) => navigate('details', prop)}
          onBookProperty={(prop) => navigate('checkout', prop)}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          formatCurrency={formatCurrency}
          handleStayImageError={handleStayImageError}
        />
      )
    }
    if (activePage === 'details') return renderDetailsPage()
    if (activePage === 'chat') return (
      <ChatPage
        property={selectedProperty}
        user={user || effectiveUser}
        language={language}
        onBack={() => navigate('details', selectedProperty)}
      />
    )
    if (activePage === 'reviews') return (
      <ReviewsPage
        property={selectedProperty}
        user={user || effectiveUser}
        language={language}
        onBack={() => navigate('details', selectedProperty)}
      />
    )
    if (activePage === 'checkout') {
      return (
        <ErrorBoundary>
          {renderCheckoutPage()}
        </ErrorBoundary>
      )
    }
    if (activePage === 'success') return renderSuccessPage()
    if (activePage === 'bookings') return renderBookingsPage()

    return (
      <ProfilePage
        user={user || effectiveUser}
        bookings={bookings}
        language={language}
        onEdit={() => navigate('profile-edit')}
        onUpdateProfile={updateProfile}
        onToggleLanguage={handleLanguageToggle}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  const bottomNavItems = [
    {
      key: 'home',
      label: language === 'en' ? 'Home' : 'الرئيسية',
      icon: 'home',
    },
    {
      key: isOwner ? 'owner' : 'dashboard',
      label: language === 'en' ? 'Dashboard' : 'لوحة التحكم',
      icon: 'dashboard',
    },
    {
      key: 'bookings',
      label: language === 'en' ? 'Bookings' : 'حجوزاتي',
      icon: 'calendar_month',
    },
    {
      key: 'account',
      label: language === 'en' ? 'My Account' : 'حسابي',
      icon: 'person',
    },
  ]

  const renderDealModal = () => {
    if (!showDealModal) return null

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 p-6 md:p-8 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden my-8">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

          <button
            type="button"
            className="absolute top-5 left-5 md:top-6 md:left-6 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            onClick={() => setShowDealModal(false)}
            aria-label={language === 'en' ? 'Close' : 'إغلاق'}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {language === 'en' ? 'Limited Time Deal' : 'عرض حصري لفترة محدودة'}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {language === 'en' ? '20% Off Coastal Getaways' : 'وفر حتى 20% على الفيلات والشاليهات'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            {language === 'en'
              ? 'Enjoy an exclusive 20% discount on luxury villas and chalets across Alexandria, North Coast, Hurghada, and Sharm El Sheikh. Instant booking with free cancellation.'
              : 'استمتع بخصم حصري حتى 20% على أفخم الفيلات والشاليهات في الإسكندرية والساحل الشمالي والغردقة وشرم الشيخ مع تأكيد فوري وخيارات إلغاء مرنة وضمان أفضل سعر.'}
          </p>

          <div className="rounded-2xl border border-dashed border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 mb-6 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                {language === 'en' ? 'Promo Code' : 'كود الخصم الترويجي'}
              </span>
              <span className="font-mono text-xl font-black tracking-widest text-emerald-900 dark:text-emerald-200">
                COAST20
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
              onClick={() => {
                navigator.clipboard?.writeText('COAST20')
                setCopiedDealCode(true)
                setPromoCodeInput('COAST20')
                setAppliedPromo({
                  code: 'COAST20',
                  percent: 20,
                  label: language === 'en' ? '20% Coastal Exclusive Deal' : 'خصم الساحل الحصري 20%',
                })
                showToast(language === 'en' ? 'Code COAST20 copied & ready for checkout!' : 'تم نسخ كود COAST20 وتجهيزه لصفحة الدفع!')
                setTimeout(() => setCopiedDealCode(false), 2500)
              }}
            >
              <span className="material-symbols-outlined text-sm">
                {copiedDealCode ? 'check' : 'content_copy'}
              </span>
              <span>{copiedDealCode ? (language === 'en' ? 'Copied & Applied!' : 'تم النسخ والتفعيل!') : (language === 'en' ? 'Copy & Apply' : 'نسخ وتفعيل الكود')}</span>
            </button>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
              <span>{language === 'en' ? 'Valid on all coastal stays in Egypt' : 'ساري على جميع الإقامات الساحلية في مصر'}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
              <span>{language === 'en' ? 'Free cancellation up to 48h before arrival' : 'إلغاء مجاني حتى 48 ساعة قبل موعد الوصول'}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
              <span>{language === 'en' ? 'Instant booking confirmation guaranteed' : 'ضمان تأكيد فوري للحجز بدون انتظار'}</span>
            </li>
          </ul>

          <button
            type="button"
            className="w-full primary-button py-3 text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            onClick={() => {
              setShowDealModal(false)
              setPromoCodeInput('COAST20')
              setAppliedPromo({
                code: 'COAST20',
                percent: 20,
                label: language === 'en' ? '20% Coastal Exclusive Deal' : 'خصم الساحل الحصري 20%',
              })
              if (activePage !== 'home') {
                setActivePage('home')
              }
              setActiveFilter('الإسكندرية')
              setHomeQuickSearch((current) => ({ ...current, destination: 'الإسكندرية' }))
              showToast(language === 'en' ? '🎉 Coastal Deal activated (20% OFF)! Explore below' : '🎉 تم تفعيل خصم 20%! استعرض الإقامات بالأسفل')
              setTimeout(() => {
                const el = document.querySelector('.property-list') || document.querySelector('.featured-collection')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 150)
            }}
          >
            <span className="material-symbols-outlined text-base">travel_explore</span>
            <span>{language === 'en' ? 'View Coastal Stays' : 'استعراض الإقامات الساحلية المشمولة'}</span>
          </button>
        </div>
      </div>
    )
  }

  const renderBookingActionsModal = () => {
    if (!activeBookingActionsTarget) return null

    const { booking, property, normalizedStatus } = activeBookingActionsTarget
    const title = getPropertyTitle(property) || booking?.title || (language === 'en' ? 'Stay Booking' : 'حجز الإقامة')
    const location = getPropertyLocation(property) || booking?.location || ''
    const isCancelled = normalizedStatus === 'cancelled'

    return (
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={() => setActiveBookingActionsTarget(null)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto my-0 sm:my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Handle Indicator */}
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

          {/* Header with thumbnail & details */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <img
              src={booking?.image || property?.image}
              alt={title}
              onError={handleStayImageError}
              className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    : normalizedStatus === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {isCancelled ? (language === 'en' ? 'Cancelled' : 'ملغية') : normalizedStatus === 'confirmed' ? (language === 'en' ? 'Confirmed' : 'مؤكدة') : (language === 'en' ? 'Pending' : 'قيد المراجعة')}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{location}</p>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">{booking?.reference || `#HB-${booking?.id || ''}`}</div>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 hover:text-slate-800 dark:hover:text-white transition"
              onClick={() => setActiveBookingActionsTarget(null)}
              aria-label={language === 'en' ? 'Close' : 'إغلاق'}
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Action List */}
          <div className="space-y-2 py-1">
            {/* View Official Invoice */}
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition group text-start font-medium text-sm"
              onClick={() => {
                setActiveBookingActionsTarget(null)
                setSelectedInvoiceBooking(booking)
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <span className="material-symbols-outlined text-xl">receipt_long</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm">{language === 'en' ? 'Official Invoice & Receipt' : 'الفاتورة وسند الحجز الرسمي'}</div>
                <div className="text-[11px] text-slate-400">{language === 'en' ? 'View, download and print receipt' : 'عرض وطباعة سند الحجز والتكاليف'}</div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">arrow_forward_ios</span>
            </button>

            {/* Edit Dates (if not cancelled) */}
            {!isCancelled && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition group text-start font-medium text-sm"
                onClick={() => {
                  setActiveBookingActionsTarget(null)
                  setSelectedProperty(property)
                  setBookingDates({
                    checkIn: booking?.checkIn || '',
                    checkOut: booking?.checkOut || '',
                    guests: booking?.guests || 1,
                  })
                  navigate('checkout')
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <span className="material-symbols-outlined text-xl">edit_calendar</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm">{language === 'en' ? 'Modify Booking Dates' : 'تعديل تواريخ الحجز'}</div>
                  <div className="text-[11px] text-slate-400">{language === 'en' ? 'Change check-in and check-out dates' : 'تغيير موعد الوصول والمغادرة'}</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">arrow_forward_ios</span>
              </button>
            )}

            {/* Share Booking */}
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition group text-start font-medium text-sm"
              onClick={async () => {
                setActiveBookingActionsTarget(null)
                haptics.trigger('light')
                await shareBooking({
                  reference: booking?.reference || `#HB-${booking?.id}`,
                  propertyTitle: getPropertyTitle(property) || booking?.title,
                  propertyTitleEn: property?.titleEn || booking?.title,
                  checkIn: booking?.checkIn,
                  checkOut: booking?.checkOut,
                  total: booking?.total,
                  currency: booking?.currency || 'EGP',
                  language,
                })
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <span className="material-symbols-outlined text-xl">share</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm">{language === 'en' ? 'Share Booking' : 'مشاركة تفاصيل الحجز'}</div>
                <div className="text-[11px] text-slate-400">{language === 'en' ? 'Send reservation details via link or apps' : 'إرسال تفاصيل الإقامة عبر الواتساب أو التطبيقات'}</div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">arrow_forward_ios</span>
            </button>

            {/* Cancel Booking (if not cancelled) */}
            {!isCancelled && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition group text-start font-medium text-sm"
                onClick={() => {
                  setActiveBookingActionsTarget(null)
                  handleCancelBooking(booking?.id)
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm">{language === 'en' ? 'Cancel Reservation' : 'إلغاء هذا الحجز'}</div>
                  <div className="text-[11px] text-rose-500/80 dark:text-rose-400/80">{language === 'en' ? 'Cancel your stay subject to cancellation policy' : 'إلغاء الحجز واسترداد الرصيد المتاح'}</div>
                </div>
                <span className="material-symbols-outlined text-rose-400 text-sm">arrow_forward_ios</span>
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition"
            onClick={() => setActiveBookingActionsTarget(null)}
          >
            {language === 'en' ? 'Close' : 'إغلاق'}
          </button>
        </div>
      </div>
    )
  }

  const renderInvoiceModal = () => {
    if (!selectedInvoiceBooking) return null

    const b = selectedInvoiceBooking
    const prop = properties.find((p) => p.id === b.propertyId) || selectedProperty || {}
    const checkInDate = b.checkIn ? new Date(b.checkIn) : new Date()
    const checkOutDate = b.checkOut ? new Date(b.checkOut) : new Date(Date.now() + 86400000)
    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)))
    const discountAmount = Number(b.discountAmount) || 0
    const totalAmount = Number(b.total) || 0
    const pricePerNight = prop.priceValue || (nights > 0 ? Math.round((totalAmount + discountAmount) / (nights * 1.08)) : 1000)
    const subtotal = pricePerNight * nights
    const serviceFee = Math.max(0, Math.round((subtotal - discountAmount) * 0.08))

    return (
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        onClick={() => setSelectedInvoiceBooking(null)}
      >
        <div
          className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 my-0 sm:my-auto max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Modal Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-xl">
                H
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Hajzy</span>
                  <span className="text-xs font-bold text-slate-400">| حجزي</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'en' ? 'Official Booking Receipt & Invoice' : 'فاتورة وسند حجز إلكتروني رسمي'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-end">
                <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {language === 'en' ? 'CONFIRMED' : 'حجز مؤكد'}
                </span>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{b.reference || '#REF-78921'}</div>
              </div>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition shrink-0"
                onClick={() => setSelectedInvoiceBooking(null)}
                aria-label={language === 'en' ? 'Close' : 'إغلاق'}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-sm flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Guest Information' : 'بيانات الضيف'}</span>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{b.guestName || user?.name || (language === 'en' ? 'Verified Guest' : 'ضيف مؤكد')}</div>
                <div className="text-slate-500 dir-ltr text-start">{b.guestEmail || user?.email || '-'}</div>
                <div className="text-slate-500 dir-ltr text-start">{b.guestPhone || user?.phone || '+20 10...'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold">{language === 'en' ? 'Property & Dates' : 'بيانات الإقامة والتواريخ'}</span>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{b.title || prop.title || 'إقامة فاخرة'}</div>
                <div className="text-slate-500">{b.location || prop.location || 'مصر'}</div>
                <div className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatDate(b.checkIn || new Date())} ← {formatDate(b.checkOut || new Date())} ({nights} {language === 'en' ? (nights === 1 ? 'night' : 'nights') : 'ليالٍ'})
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex justify-between text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <span>{language === 'en' ? 'Description' : 'البيان'}</span>
                <span>{language === 'en' ? 'Amount' : 'المبلغ'}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{language === 'en' ? `Accommodation (${nights} nights)` : `تكلفة الإقامة (${nights} ليالٍ)`}</span>
                  <span className="font-semibold">{formatCurrency(subtotal, b.currency || 'EGP')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>{language === 'en' ? `Promo Discount (${b.promoCode || 'PROMO'})` : `خصم كود الترويجي (${b.promoCode || 'كود خصم'})`}</span>
                    <span>-{formatCurrency(discountAmount, b.currency || 'EGP')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Platform & Service Fee (8%)' : 'رسوم الخدمة والتأمين (8%)'}</span>
                  <span className="font-semibold">{formatCurrency(serviceFee, b.currency || 'EGP')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{language === 'en' ? 'VAT 14% (Included)' : 'ضريبة القيمة المضافة 14% (شاملة)'}</span>
                  <span>{formatCurrency(Math.round(subtotal * 0.14), b.currency || 'EGP')}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  <span>{language === 'en' ? 'Total Paid' : 'الإجمالي المدفوع'}</span>
                  <span>{formatCurrency(totalAmount, b.currency || 'EGP')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center text-xl shrink-0">
                📱
              </div>
              <div>
                <strong className="block text-emerald-800 dark:text-emerald-300 font-bold">{language === 'en' ? 'Verified Electronic Voucher' : 'سند إلكتروني معتمد'}</strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'en' ? 'Present this invoice upon arrival for instant check-in' : 'أظهر هذه الفاتورة عند الوصول لتسجيل الدخول الفوري'}</span>
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
            <button
              type="button"
              className="secondary-button !py-2.5 !px-5 text-sm"
              onClick={() => setSelectedInvoiceBooking(null)}
            >
              {language === 'en' ? 'Close' : 'إغلاق'}
            </button>
            <button
              type="button"
              className="primary-button !py-2.5 !px-5 text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              onClick={() => window.print()}
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>{language === 'en' ? 'Print Invoice' : 'طباعة الفاتورة'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const notificationLabel = language === 'en' ? 'Notifications' : 'الإشعارات'
  const topBarTitle =
    activePage === 'home' || activePage === 'dashboard' || activePage === 'owner'
      ? 'Hajzy'
      : isOwner
        ? pageTitlesByLanguage[language]?.[activePage] || pageTitlesByLanguage[language]?.owner || 'Hajzy'
        : pageTitlesByLanguage[language]?.[activePage] || pageTitlesByLanguage[language]?.dashboard || 'Hajzy'

  const handleMarketingOpenLogin = () => {
    setIsGuestMode(false)
    localStorage.setItem('hajzy_guest_mode', 'false')
    setCurrentAuthPage('login')
    setActivePage('home')
  }

  const handleMarketingBrowseGuest = () => {
    setIsGuestMode(true)
    setAuthRequired(false)
    localStorage.setItem('hajzy_guest_mode', 'true')
    setCurrentAuthPage('login')
    setActivePage('home')
  }

  if (!loading && !user && authRequired) {
    return renderAuthPage()
  }

  const MAIN_TAB_PAGES = ['home', 'dashboard', 'owner', 'bookings', 'account', 'profile']
  const isSubPage = !MAIN_TAB_PAGES.includes(activePage)

  const handleHeaderBack = () => {
    if (activePage === 'checkout') {
      if (selectedProperty) navigate('details', selectedProperty)
      else navigate('home')
    } else if (activePage === 'details') {
      navigate('home')
    } else if (activePage === 'city') {
      navigate('home')
    } else if (activePage === 'notifications') {
      navigate(isOwner ? 'owner' : 'dashboard')
    } else if (activePage === 'chat' || activePage === 'reviews') {
      if (selectedProperty) navigate('details', selectedProperty)
      else navigate('home')
    } else if (activePage === 'profile-edit') {
      navigate('account')
    } else if (activePage === 'favorites') {
      navigate('home')
    } else {
      navigate(isOwner ? 'owner' : 'home')
    }
  }

  return (
  <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <div className="topbar-inner">
          {isSubPage ? (
            <button
              type="button"
              className="icon-button header-back-button"
              aria-label={language === 'en' ? 'Back' : 'العودة'}
              title={language === 'en' ? 'Back' : 'العودة'}
              onClick={handleHeaderBack}
            >
              <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
            </button>
          ) : (
            <div className="topbar-ghost" aria-hidden="true" />
          )}

          <h1 className="topbar-brand topbar-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(isOwner ? 'owner' : 'home')}>
            {topBarTitle === 'Hajzy' ? (
              <Logo size={30} showText={false} />
            ) : (
              topBarTitle
            )}
          </h1>

          <div className="topbar-actions flex items-center gap-1.5">
            <button
              type="button"
              className="icon-button theme-toggle"
              aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <button
              type="button"
              className="icon-button language-toggle"
              aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              title={language === 'en' ? 'العربية' : 'English'}
              onClick={handleLanguageToggle}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
              <span className="text-xs font-bold">{language === 'en' ? 'AR' : 'EN'}</span>
            </button>

            <button
              className="icon-button notification-button"
              aria-label={notificationLabel}
              title={notificationLabel}
              onClick={() => {
                setShowNotifications(false)
                navigate('notifications')
              }}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="notification-badge">{unreadNotificationsCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="content-wrap">

        {isLoadingData ? (
          // Show page-level skeletons while loading
          <div style={{ padding: 16 }}>
            <Skeleton type="home" count={6} />
          </div>
        ) : (
          <Suspense fallback={<LuxuryPageSkeleton />}>
            {renderPageContent()}
          </Suspense>
        )}
      </main>

      {renderBookingActionsModal()}
      {renderInvoiceModal()}
      {renderDealModal()}

      <SplitPaymentModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        totalAmount={grandTotal || 2800}
        currency={selectedProperty?.currency || 'EGP'}
        language={language}
        propertyName={getPropertyTitle(selectedProperty) || 'Hajzy Stay'}
      />

      {toast && (
        <div className="global-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {!isOwner && (
        <nav className="bottom-nav" aria-label="التنقل الرئيسي">
          {bottomNavItems.map((item) => {
            const isItemActive =
              activePage === item.key ||
              (item.key === 'home' && activePage === 'city') ||
              (item.key === 'account' && activePage === 'profile') ||
              (item.key === 'dashboard' && isOwner && activePage === 'owner')

            return (
              <button
                key={item.key}
                className={isItemActive ? 'nav-item active' : 'nav-item'}
                onClick={() => navigate(item.key)}
                aria-label={item.label}
                title={item.label}
              >
                <span className="nav-icon-wrap">
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default App
