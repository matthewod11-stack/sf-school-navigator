"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SF_MAP_CENTER, SF_MAP_ZOOM, SF_MAP_BOUNDS } from "@/lib/config/cities/sf";
import type { ProgramType } from "@/types/domain";

// Pin colors by program type
const PIN_COLORS: Record<ProgramType, string> = {
  center: "#2563eb",        // brand-600 blue
  "family-home": "#16a34a", // green
  "sfusd-prek": "#9333ea",  // purple
  "sfusd-tk": "#7c3aed",    // violet
  "sfusd-elementary": "#4f46e5", // indigo
  "private-elementary": "#0f766e", // teal
  "charter-elementary": "#0369a1", // sky
  "head-start": "#dc2626",  // red
  montessori: "#ea580c",    // orange
  waldorf: "#ca8a04",       // yellow
  religious: "#0891b2",     // cyan
  "co-op": "#be185d",       // pink
  other: "#6b7280",         // gray
};

// SVG shapes by category for accessibility
// circle = center, square = home-based, diamond = SFUSD, triangle = other
function getPinShape(type: ProgramType): "circle" | "square" | "diamond" | "triangle" {
  switch (type) {
    case "center":
    case "montessori":
    case "waldorf":
    case "co-op":
      return "circle";
    case "family-home":
      return "square";
    case "sfusd-prek":
    case "sfusd-tk":
    case "sfusd-elementary":
    case "private-elementary":
    case "charter-elementary":
    case "head-start":
      return "diamond";
    case "religious":
    case "other":
    default:
      return "triangle";
  }
}

export interface MapProgram {
  id: string;
  name: string;
  primaryType: ProgramType;
  coordinates: { lng: number; lat: number };
  matchTier?: "strong" | "good" | "partial" | "hidden" | null;
  address?: string | null;
}

export interface MapContainerHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  highlightPin: (programId: string | null) => void;
}

interface MapContainerProps {
  programs: MapProgram[];
  homeCoordinates?: { lng: number; lat: number } | null;
  attendanceArea?: {
    id: string;
    name: string;
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  } | null;
  showAttendanceArea?: boolean;
  onProgramClick?: (programId: string) => void;
  className?: string;
}

function createPinSvg(
  shape: "circle" | "square" | "diamond" | "triangle",
  color: string,
  scored: boolean
): string {
  const size = scored ? 28 : 20;
  const half = size / 2;
  const fill = scored ? color : "white";
  const stroke = color;
  const sw = scored ? 0 : 2;

  let shapeEl: string;
  switch (shape) {
    case "circle":
      shapeEl = `<circle cx="${half}" cy="${half}" r="${half - 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case "square":
      shapeEl = `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case "diamond":
      shapeEl = `<polygon points="${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
    case "triangle":
      shapeEl = `<polygon points="${half},2 ${size - 2},${size - 2} 2,${size - 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shapeEl}</svg>`;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MapContainer = forwardRef<MapContainerHandle, MapContainerProps>(
  function MapContainer(
    {
      programs,
      homeCoordinates,
      attendanceArea,
      showAttendanceArea = false,
      onProgramClick,
      className = "",
    },
    ref
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Expose imperative API for parent components
  useImperativeHandle(ref, () => ({
    flyTo(lng: number, lat: number, zoom?: number) {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: [lng, lat],
        zoom: zoom ?? map.getZoom(),
        duration: 800,
      });
    },
    highlightPin(programId: string | null) {
      const map = mapRef.current;
      if (!map) return;
      if (!map.getLayer("unclustered-point-highlight")) return;
      if (programId) {
        map.setFilter("unclustered-point-highlight", [
          "==",
          ["get", "id"],
          programId,
        ]);
      } else {
        map.setFilter("unclustered-point-highlight", [
          "==",
          ["get", "id"],
          "",
        ]);
      }
    },
  }));

  // Initialize map
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [SF_MAP_CENTER.lng, SF_MAP_CENTER.lat],
      zoom: SF_MAP_ZOOM,
      maxBounds: [
        [SF_MAP_BOUNDS.sw.lng, SF_MAP_BOUNDS.sw.lat],
        [SF_MAP_BOUNDS.ne.lng, SF_MAP_BOUNDS.ne.lat],
      ],
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update program data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Build GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: programs.map((p) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [p.coordinates.lng, p.coordinates.lat],
        },
        properties: {
          id: p.id,
          name: p.name,
          primaryType: p.primaryType,
          scored: p.matchTier != null && p.matchTier !== "hidden",
          address: p.address ?? "",
        },
      })),
    };

    // Create pin images for each program type
    const imagePromises: Promise<void>[] = [];
    const seenImages = new Set<string>();

    for (const p of programs) {
      const shape = getPinShape(p.primaryType);
      const color = PIN_COLORS[p.primaryType];
      const scored = p.matchTier != null && p.matchTier !== "hidden";

      for (const s of [true, false]) {
        const key = `pin-${p.primaryType}-${s ? "scored" : "basic"}`;
        if (seenImages.has(key)) continue;
        seenImages.add(key);

        const svg = createPinSvg(shape, color, s);
        const size = s ? 28 : 20;

        if (!map.hasImage(key)) {
          const promise = new Promise<void>((resolve) => {
            const img = new Image(size, size);
            img.onload = () => {
              if (!map.hasImage(key)) {
                map.addImage(key, img);
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = svgToDataUrl(svg);
          });
          imagePromises.push(promise);
        }
      }
    }

    // Deduplicate: ignore 'scored' variable — just need both variants loaded
    void Promise.all(imagePromises).then(() => {
      // Source
      if (map.getSource("programs")) {
        (map.getSource("programs") as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource("programs", {
          type: "geojson",
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Cluster circles
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "programs",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#bfdbfe", // brand-200
              5,
              "#93c5fd", // brand-300
              15,
              "#60a5fa", // brand-400
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              5,
              24,
              15,
              30,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#2563eb",
          },
        });

        // Cluster count labels
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "programs",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 13,
          },
          paint: {
            "text-color": "#1e40af",
          },
        });

        // Individual pins
        map.addLayer({
          id: "program-pins",
          type: "symbol",
          source: "programs",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": [
              "concat",
              "pin-",
              ["get", "primaryType"],
              "-",
              ["case", ["get", "scored"], "scored", "basic"],
            ],
            "icon-allow-overlap": true,
            "icon-size": 1,
          },
        });

        // Highlight ring for selected pin (controlled via imperative API)
        map.addLayer({
          id: "unclustered-point-highlight",
          type: "circle",
          source: "programs",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "circle-radius": 18,
            "circle-color": "transparent",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#2d6a4f",
            "circle-opacity": 0.8,
          },
        });

        // Click cluster to zoom
        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          if (clusterId == null) return;
          (map.getSource("programs") as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err || zoom == null) return;
              const geometry = features[0].geometry;
              if (geometry.type !== "Point") return;
              map.easeTo({
                center: geometry.coordinates as [number, number],
                zoom,
              });
            }
          );
        });

        // Click pin to show popup / callback
        map.on("click", "program-pins", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["program-pins"],
          });
          if (!features.length) return;
          const props = features[0].properties;
          if (!props) return;

          const geometry = features[0].geometry;
          if (geometry.type !== "Point") return;
          const coords = geometry.coordinates as [number, number];

          new mapboxgl.Popup({ offset: 15, maxWidth: "280px" })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-family:Inter,sans-serif">
                <strong style="font-size:14px">${props.name}</strong>
                ${props.address ? `<p style="font-size:12px;color:#6b7280;margin:4px 0 0">${props.address}</p>` : ""}
                <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;text-transform:capitalize">${(props.primaryType as string).replace(/-/g, " ")}</p>
              </div>`
            )
            .addTo(map);

          onProgramClick?.(props.id as string);
        });

        // Cursor change on hover
        map.on("mouseenter", "program-pins", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "program-pins", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });
  }, [programs, mapLoaded, onProgramClick]);

  // Attendance area overlay (fill + border)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = "attendance-area";
    const fillLayerId = "attendance-area-fill";
    const lineLayerId = "attendance-area-outline";

    const ensureLayers = () => {
      if (!map.getLayer(fillLayerId)) {
        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#2563eb",
            "fill-opacity": 0.12,
          },
        });
      }

      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#1d4ed8",
            "line-width": 2,
            "line-opacity": 0.75,
          },
        });
      }
    };

    if (!attendanceArea) {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    const featureCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: attendanceArea.geometry,
          properties: { id: attendanceArea.id, name: attendanceArea.name },
        },
      ],
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(
        featureCollection
      );
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: featureCollection,
      });
    }

    ensureLayers();
    map.setLayoutProperty(
      fillLayerId,
      "visibility",
      showAttendanceArea ? "visible" : "none"
    );
    map.setLayoutProperty(
      lineLayerId,
      "visibility",
      showAttendanceArea ? "visible" : "none"
    );
  }, [attendanceArea, showAttendanceArea, mapLoaded]);

  // Add home marker
  const homeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove existing
    homeMarkerRef.current?.remove();
    homeMarkerRef.current = null;

    if (homeCoordinates) {
      const el = document.createElement("div");
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#ef4444";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";

      homeMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([homeCoordinates.lng, homeCoordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 10 }).setHTML(
            '<div style="font-family:Inter,sans-serif;font-size:12px">Your approximate location</div>'
          )
        )
        .addTo(map);
    }
  }, [homeCoordinates, mapLoaded]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <p className="text-sm text-neutral-500">
          Map unavailable: Mapbox token not configured.
        </p>
      </div>
    );
  }

  return (
    <div
      role="application"
      aria-label="Program locations map"
      aria-roledescription="Interactive map"
      className={className}
    >
      <div className="sr-only">
        Map showing program locations. Use arrow keys to pan, plus and minus to zoom.
      </div>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
  }
);
