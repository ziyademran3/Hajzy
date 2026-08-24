import React from 'react'

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={isOwn ? 'message-row own' : 'message-row'}>
      <div className={isOwn ? 'message-bubble own' : 'message-bubble'}>
        <div className="message-text">{message.text}</div>
        <div className="message-meta">
          <small>{message.senderName || (message.sender === 'owner' ? 'المالك' : 'أنت')}</small>
          <small>{message.time ? message.time : new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
      </div>
    </div>
  )
}
