/** Input — labeled form input with error state. */

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5 font-sans">
      {label && (
        <label htmlFor={id} className="block text-xs font-extrabold text-[#08111F]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input-field ${error ? 'border-red-400 focus:ring-red-200' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[11px] font-bold text-red-600 mt-1 font-sans">{error}</p>
      )}
    </div>
  )
}
