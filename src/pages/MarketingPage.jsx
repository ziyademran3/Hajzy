export default function MarketingPage({ onOpenLogin, onBrowseGuest, language = 'ar' }) {
  const isEnglish = language === 'en'

  const features = [
    {
      icon: 'search',
      title: isEnglish ? 'Smart search' : 'بحث ذكي',
      body: isEnglish
        ? 'Find stays by city, dates, and travelers in seconds.'
        : 'ابحث عن الإقامات حسب المدينة والتواريخ وعدد الضيوف في ثوانٍ.',
    },
    {
      icon: 'verified',
      title: isEnglish ? 'Trusted stays' : 'إقامات موثقة',
      body: isEnglish
        ? 'Explore checked stays with host details and clear policies.'
        : 'استكشف إقامات موثقة مع تفاصيل المالك وسياسات واضحة.',
    },
    {
      icon: 'payments',
      title: isEnglish ? 'Fast booking' : 'حجز سريع',
      body: isEnglish
        ? 'Complete your reservation with a clear summary and secure checkout.'
        : 'أكمل الحجز بسهولة مع ملخص واضح ودفع آمن.',
    },
  ]

  const cities = [
    { name: 'الإسكندرية', text: isEnglish ? 'Sea breeze' : 'نسيم البحر', price: 'من 1,250 ج.م' },
    { name: 'القاهرة', text: isEnglish ? 'Culture & design' : 'ثقافة وتصميم', price: 'من 1,850 ج.م' },
    { name: 'الغردقة', text: isEnglish ? 'Red Sea luxury' : 'فخامة البحر الأحمر', price: 'من 2,300 ج.م' },
  ]

  const stats = [
    { value: '4.9', label: isEnglish ? 'Guest rating' : 'تقييم الضيوف' },
    { value: '2.5k+', label: isEnglish ? 'Monthly stays' : 'إقامات شهريًا' },
    { value: '24/7', label: isEnglish ? 'Support' : 'دعم مستمر' },
  ]

  return (
    <div className="marketing-page">
      <header className="marketing-header">
        <div className="marketing-brand">
          <div className="marketing-logo">H</div>
          <span>Hajzy</span>
        </div>

        <div className="marketing-actions">
          <button type="button" className="secondary-button" onClick={onOpenLogin}>
            {isEnglish ? 'Sign in' : 'تسجيل الدخول'}
          </button>
          <button type="button" className="primary-button" onClick={onBrowseGuest}>
            {isEnglish ? 'Explore stays' : 'تصفح الإقامات'}
          </button>
        </div>
      </header>

      <main className="marketing-content">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">{isEnglish ? 'Luxury stays in Egypt' : 'إقامات فاخرة في مصر'}</span>
            <h1>{isEnglish ? 'Your perfect stay starts here.' : 'إقامتك المثالية تبدأ من هنا.'}</h1>
            <p>
              {isEnglish
                ? 'Book verified homes, villas, and apartments with simple search, flexible dates, and a smooth experience from search to check-in.'
                : 'احجز منازل وفيلا وشقق موثقة بسهولة مع بحث سريع وتواريخ مرنة وتجربة حجز مريحة من البداية إلى الوصول.'}
            </p>

            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={onOpenLogin}>
                {isEnglish ? 'Book now' : 'احجز الآن'}
              </button>
              <button type="button" className="ghost-button" onClick={onBrowseGuest}>
                {isEnglish ? 'Browse as guest' : 'تصفح كضيف'}
              </button>
            </div>

            <div className="mini-stats">
              {stats.map((item) => (
                <div key={item.label} className="mini-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card feature-card large-card">
              <img
                src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                alt="Luxury stay"
              />
              <div className="card-overlay">
                <span>{isEnglish ? 'Featured stay' : 'إقامة مميزة'}</span>
                <strong>Sea View Villa</strong>
                <small>الإسكندرية • 4.9</small>
              </div>
            </div>
            <div className="floating-badge">
              <span className="material-symbols-outlined">star</span>
              {isEnglish ? 'Top rated' : 'الأعلى تقييماً'}
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <span className="eyebrow">{isEnglish ? 'Why Hajzy' : 'لماذا Hajzy'}</span>
            <h2>{isEnglish ? 'A better way to book your next getaway' : 'طريقة أفضل لحجز إقامتك القادمة'}</h2>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="feature-card">
                <span className="material-symbols-outlined feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <span className="eyebrow">{isEnglish ? 'Popular destinations' : 'وجهات شهيرة'}</span>
            <h2>{isEnglish ? 'Explore elegant stays across Egypt' : 'اكتشف إقامات أنيقة في جميع أنحاء مصر'}</h2>
          </div>

          <div className="city-grid">
            {cities.map((city) => (
              <div key={city.name} className="city-card">
                <div className="city-overlay" />
                <div className="city-content">
                  <strong>{city.name}</strong>
                  <small>{city.text}</small>
                  <span>{city.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-strip">
          <div>
            <span className="eyebrow">{isEnglish ? 'Ready to start?' : 'جاهز للانطلاق؟'}</span>
            <h2>{isEnglish ? 'Find your next favorite stay today.' : 'اكتشف إقامتك المفضلة اليوم.'}</h2>
          </div>
          <div className="cta-actions">
            <button type="button" className="primary-button" onClick={onOpenLogin}>
              {isEnglish ? 'Create account' : 'إنشاء حساب'}
            </button>
            <button type="button" className="secondary-button" onClick={onBrowseGuest}>
              {isEnglish ? 'Browse now' : 'تصفح الآن'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
