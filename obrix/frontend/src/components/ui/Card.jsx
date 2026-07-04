/** Card — glassmorphism panel wrapper. */

export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`glass-card p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
