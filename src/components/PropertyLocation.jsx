export default function PropertyLocation({ children, className = '' }) {
  return (
    <span className={`property-location-display ${className}`.trim()}>
      <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
      <span>{children}</span>
    </span>
  )
}
