// Geocode-and-discard flow
// 1. Accept raw address string
// 2. Call Mapbox geocoding API
// 3. Fuzz coordinates to ~200m radius
// 4. Determine attendance area via Supabase PostGIS query
// 5. Return fuzzed coordinates + attendance area
// 6. NEVER store or log the raw address

import type { GeocodeResult } from "@/types/api";
import { createClient } from "@/lib/supabase/server";

const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

// ~200m fuzz in degrees (at SF latitude, 1 degree ≈ 111km)
const FUZZ_RADIUS_DEGREES = 0.002;

interface MapboxFeature {
  center: [number, number]; // [lng, lat]
  place_name: string;
  relevance: number;
}

interface MapboxGeocodeResponse {
  features: MapboxFeature[];
}

/**
 * Geocode an address, fuzz the coordinates, find attendance area, and discard the raw address.
 *
 * PRIVACY: The raw address is only held in memory during this function call.
 * It is never logged, stored in the database, or sent to analytics.
 */
export async function geocodeAndDiscard(
  rawAddress: string
): Promise<GeocodeResult> {
  // Step 1: Geocode via Mapbox
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN environment variable is required");
  }

  const encoded = encodeURIComponent(rawAddress);
  const url = `${MAPBOX_GEOCODE_URL}/${encoded}.json?access_token=${token}&country=US&bbox=-122.5155,37.708,-122.357,37.812&limit=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed: ${response.status}`);
  }

  const data: MapboxGeocodeResponse = await response.json();
  if (data.features.length === 0) {
    throw new Error("Address not found. Please enter a valid San Francisco address.");
  }

  const [lng, lat] = data.features[0].center;

  // Step 2: Fuzz coordinates (~200m random offset)
  const fuzzed = fuzzCoordinates(lng, lat);

  // Step 3: Find attendance area via PostGIS point-in-polygon
  const attendanceArea = await findAttendanceArea(fuzzed.lng, fuzzed.lat);

  // rawAddress is now out of scope — never stored
  return {
    fuzzedCoordinates: fuzzed,
    attendanceAreaId: attendanceArea?.id ?? null,
    attendanceAreaName: attendanceArea?.name ?? null,
  };
}

/**
 * Add random noise to coordinates within ~200m radius.
 * Uses uniform random distribution in a circle.
 */
export function fuzzCoordinates(
  lng: number,
  lat: number
): { lng: number; lat: number } {
  const angle = Math.random() * 2 * Math.PI;
  const radius = Math.random() * FUZZ_RADIUS_DEGREES;
  return {
    lng: lng + radius * Math.cos(angle),
    lat: lat + radius * Math.sin(angle),
  };
}

async function findAttendanceArea(
  lng: number,
  lat: number
): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("find_attendance_area", {
    point_lng: lng,
    point_lat: lat,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return { id: data[0].id, name: data[0].name };
}
