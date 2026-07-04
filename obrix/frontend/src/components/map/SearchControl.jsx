/**
 * SearchControl — Nominatim geocoder with autocomplete.
 *
 * Phase 2 fix: Dropdown now uses createPortal + position:fixed.
 * This prevents the dropdown from being clipped by the sidebar's
 * overflow:hidden/auto scroll container, regardless of parent layout.
 *
 * Rate-limiting: 300ms debounce + User-Agent header (Nominatim policy).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Loader2, MapPin } from 'lucide-react'
import useMapStore from '@/store/mapStore'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

export default function SearchControl() {
  const { selectCoordinates, setMapCenter } = useMapStore()

  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  // Fixed pixel position for the portal dropdown
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, left: 0, width: 0 })

  const debounceRef    = useRef(null)
  const inputWrapRef   = useRef(null)   // wraps the <input> — used to compute portal position
  const containerRef   = useRef(null)   // whole component — used for click-outside detection

  // ── Compute fixed pixel position of the dropdown ────────────────────────────
  const updateDropdownPos = useCallback(() => {
    if (!inputWrapRef.current) return
    const rect = inputWrapRef.current.getBoundingClientRect()
    setDropdownPos({
      top:   rect.bottom + 6,
      left:  rect.left,
      width: rect.width,
    })
  }, [])

  // ── Nominatim search ─────────────────────────────────────────────────────────
  const search = useCallback(async (q) => {
    if (q.trim().length < 3) { setResults([]); return }
    setIsLoading(true)
    try {
      const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Obrix/1.0 (educational project; contact: student@example.com)',
        },
      })
      const data = await res.json()
      setResults(data)
      setShowDropdown(true)
      updateDropdownPos()
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [updateDropdownPos])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  // ── Click outside closes dropdown ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !document.getElementById('obrix-search-portal')?.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update portal position when window is resized / scrolled
  useEffect(() => {
    if (!showDropdown) return
    window.addEventListener('resize', updateDropdownPos)
    window.addEventListener('scroll', updateDropdownPos, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPos)
      window.removeEventListener('scroll', updateDropdownPos, true)
    }
  }, [showDropdown, updateDropdownPos])

  // ── Select a result ──────────────────────────────────────────────────────────
  const handleSelect = (item) => {
    const lat = parseFloat(parseFloat(item.lat).toFixed(6))
    const lon = parseFloat(parseFloat(item.lon).toFixed(6))
    selectCoordinates(lat, lon)
    setMapCenter([lat, lon], 15)
    setQuery(item.display_name.split(',').slice(0, 2).join(', '))
    setShowDropdown(false)
    setResults([])
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  const formatName = (item) => {
    const parts = item.display_name.split(', ')
    return { primary: parts[0], secondary: parts.slice(1, 3).join(', ') }
  }

  // ── Portal dropdown ──────────────────────────────────────────────────────────
  const dropdown = showDropdown && results.length > 0
    ? createPortal(
        <div
          id="obrix-search-portal"
          style={{
            position: 'fixed',
            top:   dropdownPos.top,
            left:  dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="bg-[#0d1526] border border-white/10 rounded-2xl
                     shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden"
        >
          {results.map((item) => {
            const { primary, secondary } = formatName(item)
            return (
              <button
                key={item.place_id}
                onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                onClick={() => handleSelect(item)}
                className="w-full flex items-start gap-3 px-4 py-3
                           hover:bg-white/[0.06] transition-colors duration-100
                           border-b border-white/[0.06] last:border-0 text-left"
              >
                <MapPin className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate leading-snug">
                    {primary}
                  </p>
                  <p className="text-xs text-white/35 truncate mt-0.5 leading-snug">
                    {secondary}
                  </p>
                </div>
              </button>
            )
          })}
        </div>,
        document.body,
      )
    : showDropdown && !isLoading && results.length === 0 && query.length >= 3
      ? createPortal(
          <div
            id="obrix-search-portal"
            style={{
              position: 'fixed',
              top:   dropdownPos.top,
              left:  dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-[#0d1526] border border-white/10 rounded-2xl
                       px-4 py-3 shadow-xl"
          >
            <p className="text-sm text-white/35">No results for "{query}"</p>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input wrapper — ref is used to compute portal position */}
      <div ref={inputWrapRef} className="relative flex items-center">
        <div className="absolute left-3.5 text-white/30 pointer-events-none z-10">
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            : <Search className="w-4 h-4" />
          }
        </div>

        <input
          id="map-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowDropdown(true)
              updateDropdownPos()
            }
          }}
          placeholder="Search any location…"
          autoComplete="off"
          className="w-full bg-white/[0.05] border border-white/10
                     rounded-xl pl-10 pr-9 py-3 text-sm text-white
                     placeholder-white/25
                     focus:outline-none focus:ring-2 focus:ring-brand-500/40
                     focus:border-brand-500/30
                     transition-all duration-200 hover:bg-white/[0.07]"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-white/25 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown rendered via portal — never clipped by parent overflow */}
      {dropdown}
    </div>
  )
}
