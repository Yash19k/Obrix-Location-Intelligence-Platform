/** Input — labeled form input with error state. */

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input-field ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}
