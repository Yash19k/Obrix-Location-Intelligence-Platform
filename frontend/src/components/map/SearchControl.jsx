/**
 * SearchControl — Nominatim geocoder with autocomplete.
 *
 * Dropdown uses createPortal + position:fixed + zIndex 700 to ensure
 * results render cleanly above Leaflet map, overlays, and toolbars
 * without being clipped.
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
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, left: 0, width: 0 })

  const debounceRef    = useRef(null)
  const inputWrapRef   = useRef(null)
  const containerRef   = useRef(null)

  const updateDropdownPos = useCallback(() => {
    if (!inputWrapRef.current) return
    const rect = inputWrapRef.current.getBoundingClientRect()
    setDropdownPos({
      top:   rect.bottom + 6,
      left:  rect.left,
      width: rect.width,
    })
  }, [])

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

  useEffect(() => {
    if (!showDropdown) return
    window.addEventListener('resize', updateDropdownPos)
    window.addEventListener('scroll', updateDropdownPos, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPos)
      window.removeEventListener('scroll', updateDropdownPos, true)
    }
  }, [showDropdown, updateDropdownPos])

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

  const dropdown = showDropdown && results.length > 0
    ? createPortal(
        <div
          id="obrix-search-portal"
          style={{
            position: 'fixed',
            top:   dropdownPos.top,
            left:  dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 700,
          }}
          className="bg-white border border-[#DDE3EC] rounded-2xl shadow-xl overflow-hidden font-sans"
        >
          {results.map((item) => {
            const { primary, secondary } = formatName(item)
            return (
              <button
                key={item.place_id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="w-full flex items-start gap-3 px-4 py-3
                           hover:bg-[#F6F8FC] active:bg-[#E9EFFF] transition-colors duration-100
                           border-b border-[#E8ECF2] last:border-0 text-left cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#315CF5] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#08111F] truncate leading-snug font-sans">
                    {primary}
                  </p>
                  <p className="text-[11px] text-[#5D6675] truncate mt-0.5 leading-snug font-sans font-medium">
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
              zIndex: 700,
            }}
            className="bg-white border border-[#DDE3EC] rounded-2xl px-4 py-3 shadow-xl font-sans"
          >
            <p className="text-xs text-[#8A94A3] font-medium font-sans">No results found for "{query}"</p>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className="relative w-full font-sans">
      <div ref={inputWrapRef} className="relative flex items-center">
        <div className="absolute left-3.5 text-[#5D6675] pointer-events-none z-10">
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin text-[#315CF5]" />
            : <Search className="w-4 h-4 text-[#5D6675]" />
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
          className="w-full bg-white border border-[#DDE3EC]
                     rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#08111F]
                     placeholder-[#8A94A3] font-sans font-medium shadow-2xs
                     focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20
                     focus:border-[#315CF5]
                     transition-all duration-150 hover:border-[#315CF5]/35"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-[#8A94A3] hover:text-[#08111F] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {dropdown}
    </div>
  )
}
