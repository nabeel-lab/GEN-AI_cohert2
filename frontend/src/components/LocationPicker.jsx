import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Crosshair, MapPin, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Loader2, Search,
} from 'lucide-react'
import {
  loadGoogleMaps, hasMapsApiKey, parseAddressComponents, DARK_MAP_STYLE,
} from '../lib/googleMaps'

// Default center: Bangalore (MG Road)
const DEFAULT_CENTER = { lat: 12.9738, lng: 77.6119 }

export default function LocationPicker({ initialQuery = '', initialLocation = null, onChange }) {
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const geocoderRef = useRef(null)
  const autocompleteServiceRef = useRef(null)

  const [sdkState, setSdkState] = useState('loading') // loading | ready | error | no-key
  const [loadError, setLoadError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected] = useState(initialLocation) // parsed location object
  const [confirmed, setConfirmed] = useState(Boolean(initialLocation))
  const [locating, setLocating] = useState(false)

  // Autocomplete UI States
  const [searchQuery, setSearchQuery] = useState(initialLocation?.formatted_address || initialQuery)
  const [predictions, setPredictions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // ── Reverse-geocode a lat/lng and update state + marker ──────────────────
  const resolveLatLng = useCallback((lat, lng, animateDrop = false) => {
    if (!geocoderRef.current) return

    setResolving(true)
    setConfirmed(false)

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setResolving(false)

      if (status !== 'OK' || !results || !results[0]) {
        const fallbackAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setSelected({
          latitude: lat,
          longitude: lng,
          formatted_address: fallbackAddress,
          place_id: '',
          locality: '', city: '', state: '', country: '', postal_code: '',
        })
        setSearchQuery(fallbackAddress)
        return
      }

      const best = results[0]
      const parsed = parseAddressComponents(best.address_components)
      setSelected({
        latitude: lat,
        longitude: lng,
        formatted_address: best.formatted_address,
        place_id: best.place_id || '',
        ...parsed,
      })
      setSearchQuery(best.formatted_address)
    })

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng })
      if (animateDrop) {
        markerRef.current.setAnimation(window.google.maps.Animation.DROP)
      }
    }
    if (mapRef.current) mapRef.current.panTo({ lat, lng })
  }, [])

  // ── Initialize the SDK + map once ────────────────────────────────────────
  useEffect(() => {
    if (!hasMapsApiKey()) {
      setSdkState('no-key')
      return
    }

    let cancelled = false

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return

        const startCenter = initialLocation
          ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
          : DEFAULT_CENTER

        const map = new window.google.maps.Map(mapDivRef.current, {
          center: startCenter,
          zoom: initialLocation ? 16 : 14,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        })

        const marker = new window.google.maps.Marker({
          position: startCenter,
          map,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        })

        map.addListener('click', (e) => {
          resolveLatLng(e.latLng.lat(), e.latLng.lng())
        })
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          resolveLatLng(pos.lat(), pos.lng())
        })

        mapRef.current = map
        markerRef.current = marker
        geocoderRef.current = new window.google.maps.Geocoder()

        // Initialize programmatic AutocompleteService
        if (window.google.maps.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        }

        // Prime the map with initial query if no coordinates are provided
        if (!initialLocation && initialQuery) {
          geocoderRef.current.geocode({ address: `${initialQuery}, India` }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const loc = results[0].geometry.location
              map.setCenter(loc)
              map.setZoom(15)
              resolveLatLng(loc.lat(), loc.lng())
            }
          })
        }

        setSdkState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Google Maps failed to load:', err)
        setLoadError(err?.message || 'Failed to load Google Maps.')
        setSdkState('error')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handle programmatic search autocomplete ────────────────────────────────
  const handleSearchChange = (val) => {
    setSearchQuery(val)
    setConfirmed(false)
    if (!val.trim()) {
      setPredictions([])
      setShowSuggestions(false)
      return
    }

    if (autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        { input: val, componentRestrictions: { country: 'in' } },
        (results, status) => {
          if (status === 'OK' && results) {
            setPredictions(results)
            setShowSuggestions(true)
          } else {
            setPredictions([])
          }
        }
      )
    }
  }

  // ── Select a prediction from dropdown list ─────────────────────────────────
  const handleSelectPrediction = (prediction) => {
    setSearchQuery(prediction.description)
    setShowSuggestions(false)
    setConfirmed(false)

    if (geocoderRef.current) {
      setResolving(true)
      geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        setResolving(false)
        if (status === 'OK' && results && results[0]) {
          const best = results[0]
          const lat = best.geometry.location.lat()
          const lng = best.geometry.location.lng()
          const parsed = parseAddressComponents(best.address_components)
          
          setSelected({
            latitude: lat,
            longitude: lng,
            formatted_address: best.formatted_address,
            place_id: prediction.place_id || '',
            ...parsed,
          })

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
            markerRef.current.setAnimation(window.google.maps.Animation.DROP)
          }
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng })
            mapRef.current.setZoom(16)
          }
        }
      })
    }
  }

  // ── Geocode custom typed address or fallback to free text ───────────────────
  const handleGeocodeFreeText = () => {
    if (!searchQuery.trim()) return
    setConfirmed(false)

    if (geocoderRef.current) {
      setResolving(true)
      geocoderRef.current.geocode({ address: `${searchQuery}, India` }, (results, status) => {
        setResolving(false)
        if (status === 'OK' && results && results[0]) {
          const best = results[0]
          const lat = best.geometry.location.lat()
          const lng = best.geometry.location.lng()
          const parsed = parseAddressComponents(best.address_components)

          setSelected({
            latitude: lat,
            longitude: lng,
            formatted_address: best.formatted_address,
            place_id: best.place_id || '',
            ...parsed,
          })

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
            markerRef.current.setAnimation(window.google.maps.Animation.DROP)
          }
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng })
            mapRef.current.setZoom(16)
          }
        } else {
          // If Geocoder fails (e.g. invalid key, offline, or not found), save query as free_text
          setSelected({
            latitude: null,
            longitude: null,
            formatted_address: searchQuery,
            place_id: '',
            locality: '', city: '', state: '', country: '', postal_code: '',
            free_text: searchQuery,
          })
        }
      })
    } else {
      // Maps not ready, save query as free_text
      setSelected({
        latitude: null,
        longitude: null,
        formatted_address: searchQuery,
        place_id: '',
        locality: '', city: '', state: '', country: '', postal_code: '',
        free_text: searchQuery,
      })
    }
  }

  // ── Current location button ──────────────────────────────────────────────
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        resolveLatLng(pos.coords.latitude, pos.coords.longitude, true)
        if (mapRef.current) mapRef.current.setZoom(16)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  function handleConfirm() {
    if (!selected) {
      // If nothing selected but searchQuery has text, treat it as custom input
      if (searchQuery.trim()) {
        const customLoc = {
          latitude: null,
          longitude: null,
          formatted_address: searchQuery,
          place_id: '',
          locality: '', city: '', state: '', country: '', postal_code: '',
          free_text: searchQuery,
        }
        setSelected(customLoc)
        setConfirmed(true)
        onChange?.(customLoc)
      }
      return
    }
    setConfirmed(true)
    onChange?.(selected)
  }

  function handleRetryLoad() {
    setSdkState('loading')
    setLoadError('')
    window.location.reload()
  }

  const openInMapsUrl = selected
    ? `https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`
    : null

  // ── Fallback: no API key configured ───────────────────────────────────────
  if (sdkState === 'no-key') {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center text-center gap-2 backdrop-blur-xl">
        <MapPin size={26} className="text-zinc-600" />
        <p className="text-zinc-400 text-sm max-w-sm">
          Interactive map is not configured. Type your target location directly.
        </p>
        <input
          type="text"
          placeholder="e.g. Banjara Hills, Hyderabad"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            onChange?.({
              latitude: null, longitude: null, formatted_address: e.target.value,
              place_id: '', locality: '', city: '', state: '', country: '', postal_code: '',
              free_text: e.target.value,
            })
          }}
          className="w-full mt-2 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors text-sm"
        />
      </div>
    )
  }

  // ── Fallback: SDK failed to load ─────────────────
  if (sdkState === 'error') {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 flex flex-col items-center text-center gap-3 backdrop-blur-xl">
        <AlertTriangle size={26} className="text-red-400/80" />
        <div>
          <p className="text-zinc-200 text-sm font-medium">Couldn't load Google Maps</p>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm">{loadError}</p>
        </div>
        <button
          onClick={handleRetryLoad}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Autocomplete & Free-text search input */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGeocodeFreeText()
                  setShowSuggestions(false)
                }
              }}
              placeholder="Search or type address (e.g. Banjara Hills, Hyderabad)"
              className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-zinc-500 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors text-sm"
            />
            <Search size={16} className="absolute left-3.5 text-zinc-600" />
          </div>
          <button
            onClick={handleGeocodeFreeText}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-colors flex-shrink-0"
          >
            Locate
          </button>
        </div>

        {/* Suggestion Dropdown */}
        {showSuggestions && predictions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-800 rounded-xl max-h-60 overflow-y-auto z-50 shadow-2xl backdrop-blur-xl">
            {predictions.map((p) => (
              <button
                key={p.place_id}
                onClick={() => handleSelectPrediction(p)}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs border-b border-zinc-800/40 last:border-0 transition-colors truncate"
              >
                {p.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
        <div ref={mapDivRef} className="w-full h-[320px] bg-zinc-950" />

        {sdkState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-zinc-400 animate-spin" />
              <p className="text-zinc-500 text-xs tracking-widest uppercase font-mono">Syncing Map...</p>
            </div>
          </div>
        )}

        {/* Floating current-location FAB */}
        {sdkState === 'ready' && (
          <button
            onClick={handleUseCurrentLocation}
            disabled={locating}
            title="Use current location"
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shadow-xl disabled:opacity-50"
          >
            {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          </button>
        )}

        {/* Center pin hint while resolving */}
        {resolving && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-xs text-zinc-300 flex items-center gap-2 shadow-xl">
            <Loader2 size={12} className="animate-spin text-zinc-400" /> Resolving Coordinates...
          </div>
        )}
      </div>

      {/* Selected location preview card */}
      {(selected || searchQuery.trim()) && (
        <div className={[
          'rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 backdrop-blur-xl shadow-2xl',
          confirmed ? 'border-zinc-700/50 bg-zinc-800/30' : 'border-zinc-800 bg-zinc-900/50',
        ].join(' ')}>
          <div className="flex items-start gap-4">
            <MapPin size={18} className={confirmed ? 'text-zinc-400 flex-shrink-0 mt-0.5' : 'text-zinc-100 flex-shrink-0 mt-0.5'} />
            <div className="flex-1 min-w-0">
              <p className="text-zinc-100 text-sm font-medium leading-snug tracking-wide">
                {selected?.formatted_address || searchQuery}
              </p>
              <p className="text-zinc-500 text-xs mt-1.5 font-light">
                {selected 
                  ? [selected.locality, selected.city, selected.state].filter(Boolean).join(', ') 
                  : 'Custom Typed Location (Fallback analysis active)'}
              </p>
              {selected?.latitude != null && (
                <p className="text-zinc-600 text-[10px] mt-2 font-mono uppercase tracking-widest">
                  COORD: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </p>
              )}
            </div>
            {confirmed && <CheckCircle2 size={20} className="text-zinc-500 flex-shrink-0" />}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={[
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all',
                confirmed
                  ? 'bg-zinc-800/50 text-zinc-500 cursor-default border border-zinc-700/50'
                  : 'bg-zinc-100 text-black hover:bg-white hover:scale-[1.02] active:scale-100 shadow-xl shadow-black/20',
              ].join(' ')}
            >
              {confirmed ? (<><CheckCircle2 size={16} /> Location Confirmed</>) : 'Confirm Location'}
            </button>
            {selected?.latitude != null && (
              <a
                href={openInMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors flex-shrink-0"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      )}

      {!selected && !searchQuery.trim() && sdkState === 'ready' && (
        <p className="text-zinc-600 text-xs text-center font-light mt-2">
          Search above, click anywhere on the map, or type a custom location name directly.
        </p>
      )}
    </div>
  )
}
