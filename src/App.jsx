import { useEffect, useState, useRef } from 'react'
import './App.css'
import i18n from './i18n'
import { useAuth } from './hooks/useAuth'
import Skeleton from './components/Skeleton'
import usePullToRefresh from './hooks/usePullToRefresh'
import ExampleCard from './components/ExampleCard'
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
import {
  addBooking,
  addChatMessage,
  addProperty,
  createPaymentSession,
  deleteBooking,
  deleteProperty,
  fetchBookings,
  fetchChatMessages,
  fetchProperties,
  fetchPropertiesByOwner,
  hasSupabaseConnection,
  propertySeed,
  updateBooking,
  updateProperty,
} from './lib/dataService'

const filterOptions = [
  { id: 'all', label: 'الكل' },
  { id: 'الإسكندرية', label: 'الإسكندرية' },
  { id: 'القاهرة', label: 'القاهرة' },
  { id: 'الجيزة', label: 'الجيزة' },
  { id: 'الغردقة', label: 'الغردقة' },
  { id: 'شرم الشيخ', label: 'شرم الشيخ' },
]

const destinationOptions = ['الإسكندرية', 'القاهرة', 'الجيزة', 'الغردقة', 'شرم الشيخ']

const pageTitles = {
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

const formatCurrency = (amount, currency = 'EGP') => {
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ar-EG'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ar-EG'

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

const translations = {
  ar: {
    homeTitle: 'استكشف إقامات حجزي الفاخرة في مصر',
    welcome: 'مرحباً بك',
    searchPlaceholder: 'ابحث عن شقتك المثالية...',
    results: 'نتيجة',
    resultsPlural: 'نتائج',
    favorite: 'إضافة للمفضلة',
    bookNow: 'احجز الآن',
    nightly: '/ ليلة',
    description: 'وصف العقار',
    amenities: 'المزايا',
    checkoutTitle: 'تأكيد الحجز',
    paymentMethod: 'طريقة الدفع',
    total: 'الإجمالي',
    confirmPayment: 'تأكيد الدفع',
    chat: 'الدردشة',
    send: 'إرسال',
    typeMessage: 'اكتب رسالتك...',
    language: 'English',
    propertyAdded: 'تمت إضافة الشقة بنجاح',
  },
  en: {
    homeTitle: "Discover Hajzy's luxury stays in Egypt",
    welcome: 'Welcome back',
    searchPlaceholder: 'Search for your perfect stay...',
    results: 'result',
    resultsPlural: 'results',
    favorite: 'Add to favorites',
    bookNow: 'Book now',
    nightly: '/ night',
    description: 'Property description',
    amenities: 'Amenities',
    checkoutTitle: 'Confirm booking',
    paymentMethod: 'Payment method',
    total: 'Total',
    confirmPayment: 'Confirm payment',
    chat: 'Chat',
    send: 'Send',
    typeMessage: 'Type your message...',
    language: 'العربية',
    propertyAdded: 'Property added successfully',
  },
}

function App() {
  const t = i18n.t.bind(i18n)
  const { user, loading, isAuthenticated, login, signup, logout } = useAuth()
  const [activePage, setActivePage] = useState('home')
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [currentAuthPage, setCurrentAuthPage] = useState('landing')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('stitch_favorites')
    return savedFavorites ? JSON.parse(savedFavorites) : []
  })
  const [lastBooking, setLastBooking] = useState(null)
  // Default dates: check-in = tomorrow, check-out = day after tomorrow
  const _tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); })()
  const _dayAfter = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().slice(0,10); })()

  const [bookingDates, setBookingDates] = useState({
    checkIn: _tomorrow,
    checkOut: _dayAfter,
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
  const [toast, setToast] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
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
    destination: 'الإسكندرية',
    checkIn: _tomorrow,
    checkOut: _dayAfter,
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
    localStorage.setItem('hajzy-language', nextLanguage)
  }, [i18n, language])

  useEffect(() => {
    try {
      localStorage.removeItem('hajzy-theme')
    } catch (err) {
      // ignore
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [propertyList, bookingList] = await Promise.all([fetchProperties(), fetchBookings()])
        if (isMounted) {
          const safePropertyList = Array.isArray(propertyList) && propertyList.length ? propertyList : propertySeed
          const safeBookingList = Array.isArray(bookingList) && bookingList.length ? bookingList : []

          if (!Array.isArray(propertyList) || !propertyList.length) {
            localStorage.setItem('stitch_properties', JSON.stringify(propertySeed))
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
        localStorage.setItem('stitch_properties', JSON.stringify(propertySeed))
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
    localStorage.setItem('stitch_favorites', JSON.stringify(favorites))
  }, [favorites])

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

  const handleLogin = async (email, password, guest = false) => {
    if (guest || email?.guest) {
      setIsGuestMode(true)
      setCurrentAuthPage('login')
      setActivePage('home')
      return { id: 'guest', name: '', email: 'guest@example.com' }
    }
    
    const authUser = await login(email, password)
    if (authUser) {
      setCurrentAuthPage('login')
      setActivePage('home')
      return authUser
    }
    return null
  }

  const handleSocialLogin = async (provider) => {
    setIsGuestMode(true)
    setCurrentAuthPage('login')
    setActivePage('home')
    const providerNames = {
      google: 'Google',
      apple: 'Apple',
      github: 'GitHub',
    }
    showToast(language === 'en' ? `${providerNames[provider] || 'Account'} quick access enabled` : `تم تسجيل الدخول السريع عبر ${providerNames[provider] || 'الحساب'}`)
    return { id: `social-${provider}`, name: '', email: `${provider}@hajzy.local`, role: 'user' }
  }

  const handleSignup = async (email, password, name) => {
    const authUser = await signup(email, password, name)
    if (authUser) {
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
      setCurrentAuthPage('login')
      setActivePage('home')
      return
    }

    logout()
    setCurrentAuthPage('login')
    setActivePage('home')
  }

  const handleLanguageToggle = () => {
    setLanguage((currentLanguage) => (currentLanguage === 'ar' ? 'en' : 'ar'))
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

  const toggleFavorite = (propertyId) => {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(propertyId)
        ? currentFavorites.filter((id) => id !== propertyId)
        : [...currentFavorites, propertyId],
    )
  }

  const showToast = (message) => {
    if (!message) return
    setToast(message)
    setOwnerNotice(message)
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
      const matchesSearch =
        !normalizedSearch ||
        property.title.toLowerCase().includes(normalizedSearch) ||
        property.location.toLowerCase().includes(normalizedSearch) ||
        property.city.toLowerCase().includes(normalizedSearch)

      const selectedCity = activeFilter !== 'all' ? activeFilter : homeQuickSearch.destination
      const matchesFilter = !selectedCity || selectedCity === 'all' || property.city === selectedCity
      const matchesGuests = Number(property.guests || 2) >= Number(homeQuickSearch.guests || 1)
      const matchesDates = !homeQuickSearch.checkIn || !homeQuickSearch.checkOut || true
      const matchesPrice = Number(property.priceValue || 0) <= Number(homeFilters.maxPrice || 8000)
      const matchesRating = Number(property.rating || 0) >= Number(homeFilters.ratingMin || 0)
      const matchesType =
        homeFilters.type === 'all' ||
        (() => {
          const typeText = `${property.title} ${property.details.join(' ')}`.toLowerCase()
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
      const matchesAmenities =
        homeFilters.amenities.length === 0 ||
        homeFilters.amenities.every((amenity) =>
          property.amenities.some((item) => item.toLowerCase().includes(amenity.toLowerCase())),
        )

      return (
        matchesSearch &&
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
  const handleSendMessage = async () => {
    const trimmedMessage = chatInput.trim()
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
    setChatInput('')

    setTimeout(() => {
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          propertyId: selectedProperty.id,
          sender: 'owner',
          text: language === 'en' ? 'Thank you, we will reply shortly.' : 'شكرًا لك، سنرد عليك قريبًا.',
          createdAt: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }, 400)
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
              <img src={property.image} alt={property.title} />
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
              <img src={property.image} alt={property.title} />
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
                <img src={booking.image} alt={booking.title} />
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

  const destinationCards = [
    {
      city: 'الإسكندرية',
      label: language === 'en' ? 'Sea breeze' : 'نسيم البحر',
      price: 'من 1,250 ج.م',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    },
    {
      city: 'القاهرة',
      label: language === 'en' ? 'Culture & design' : 'ثقافة وتصميم',
      price: 'من 1,850 ج.م',
      image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=900&q=80',
    },
    {
      city: 'الغردقة',
      label: language === 'en' ? 'Red Sea luxury' : 'فخامة البحر الأحمر',
      price: 'من 2,300 ج.م',
      image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80',
    },
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
              <button type="button" className="primary-button hero-cta" onClick={() => navigate('home')}>
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
                    dir="rtl"
                    value={homeQuickSearch.destination}
                    onChange={(event) => {
                      const nextDestination = event.target.value
                      setHomeQuickSearch((current) => ({ ...current, destination: nextDestination }))
                      setActiveFilter(nextDestination || 'all')
                    }}
                  >
                    <option value="">{language === 'en' ? 'Any city' : 'أي مدينة'}</option>
                    {destinationOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
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
                    dir="rtl"
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
                    dir="rtl"
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
                    dir="rtl"
                    value={homeQuickSearch.guests}
                    onChange={(event) => setHomeQuickSearch((current) => ({ ...current, guests: Number(event.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((guest) => (
                      <option key={guest} value={guest}>{guest} {language === 'en' ? 'guest(s)' : 'ضيف'}</option>
                    ))}
                  </select>
                </div>
              </label>
              <button
                type="button"
                className="primary-button search-submit-button"
                onClick={() => setActiveFilter(homeQuickSearch.destination || 'all')}
              >
                {language === 'en' ? 'Search' : 'ابحث'}
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
                    <strong>{formatCurrency(homeFilters.maxPrice, 'EGP')}</strong>
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
                    {['Wi‑Fi', 'Parking', 'Pool', 'Sea View', 'Breakfast', 'Air Conditioning'].map((amenity) => (
                      <label key={amenity} className="amenity-toggle">
                        <input
                          type="checkbox"
                          checked={homeFilters.amenities.includes(amenity)}
                          onChange={() => toggleAmenityFilter(amenity)}
                        />
                        <span>{amenity}</span>
                      </label>
                    ))}
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
              key={item.city}
              type="button"
              className="mini-city-card"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.28)), url(${item.image})` }}
              onClick={() => {
                setHomeQuickSearch((current) => ({ ...current, destination: item.city }))
                setActiveFilter(item.city)
              }}
            >
              <span>{item.city}</span>
              <small>{item.label}</small>
              <strong>{item.price}</strong>
            </button>
          ))}
        </div>

        {filteredProperties.length > 0 && (
          <div className="home-section-head">
            <div className="home-section-title-wrap">
              <h3>{language === 'en' ? 'Most booked this week' : 'الأكثر حجزًا هذا الأسبوع'}</h3>
              <span className="home-results-pill">
                {filteredProperties.length} {filteredProperties.length === 1 ? activeText.result : activeText.resultsPlural}
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
                    aria-label={property.title}
                  >
                    <small>{formatCurrency(property.priceValue, property.currency)}</small>
                  </button>
                )
              })}
            </div>

            {selectedMapProperty && (
              <div className="map-property-highlight">
                <img src={selectedMapProperty.image} alt={selectedMapProperty.title} />
                <div className="map-property-copy">
                  <span>{selectedMapProperty.city}</span>
                  <strong>{selectedMapProperty.title}</strong>
                  <small>{formatCurrency(selectedMapProperty.priceValue, selectedMapProperty.currency)} / {language === 'en' ? 'night' : 'ليلة'}</small>
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
                <img src={property.image} alt={property.title} />
                <div>
                  <span>{property.city}</span>
                  <strong>{property.title}</strong>
                  <small>{formatCurrency(property.priceValue, property.currency)} / {language === 'en' ? 'night' : 'ليلة'}</small>
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
                setHomeQuickSearch((current) => ({ ...current, destination: option.id === 'all' ? '' : option.id }))
                setActiveFilter(option.id)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filteredProperties.length === 0 ? (
        <div className="empty-state">
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
                <img src={property.image} alt={property.title} />
                <button
                  className={favorites.includes(property.id) ? 'favorite-button active' : 'favorite-button'}
                  aria-label={language === 'en' ? 'Add to favorites' : 'إضافة للمفضلة'}
                  onClick={() => toggleFavorite(property.id)}
                >
                  <span className="material-symbols-outlined">
                    {favorites.includes(property.id) ? 'favorite' : 'favorite_border'}
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
                  <span className="property-badge">إقامة فاخرة</span>
                  <span className="property-availability">متاح الآن</span>
                </div>

                <div className="title-block">
                  <h3>{property.title}</h3>
                  <p>
                    <span className="material-symbols-outlined">location_on</span>
                    {property.location}
                  </p>
                </div>

                <div className="property-meta-row">
                  <span><span className="material-symbols-outlined">bed</span> 2 غرف</span>
                  <span><span className="material-symbols-outlined">wifi</span> Wi‑Fi</span>
                  <span><span className="material-symbols-outlined">local_parking</span> موقف</span>
                </div>

                <div className="tag-row">
                  {property.details.map((detail, index) => (
                    <span key={`${detail}-${index}`}>{detail}</span>
                  ))}
                </div>

                <div className="price-row">
                  <div className="price-box">
                    <strong>{formatCurrency(property.priceValue, property.currency)}</strong>
                    <span>{activeText.nightly}</span>
                  </div>

                  <button className="primary-button" onClick={() => navigate('details', property)}>
                    {activeText.bookNow}
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

    const galleryImages = [
      selectedProperty.image,
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    ].slice(0, 8)

    const guestReviews = [
      { name: 'سارة م.', rating: 5, text: 'الاستقبال ممتاز، الشقة فاخرة جدًا والهدوء رائع.', trip: 'إقامة 3 ليالٍ' },
      { name: 'محمد ع.', rating: 5, text: 'الموقع مثالي، وسهولة الوصول للمتنزهات ومقاهي المدينة كانت مميزة.', trip: 'عائلة' },
      { name: 'ليلى ج.', rating: 4, text: 'المنظر جميل جدًا والتجهيز أنيق، والمالك سريع جدًا في الرد.', trip: 'رحلة عمل' },
    ]

    const propertyPricePreview = [
      { label: language === 'en' ? 'Price per night' : 'السعر لكل ليلة', value: formatCurrency(selectedProperty.priceValue, selectedProperty.currency) },
      { label: language === 'en' ? 'Stay length' : 'مدة الإقامة', value: language === 'en' ? `${stayNights} nights` : `${stayNights} ليلة` },
      { label: language === 'en' ? 'Estimated total' : 'الإجمالي المتوقع', value: formatCurrency(grandTotal, selectedProperty.currency) },
    ]

    const mapCenter = selectedProperty.coordinates || { lat: 30.0333, lng: 31.2333 }
    const mapPadding = 0.02
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - mapPadding}%2C${mapCenter.lat - mapPadding}%2C${mapCenter.lng + mapPadding}%2C${mapCenter.lat + mapPadding}&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lng}`

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

          <img src={galleryImages[selectedGalleryIndex] || galleryImages[0]} alt={selectedProperty.title} />

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
            className={favorites.includes(selectedProperty.id) ? 'gallery-fav active' : 'gallery-fav'}
            aria-label={language === 'en' ? 'Add to favorites' : 'إضافة للمفضلة'}
            onClick={() => toggleFavorite(selectedProperty.id)}
          >
            <span className="material-symbols-outlined">{favorites.includes(selectedProperty.id) ? 'favorite' : 'favorite_border'}</span>
          </button>

          <div className="gallery-index-badge">{selectedGalleryIndex + 1} / {galleryImages.length}</div>

          <div className="gallery-price-overlay">
            <div className="gallery-price-left">
              <small>{language === 'en' ? 'From' : 'من'}</small>
              <strong>{formatCurrency(selectedProperty.priceValue, selectedProperty.currency)}</strong>
              <span className="muted">{language === 'en' ? '/ night' : ' / ليلة'}</span>
            </div>
            <div className="gallery-price-right">
              <small>{language === 'en' ? 'Estimated total' : 'الإجمالي المتوقع'}</small>
              <strong>{formatCurrency(grandTotal, selectedProperty.currency)}</strong>
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
              <img src={image} alt={`${selectedProperty.title} ${index + 1}`} />
            </button>
          ))}
        </div>

        <section className="details-card">
          <div className="details-header">
            <div>
              <h2>{selectedProperty.title}</h2>
              <p>
                <span className="material-symbols-outlined">location_on</span>
                {selectedProperty.location}
              </p>
            </div>
            <div className="rating-chip">
              <span className="material-symbols-outlined">star</span>
              <span>{selectedProperty.rating}</span>
            </div>
          </div>

          <div className="tag-row">
            {selectedProperty.details.map((detail, index) => (
              <span key={`${detail}-${index}`}>{detail}</span>
            ))}
          </div>

          <div className="price-action">
            <div>
              <small>السعر لكل ليلة</small>
              <strong>{formatCurrency(selectedProperty.priceValue, selectedProperty.currency)}</strong>
            </div>
            <button className="primary-button" onClick={() => navigate('checkout')}>
              احجز الآن
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
              <h3>الموقع والحي</h3>
              <span className="status-pill neutral">{selectedProperty.neighborhood || selectedProperty.city}</span>
            </div>
            <div className="map-visual detail-map-visual">
              <MapView coordinates={mapCenter} zoom={14} markerLabel={selectedProperty.title} />
              <div className="detail-map-actions">
                <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapCenter.lat + ',' + mapCenter.lng)}`}>
                  {language === 'en' ? 'Open in Maps' : 'افتح في الخرائط'}
                </a>
              </div>
            </div>
            <div className="detail-location-row">
              <span className="material-symbols-outlined">location_on</span>
              <div>
                <strong>{selectedProperty.city}</strong>
                <small>{selectedProperty.location}</small>
              </div>
            </div>
            <p>يقع العقار في {selectedProperty.location}، بالقرب من المحلات، المقاهي، والمناطق السياحية الأساسية، مع وصول سريع إلى أبرز المعالم في المنطقة.</p>
          </div>

          <div className="detail-similar-card">
            <div className="detail-card-head">
              <h3>عقارات مشابهة</h3>
              <button type="button" className="text-button" onClick={handleViewAllProperties}>عرض الكل</button>
            </div>
            <div className="similar-stays">
              {properties.slice(0, 3).map((property) => (
                <button key={property.id} type="button" className="similar-stay-item" onClick={() => navigate('details', property)}>
                  <img src={property.image} alt={property.title} />
                  <div>
                    <strong>{property.title}</strong>
                    <span>{property.location}</span>
                    <small>{formatCurrency(property.priceValue, property.currency)} / ليلة</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-trust-grid">
          <div className="detail-review-card">
            <div className="detail-card-head">
              <h3>تقييمات الضيوف</h3>
              <span className="rating-chip small"><span className="material-symbols-outlined">star</span>{selectedProperty.rating}</span>
            </div>
            <div className="review-score-box">
              <strong>{selectedProperty.rating}</strong>
              <span>من 5.0</span>
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
              <h3>المضيف</h3>
              <span className="status-pill neutral">متصل الآن</span>
            </div>
            <div className="host-summary">
              <div className="host-avatar">A</div>
              <div>
                <strong>أحمد القحطاني</strong>
                <small>مضيف موثوق • 4 سنوات</small>
              </div>
            </div>
            <ul className="host-details-list">
              <li><span className="material-symbols-outlined">check_circle</span>استجابة سريعة خلال 10 دقائق</li>
              <li><span className="material-symbols-outlined">shield</span>حجوزات موثقة وآمنة</li>
              <li><span className="material-symbols-outlined">support_agent</span>دعم طوال مدة الإقامة</li>
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
          <p>{selectedProperty.description}</p>
        </section>

        <section className="content-section amenity-grid">
          <h3>{activeText.amenities}</h3>
          <div className="amenities">
            {selectedProperty.amenities.map((amenity) => (
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
          <h3>سياسات الإقامة</h3>
          <ul className="policy-list">
            <li><span className="material-symbols-outlined">schedule</span>تسجيل الوصول من الساعة 3:00 مساءً</li>
            <li><span className="material-symbols-outlined">logout</span>تسجيل المغادرة حتى الساعة 12:00 ظهراً</li>
            <li><span className="material-symbols-outlined">pets</span>الحيوانات الأليفة مسموحة في بعض الوحدات</li>
            <li><span className="material-symbols-outlined">smoke_free</span>ممنوع التدخين داخل الوحدات</li>
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
              <div className="chat-compose">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={activeText.typeMessage}
                />
                <button type="button" className="primary-button" onClick={handleSendMessage}>
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

    return (
      <div className="page-shell checkout-shell">
        <section className="checkout-card">
          <div className="checkout-image">
            <img src={selectedProperty.image} alt={selectedProperty.title} />
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
                <h2>{selectedProperty.title}</h2>
                <p>{selectedProperty.location}</p>
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

                <div className="calendar-picker">
                  <div className="calendar-header">
                    <button type="button" className="calendar-arrow" onClick={() => setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <strong>{new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(monthDate)}</strong>
                    <button type="button" className="calendar-arrow" onClick={() => setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>

                  <div className="calendar-weekdays">
                    {['إثن', 'ثلاث', 'أرب', 'خم', 'جم', 'سب', 'حد'].map((day) => (
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
                      <span className="summary-kicker">Hajzy promise</span>
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

                <section className="payment-card compact-payment">
                  <h3>{activeText.paymentMethod}</h3>
                  <label className="payment-option">
                    <div className="label-wrap">
                      <span className="material-symbols-outlined">credit_card</span>
                      <span>{language === 'en' ? 'Credit card' : 'بطاقة ائتمان'}</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  </label>
                  <label className="payment-option">
                    <div className="label-wrap">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                      <span>{language === 'en' ? 'Digital wallet' : 'محفظة رقمية'}</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                  </label>
                  <label className="payment-option">
                    <div className="label-wrap">
                      <span className="material-symbols-outlined">currency_exchange</span>
                      <span>{language === 'en' ? 'Bank transfer' : 'تحويل بنكي'}</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                  </label>
                  <label className="payment-option">
                    <div className="label-wrap">
                      <span className="material-symbols-outlined">payments</span>
                      <span>{language === 'en' ? 'Cash on arrival' : 'الدفع عند الوصول'}</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  </label>
                </section>

                <section className="booking-summary-sheet compact-summary">
                  <div className="booking-summary-header">
                    <div>
                      <span className="summary-kicker">{language === 'en' ? 'Trip details' : 'تفاصيل الرحلة'}</span>
                      <h3>{selectedProperty.title}</h3>
                    </div>
                    <div className="summary-rating">
                      <span className="material-symbols-outlined">star</span>
                      <span>{selectedProperty.rating}</span>
                    </div>
                  </div>

                  <div className="booking-meta-grid">
                    <div className="meta-tile">
                      <small>{language === 'en' ? 'Check-in' : 'تاريخ الوصول'}</small>
                      <strong>{formatDate(bookingDates.checkIn)}</strong>
                    </div>
                    <div className="meta-tile">
                      <small>{language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}</small>
                      <strong>{formatDate(bookingDates.checkOut)}</strong>
                    </div>
                    <div className="meta-tile">
                      <small>{language === 'en' ? 'Guests' : 'الضيوف'}</small>
                      <strong>{bookingDates.guests} {language === 'en' ? 'guest(s)' : 'ضيف'}</strong>
                    </div>
                    <div className="meta-tile accent">
                      <small>{language === 'en' ? 'Nights' : 'الليالي'}</small>
                      <strong>{stayNights} {language === 'en' ? 'nights' : 'ليلة'}</strong>
                    </div>
                  </div>

                  <div className="booking-price-list">
                    {bookingBreakdown.map((item, index) => (
                      <div key={`${item.label}-${index}`} className={item.total ? 'booking-price-row total' : 'booking-price-row'}>
                        <span>{item.label}</span>
                        <strong>{formatCurrency(item.value, selectedProperty.currency)}</strong>
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
              <strong>{formatDate(currentBooking.checkIn)}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Check-out' : 'تاريخ المغادرة'}</span>
              <strong>{formatDate(currentBooking.checkOut)}</strong>
            </div>
            <div>
              <span>{language === 'en' ? 'Total amount' : 'إجمالي المبلغ'}</span>
              <strong>{formatCurrency(currentBooking.total, currentBooking.currency)}</strong>
            </div>
          </div>

          <div className="success-actions">
            <button className="primary-button" onClick={() => navigate('bookings')}>
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
                ? `${booking?.checkIn ? formatDate(booking.checkIn) : '—'} إلى ${booking?.checkOut ? formatDate(booking.checkOut) : '—'}`
                : '—'

              return (
                <article key={booking.id || `${booking.propertyId || 'booking'}-${index}`} className="booking-card">
                  <div className="booking-image">
                    <img src={booking.image || property?.image} alt={booking.title || property?.title || 'Booking'} />
                    <span className={`status ${normalizedStatus === 'confirmed' ? 'confirmed' : normalizedStatus === 'cancelled' ? 'cancelled' : 'pending'}`}>
                      {normalizedStatus === 'confirmed' ? 'مؤكدة' : normalizedStatus === 'cancelled' ? 'ملغية' : 'قيد المراجعة'}
                    </span>
                  </div>
                  <div className="booking-body">
                    <div className="booking-head">
                      <div>
                        <h3>{booking.title || property?.title || 'إقامة'}</h3>
                        <p>{booking.location || property?.location || 'موقع غير متوفر'}</p>
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
                          <span className="per-night">{formatCurrency(perNight, booking.currency || property?.currency || 'EGP')} {language === 'en' ? '/ night' : '/ ليلة'}</span>
                          <strong className="booking-total">{formatCurrency(Number(booking.total || (perNight * nights)), booking.currency || property?.currency || 'EGP')}</strong>
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button
                          className="primary-button small-button booking-cta"
                          onClick={() => navigate('details', property ?? selectedProperty)}
                        >
                          {language === 'en' ? 'Details' : 'تفاصيل'}
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
    const savedProperties = properties.filter((property) => favorites.includes(property.id))

    return (
      <div className="page-shell profile-shell">
        <section className="profile-header">
          <div className="avatar-wrap">
            <img src={user?.avatar || 'https://via.placeholder.com/96'} alt="صورة المستخدم" />
          </div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <small>{favorites.length} أماكن محفوظة</small>
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
                  <img src={property.image} alt={property.title} />
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
          <button className="profile-item">
            <span className="material-symbols-outlined">person</span>
            <span>{language === 'en' ? 'Personal info' : 'المعلومات الشخصية'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
          <button className="profile-item" onClick={() => navigate('home')}>
            <span className="material-symbols-outlined">favorite</span>
            <span>{language === 'en' ? 'Favorites' : 'المفضلة'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
          <button
            className="profile-item"
            onClick={() => document.getElementById('profile-settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>{language === 'en' ? 'Settings' : 'الإعدادات'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
          <button className="profile-item logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>{language === 'en' ? 'Log out' : 'تسجيل الخروج'}</span>
            <span className="material-symbols-outlined chevron">chevron_left</span>
          </button>
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
    if (isOwner) return renderOwnerPage()
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
    if (activePage === 'home') return renderHomePage()
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
        user={user}
        language={language}
        onEdit={() => navigate('profile-edit')}
        onToggleLanguage={handleLanguageToggle}
      />
    )

    return renderProfilePage()
  }

  const notificationLabel = language === 'en' ? 'Notifications' : 'الإشعارات'
  const navLabels = {
    dashboard: 'لوحة التحكم',
    home: 'الرئيسية',
    bookings: 'حجوزاتي',
    profile: 'الملف الشخصي',
  }
  const topBarTitle =
    activePage === 'home' || activePage === 'dashboard' || activePage === 'owner'
      ? 'Hajzy'
      : isOwner
        ? pageTitlesByLanguage[language][activePage] || pageTitlesByLanguage[language].owner
        : pageTitlesByLanguage[language][activePage] || pageTitlesByLanguage[language].dashboard

  const handleMarketingOpenLogin = () => {
    setCurrentAuthPage('login')
    setActivePage('home')
  }

  const handleMarketingBrowseGuest = () => {
    setIsGuestMode(true)
    setCurrentAuthPage('landing')
    setActivePage('home')
  }

  if (!loading && !user && !isGuestMode && currentAuthPage === 'landing') {
    return (
      <MarketingPage
        language={language}
        onOpenLogin={handleMarketingOpenLogin}
        onBrowseGuest={handleMarketingBrowseGuest}
      />
    )
  }

  if (!loading && !user && !isGuestMode) {
    return renderAuthPage()
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          {activePage !== 'home' && activePage !== 'dashboard' && activePage !== 'profile' ? (
            <button className="icon-button" aria-label="العودة" onClick={() => navigate(isOwner ? 'owner' : 'home')}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <div className="topbar-ghost" aria-hidden="true" />
          )}

          <h1 className="topbar-brand topbar-logo-wrap">{topBarTitle}</h1>

          <div className="topbar-actions">
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

      {toast && (
        <div className="global-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {!isOwner && (
        <nav className="bottom-nav" aria-label="التنقل الرئيسي">
          <button
            className={activePage === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate('dashboard')}
            aria-label="لوحة التحكم"
            title="لوحة التحكم"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="nav-label">لوحة التحكم</span>
          </button>
          <button
            className={activePage === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate('home')}
            aria-label="الرئيسية"
            title="الرئيسية"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="nav-label">الرئيسية</span>
          </button>
          <button
            className={activePage === 'bookings' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate('bookings')}
            aria-label="حجوزاتي"
            title="حجوزاتي"
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="nav-label">حجوزاتي</span>
          </button>
          <button
            className={activePage === 'profile' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigate('profile')}
            aria-label="الملف الشخصي"
            title="الملف الشخصي"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="nav-label">الملف الشخصي</span>
          </button>
        </nav>
      )}
    </div>
  )
}

export default App

