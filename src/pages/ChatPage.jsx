import React, { useEffect, useRef, useState } from 'react'
import { fetchChatMessages, addChatMessage } from '../lib/dataService'
import MessageBubble from '../components/MessageBubble'

export default function ChatPage({ property, user, language = 'ar', onBack = () => {} }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isHostTyping, setIsHostTyping] = useState(false)
  const [attachedImage, setAttachedImage] = useState(null)
  const listRef = useRef(null)
  const fileInputRef = useRef(null)

  const isArabic = language === 'ar'
  const propertyId = property?.id || 'general'

  const quickReplies = isArabic
    ? [
        'هل يمكن تسجيل الوصول مبكراً؟',
        'ما هي كلمة سر الواي فاي (Wi-Fi)؟',
        'هل يوجد موقف سيارات خاص ومجاني؟',
        'ما هي أقرب بقالة أو سوبرماركت؟',
        'أين موقع استلام المفاتيح؟',
      ]
    : [
        'Is early check-in possible?',
        'What is the Wi-Fi password?',
        'Is there free private parking?',
        'Where is the nearest grocery store?',
        'Where can I pick up the keys?',
      ]

  const loadMessages = async () => {
    setLoading(true)
    try {
      const ms = await fetchChatMessages(propertyId)
      setMessages(ms || [])
      scrollToBottom()
    } catch (err) {
      console.error('Failed to load chat messages', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    const timer = setInterval(loadMessages, 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId])

  const scrollToBottom = () => {
    setTimeout(() => {
      try {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      } catch {
        // ignore
      }
    }, 80)
  }

  const handleSend = async (textToSend = input) => {
    const text = String(textToSend || '').trim()
    if (!text && !attachedImage) return
    setSending(true)

    const guestMessageText = text || (isArabic ? '📷 [صورة مرفقة]' : '📷 [Attached Image]')
    const newMsg = {
      id: `msg-${Date.now()}`,
      propertyId,
      sender: user?.role === 'owner' ? 'owner' : 'guest',
      senderId: user?.id || 'guest',
      senderName: user?.name || (isArabic ? 'ضيف' : 'Guest'),
      text: guestMessageText,
      image: attachedImage,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((cur) => [...cur, newMsg])
    setInput('')
    setAttachedImage(null)
    scrollToBottom()

    try {
      await addChatMessage(newMsg)
      setSending(false)

      // Smart automated host reply simulation
      if (user?.role !== 'owner') {
        setIsHostTyping(true)
        setTimeout(async () => {
          setIsHostTyping(false)
          let replyText = isArabic
            ? 'أهلاً بك! نسعد باستضافتك. سأقوم بتجهيز كل شيء لراحتك. لا تتردد في طلب أي مساعدة إضافية.'
            : 'Welcome! We are delighted to host you. Everything will be prepared for your comfort. Feel free to ask anytime.'

          if (text.includes('واي فاي') || text.toLowerCase().includes('wi-fi')) {
            replyText = isArabic
              ? 'شبكة الواي فاي: Hajzy_Guest / كلمة السر: LuxuryStay2026'
              : 'Wi-Fi Network: Hajzy_Guest / Password: LuxuryStay2026'
          } else if (text.includes('مبكراً') || text.toLowerCase().includes('early')) {
            replyText = isArabic
              ? 'نعم بالتأكيد! يمكننا استقبالك من الساعة 12:00 ظهراً دون أي رسوم إضافية.'
              : 'Yes certainly! We can welcome you starting from 12:00 PM at no extra fee.'
          } else if (text.includes('موقف') || text.toLowerCase().includes('parking')) {
            replyText = isArabic
              ? 'يوجد موقف مجاني مخصص للنزلاء أسفل البناية (رقم الموقف 14).'
              : 'There is free designated parking in the basement (Spot #14).'
          }

          const hostReply = {
            id: `msg-host-${Date.now()}`,
            propertyId,
            sender: 'owner',
            senderId: 'host-1',
            senderName: isArabic ? 'أحمد (المضيف)' : 'Ahmed (Host)',
            text: replyText,
            createdAt: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }

          setMessages((cur) => [...cur, hostReply])
          scrollToBottom()
          await addChatMessage(hostReply)
        }, 1800)
      }
    } catch (err) {
      console.error('Send failed', err)
      setSending(false)
    }
  }

  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        setAttachedImage(uploadEvent.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="page-shell chat-shell">
      <div className="chat-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={isArabic ? 'رجوع' : 'Back'}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="chat-title flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
            {property?.title?.[0] || 'H'}
          </div>
          <div>
            <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              {property?.title || (isArabic ? 'محادثة المضيف' : 'Host Chat')}
            </strong>
            <small className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isArabic ? 'متصل الآن • استجابة خلال دقائق' : 'Online now • Fast replies'}
            </small>
          </div>
        </div>
      </div>

      <div className="chat-list" ref={listRef}>
        {loading ? (
          <div className="chat-loading">{isArabic ? 'جاري تحميل الرسائل...' : 'Loading messages...'}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span className="material-symbols-outlined text-3xl text-emerald-600 mb-2">chat</span>
            <p>{isArabic ? 'لا توجد رسائل سابقة. ابدأ المحادثة وسيرد عليك المالك فوراً!' : 'No messages yet. Send a message to start!'}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message-wrapper">
              <MessageBubble message={msg} isOwn={String(msg.senderId) === String(user?.id)} />
              {msg.image && (
                <div className={`attached-image-bubble ${String(msg.senderId) === String(user?.id) ? 'own' : 'other'}`}>
                  <img src={msg.image} alt="Attachment" className="max-w-[220px] rounded-xl border border-slate-200 shadow-sm" />
                </div>
              )}
            </div>
          ))
        )}

        {isHostTyping && (
          <div className="host-typing-indicator flex items-center gap-2 text-xs text-slate-500 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            <span>{isArabic ? 'المضيف يكتب الآن...' : 'Host is typing...'}</span>
            <div className="typing-dots flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies Strip */}
      <div className="quick-replies-strip">
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
          {isArabic ? 'ردود سريعة:' : 'Quick:'}
        </span>
        <div className="quick-chips-wrap">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              className="chip text-xs py-1 px-2.5 hover:border-emerald-500"
              onClick={() => handleSend(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {attachedImage && (
        <div className="attachment-preview-bar flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200">
          <img src={attachedImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
          <span className="text-xs text-emerald-800 dark:text-emerald-300 flex-1">
            {isArabic ? 'تم إرفاق صورة جاهزة للإرسال' : 'Image ready to send'}
          </span>
          <button
            type="button"
            className="icon-button small"
            onClick={() => setAttachedImage(null)}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="chat-input-bar">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          style={{ display: 'none' }}
          onChange={handleImagePick}
        />
        <button
          type="button"
          className="icon-button"
          onClick={() => fileInputRef.current?.click()}
          title={isArabic ? 'إرفاق صورة' : 'Attach photo'}
        >
          <span className="material-symbols-outlined">add_photo_alternate</span>
        </button>

        <input
          type="text"
          aria-label={isArabic ? 'اكتب رسالة' : 'Type a message'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          placeholder={isArabic ? 'اكتب رسالتك للمضيف...' : 'Write a message to host...'}
        />

        <button
          className="primary-button"
          onClick={() => handleSend()}
          disabled={sending || (!input.trim() && !attachedImage)}
        >
          {sending ? (isArabic ? 'جارٍ...' : 'Sending...') : (isArabic ? 'إرسال' : 'Send')}
        </button>
      </div>
    </div>
  )
}
