'use client';

import { useEffect, useRef } from 'react';
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
        'raster-saturation': -0.92,
        'raster-contrast': 0.25,
        'raster-brightness-min': 0.04,
        'raster-brightness-max': 0.42,
      }
    : {
        'raster-saturation': -0.12,
        'raster-contrast': 0.03,
        'raster-brightness-min': 0.12,
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
          'background-color': theme === 'dark' ? '#0a0d11' : '#e8ece8',
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
        map.addSource('quakes', {
          type: 'geojson',
          data: toFeatureCollection(events),
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
              0.65,
              7,
              1.75,
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              8,
              7,
              38,
            ],
            'heatmap-opacity': 0.82,
          },
          layout: {
            visibility: mode === 'heat' ? 'visible' : 'none',
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
              5,
              4,
              11,
              7,
              24,
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.14,
            'circle-blur': 0.75,
          },
          layout: {
            visibility: mode === 'points' ? 'visible' : 'none',
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
              3,
              4,
              5.5,
              7,
              10,
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.92,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 0.65,
            'circle-stroke-opacity': 0.5,
          },
          layout: {
            visibility: mode === 'points' ? 'visible' : 'none',
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
              10,
              7,
              20,
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
            'circle-radius': 17,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': '#b8ed3f',
            'circle-stroke-width': 2.5,
            'circle-stroke-opacity': 0.95,
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
      });

      map.on('error', (event) => {
        if (event.error) {
          console.warn('QuakeVision map resource error:', event.error.message);
        }
      });

      mapRef.current = map;
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer('osm-basemap')) return;

    const paint = rasterPaint(theme);
    Object.entries(paint).forEach(([property, value]) => {
      map.setPaintProperty('osm-basemap', property, value);
    });

    if (map.getLayer('map-background')) {
      map.setPaintProperty(
        'map-background',
        'background-color',
        theme === 'dark' ? '#0a0d11' : '#e8ece8',
      );
    }
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const source = map.getSource(
      'quakes',
    ) as import('maplibre-gl').GeoJSONSource | undefined;

    source?.setData(toFeatureCollection(events));
  }, [events]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const visibility = mode === 'points' ? 'visible' : 'none';
    const heatVisibility = mode === 'heat' ? 'visible' : 'none';

    if (map.getLayer('quake-points')) {
      map.setLayoutProperty('quake-points', 'visibility', visibility);
    }
    if (map.getLayer('quake-glow')) {
      map.setLayoutProperty('quake-glow', 'visibility', visibility);
    }
    if (map.getLayer('quake-heat')) {
      map.setLayoutProperty('quake-heat', 'visibility', heatVisibility);
    }
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

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
  }, [events, selectedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
