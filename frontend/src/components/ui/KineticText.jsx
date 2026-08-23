import React from 'react'
import { cn } from '@/lib/utils'

/**
 * KineticText Component
 * Renders text broken down into accessible individual characters that animate
 * kinetically (becoming heavier and subtly expanding) on mouse hover.
 *
 * @param {string} text - Text to animate
 * @param {React.ElementType} as - HTML element or React component to render as (default: 'span')
 * @param {string} className - Additional CSS classes
 * @param {React.CSSProperties} style - Inline styles
 */
export function KineticText({
  text = '',
  as: Component = 'span',
  className = '',
  style = {},
  children,
  ...props
}) {
  const content = text || (typeof children === 'string' ? children : '')
  const words = content.split(' ')

  return (
    <Component
      className={cn('relative inline select-none', className)}
      style={style}
      {...props}
    >
      {/* Screen-reader accessible full text */}
      <span className="sr-only">{content}</span>

      {/* Visual characters with kinetic hover animations */}
      <span aria-hidden="true" className="inline">
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {word.split('').map((char, charIdx) => (
              <span
                key={charIdx}
                className="kinetic-char inline-block cursor-default select-none"
              >
                {char}
              </span>
            ))}
            {wordIdx < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </span>
    </Component>
  )
}

export default KineticText
