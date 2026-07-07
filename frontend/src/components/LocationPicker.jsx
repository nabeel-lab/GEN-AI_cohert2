import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Crosshair, MapPin, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Loader2,
} from 'lucide-react'
import {
  loadGoogleMaps, hasMapsApiKey, parseAddressComponents, parseNewPlaceAddressComponents, DARK_MAP_STYLE,
} from '../lib/googleMaps'

// Default center: Bangalore (MG Road) — sensible starting point for this
// India-focused product when no location has been picked yet.
const DEFAULT_CENTER = { lat: 12.9738, lng: 77.6119 }

/**
 * Uber-style interactive location picker.
 *
 * Uses Maps JavaScript API (map + draggable marker), Places API (New) via
 * the classic Autocomplete widget (search bar), and Geocoding API (reverse
 * geocoding on click / drag / current-location).
 *
 * Calls onChange(locationData | null) every time the confirmed selection
 * changes. locationData shape matches the backend AnalysisRequest extension:
 * { latitude, longitude, formatted_address, place_id, locality, city, state, country, postal_code }
 */
export default function LocationPicker({ initialQuery = '', initialLocation = null, onChange }) {
  const mapDivRef = useRef(null)
  const searchContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const geocoderRef = useRef(null)
  const autocompleteRef = useRef(null)

  const [sdkState, setSdkState] = useState('loading') // loading | ready | error | no-key
  const [loadError, setLoadError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected] = useState(initialLocation) // parsed location object
  const [confirmed, setConfirmed] = useState(Boolean(initialLocation))
  const [locating, setLocating] = useState(false)

  // ── Reverse-geocode a lat/lng and update state + marker ──────────────────
  const resolveLatLng = useCallback((lat, lng, animateDrop = false) => {
    if (!geocoderRef.current) return

    setResolving(true)
    setConfirmed(false)

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setResolving(false)

      if (status !== 'OK' || !results || !results[0]) {
        // Geocoding failed but we still have a valid pin — degrade gracefully
        // rather than losing the selection entirely.
        setSelected({
          latitude: lat,
          longitude: lng,
          formatted_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          place_id: '',
          locality: '', city: '', state: '', country: '', postal_code: '',
        })
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

        // Search bar → Places API (New) Autocomplete Element. The legacy
        // `google.maps.places.Autocomplete` widget is blocked on API keys/
        // projects provisioned after March 2025 (ApiTargetBlockedMapError) —
        // PlaceAutocompleteElement is the current, supported replacement and
        // is what "Places API (New)" actually refers to.
        if (searchContainerRef.current && window.google.maps.places.PlaceAutocompleteElement) {
          searchContainerRef.current.innerHTML = ''
          const autocompleteEl = new window.google.maps.places.PlaceAutocompleteElement({
            includedRegionCodes: ['in'],
          })
          autocompleteEl.classList.add('lw-place-autocomplete')
          searchContainerRef.current.appendChild(autocompleteEl)

          autocompleteEl.addEventListener('gmp-select', async ({ placePrediction }) => {
            const place = placePrediction.toPlace()
            await place.fetchFields({ fields: ['location', 'formattedAddress', 'addressComponents', 'id'] })
            if (!place.location) return

            const lat = place.location.lat()
            const lng = place.location.lng()
            map.setZoom(16)

            const parsed = parseNewPlaceAddressComponents(place.addressComponents || [])
            setSelected({
              latitude: lat,
              longitude: lng,
              formatted_address: place.formattedAddress || '',
              place_id: place.id || '',
              ...parsed,
            })
            marker.setPosition({ lat, lng })
            marker.setAnimation(window.google.maps.Animation.DROP)
            map.panTo({ lat, lng })
            setConfirmed(false)
          })

          autocompleteRef.current = autocompleteEl
        }

        // If the wizard already has a confirmed pick (user hit "Back" and
        // returned to this step), we've already centered/marked it above —
        // nothing further to resolve. Otherwise, if there's just a free-text
        // location string from an earlier version of this step, prime the
        // map there via a one-off geocode.
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
      // Guards against React StrictMode's double-invoke in dev, which would
      // otherwise append a second PlaceAutocompleteElement into the same
      // container on remount.
      if (searchContainerRef.current) searchContainerRef.current.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (!selected) return
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
          The interactive map isn't configured for this environment. You can still type
          the location in the field below.
        </p>
        <input
          type="text"
          placeholder="e.g. Koramangala, Bangalore"
          defaultValue={initialQuery}
          onChange={(e) => onChange?.({
            latitude: null, longitude: null, formatted_address: e.target.value,
            place_id: '', locality: '', city: '', state: '', country: '', postal_code: '',
            free_text: e.target.value,
          })}
          className="w-full mt-2 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors text-sm"
        />
      </div>
    )
  }

  // ── Fallback: SDK failed to load (network / key rejected) ─────────────────
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
    <div className="flex flex-col gap-3">
      {/* Search bar — hosts the Places API (New) PlaceAutocompleteElement,
          injected imperatively once the SDK loads (see effect above). It's a
          shadow-DOM custom element, so it renders its own input + dropdown
          rather than a plain <input> we control directly. */}
      <div
        ref={searchContainerRef}
        className="lw-place-autocomplete-container rounded-xl overflow-hidden border border-zinc-800 focus-within:border-zinc-500 transition-colors bg-zinc-900/50"
      />
      {sdkState === 'ready' && !window.google?.maps?.places?.PlaceAutocompleteElement && (
        <p className="text-zinc-500 text-xs -mt-1">
          Search is unavailable in this browser session — use the map directly instead.
        </p>
      )}

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

        {/* Floating current-location control (Uber-style FAB) */}
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
      {selected && (
        <div className={[
          'rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 backdrop-blur-xl shadow-2xl',
          confirmed ? 'border-zinc-700/50 bg-zinc-800/30' : 'border-zinc-800 bg-zinc-900/50',
        ].join(' ')}>
          <div className="flex items-start gap-4">
            <MapPin size={18} className={confirmed ? 'text-zinc-400 flex-shrink-0 mt-0.5' : 'text-zinc-100 flex-shrink-0 mt-0.5'} />
            <div className="flex-1 min-w-0">
              <p className="text-zinc-100 text-sm font-medium leading-snug tracking-wide">
                {selected.formatted_address || 'Selected location'}
              </p>
              <p className="text-zinc-500 text-xs mt-1.5 font-light">
                {[selected.locality, selected.city, selected.state].filter(Boolean).join(', ') || '—'}
                {selected.postal_code ? ` · ${selected.postal_code}` : ''}
              </p>
              <p className="text-zinc-600 text-[10px] mt-2 font-mono uppercase tracking-widest">
                COORD: {selected.latitude?.toFixed(5)}, {selected.longitude?.toFixed(5)}
              </p>
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
            <a
              href={openInMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors flex-shrink-0"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}

      {!selected && sdkState === 'ready' && (
        <p className="text-zinc-600 text-xs text-center font-light mt-2">
          Search above, click anywhere on the map, or drag the pin to choose your exact location.
        </p>
      )}
    </div>
  )
}
