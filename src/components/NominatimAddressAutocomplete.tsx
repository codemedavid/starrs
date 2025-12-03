'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete'
import type { AddressSuggestion } from '../types'

interface NominatimAddressAutocompleteProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function NominatimAddressAutocomplete({
  value,
  onChange,
  placeholder = 'Enter your address',
  required = false,
  className = '',
}: NominatimAddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { suggestions, loading, error, clearSuggestions } = useAddressAutocomplete(inputValue)

  // Sync external value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setShowSuggestions(true)
  }

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const fullAddress = suggestion.display_name
    setInputValue(fullAddress)
    onChange(fullAddress, {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    })
    setShowSuggestions(false)
    clearSuggestions()
  }

  const formatAddress = (suggestion: AddressSuggestion): string => {
    const addr = suggestion.address
    const parts: string[] = []
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`)
    } else if (addr.road) {
      parts.push(addr.road)
    }
    if (addr.barangay || addr.village) {
      parts.push(addr.barangay || addr.village)
    }
    if (addr.city || addr.town || addr.municipality) {
      parts.push(addr.city || addr.town || addr.municipality)
    }
    if (addr.province) {
      parts.push(addr.province)
    }
    return parts.length > 0 ? parts.join(', ') : suggestion.display_name
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          required={required}
          autoComplete="address-line1"
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {formatAddress(suggestion)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.display_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

