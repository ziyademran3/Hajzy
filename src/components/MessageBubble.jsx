import React from 'react'
import { formatTime, normalizeNumerals } from '../lib/formatters'

export default function MessageBubble({ message, isOwn, language = 'ar' }) {
  return (
    <div className={isOwn ? 'message-row own' : 'message-row'}>
      <div className={isOwn ? 'message-bubble own' : 'message-bubble'}>
        <div className="message-text">{message.text}</div>
        <div className="message-meta">
          <small>{message.senderName || (message.sender === 'owner' ? 'المالك' : 'أنت')}</small>
          <small>{message.time ? normalizeNumerals(message.time) : formatTime(message.createdAt, language)}</small>
        </div>
      </div>
    </div>
  )
}
