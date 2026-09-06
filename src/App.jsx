import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { useAuth } from './hooks/useAuth'
import Skeleton from './components/Skeleton'
import usePullToRefresh from './hooks/usePullToRefresh'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import MarketingPage from './pages/MarketingPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import ReviewsPage from './pages/ReviewsPage'
import MapView from './components/MapView'
import Logo from './components/Logo'
import SplitPaymentModal from './components/SplitPaymentModal'
import NeighborhoodExplorer from './components/NeighborhoodExplorer'
import HostCalendar from './components/HostCalendar'
import { useTheme } from './components/ThemeProvider'
import { formatCurrency, formatDate } from './lib/formatters'
import {
  addBooking,
  addChatMessage,
  addProperty,
  CITY_PHOTOS,
  createPaymentSession,
  deleteBooking,
  deleteProperty,
  FALLBACK_STAY_PHOTO,
  fetchBookings,
  fetchChatMessages,
  fetchProperties,
  hasSupabaseConnection,
  propertySeed,
  updateBooking,
  updateProperty,
} from './lib/dataService'

const handleStayImageError = (event) => {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return
  event.currentTarget.dataset.fallbackApplied = 'true'
  event.currentTarget.src = FALLBACK_STAY_PHOTO
}

const pageTitlesByLanguage = {
  ar: {
    dashboard: 'لوحة التحكم',
    home: 'Hajzy',
    details: 'تفاصيل الشقة',
    checkout: 'تأكيد الحجز',
    success: 'تم التأكيد',
    bookings: 'حجوزاتي',
    notifications: 'الإشعارات',
    profile: 'الملف الشخصي',
    owner: 'لوحة المالك',
    'owner-settings': 'إعدادات المالك',
  },
  en: {
    dashboard: 'Dashboard',
    home: 'Hajzy',
    details: 'Property details',
    checkout: 'Confirm booking',
    success: 'Confirmed',
    bookings: 'My bookings',
    notifications: 'Notifications',
    profile: 'Profile',
    owner: 'Owner dashboard',
    'owner-settings': 'Owner settings',
  },
}

const getDefaultBookingDates = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  return {
    checkIn: tomorrow.toISOString().slice(0, 10),
    checkOut: dayAfterTomorrow.toISOString().slice(0, 10),
  }
}

function App() {
  const { t, i18n } = useTranslation()
  const { user, loading, login, signup, socialLogin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null)
  const [activePage, setActivePage] = useState('home')
  const [authRequired, setAuthRequired] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(() => {
    if (typeof window === 'undefined') return true

    const savedGuestMode = localStorage.getItem('hajzy_guest_mode')
    if (savedGuestMode === null) {
      localStorage.setItem('hajzy_guest_mode', 'true')
      return true
    }

    return savedGuestMode === 'true'
  })
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [currentAuthPage, setCurrentAuthPage] = useState('login')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('hajzy_favorites') || localStorage.getItem('stitch_favorites')
    return savedFavorites ? JSON.parse(savedFavorites) : []
  })
  const [lastBooking, setLastBooking] = useState(null)
  const defaultBookingDates = getDefaultBookingDates()

  const [bookingDates, setBookingDates] = useState({
    ...defaultBookingDates,
    guests: 2,
  })
  const [ownerNotice, setOwnerNotice] = useState('')
  const [ownerEditingId, setOwnerEditingId] = useState(null)
  const [bookingFilter, setBookingFilter] = useState('upcoming')
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
  const [guestForm, setGuestForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [walletNumber, setWalletNumber] = useState('01023456789')
  const [instapayHandle, setInstapayHandle] = useState('user@instapay')
  const [fawryRefCode] = useState('74920184')
  const [toast, setToast] = useState(null)
  const [_showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 'welcome-note',
      title: 'تم تأكيد حجزك',
      detail: 'إقامة فيستا الإسكندرية - الوصول غدًا في 15:00',
      time: 'الآن',
      type: 'success',
      read: false,
    },
    {
      id: 'price-drop-note',
      title: 'انخفض سعر إقامتك المفضلة',
      detail: 'تم تخفيض سعر شاليه البحر الأحمر بنسبة 12%',
      time: 'منذ 2 س',
      type: 'info',
      read: false,
    },
    {
      id: 'reminder-note',
      title: 'تذكير الوصول',
      detail: 'يرجى تأكيد موعد الوصول قبل 24 ساعة',
      time: 'أمس',
      type: 'warning',
      read: true,
    },
  ])
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
    maxPrice: 8000,
    ratingMin: 4.5,
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

    if (path.includes('/verify-email')) {
      setCurrentAuthPage('verify')
      return
    }

    if (path.includes('/reset-password') && params.get('token')) {
      setCurrentAuthPage('reset')
    }
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

  // Refresh function used by pull-to-refresh and manual refresh
  const refreshData = async () => {
    setIsLoadingData(true)
    try {
      const [propertyList, bookingList] = await Promise.all([fetchProperties(), fetchBookings()])
      const safePropertyList = Array.isArray(propertyList) && propertyList.length ? propertyList : propertySeed
      const safeBookingList = Array.isArray(bookingList) && bookingList.length ? bookingList : []
      if (!Array.isArray(propertyList) || !propertyList.length) {
        localStorage.setItem('hajzy_properties', JSON.stringify(propertySeed))
      }
      setProperties(safePropertyList)
      setBookings(safeBookingList)
      setSelectedProperty((prev) => prev || safePropertyList[0])
    } catch (err) {
      console.error('Refresh failed', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Pull-to-refresh binding: attach to main content
  const mainRef = useRef(null)
  const { pullDistance, refreshing } = usePullToRefresh(mainRef, async () => {
    await refreshData()
  })

  useEffect(() => {
    localStorage.setItem('hajzy_favorites', JSON.stringify(favorites))
  }, [favorites])

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

  const navigate = (page, property = selectedProperty) => {
    if (property) {
      setSelectedProperty(property)
    }
    setActivePage(page)
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
      setActivePage('home')
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
      setAuthRequired(false)
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

      if (field === 'checkIn' && nextState.checkOut && new Date(nextState.checkOut) < new Date(value)) {
        nextState.checkOut = value
      }

      if (field === 'checkOut' && nextState.checkIn && new Date(value) < new Date(nextState.checkIn)) {
        nextState.checkOut = nextState.checkIn
      }

      return nextState
    })
  }

  const quickSearchDateError =
    homeQuickSearch.checkIn &&
    homeQuickSearch.checkOut &&
    new Date(homeQuickSearch.checkOut) < new Date(homeQuickSearch.checkIn)
      ? language === 'en'
        ? 'Check-out must be after check-in.'
        : 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.'
      : ''

  const showToast = (message) => {
    if (!message) return
    setToast(message)
    setOwnerNotice(message)
  }

  const isFavorite = (propertyId) => favorites.some((id) => String(id) === String(propertyId))

  const toggleFavorite = (event, propertyId) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()

    const favoriteId = String(propertyId)
    const alreadySaved = isFavorite(favoriteId)

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

  const addNotification = (title, detail, type = 'info') => {
    setNotifications((currentNotifications) => [
      {
        id: Date.now().toString(),
        title,
        detail,
        type,
        time: 'الآن',
        read: false,
      },
      ...currentNotifications,
    ].slice(0, 5))
  }

  const markAllNotificationsRead = () => {
    setNotifications((currentNotifications) => currentNotifications.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = (notificationId) => {
    setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.id !== notificationId))
  }

  const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length

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
      const matchesPrice = Number(property.priceValue || 0) <= Number(homeFilters.maxPrice || 8000)
      const matchesRating = Number(property.rating || 0) >= Number(homeFilters.ratingMin || 0)
      const matchesType =
        homeFilters.type === 'all' ||
        (() => {
          const typeText = `${property.title || ''} ${property.titleEn || ''} ${(property.details || []).join(' ')} ${(property.detailsEn || []).join(' ')}`.toLowerCase()
          if (homeFilters.type === 'apartment') return typeText.includes('شقة') || typeText.includes('suite') || typeText.includes('appartment') || typeText.includes('flat')
          if (homeFilters.type === 'villa') return typeText.includes('فيلا') || typeText.includes('villa') || typeText.includes(' chalet ') || typeText.includes('شاليه')
          if (homeFilters.type === 'hotel') return typeText.includes('فندق') || typeText.includes('hotel') || typeText.includes('جناح')
          if (homeFilters.type === 'resort') return typeText.includes('شاطئ') || typeText.includes('شرم') || typeText.includes('resort') || typeText.includes('بحر')
          return true
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
        'Wi‑Fi': ['wifi', 'wi-fi', 'wi‑fi', 'واي فاي'],
        Parking: ['parking', 'موقف', 'مواقف'],
        Pool: ['pool', 'مسبح'],
        'Sea View': ['sea view', 'sea', 'إطلالة بحر', 'بحرية'],
        Breakfast: ['breakfast', 'إفطار'],
        'Air Conditioning': ['air conditioning', 'air', 'تكييف'],
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

  const stayNights = Math.max(
    1,
    Math.round(
      (new Date(bookingDates.checkOut).getTime() - new Date(bookingDates.checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  )

  const bookingTotal = selectedProperty ? selectedProperty.priceValue * stayNights : 0
  const serviceFee = bookingTotal * 0.08
  const grandTotal = bookingTotal + serviceFee
  const bookingBreakdown = [
    {
      label: language === 'en' ? 'Stay total' : 'إجمالي الإقامة',
      value: bookingTotal,
    },
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
    if (bookingFilter === 'all') return true
    return booking.status === bookingFilter
  })

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
      showToast('يمكنك الآن إدارة العقارات من نموذج إضافة الشقة.')
      return
    }

    if (action === 'price') {
      document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      showToast('وضع تحديث الأسعار مفعل. يمكنك تعديل سعر أي عقار من النموذج.')
      return
    }

    if (action === 'message') {
      setChatOpen(true)
      showToast('تم تجهيز رسالة ترحيب للضيوف، ويمكنك إرسالها من محادثة العقار.')
      return
    }

    if (action === 'report') {
      const csvRows = [
        ['العقار', 'الحالة', 'الإجمالي', 'تاريخ الوصول', 'تاريخ المغادرة'],
        ...ownerBookings.map((booking) => [
          booking.title || 'العقار',
          booking.status === 'confirmed' ? 'مؤكد' : 'قيد المراجعة',
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
      showToast('تم تصدير تقرير الحجوزات بنجاح.')
    }
  }

  const handleOwnerAlertDetails = () => {
    setBookingFilter('all')
    document.querySelector('.owner-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showToast('تم تحديث عرض الحجوزات الأخيرة والطلبات على الشاشة.')
  }

  const handleViewAllOwnerBookings = () => {
    setBookingFilter('all')
    document.querySelector('.owner-table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    addNotification('تم إلغاء الحجز', 'تم تحديث حالة الحجز بنجاح وسيتم إبلاغك بأي تغييرات لاحقًا.', 'warning')
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

    if (isProcessingPayment) {
      return
    }

    setIsProcessingPayment(true)

    try {
      const reference = `#REF-${Math.floor(10000 + Math.random() * 90000)}`
      const newBooking = {
        id: `booking-${Date.now()}`,
        propertyId: selectedProperty.id,
        title: selectedProperty.title,
        location: selectedProperty.location,
        image: selectedProperty.image,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        guests: Number(bookingDates.guests),
        total: grandTotal,
        currency: selectedProperty.currency,
        status: 'confirmed',
        reference,
        paymentMethod,
      }

      const savedBooking = await addBooking(newBooking)
      const paymentSession = await createPaymentSession({
        amount: grandTotal,
        currency: selectedProperty.currency,
        propertyTitle: selectedProperty.title,
        paymentMethod,
      })

      if (paymentSession.redirectUrl && typeof window !== 'undefined') {
        window.location.href = paymentSession.redirectUrl
        return
      }

      setLastBooking({ ...savedBooking, paymentMethod })
      setBookings((currentBookings) => [{ ...savedBooking, paymentMethod }, ...currentBookings])
      addNotification('تم تأكيد حجزك', `تم حجز ${selectedProperty.title} بنجاح، موعد الوصول ${bookingDates.checkIn}، وإجمالي ${formatCurrency(grandTotal, selectedProperty.currency)}.`, 'success')
      navigate('success')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const renderOwnerPage = () => (
    <div className="page-shell owner-shell">
      <div className="owner-dashboard-header">
        <div>
          <span className="owner-dashboard-kicker">Owner Dashboard</span>
          <h2>لوحة تحكم المالك</h2>
        </div>
        <div className="owner-header-actions">
          <button type="button" className="secondary-button small-button" onClick={() => document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            إضافة شقة جديدة
          </button>
          <button type="button" className="primary-button small-button" onClick={() => navigate('owner-settings')}>
            إعدادات المالك
          </button>
        </div>
      </div>

      <div className="owner-summary">
        <div className="owner-summary-card accent">
          <div className="owner-card-topline">
            <p>إجمالي الشقق</p>
            <span className="owner-stat-icon material-symbols-outlined">apartment</span>
          </div>
          <strong>{ownerProperties.length}</strong>
          <small>+{Math.max(2, Math.round(ownerProperties.length * 0.3))} هذا الشهر</small>
        </div>
        <div className="owner-summary-card warn">
          <div className="owner-card-topline">
            <p>الطلبات</p>
            <span className="owner-stat-icon material-symbols-outlined">event_available</span>
          </div>
          <strong>{ownerBookings.length}</strong>
          <small>{Math.max(1, Math.min(8, ownerBookings.length))} قيد المراجعة</small>
        </div>
        <div className="owner-summary-card success">
          <div className="owner-card-topline">
            <p>الإيرادات</p>
            <span className="owner-stat-icon material-symbols-outlined">payments</span>
          </div>
          <strong>{formatCurrency(ownerRevenue)}</strong>
          <small>+18.4% مقارنة بالأسبوع الماضي</small>
        </div>
      </div>

      <div className="owner-action-rail">
        <button type="button" className="secondary-button small-button" onClick={() => document.getElementById('owner-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          + إضافة عقار
        </button>
        <button type="button" className="secondary-button small-button" onClick={() => setBookingFilter('pending')}>
          مراجعة الطلبات
        </button>
        <button type="button" className="secondary-button small-button" onClick={() => navigate('owner-settings')}>
          إعدادات التشغيل
        </button>
        <button type="button" className="secondary-button small-button" onClick={() => handleOwnerQuickAction('report')}>
          تصدير تقرير
        </button>
      </div>

      <div className="owner-feature-banner">
        <div>
          <span className="owner-feature-kicker">الدفع الفوري</span>
          <h3>أعلى طلب هذا الأسبوع</h3>
        </div>
        <div className="owner-feature-pills">
          <span>إشغال 78%</span>
          <span>حجوزات مؤكدة 84%</span>
          <span>تقييم 4.9</span>
        </div>
      </div>

      <div className="owner-overview">
        <div className="owner-overview-card wide">
          <div className="owner-overview-header">
            <h3>نظرة سريعة</h3>
            <span className="status-pill">محدث الآن</span>
          </div>
          <div className="owner-metrics-grid">
            <div>
              <span>متوسط الإشغال</span>
              <strong>78%</strong>
            </div>
            <div>
              <span>أعلى مدينة</span>
              <strong>الإسكندرية</strong>
            </div>
            <div>
              <span>إيراد هذا الشهر</span>
              <strong>{formatCurrency(ownerRevenue)}</strong>
            </div>
          </div>
          <div className="owner-progress-list">
            <div>
              <div className="label-row">
                <span>الطلبات المؤكدة</span>
                <strong>84%</strong>
              </div>
              <div className="progress-bar"><span style={{ width: '84%' }}></span></div>
            </div>
            <div>
              <div className="label-row">
                <span>الإشغال هذا الشهر</span>
                <strong>71%</strong>
              </div>
              <div className="progress-bar"><span style={{ width: '71%' }}></span></div>
            </div>
          </div>
        </div>

        <div className="owner-overview-card">
          <div className="owner-overview-header">
            <h3>التقييمات</h3>
            <span className="status-pill neutral">+12%</span>
          </div>
          <div className="rating-score-box">
            <strong>4.9</strong>
            <span>متوسط تقييم الضيوف</span>
          </div>
          <ul className="mini-score-list">
            <li><span>الصفاء</span><strong>4.9</strong></li>
            <li><span>الموقع</span><strong>4.8</strong></li>
            <li><span>التواصل</span><strong>5.0</strong></li>
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
          <h3>تنبيهات التشغيل</h3>
          <span className="status-pill neutral">اليوم</span>
        </div>
        <div className="owner-alert-row">
          <div>
            <span className="material-symbols-outlined">notifications_active</span>
            <div>
              <strong>3 طلبات جديدة</strong>
              <small>تحتاج إلى مراجعة خلال 2 ساعة</small>
            </div>
          </div>
          <button type="button" className="secondary-button small-button" onClick={() => setBookingFilter('pending')}>مراجعة</button>
        </div>
        <div className="owner-alert-row">
          <div>
            <span className="material-symbols-outlined">schedule</span>
            <div>
              <strong>تحديث أسعار السكن</strong>
              <small>توصية بزيادة 5% في عطلة نهاية الأسبوع</small>
            </div>
          </div>
          <button type="button" className="text-button" onClick={handleOwnerAlertDetails}>تفاصيل</button>
        </div>
      </div>

      <div className="owner-quick-actions">
        <button type="button" className="primary-button" onClick={() => handleOwnerQuickAction('manage')}>إدارة العقارات</button>
        <button type="button" className="secondary-button" onClick={() => handleOwnerQuickAction('price')}>تحديث الأسعار</button>
        <button type="button" className="secondary-button" onClick={() => handleOwnerQuickAction('message')}>إرسال رسالة</button>
        <button type="button" className="secondary-button" onClick={() => handleOwnerQuickAction('report')}>تصدير تقرير</button>
      </div>

      <div className="owner-analytics-surface">
        <div className="owner-insights-header">
          <h3>إيرادات العقارات</h3>
          <span className="status-pill neutral">آخر 30 يوم</span>
        </div>
        <div className="owner-analytics-graph">
          {[42, 58, 49, 63, 72, 88, 96, 82, 68].map((value, index) => (
            <div key={value + index} className="owner-analytics-bar-wrap">
              <span>{value}k</span>
              <div className="owner-analytics-bar" style={{ height: `${value}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="owner-analytics-grid">
        <div className="owner-analytics-card">
          <div className="owner-overview-header">
            <h3>أحدث الحجوزات</h3>
            <button type="button" className="text-button" onClick={handleViewAllOwnerBookings}>عرض الكل</button>
          </div>
          <div className="mini-booking-list">
            {ownerBookings.length ? ownerBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="mini-booking-item">
                <div>
                  <strong>{booking.title}</strong>
                  <span>{booking.location}</span>
                </div>
                <div>
                  <strong>{formatCurrency(booking.total, booking.currency)}</strong>
                  <span>{booking.status === 'confirmed' ? 'مؤكد' : 'قيد المراجعة'}</span>
                </div>
              </div>
            )) : (
              <div className="empty-inline">لا توجد حجوزات حتى الآن.</div>
            )}
          </div>
        </div>

        <div className="owner-analytics-card">
          <div className="owner-overview-header">
            <h3>مهام سريعة</h3>
            <span className="status-pill neutral">اليوم</span>
          </div>
          <ul className="owner-task-list">
            <li>متابعة طلبات الحجز الجديدة</li>
            <li><span className="material-symbols-outlined">inventory_2</span>تحديث وصف الشقة الرئيسية</li>
            <li><span className="material-symbols-outlined">campaign</span>إرسال رسالة ترحيب للضيوف</li>
            <li><span className="material-symbols-outlined">payments</span>مراجعة الإيرادات الشهرية</li>
          </ul>
        </div>
      </div>

      <div className="owner-leading-listings">
        <div className="owner-overview-header">
          <h3>أفضل العقارات أداءً</h3>
          <span className="status-pill neutral">هذا الأسبوع</span>
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
                <span>{property.rating}★</span>
                <strong>{formatCurrency(property.priceValue, property.currency)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="owner-summary-grid">
        <div className="owner-summary-card">
          <span>متوسط الإشغال</span>
          <strong>78%</strong>
          <small>منذ آخر 30 يوم</small>
        </div>
        <div className="owner-summary-card">
          <span>معدل الحجز</span>
          <strong>14%</strong>
          <small>نسبة التحويل</small>
        </div>
        <div className="owner-summary-card">
          <span>استجابة المالك</span>
          <strong>1.2h</strong>
          <small>متوسط الرد</small>
        </div>
      </div>

      <div className="owner-main-panel">
        <div className="owner-main-panel-header">
          <h3>إحصاءات الإقبال</h3>
          <span>آخر 7 أيام</span>
        </div>
        <div className="owner-chart">
          {[48, 72, 58, 90, 84, 96, 76].map((value, index) => (
            <div key={value + index} className="owner-chart-bar-wrap">
              <span>{value}%</span>
              <div className="owner-chart-bar" style={{ height: `${value}%` }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="owner-table-card">
        <div className="owner-overview-header">
          <h3>قائمة الحجوزات</h3>
        </div>
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>العقار</th>
                <th>التواريخ</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {ownerBookings.length ? ownerBookings.slice(0, 5).map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.title || 'زائر'}</td>
                  <td>{booking.location || 'موقع العقار'}</td>
                  <td>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</td>
                  <td>{formatCurrency(booking.total, booking.currency)}</td>
                  <td>
                    <span className={booking.status === 'confirmed' ? 'status-badge confirmed' : 'status-badge pending'}>
                      {booking.status === 'confirmed' ? 'مؤكد' : 'قيد المراجعة'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="empty-table">لا توجد حجوزات حتى الآن.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form id="owner-form" className="owner-form" onSubmit={handleOwnerAddProperty}>
        <div className="owner-form-head">
          <h3>{ownerEditingId ? 'تعديل الشقة' : 'إضافة شقة جديدة'}</h3>
          {ownerEditingId && (
            <button type="button" className="secondary-button small-button" onClick={resetOwnerForm}>
              إلغاء
            </button>
          )}
        </div>

        {ownerNotice && <div className="success-banner">{ownerNotice}</div>}

        <div className="owner-grid">
          <label>
            عنوان الشقة
            <input
              type="text"
              value={propertyForm.title}
              onChange={(event) => setPropertyForm({ ...propertyForm, title: event.target.value })}
              placeholder="اسم الشقة"
            />
          </label>
          <label>
            المدينة
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
            الموقع التفصيلي
            <input
              type="text"
              value={propertyForm.location}
              onChange={(event) => setPropertyForm({ ...propertyForm, location: event.target.value })}
              placeholder="مثال: شارع النيل، القاهرة"
            />
          </label>
          <label>
            السعر / يوم
            <input
              type="number"
              min="0"
              value={propertyForm.priceValue}
              onChange={(event) => setPropertyForm({ ...propertyForm, priceValue: event.target.value })}
              placeholder="مثال: 2500"
            />
          </label>
          <label className="wide">
            رابط الصورة
            <input
              type="url"
              value={propertyForm.image}
              onChange={(event) => setPropertyForm({ ...propertyForm, image: event.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="wide">
            المزايا
            <input
              type="text"
              value={propertyForm.amenities}
              onChange={(event) => setPropertyForm({ ...propertyForm, amenities: event.target.value })}
              placeholder="مثل: إنترنت, موقف, نوافذ واسعة"
            />
          </label>
          <label className="wide">
            الوصف
            <textarea
              rows="3"
              value={propertyForm.description}
              onChange={(event) => setPropertyForm({ ...propertyForm, description: event.target.value })}
              placeholder="اكتب وصف الشقة بشكل جذاب"
            />
          </label>
          <label className="wide">
            معلومات الحجز
            <textarea
              rows="3"
              value={propertyForm.bookingInfo}
              onChange={(event) => setPropertyForm({ ...propertyForm, bookingInfo: event.target.value })}
              placeholder="مثل: إلغاء مجاني حتى 48 ساعة قبل الوصول"
            />
          </label>
        </div>

        <button type="submit" className="primary-button">
          {ownerEditingId ? 'حفظ التعديلات' : 'إضافة الشقة'}
        </button>
      </form>

      <div className="owner-listings">
        <h3>الشقق المضافة</h3>

        {ownerProperties.length === 0 ? (
          <div className="owner-empty-state">
            <span className="material-symbols-outlined">apartment</span>
            <p>لا توجد شقق مضافة بعد، أضف أول إعلان لك.</p>
          </div>
        ) : (
          ownerProperties.map((property) => (
            <article key={property.id} className="owner-card">
              <img src={property.image} alt={property.title} onError={handleStayImageError} />
              <div className="owner-card-body">
                <div>
                  <h4>{property.title}</h4>
                  <p>{property.location}</p>
                  <strong>{formatCurrency(property.priceValue, property.currency)}</strong>
                </div>
                <div className="owner-actions">
                  <button type="button" className="secondary-button small-button" onClick={() => handleOwnerEditProperty(property)}>
                    تعديل
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleOwnerDeleteProperty(property.id)}>
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="owner-listings owner-bookings-panel">
        <div className="owner-form-head">
          <h3>طلبات الحجز</h3>
          <div className="booking-filter-tabs">
            {['all', 'confirmed', 'pending'].map((filter) => (
              <button
                key={filter}
                type="button"
                className={bookingFilter === filter ? 'filter-tag active' : 'filter-tag'}
                onClick={() => setBookingFilter(filter)}
              >
                {filter === 'all' ? 'الكل' : filter === 'confirmed' ? 'مؤكد' : 'قيد المراجعة'}
              </button>
            ))}
          </div>
        </div>

        {filteredOwnerBookings.length === 0 ? (
          <div className="owner-empty-state">
            <span className="material-symbols-outlined">calendar_month</span>
            <p>لا توجد حجوزات في هذا التصفية حالياً.</p>
          </div>
        ) : (
          filteredOwnerBookings.map((booking) => (
            <article key={booking.id} className="booking-card owner-booking-card">
              <div className="booking-image">
                <img src={booking.image} alt={booking.title} onError={handleStayImageError} />
                <span className={`status ${booking.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                  {booking.status === 'confirmed' ? 'مؤكدة' : 'قيد المراجعة'}
                </span>
              </div>
              <div className="booking-body">
                <div className="booking-head">
                  <div>
                    <h3>{booking.title}</h3>
                    <p>{booking.location}</p>
                  </div>
                </div>
                <div className="booking-footer">
                  <div>
                    <small>
                      من {formatDate(booking.checkIn)} إلى {formatDate(booking.checkOut)}
                    </small>
                    <strong>{formatCurrency(booking.total, booking.currency)}</strong>
                  </div>
                </div>
                <div className="owner-booking-actions">
                  <button type="button" className="secondary-button small-button" onClick={() => handleBookingStatusToggle(booking)}>
                    {booking.status === 'confirmed' ? 'إرجاع إلى قيد المراجعة' : 'تأكيد الحجز'}
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDeleteBooking(booking.id)}>
                    حذف
                  </button>
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

  const destinationCards = [
    {
      cityKey: 'الإسكندرية',
      city: language === 'en' ? 'Alexandria' : 'الإسكندرية',
      label: language === 'en' ? 'Sea breeze' : 'نسيم البحر',
      price: language === 'en' ? 'From 3,100 EGP' : 'من 3,100 ج.م',
      image: CITY_PHOTOS['الإسكندرية'],
    },
    {
      cityKey: 'القاهرة',
      city: language === 'en' ? 'Cairo' : 'القاهرة',
      label: language === 'en' ? 'Nile & city' : 'النيل والمدينة',
      price: language === 'en' ? 'From 3,600 EGP' : 'من 3,600 ج.م',
      image: CITY_PHOTOS['القاهرة'],
    },
    {
      cityKey: 'الجيزة',
      city: language === 'en' ? 'Giza' : 'الجيزة',
      label: language === 'en' ? 'Pyramids view' : 'إطلالة الأهرامات',
      price: language === 'en' ? 'From 2,950 EGP' : 'من 2,950 ج.م',
      image: CITY_PHOTOS['الجيزة'],
    },
    {
      cityKey: 'الغردقة',
      city: language === 'en' ? 'Hurghada' : 'الغردقة',
      label: language === 'en' ? 'Red Sea luxury' : 'فخامة البحر الأحمر',
      price: language === 'en' ? 'From 3,400 EGP' : 'من 3,400 ج.م',
      image: CITY_PHOTOS['الغردقة'],
    },
    {
      cityKey: 'شرم الشيخ',
      city: language === 'en' ? 'Sharm El-Sheikh' : 'شرم الشيخ',
      label: language === 'en' ? 'Bay & reefs' : 'الخلجان والشعاب',
      price: language === 'en' ? 'From 3,900 EGP' : 'من 3,900 ج.م',
      image: CITY_PHOTOS['شرم الشيخ'],
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
        <div className="home-header">
          <div className="home-header-copy">
            <h2>{activeText.homeTitle}</h2>
            <p>{t('welcome', { name: user?.name || 'Ziad' })} 👋</p>
          </div>
        </div>

        <div className="hero-banner">
          <div className="hero-copy">
            <span className="hero-kicker">{language === 'en' ? 'Trending now' : 'الأكثر طلباً'}</span>
            <h3>{language === 'en' ? 'Luxury stays for your next escape' : 'إقامات فاخرة لرحلتك القادمة'}</h3>
            <div className="hero-actions">
              <button type="button" className="primary-button hero-cta" onClick={runHomeSearch}>
                {language === 'en' ? 'Explore homes' : 'استكشف العقارات'}
              </button>
              <button
                type="button"
                className="secondary-button hero-secondary"
                onClick={() => {
                  setHomeQuickSearch((current) => ({ ...current, destination: 'الإسكندرية' }))
                  setActiveFilter('الإسكندرية')
                }}
              >
                {language === 'en' ? 'Nearby homes' : 'بيوت قريبة منك'}
              </button>
            </div>
          </div>
          <div className="hero-mini-stat">
            <strong>4.9</strong>
            <span>{language === 'en' ? 'Average rating' : 'متوسط التقييم'}</span>
          </div>
        </div>

        <div className="home-compact-search">
          <div className="search-panel home-search-panel">
            <div className="search-panel-header">
              <div>
                <span className="search-panel-kicker">{language === 'en' ? 'Find your stay' : 'ابحث عن الإقامة'}</span>
                <h3>{language === 'en' ? 'Where are you going?' : 'إلى أين تريد الذهاب؟'}</h3>
              </div>
              <button type="button" className="secondary-button small-button" onClick={() => setShowFilterPanel((open) => !open)}>
                <span className="material-symbols-outlined">tune</span>
                {language === 'en' ? 'Filters' : 'تصفية'}
              </button>
            </div>

            <div className="search-panel-row full-width-row">
              <label className="search-field">
                <span>{language === 'en' ? 'Destination' : 'الوجهة'}</span>
                <div className="input-with-icon">
                  <span className="field-icon material-symbols-outlined">location_on</span>
                  <select
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
            </div>

            <div className="search-panel-row compact">
              <label className="search-field">
                <span>{language === 'en' ? 'Check-in' : 'تاريخ الوصول'}</span>
                <div className="input-with-icon">
                  <span className="field-icon material-symbols-outlined">calendar_month</span>
                  <input
                    type="date"
                    value={homeQuickSearch.checkIn}
                    onChange={(event) => handleQuickSearchDateChange('checkIn', event.target.value)}
                  />
                </div>
              </label>
              <label className="search-field">
                <span>{language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}</span>
                <div className="input-with-icon">
                  <span className="field-icon material-symbols-outlined">calendar_month</span>
                  <input
                    type="date"
                    value={homeQuickSearch.checkOut}
                    onChange={(event) => handleQuickSearchDateChange('checkOut', event.target.value)}
                  />
                </div>
              </label>
            </div>

            {quickSearchDateError && <div className="field-error-banner">{quickSearchDateError}</div>}

            <div className="search-panel-row compact">
              <label className="search-field">
                <span>{language === 'en' ? 'Guests' : 'عدد الضيوف'}</span>
                <div className="input-with-icon compact-icon">
                  <span className="field-icon material-symbols-outlined">group</span>
                  <select
                    value={homeQuickSearch.guests}
                    onChange={(event) => setHomeQuickSearch((current) => ({ ...current, guests: Number(event.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((guest) => (
                      <option key={guest} value={guest}>{guest} {language === 'en' ? (guest === 1 ? 'guest' : 'guests') : 'ضيف'}</option>
                    ))}
                  </select>
                </div>
              </label>
              <button
                type="button"
                className="primary-button search-submit-button"
                onClick={runHomeSearch}
              >
                {t('search')}
              </button>
            </div>
          </div>

          {showFilterPanel && (
            <div className="filter-drawer">
              <div className="filter-drawer-grid">
                <div className="filter-section">
                  <label>
                    <span>{language === 'en' ? 'Max price' : 'الحد الأقصى للسعر'}</span>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="250"
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
                      value={homeFilters.ratingMin}
                      onChange={(event) => setHomeFilters((current) => ({ ...current, ratingMin: Number(event.target.value) }))}
                    >
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

        <div className="mini-city-grid">
          {destinationCards.map((item) => (
            <button
              key={item.cityKey}
              type="button"
              className="mini-city-card"
              onClick={() => {
                setHomeQuickSearch((current) => ({ ...current, destination: item.cityKey }))
                setActiveFilter(item.cityKey)
              }}
            >
              <img src={item.image} alt={item.city} onError={handleStayImageError} />
              <div className="city-card-copy">
                <span>{item.city}</span>
                <small>{item.label}</small>
                <strong>{item.price}</strong>
              </div>
            </button>
          ))}
        </div>

        {filteredProperties.length > 0 && (
          <div className="home-section-head" id="home-results">
            <div className="home-section-title-wrap">
              <h3>{language === 'en' ? 'Most booked this week' : 'الأكثر حجزًا هذا الأسبوع'}</h3>
              <span className="home-results-pill">
                {filteredProperties.length} {filteredProperties.length === 1 ? (language === 'en' ? 'result' : 'نتيجة') : (language === 'en' ? 'results' : 'نتائج')}
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
                <img src={property.image} alt={getPropertyTitle(property)} onError={handleStayImageError} />
                <div>
                  <span>{getPropertyCity(property)}</span>
                  <strong>{getPropertyTitle(property)}</strong>
                  <small>{formatCurrency(property.priceValue, property.currency, language)} / {language === 'en' ? 'night' : 'ليلة'}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="filter-chips">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              className={activeFilter === option.id ? 'chip active' : 'chip'}
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
              onClick={(event) => {
                if (event.target.closest('button')) return
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
                  <span className="material-symbols-outlined">
                    {isFavorite(property.id) ? 'favorite' : 'favorite_border'}
                  </span>
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
                  <h3>{getPropertyTitle(property)}</h3>
                  <p>
                    <span className="material-symbols-outlined">location_on</span>
                    {getPropertyLocation(property)}
                  </p>
                </div>

                <div className="property-meta-row">
                  <span><span className="material-symbols-outlined">bed</span> {language === 'en' ? `${property.guests || 2} guests` : `${property.guests || 2} ضيوف`}</span>
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

                  <button className="primary-button" onClick={() => navigate('details', property)}>
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
            <small>{language === 'en' ? 'Protected checkout' : 'دفع محمي'}</small>
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
      { label: language === 'en' ? 'Stay length' : 'مدة الإقامة', value: language === 'en' ? `${stayNights} nights` : `${stayNights} ليلة` },
      { label: language === 'en' ? 'Estimated total' : 'الإجمالي المتوقع', value: formatCurrency(grandTotal, selectedProperty.currency, language) },
    ]

    const mapCenter = selectedProperty.coordinates || { lat: 30.0333, lng: 31.2333 }

    return (
      <div className="page-shell detail-shell">
        <section className="gallery-hero">
          <button
            type="button"
            className="gallery-arrow left"
            aria-label={language === 'en' ? 'Previous image' : 'الصورة السابقة'}
            onClick={() => setSelectedGalleryIndex((selectedGalleryIndex - 1 + galleryImages.length) % galleryImages.length)}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <img src={galleryImages[selectedGalleryIndex] || galleryImages[0]} alt={getPropertyTitle(selectedProperty)} onError={handleStayImageError} />

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
            <span className="material-symbols-outlined">{isFavorite(selectedProperty.id) ? 'favorite' : 'favorite_border'}</span>
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
            <button className="primary-button" onClick={() => navigate('checkout')}>
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

  const monthDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
  const visibleDates = []
  const startWeekOffset = (monthDate.getDay() + 6) % 7
  const firstVisibleDate = new Date(monthDate)
  firstVisibleDate.setDate(monthDate.getDate() - startWeekOffset)

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(firstVisibleDate)
    current.setDate(firstVisibleDate.getDate() + index)
    visibleDates.push(current)
  }

  const isSameDay = (left, right) => left && right && left.toDateString() === right.toDateString()
  const isWithinRange = (date, start, end) => {
    if (!start || !end) return false
    return date >= new Date(start) && date <= new Date(end)
  }

  const handleCalendarDateSelect = (dateValue) => {
    const nextDate = new Date(dateValue)
    const nextDateString = nextDate.toISOString().slice(0, 10)
    setCalendarMonth(new Date(nextDateString))

    if (!bookingDates.checkIn || (bookingDates.checkIn && bookingDates.checkOut)) {
      setBookingDates((currentDates) => ({
        ...currentDates,
        checkIn: nextDateString,
        checkOut: '',
      }))
      return
    }

    if (new Date(nextDateString) < new Date(bookingDates.checkIn)) {
      setBookingDates((currentDates) => ({
        ...currentDates,
        checkIn: nextDateString,
        checkOut: '',
      }))
      return
    }

    setBookingDates((currentDates) => ({
      ...currentDates,
      checkOut: nextDateString,
    }))
  }

  const renderCheckoutPage = () => {
    const stepTitles = [
      language === 'en' ? 'Stay details' : 'تفاصيل الإقامة',
      language === 'en' ? 'Guest info' : 'بيانات الضيف',
      language === 'en' ? 'Payment' : 'الدفع',
    ]
    const calendarWeekdays = language === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['إثن', 'ثلاث', 'أرب', 'خم', 'جم', 'سب', 'حد']
    const monthFormatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-EG', { month: 'long', year: 'numeric' })

    return (
      <div className="page-shell checkout-shell">
        <section className="checkout-card">
          <div className="checkout-image">
            <img src={selectedProperty.image} alt={getPropertyTitle(selectedProperty)} onError={handleStayImageError} />
          </div>

          <div className="checkout-body">
            <div className="booking-progress-steps">
              {stepTitles.map((title, index) => (
                <span key={title} className={bookingStep === index + 1 ? 'active' : ''}>
                  {index + 1}. {title}
                </span>
              ))}
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
                    <input
                      type="date"
                      value={bookingDates.checkIn}
                      onChange={(event) =>
                        setBookingDates((currentDates) => ({
                          ...currentDates,
                          checkIn: event.target.value,
                          checkOut: currentDates.checkOut && new Date(event.target.value) > new Date(currentDates.checkOut) ? '' : currentDates.checkOut,
                        }))
                      }
                    />
                  </div>
                  <div className="info-box">
                    <span>{language === 'en' ? 'Check-out date' : 'تاريخ المغادرة'}</span>
                    <input
                      type="date"
                      value={bookingDates.checkOut}
                      onChange={(event) =>
                        setBookingDates((currentDates) => ({
                          ...currentDates,
                          checkOut: event.target.value,
                        }))
                      }
                    />
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
                      <option value={1}>{language === 'en' ? '1 guest' : '1 ضيف'}</option>
                      <option value={2}>{language === 'en' ? '2 guests' : '2 ضيوف'}</option>
                      <option value={3}>{language === 'en' ? '3 guests' : '3 ضيوف'}</option>
                      <option value={4}>{language === 'en' ? '4 guests' : '4 ضيوف'}</option>
                    </select>
                  </div>
                  <div className="info-box">
                    <span>{language === 'en' ? 'Nights' : 'عدد الليالي'}</span>
                    <strong>{language === 'en' ? `${stayNights} nights` : `${stayNights} ليلة`}</strong>
                  </div>
                </div>

                <div className="calendar-picker" dir={language === 'en' ? 'ltr' : 'rtl'}>
                  <div className="calendar-header">
                    <button type="button" className="calendar-arrow" onClick={() => setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <strong>{monthFormatter.format(monthDate)}</strong>
                    <button type="button" className="calendar-arrow" onClick={() => setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>

                  <div className="calendar-weekdays">
                    {calendarWeekdays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="calendar-grid">
                    {visibleDates.map((date) => {
                      const dateString = date.toISOString().slice(0, 10)
                      const isCurrentMonth = date.getMonth() === monthDate.getMonth()
                      const isSelected = isSameDay(date, new Date(bookingDates.checkIn)) || isSameDay(date, new Date(bookingDates.checkOut))
                      const inRange = isWithinRange(date, bookingDates.checkIn, bookingDates.checkOut)

                      return (
                        <button
                          key={dateString}
                          type="button"
                          className={[
                            'calendar-day',
                            isCurrentMonth ? '' : 'muted',
                            isSelected ? 'selected' : '',
                            inRange ? 'in-range' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => handleCalendarDateSelect(dateString)}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="checkout-actions">
                  <button type="button" className="secondary-button" onClick={() => navigate('details')}>
                    {language === 'en' ? 'Back' : 'رجوع'}
                  </button>
                  <button type="button" className="primary-button" onClick={() => setBookingStep(2)}>
                    {language === 'en' ? 'Continue' : 'متابعة'}
                  </button>
                </div>
              </>
            )}

            {bookingStep === 2 && (
              <>
                <div className="guest-form-grid">
                  <label>
                    <span>{language === 'en' ? 'Full name' : 'الاسم الكامل'}</span>
                    <input
                      type="text"
                      value={guestForm.fullName}
                      onChange={(event) => setGuestForm((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder={language === 'en' ? 'Your name' : 'اسمك'}
                    />
                  </label>
                  <label>
                    <span>{language === 'en' ? 'Phone' : 'رقم الهاتف'}</span>
                    <input
                      type="tel"
                      value={guestForm.phone}
                      onChange={(event) => setGuestForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder={language === 'en' ? '+966...' : '+966...'}
                    />
                  </label>
                  <label>
                    <span>{language === 'en' ? 'Email' : 'البريد الإلكتروني'}</span>
                    <input
                      type="email"
                      value={guestForm.email}
                      onChange={(event) => setGuestForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label className="full-width">
                    <span>{language === 'en' ? 'Notes' : 'ملاحظات'}</span>
                    <textarea
                      rows="4"
                      value={guestForm.notes}
                      onChange={(event) => setGuestForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder={language === 'en' ? 'Any arrival notes or preferences' : 'أي ملاحظات أو تفضيلات الوصول'}
                    />
                  </label>
                </div>

                <div className="checkout-actions">
                  <button type="button" className="secondary-button" onClick={() => setBookingStep(1)}>
                    {language === 'en' ? 'Back' : 'رجوع'}
                  </button>
                  <button type="button" className="primary-button" onClick={() => setBookingStep(3)}>
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
                    <span className="material-symbols-outlined text-sm">group_work</span>
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
                    <input type="radio" name="payment" checked={paymentMethod === 'instapay'} onChange={() => setPaymentMethod('instapay')} />
                  </label>

                  {paymentMethod === 'instapay' && (
                    <div className="payment-subpanel">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'en' ? 'Your InstaPay IPA Address / Mobile' : 'عنوان الدفع اللحظي (IPA) أو رقم الهاتف'}
                      </label>
                      <input
                        type="text"
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
                    <input type="radio" name="payment" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                  </label>

                  {paymentMethod === 'wallet' && (
                    <div className="payment-subpanel">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'en' ? 'Wallet Mobile Number' : 'رقم الهاتف المسجل بالمحفظة'}
                      </label>
                      <input
                        type="tel"
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
                    <input type="radio" name="payment" checked={paymentMethod === 'fawry'} onChange={() => setPaymentMethod('fawry')} />
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
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  </label>

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
                      <strong>{bookingDates.guests} {language === 'en' ? (bookingDates.guests === 1 ? 'guest' : 'guests') : 'ضيف'}</strong>
                    </div>
                    <div className="meta-tile accent">
                      <small>{language === 'en' ? 'Nights' : 'الليالي'}</small>
                      <strong>{stayNights} {language === 'en' ? (stayNights === 1 ? 'night' : 'nights') : 'ليلة'}</strong>
                    </div>
                  </div>

                  <div className="booking-price-list">
                    {bookingBreakdown.map((item, index) => (
                      <div key={`${item.label}-${index}`} className={item.total ? 'booking-price-row total' : 'booking-price-row'}>
                        <span>{item.label}</span>
                        <strong>{formatCurrency(item.value, selectedProperty.currency, language)}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="checkout-actions">
                  <button type="button" className="secondary-button" onClick={() => setBookingStep(2)}>
                    {language === 'en' ? 'Back' : 'رجوع'}
                  </button>
                  <button className="primary-button" onClick={handleBookingConfirm} disabled={isProcessingPayment}>
                    {isProcessingPayment ? (language === 'en' ? 'Processing payment...' : 'جارٍ تجهيز الدفع...') : activeText.confirmPayment}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    )
  }

  const renderSuccessPage = () => {
    const currentBooking = lastBooking ?? bookings[0]

    return (
      <div className="page-shell success-shell">
        <div className="success-card">
          <div className="success-icon" aria-hidden="true"></div>
          <h2>{language === 'en' ? 'Booking confirmed successfully' : 'تم تأكيد الحجز بنجاح'}</h2>
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

          <div className="success-actions">
            <button className="primary-button" onClick={() => setSelectedInvoiceBooking(currentBooking)}>
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              <span>{language === 'en' ? 'Official Invoice' : 'الفاتورة الرسمية'}</span>
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

  useEffect(() => {
    if (activePage === 'notifications') {
      markAllNotificationsRead()
    }
  }, [activePage])

  const renderNotificationsPage = () => {
    return (
      <div className="page-shell notifications-shell">
        <div className="notification-toolbar">
          <button type="button" className="secondary-button small-button" onClick={markAllNotificationsRead}>
            {language === 'en' ? 'Mark all as read' : 'تحديد الكل كمقروء'}
          </button>
        </div>

        <div className="notification-list-page">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification-item-page ${notification.type} ${notification.read ? 'read' : 'unread'}`}>
              {!notification.read && <span className="notification-dot" aria-hidden="true" />}
              <div className="notification-icon-wrap">
                <span className="material-symbols-outlined">
                  {notification.type === 'success' ? 'check_circle' : notification.type === 'warning' ? 'schedule' : 'info'}
                </span>
              </div>
              <div className="notification-copy">
                <strong>{notification.title}</strong>
                <p>{notification.detail}</p>
                <small>{notification.time}</small>
              </div>
              <button type="button" className="notification-delete" onClick={() => removeNotification(notification.id)} aria-label={language === 'en' ? 'Delete notification' : 'حذف الإشعار'}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderBookingsPage = () => {
    const bookingTabs = [
      { id: 'upcoming', label: language === 'en' ? 'Upcoming' : 'القادمة' },
      { id: 'past', label: language === 'en' ? 'Past' : 'السابقة' },
      { id: 'cancelled', label: language === 'en' ? 'Cancelled' : 'الملغاة' },
    ]

    const normalizeBookingStatus = (status) => {
      const nextStatus = String(status || '').trim().toLowerCase()
      if (nextStatus === 'confirmed') return 'confirmed'
      if (nextStatus === 'cancelled') return 'cancelled'
      return 'pending'
    }

    const safeBookings = Array.isArray(bookings) ? bookings.filter(Boolean) : []

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
    })

    return (
      <div className="page-shell bookings-shell">
        <div className="segmented-control">
          {bookingTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={bookingFilter === tab.id ? 'is-active' : ''}
              onClick={() => setBookingFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
              const property = properties.find((item) => item.id === booking?.propertyId) ?? selectedProperty

              const checkInVal = booking?.checkIn || ''
              const checkOutVal = booking?.checkOut || booking?.checkIn || ''
              const nights = (checkInVal && checkOutVal && !Number.isNaN(new Date(checkInVal).getTime()) && !Number.isNaN(new Date(checkOutVal).getTime()))
                ? Math.max(1, Math.round((new Date(checkOutVal) - new Date(checkInVal)) / (1000 * 60 * 60 * 24)))
                : 1

              const perNight = booking?.total && nights ? Math.round(Number(booking.total) / nights) : (property?.priceValue || 0)

              const displayDateRange = checkInVal || checkOutVal
                ? `${booking?.checkIn ? formatDate(booking.checkIn, language) : '—'} ${language === 'en' ? 'to' : 'إلى'} ${booking?.checkOut ? formatDate(booking.checkOut, language) : '—'}`
                : '—'

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
                        <p>{getPropertyLocation(property) || booking.location || (language === 'en' ? 'Location not available' : 'موقع غير متوفر')}</p>
                      </div>
                      <div className="rating-chip small">
                        <span className="material-symbols-outlined">star</span>
                        <span>{property?.rating ?? 4.8}</span>
                      </div>
                    </div>

                    <div className="booking-footer">
                      <div className="booking-details">
                        <small>
                          {displayDateRange} • {nights} {language === 'en' ? (nights === 1 ? 'night' : 'nights') : 'ليلة'}
                        </small>
                        <div className="booking-pricing">
                          <span className="per-night">{formatCurrency(perNight, booking.currency || property?.currency || 'EGP', language)} {language === 'en' ? '/ night' : '/ ليلة'}</span>
                          <strong className="booking-total">{formatCurrency(Number(booking.total || (perNight * nights)), booking.currency || property?.currency || 'EGP', language)}</strong>
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button
                          className="primary-button small-button booking-cta"
                          onClick={() => navigate('details', property ?? selectedProperty)}
                        >
                          {language === 'en' ? 'Details' : 'تفاصيل'}
                        </button>

                        <button
                          type="button"
                          className="secondary-button small-button booking-receipt"
                          onClick={() => setSelectedInvoiceBooking(booking)}
                          title={language === 'en' ? 'View Invoice' : 'عرض الفاتورة'}
                        >
                          {language === 'en' ? 'Invoice' : 'الفاتورة'}
                        </button>

                        {normalizedStatus !== 'cancelled' && (
                          <>
                            <button className="secondary-button small-button booking-edit" onClick={() => { setSelectedProperty(property); setBookingDates({ checkIn: booking.checkIn || '', checkOut: booking.checkOut || '', guests: booking.guests || 1 }); navigate('checkout'); }}>
                              {language === 'en' ? 'Edit' : 'تعديل'}
                            </button>

                            <button className="secondary-button small-button booking-cancel" onClick={() => handleCancelBooking(booking.id)}>
                              {language === 'en' ? 'Cancel' : 'إلغاء'}
                            </button>
                          </>
                        )}
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
              <strong>{bookings.length || 0}</strong>
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
      <div className="settings-card">
        <div className="settings-header">
          <div className="avatar-wrap small-avatar">
            <img src={user?.avatar || 'https://via.placeholder.com/96'} alt="مالك العقارات" />
          </div>
          <div>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="setting-box">
            <span>الدور</span>
            <strong>مالك عقارات</strong>
          </div>
          <div className="setting-box">
            <span>حالة الاتصال</span>
            <strong>{hasSupabaseConnection ? 'متصل بـ Supabase' : 'وضع تجريبي محلي'}</strong>
          </div>
          <div className="setting-box wide-setting">
            <span>مفتاح المشروع</span>
            <strong>{hasSupabaseConnection ? 'تمت تهيئة البيئة بنجاح' : 'أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY'}</strong>
          </div>
        </div>

        <div className="settings-actions">
          <button className="primary-button" onClick={() => navigate('owner')}>
            العودة للوحة التحكم
          </button>
          <button className="secondary-button" onClick={handleLogout}>
            تسجيل الخروج
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
          onBackToLogin={() => setCurrentAuthPage('login')}
          onSwitchToSignup={() => setCurrentAuthPage('signup')}
        />
      )
    }

    if (currentAuthPage === 'reset') {
      return (
        <ResetPasswordPage
          language={language}
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
        <MarketingPage
          language={language}
          onOpenLogin={handleMarketingOpenLogin}
          onBrowseGuest={handleMarketingBrowseGuest}
        />
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
      />
    )
  }

  const renderPageContent = () => {
    if (activePage === 'notifications') return renderNotificationsPage()
    if (isOwner && activePage === 'owner-settings') return renderOwnerSettingsPage()
    if (isOwner && (activePage === 'owner' || activePage === 'dashboard' || activePage === 'home')) {
      return renderOwnerPage()
    }
    if (activePage === 'dashboard') {
      return (
        <DashboardPage
          user={user}
          bookings={bookings}
          properties={properties}
          language={language}
          onNavigate={navigate}
          onLogout={handleLogout}
          onSupportRequest={handleSupportRequest}
        />
      )
    }
    if (activePage === 'home') {
      return renderHomePage()
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
    if (activePage === 'checkout') return renderCheckoutPage()
    if (activePage === 'success') return renderSuccessPage()
    if (activePage === 'bookings') return renderBookingsPage()
    if (activePage === 'profile') return (
      <ProfilePage
        user={user || effectiveUser}
        language={language}
        onEdit={() => navigate('profile-edit')}
        onToggleLanguage={handleLanguageToggle}
      />
    )

    return renderProfilePage()
  }

  const dashboardPageKey = isOwner ? 'owner' : 'dashboard'

  const bottomNavItems = [
    {
      key: dashboardPageKey,
      label: language === 'en' ? 'Dashboard' : 'لوحة التحكم',
      icon: 'dashboard',
    },
    {
      key: 'home',
      label: language === 'en' ? 'Home' : 'الرئيسية',
      icon: 'home',
    },
    {
      key: 'bookings',
      label: language === 'en' ? 'Bookings' : 'حجوزاتي',
      icon: 'calendar_month',
    },
    {
      key: 'profile',
      label: language === 'en' ? 'Profile' : 'الملف الشخصي',
      icon: 'person',
    },
  ]

  const renderInvoiceModal = () => {
    if (!selectedInvoiceBooking) return null

    const b = selectedInvoiceBooking
    const prop = properties.find((p) => p.id === b.propertyId) || selectedProperty || {}
    const checkInDate = b.checkIn ? new Date(b.checkIn) : new Date()
    const checkOutDate = b.checkOut ? new Date(b.checkOut) : new Date(Date.now() + 86400000)
    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)))
    const pricePerNight = b.total ? Math.round(Number(b.total) / (nights * 1.08)) : (prop.priceValue || 1000)
    const subtotal = pricePerNight * nights
    const serviceFee = Math.round(subtotal * 0.08)
    const totalAmount = Number(b.total) || (subtotal + serviceFee)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
        <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-900 dark:text-slate-100 my-8">
          <button
            type="button"
            className="absolute top-5 left-5 md:top-6 md:left-6 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            onClick={() => setSelectedInvoiceBooking(null)}
            aria-label={language === 'en' ? 'Close' : 'إغلاق'}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Hajzy</span>
                <span className="text-sm font-bold text-slate-400">| حجزي</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{language === 'en' ? 'Official Booking Receipt & Invoice' : 'فاتورة وسند حجز إلكتروني رسمي'}</p>
            </div>
            <div className="text-end">
              <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {language === 'en' ? 'CONFIRMED' : 'حجز مؤكد'}
              </span>
              <div className="text-xs text-slate-500 font-mono mt-1">{b.reference || '#REF-78921'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">{language === 'en' ? 'Guest Information' : 'بيانات الضيف'}</span>
              <div className="font-bold text-base">{b.guestName || user?.name || (language === 'en' ? 'Verified Guest' : 'ضيف مؤكد')}</div>
              <div className="text-xs text-slate-500">{b.guestEmail || user?.email || '-'}</div>
              <div className="text-xs text-slate-500">{b.guestPhone || user?.phone || '+20 10...'}</div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold">{language === 'en' ? 'Property & Dates' : 'بيانات الإقامة والتواريخ'}</span>
              <div className="font-bold text-base">{b.title || prop.title || 'إقامة فاخرة'}</div>
              <div className="text-xs text-slate-500">{b.location || prop.location || 'مصر'}</div>
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {formatDate(b.checkIn || new Date())} ← {formatDate(b.checkOut || new Date())} ({nights} {language === 'en' ? (nights === 1 ? 'night' : 'nights') : 'ليالٍ'})
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 mb-6">
            <div className="flex justify-between text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
              <span>{language === 'en' ? 'Description' : 'البيان'}</span>
              <span>{language === 'en' ? 'Amount' : 'المبلغ'}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{language === 'en' ? `Accommodation (${nights} nights)` : `تكلفة الإقامة (${nights} ليالٍ)`}</span>
                <span>{formatCurrency(subtotal, b.currency || 'EGP')}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Platform & Service Fee (8%)' : 'رسوم الخدمة والتأمين (8%)'}</span>
                <span>{formatCurrency(serviceFee, b.currency || 'EGP')}</span>
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

          <div className="flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-300 dark:border-slate-700">
                📱
              </div>
              <div>
                <strong className="block text-slate-700 dark:text-slate-300">{language === 'en' ? 'Verified Electronic Voucher' : 'سند إلكتروني معتمد'}</strong>
                <span>{language === 'en' ? 'Present this invoice upon arrival for instant check-in' : 'أظهر هذه الفاتورة عند الوصول لتسجيل الدخول الفوري'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelectedInvoiceBooking(null)}
            >
              {language === 'en' ? 'Close' : 'إغلاق'}
            </button>
            <button
              type="button"
              className="primary-button flex items-center gap-2"
              onClick={() => window.print()}
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>{language === 'en' ? 'Print Invoice' : 'طباعة الفاتورة'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const notificationLabel = language === 'en' ? 'Notifications' : 'الإشعارات'
  const topBarTitle =
    activePage === 'home' || activePage === dashboardPageKey || activePage === 'owner'
      ? 'Hajzy'
      : isOwner
        ? pageTitlesByLanguage[language][activePage] || pageTitlesByLanguage[language].owner
        : pageTitlesByLanguage[language][activePage] || pageTitlesByLanguage[language].dashboard

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

  return (
  <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <div className="topbar-inner">
          {activePage !== 'home' && activePage !== 'dashboard' && activePage !== 'profile' ? (
            <button className="icon-button" aria-label="العودة" onClick={() => navigate(isOwner ? 'owner' : 'home')}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <div className="topbar-ghost" aria-hidden="true" />
          )}

          <h1 className="topbar-brand topbar-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate(isOwner ? 'owner' : 'home')}>
            {topBarTitle === 'Hajzy' ? (
              <>
                <Logo size={30} showText={false} />
                <span>Hajzy</span>
              </>
            ) : (
              topBarTitle
            )}
          </h1>

          <div className="topbar-actions flex items-center gap-1.5">
            <button
              type="button"
              className="icon-button"
              aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label={language === 'en' ? 'العربية' : 'English'}
              title={language === 'en' ? 'العربية' : 'English'}
              onClick={handleLanguageToggle}
            >
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
              <span className="notification-badge">{unreadNotificationsCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="content-wrap" ref={mainRef}>
        {/* Pull-to-refresh indicator hint */}
        {(pullDistance > 8 || refreshing) && (
          <div className="pull-indicator" aria-hidden="true">
            <div className="dot" style={{ transform: `translateY(${Math.min(pullDistance, 40)}px)` }} />
            <small>{refreshing ? (language === 'en' ? 'Refreshing...' : 'جارٍ التحديث...') : (language === 'en' ? 'Pull to refresh' : 'اسحب للتحديث')}</small>
          </div>
        )}

        {isLoadingData ? (
          // Show page-level skeletons while loading
          <div style={{ padding: 16 }}>
            <Skeleton type="home" count={6} />
          </div>
        ) : (
          renderPageContent()
        )}
      </main>

      {renderInvoiceModal()}

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

      <nav className="bottom-nav" aria-label="التنقل الرئيسي">
        {bottomNavItems.map((item) => (
          <button
            key={item.key}
            className={activePage === item.key ? 'nav-item active' : 'nav-item'}
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
        ))}
      </nav>
    </div>
  )
}

export default App

