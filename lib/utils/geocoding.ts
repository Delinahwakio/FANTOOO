/**
 * Geocoding utilities for location validation
 * Uses Google Maps Geocoding API
 */

export interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress: string
  success: boolean
  error?: string
}

/**
 * Validate location using Google Maps Geocoding API
 * @param location - Location string to validate
 * @returns Geocode result with coordinates
 */
export async function validateLocation(location: string): Promise<GeocodeResult> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error('Google Maps API key not configured')
      return {
        latitude: 0,
        longitude: 0,
        formattedAddress: location,
        success: false,
        error: 'Location validation service not configured',
      }
    }

    const encodedLocation = encodeURIComponent(location)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const { lat, lng } = result.geometry.location

      return {
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formatted_address,
        success: true,
      }
    }

    if (data.status === 'ZERO_RESULTS') {
      return {
        latitude: 0,
        longitude: 0,
        formattedAddress: location,
        success: false,
        error: 'Location not found',
      }
    }

    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: location,
      success: false,
      error: `Geocoding failed: ${data.status}`,
    }
  } catch (error) {
    console.error('Error validating location:', error)
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: location,
      success: false,
      error: 'Failed to validate location',
    }
  }
}

/**
 * Reverse geocode coordinates to get address
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Address string
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ address: string; success: boolean; error?: string }> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error('Google Maps API key not configured')
      return {
        address: '',
        success: false,
        error: 'Location service not configured',
      }
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return {
        address: data.results[0].formatted_address,
        success: true,
      }
    }

    return {
      address: '',
      success: false,
      error: `Reverse geocoding failed: ${data.status}`,
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return {
      address: '',
      success: false,
      error: 'Failed to reverse geocode',
    }
  }
}
