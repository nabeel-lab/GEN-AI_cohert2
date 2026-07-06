import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// Dark, muted map styling to match the app's glass/navy design system instead
// of the default light Google Maps skin. Shared by the analysis-time
// LocationPicker and the results-page LocationMap so both look identical.
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a2436' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2436' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7d8ba1' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d4af37' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8a97ab' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f3329' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3548' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a2436' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9aa7bd' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4a63' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#252f42' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1824' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5a75' }] },
]

// Singleton loader — the JS API bootstrap must only be configured once per
// page, regardless of how many components (LocationPicker, results-page
// LocationMap) need it. Every caller awaits the same promise. Uses the
// current @googlemaps/js-api-loader v2 functional API (setOptions +
// importLibrary) — the older `Loader` class was removed in v2.
let loaderPromise = null

export function loadGoogleMaps() {
  if (loaderPromise) return loaderPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  setOptions({ key: apiKey, v: 'weekly' })

  // Each import both resolves its own library and populates the classic
  // window.google.maps.* namespace as a side effect, which is what the
  // rest of the app's code (Map, Marker, Geocoder, places.Autocomplete,
  // Animation) reads from.
  loaderPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('places'),
    importLibrary('geocoding'),
  ])

  return loaderPromise
}

export function hasMapsApiKey() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  return Boolean(apiKey) && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
}

// Parses a legacy Geocoder `address_components` array (long_name/short_name)
// into the flat shape the rest of the app (backend AnalysisRequest,
// LocationPicker UI) uses. Used for reverse-geocoding (map click / marker
// drag / current location) — the Geocoding API's response shape is
// unaffected by the Places API (New) migration.
export function parseAddressComponents(components = []) {
  const get = (type) => components.find((c) => c.types.includes(type))?.long_name || ''

  return {
    locality: get('sublocality_level_1') || get('neighborhood') || get('sublocality') || '',
    city: get('locality') || get('administrative_area_level_2') || '',
    state: get('administrative_area_level_1') || '',
    country: get('country') || '',
    postal_code: get('postal_code') || '',
  }
}

// Parses the Places API (New) `addressComponents` array — the
// PlaceAutocompleteElement / Place.fetchFields() result shape uses
// `longText`/`shortText` instead of the legacy `long_name`/`short_name`.
export function parseNewPlaceAddressComponents(components = []) {
  const get = (type) => components.find((c) => c.types.includes(type))?.longText || ''

  return {
    locality: get('sublocality_level_1') || get('neighborhood') || get('sublocality') || '',
    city: get('locality') || get('administrative_area_level_2') || '',
    state: get('administrative_area_level_1') || '',
    country: get('country') || '',
    postal_code: get('postal_code') || '',
  }
}
