import React, { useState } from 'react'

const destinationTips = {
  'الجونة': [
    { title: 'أفضل تجربة عشاء', desc: 'مطاعم المارينا الجديدة وأبو تيج مارينا تمنحك إطلالة يخت استثنائية وأجواء هادئة.', tag: 'عشاء فاخر' },
    { title: 'شواطئ ونشاطات بحرية', desc: 'شاطئ زيتونة وكلوب 88 يقدمان مياه نقية ورياضات الكايت سيرفنج (Kite Surfing).', tag: 'أنشطة' },
    { title: 'طوارئ وخدمات', desc: 'مستشفى الجونة الدولي وخدمة التوكتوك الداخلي متاحة 24/7 عبر تطبيق El Gouna.', tag: 'خدمات' },
  ],
  'الإسكندرية': [
    { title: 'مأكولات بحرية أيقونية', desc: 'مطعم فيش ماركت ومطعم سي جل يقدمان صيد اليوم الطازج بإطلالة بانورامية على البحر.', tag: 'مطاعم' },
    { title: 'نزهة وتراث', desc: 'قلعة قايتباي وممشى المنتزه الملكي ومكتبة الإسكندرية أوقات الصباح الباكر.', tag: 'تراث' },
    { title: 'أفضل وقت للإطلالة', desc: 'ساعة الغروب من كوبري ستانلي أو كافيهات الكورنيش لتجربة ساحلية لا تُنسى.', tag: 'إطلالة' },
  ],
  'default': [
    { title: 'مطاعم وتجارب محلية', desc: 'خيارات طعام بحرية وتراثية موثقة ومعتمدة من نزلاء حجزي بتقييم 4.9★.', tag: 'مطاعم' },
    { title: 'خدمات الوصول الذاتي', desc: 'يمكنك فتح القفل الذكي عبر الرمز المرسل لك على واتساب بعد تأكيد الحجز مباشرة.', tag: 'دخول ذاتي' },
    { title: 'الدعم والمساعدة 24/7', desc: 'فريق كونسيرج حجزي جاهز للإجابة على أي استفسار وتلبية طلبات الإقامة الخاصة.', tag: 'دعم' },
  ],
}

export default function AiConciergeModal({
  isOpen,
  onClose,
  cityName = 'الجونة',
  propertyName = 'إقامة فاخرة',
  language = 'ar',
}) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: language === 'en'
        ? `Welcome to your private Hajzy Concierge for ${propertyName} in ${cityName}! How can I assist your stay today?`
        : `أهلاً بك! أنا مرشد حجزي الذكي المخصص لإقامتك في "${propertyName}" بـ ${cityName}. كيف يمكنني إثراء عطلتك اليوم؟`,
    },
  ])
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  if (!isOpen) return null

  const isArabic = language === 'ar'
  const tips = destinationTips[cityName] || destinationTips['default']

  const quickPrompts = isArabic
    ? ['أفضل مطعم سمك قريب؟', 'أماكن هادئة للغروب؟', 'أرقام الطوارئ والصيدليات؟', 'تعليمات الدخول الذاتي؟']
    : ['Best nearby dining?', 'Sunset view spots?', 'Emergency numbers?', 'Self check-in guide?']

  const handleSend = (textToSend) => {
    const query = textToSend || inputVal.trim()
    if (!query) return

    setMessages((prev) => [...prev, { sender: 'user', text: query }])
    setInputVal('')
    setIsTyping(true)

    // Simulate intelligent concierge advice tailored to city
    setTimeout(() => {
      let answer = isArabic
        ? `بناءً على موقع إقامتك في ${cityName}: ننصحك بزيارة الشاطئ الرئيسي على بعد 5 دقائق، كما نوفر لك حجز طاولة مسبقاً وتوصيل مشتريات الإقامة فوراً.`
        : `Based on your stay in ${cityName}: We recommend the scenic marina bay 5 minutes away, plus our 24/7 concierge can reserve tables or arrange arrival supplies.`

      if (query.includes('مطعم') || query.includes('dining')) {
        answer = isArabic
          ? `أفضل ترشيحات الطعام في ${cityName}: جرب مطاعم المارينا للمأكولات البحرية الطازجة، وتتوفر خدمة التوصيل المباشر حتى باب الفيلا.`
          : `Top dining recommendation in ${cityName}: Try the seaside marina grill for fresh catch of the day, with direct delivery to your villa.`
      } else if (query.includes('طوارئ') || query.includes('emergency')) {
        answer = isArabic
          ? `خدمات الطوارئ في ${cityName}: أقرب صيدلية تعمل 24/7 هي صيدلية المارينا، ورقم الطوارئ الموحد هو 123 مع دعم أمني على مدار الساعة.`
          : `Emergency support in ${cityName}: 24/7 pharmacy is located at the central square, and verified local hospital contact is on file.`
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: answer }])
      setIsTyping(false)
    }, 600)
  }

  return (
    <div className="dialog-backdrop" onClick={onClose} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div
        className="dialog-modal w-full max-w-xl rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#10151a] shadow-2xl p-6 sm:p-7 flex flex-col h-[600px] max-h-[85vh] text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00433f] to-emerald-500 text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black">{isArabic ? 'مرشد حجزي الذكي (AI Concierge)' : 'Hajzy AI Concierge'}</h3>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                  {cityName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isArabic ? 'إرشادات وترشيحات محلية مخصصة لإقامتك' : 'Tailored local recommendations for your stay'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Local Quick Tips Strip */}
        <div className="py-3 overflow-x-auto flex items-center gap-2 border-b border-slate-100 dark:border-white/5 shrink-0 scrollbar-none">
          {tips.map((t, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 p-2.5 max-w-[200px]"
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span>{t.tag}</span>
                <span className="material-symbols-outlined text-[12px]">recommend</span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{t.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                  ★
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#00433f] text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce delay-300" />
              <span>{isArabic ? 'المرشد يفكر...' : 'Concierge is typing...'}</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(p)}
              className="rounded-full bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition active:scale-95"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2 pt-2 shrink-0 border-t border-slate-200/80 dark:border-white/10"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isArabic ? 'اسأل المرشد عن أي تفاصيل في وجهتك...' : 'Ask about local dining, beaches, tips...'}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00433f] to-emerald-600 text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-40 transition"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  )
}
