import React, { useEffect, useRef, useState } from 'react'
import { fetchChatMessages, addChatMessage } from '../lib/dataService'
import MessageBubble from '../components/MessageBubble'

export default function ChatPage({ property, user, language = 'ar', onBack = () => {} }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  const propertyId = property?.id || 'general'

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
    // poll for updates
    const timer = setInterval(loadMessages, 4000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId])

  const scrollToBottom = () => {
    try {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    } catch (err) {
      // ignore
    }
  }

  const handleSend = async () => {
    const text = String(input || '').trim()
    if (!text) return
    setSending(true)
    try {
      const newMsg = {
        id: `msg-${Date.now()}`,
        propertyId,
        sender: user?.role === 'owner' ? 'owner' : 'guest',
        senderId: user?.id || 'guest',
        senderName: user?.name || (language === 'en' ? 'Guest' : 'ضيف'),
        text,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      // optimistic update
      setMessages((cur) => [...cur, newMsg])
      setInput('')
      scrollToBottom()

      // persist via dataService (may be a noop in demo)
      await addChatMessage(newMsg)
      // reload to get authoritative list
      await loadMessages()
    } catch (err) {
      console.error('Send failed', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-shell chat-shell">
      <div className="chat-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={language === 'en' ? 'Back' : 'رجوع'}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="chat-title">
          <strong>{property?.title || (language === 'en' ? 'Host chat' : 'محادثة المالك')}</strong>
          <small>{property?.location || ''}</small>
        </div>
      </div>

      <div className="chat-list" ref={listRef}>
        {loading ? (
          <div className="chat-loading">{language === 'en' ? 'Loading messages...' : 'جاري تحميل الرسائل...'}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">{language === 'en' ? 'No messages yet. Say hello!' : 'لا توجد رسائل بعد. ابدأ المحادثة الآن!'}</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={String(msg.senderId) === String(user?.id)} />
          ))
        )}
      </div>

      <div className="chat-input-bar">
        <input type="text" aria-label={language === 'en' ? 'Type a message' : 'اكتب رسالة'} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }} placeholder={language === 'en' ? 'Write a message...' : 'اكتب رسالتك...'} />
        <button className="primary-button" onClick={handleSend} disabled={sending || !input.trim()}>
          {sending ? (language === 'en' ? 'Sending...' : 'جارٍ الإرسال...') : (language === 'en' ? 'Send' : 'إرسال')}
        </button>
      </div>
    </div>
  )
}
