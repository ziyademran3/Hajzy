import React from 'react'

export default function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="review-media">
        {review.image ? <img src={review.image} alt={review.title || 'review image'} /> : <div className="review-media-placeholder">📷</div>}
      </div>
      <div className="review-body">
        <div className="review-head">
          <strong>{review.authorName || 'ضيف'}</strong>
          <div className="review-rating">{Array.from({ length: review.rating || 5 }).map((_, i) => <span key={i} className="material-symbols-outlined">star</span>)}</div>
        </div>
        <small className="muted">{review.date ? new Date(review.date).toLocaleDateString() : ''}</small>
        <p>{review.text}</p>
      </div>
    </article>
  )
}
