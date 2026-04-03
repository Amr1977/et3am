interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  area?: string;
  country?: string;
  fullAddress?: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  suburb?: string;
  district?: string;
  neighbourhood?: string;
  county?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface CacheEntry {
  data: GeoLocation;
  timestamp: number;
}

const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_DELAY = 1000;

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url);
}

function getCacheKey(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  return `${roundedLat},${roundedLng}`;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
  const cacheKey = getCacheKey(latitude, longitude);
  
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Geocoding] Cache hit for ${cacheKey}`);
    return cached.data;
  }
  
  console.log(`[Geocoding] Fetching for ${latitude}, ${longitude}`);
  
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&language=en`;
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json() as NominatimResponse;
    
    const address = data.address || {};
    const result: GeoLocation = {
      latitude,
      longitude,
      city: address.city || address.town || address.village || address.municipality || address.state || 'Unknown',
      area: address.suburb || address.district || address.neighbourhood || address.county || undefined,
      country: address.country || 'Unknown',
      fullAddress: data.display_name,
    };
    
    geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    console.log(`[Geocoding] Result: ${result.city}, ${result.area || 'no area'}`);
    
    return result;
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return {
      latitude,
      longitude,
      city: 'Unknown',
      area: undefined,
      country: 'Unknown',
    };
  }
}

export function getCachedLocation(latitude: number, longitude: number): GeoLocation | null {
  const cacheKey = getCacheKey(latitude, longitude);
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}

export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

export function getCacheStats(): { size: number; oldest: number } {
  const entries = Array.from(geocodeCache.values());
  const oldest = entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0;
  
  return {
    size: geocodeCache.size,
    oldest,
  };
}
