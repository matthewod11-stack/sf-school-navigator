"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SEARCH_CONTEXT_STORAGE_KEY = "sf-school-nav-search-context";

interface LocationSectionProps {
  address: string | null;
  coordinates: { lng: number; lat: number } | null;
}

function haversineDistanceKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function LocationSection({ address, coordinates }: LocationSectionProps) {
  const [homeCoordinates, setHomeCoordinates] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_CONTEXT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        homeCoordinates?: { lng: number; lat: number } | null;
      };
      if (parsed.homeCoordinates) {
        setHomeCoordinates(parsed.homeCoordinates);
      }
    } catch {
      // Ignore malformed context.
    }
  }, []);

  const distanceKm = useMemo(() => {
    if (!homeCoordinates || !coordinates) return null;
    return haversineDistanceKm(homeCoordinates, coordinates);
  }, [homeCoordinates, coordinates]);

  const staticMapUrl = useMemo(() => {
    if (!coordinates) return null;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    const lng = coordinates.lng.toFixed(5);
    const lat = coordinates.lat.toFixed(5);
    const marker = `pin-s+3b82f6(${lng},${lat})`;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lng},${lat},14/700x260?access_token=${token}`;
  }, [coordinates]);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-lg font-semibold text-neutral-900">Location</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
            <span>{address ?? "Not yet verified"}</span>
            {distanceKm != null && (
              <span className="text-neutral-500">
                {distanceKm.toFixed(1)} km from home
              </span>
            )}
          </div>

          {staticMapUrl ? (
            <img
              src={staticMapUrl}
              alt="Map showing program location"
              className="h-44 w-full rounded-md border border-neutral-200 object-cover"
              loading="lazy"
            />
          ) : (
            <p className="text-xs text-neutral-500">
              Map preview unavailable.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
