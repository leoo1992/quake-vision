'use client';

import { useEffect, useRef, useState } from 'react';
import type { ThemePreference } from '@/components/experience-provider';
import type {
  EarthquakeEvent,
  MapMode,
} from '@/lib/earthquakes';
import { getMagnitudeColor } from '@/lib/earthquakes';

interface SeismicMapProps {
  events: EarthquakeEvent[];
  selectedId: string | null;
  mode: MapMode;
  theme: ThemePreference;
  onSelect: (id: string) => void;
}

function toFeatureCollection(events: EarthquakeEvent[]) {
  return {
    type: 'FeatureCollection' as const,
    features: events.map((event) => ({
      type: 'Feature' as const,
      id: event.id,
      geometry: {
        type: 'Point' as const,
        coordinates: [event.longitude, event.latitude],
      },
      properties: {
        id: event.id,
        magnitude: event.magnitude,
        depth: event.depth,
        place: event.place,
        color: getMagnitudeColor(event.magnitude),
      },
    })),
  };
}

function rasterPaint(theme: ThemePreference) {
  return theme === 'dark'
    ? {
        'raster-saturation': -1,
        'raster-contrast': 0.42,
        'raster-brightness-min': 0.02,
        'raster-brightness-max': 0.28,
      }
    : {
        'raster-saturation': -0.04,
        'raster-contrast': 0,
        'raster-brightness-min': 0.08,
        'raster-brightness-max': 1,
      };
}

function baseStyle(theme: ThemePreference): import('maplibre-gl').StyleSpecification {
  return {
    version: 8,
    sources: {
      'osm-base': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'map-background',
        type: 'background',
        paint: {
          'background-color': theme === 'dark' ? '#07090d' : '#eef1ed',
        },
      },
      {
        id: 'osm-basemap',
        type: 'raster',
        source: 'osm-base',
        paint: rasterPaint(theme),
      },
    ],
  };
}

export function SeismicMap({
  events,
  selectedId,
  mode,
  theme,
  onSelect,
}: SeismicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const initialThemeRef = useRef(theme);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;

    void import('maplibre-gl').then((maplibregl) => {
      if (disposed || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: baseStyle(initialThemeRef.current),
        center: [8, 18],
        zoom: 1.45,
        minZoom: 1,
        maxZoom: 10,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          visualizePitch: true,
        }),
        'bottom-right',
      );

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: 'Earthquakes: USGS',
        }),
      );

      map.on('load', () => {
        if (disposed) return;

        map.addSource('quakes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
          promoteId: 'id',
        });

        map.addLayer({
          id: 'quake-heat',
          type: 'heatmap',
          source: 'quakes',
          maxzoom: 8,
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'magnitude'],
              0,
              0,
              8,
              1,
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              0.7,
              7,
              1.9,
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              10,
              7,
              42,
            ],
            'heatmap-opacity': 0.88,
          },
          layout: {
            visibility: 'none',
          },
        });

        map.addLayer({
          id: 'quake-glow',
          type: 'circle',
          source: 'quakes',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'magnitude'],
              1,
              7,
              4,
              14,
              7,
              29,
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.22,
            'circle-blur': 0.75,
          },
          layout: {
            visibility: 'visible',
          },
        });

        map.addLayer({
          id: 'quake-points',
          type: 'circle',
          source: 'quakes',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'magnitude'],
              1,
              4,
              3,
              5,
              4,
              7,
              5,
              9,
              7,
              13,
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.98,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-stroke-opacity': 0.82,
          },
          layout: {
            visibility: 'visible',
          },
        });

        map.addLayer({
          id: 'quake-hit',
          type: 'circle',
          source: 'quakes',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'magnitude'],
              1,
              11,
              7,
              22,
            ],
            'circle-opacity': 0,
          },
        });

        map.addSource('selected-quake', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        map.addLayer({
          id: 'selected-quake-ring',
          type: 'circle',
          source: 'selected-quake',
          paint: {
            'circle-radius': 19,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': '#b8ed3f',
            'circle-stroke-width': 3,
            'circle-stroke-opacity': 1,
          },
        });

        map.on(
          'click',
          'quake-hit',
          (
            event: import('maplibre-gl').MapMouseEvent & {
              features?: import('maplibre-gl').MapGeoJSONFeature[];
            },
          ) => {
            const feature = event.features?.[0];
            const id = feature?.properties?.id as string | undefined;
            if (id) onSelectRef.current(id);
          },
        );

        map.on('mouseenter', 'quake-hit', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'quake-hit', () => {
          map.getCanvas().style.cursor = '';
        });

        setMapReady(true);
      });

      map.on('error', (event) => {
        if (event.error) {
          console.warn(
            'QuakeVision map resource error:',
            event.error.message,
          );
        }
      });

      mapRef.current = map;
    });

    return () => {
      disposed = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map || !map.getLayer('osm-basemap')) return;

    const paint = rasterPaint(theme);

    map.setPaintProperty(
      'osm-basemap',
      'raster-saturation',
      paint['raster-saturation'],
    );
    map.setPaintProperty(
      'osm-basemap',
      'raster-contrast',
      paint['raster-contrast'],
    );
    map.setPaintProperty(
      'osm-basemap',
      'raster-brightness-min',
      paint['raster-brightness-min'],
    );
    map.setPaintProperty(
      'osm-basemap',
      'raster-brightness-max',
      paint['raster-brightness-max'],
    );

    map.setPaintProperty(
      'map-background',
      'background-color',
      theme === 'dark' ? '#07090d' : '#eef1ed',
    );

    map.triggerRepaint();
  }, [mapReady, theme]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    const source = map?.getSource(
      'quakes',
    ) as import('maplibre-gl').GeoJSONSource | undefined;

    source?.setData(toFeatureCollection(events));
    map?.triggerRepaint();
  }, [events, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const pointVisibility = mode === 'points' ? 'visible' : 'none';
    const heatVisibility = mode === 'heat' ? 'visible' : 'none';

    map.setLayoutProperty(
      'quake-points',
      'visibility',
      pointVisibility,
    );
    map.setLayoutProperty(
      'quake-glow',
      'visibility',
      pointVisibility,
    );
    map.setLayoutProperty(
      'quake-heat',
      'visibility',
      heatVisibility,
    );

    map.triggerRepaint();
  }, [mapReady, mode]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const selected = events.find((event) => event.id === selectedId);
    const source = map.getSource(
      'selected-quake',
    ) as import('maplibre-gl').GeoJSONSource | undefined;

    if (!source) return;

    if (!selected) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
      map.triggerRepaint();
      return;
    }

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [selected.longitude, selected.latitude],
          },
          properties: {},
        },
      ],
    });

    map.easeTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(map.getZoom(), 4.2),
      duration: 900,
    });
  }, [events, mapReady, selectedId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      data-map-ready={mapReady}
      aria-label="Interactive earthquake map"
    />
  );
}
