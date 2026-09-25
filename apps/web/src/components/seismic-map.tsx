'use client';

import { useEffect, useRef } from 'react';
import type {
  EarthquakeEvent,
  MapMode,
} from '@/lib/earthquakes';
import { getMagnitudeColor } from '@/lib/earthquakes';

interface SeismicMapProps {
  events: EarthquakeEvent[];
  selectedId: string | null;
  mode: MapMode;
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
        weight: Math.max(0.12, event.magnitude / 8),
      },
    })),
  };
}

export function SeismicMap({
  events,
  selectedId,
  mode,
  onSelect,
}: SeismicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;

    void import('maplibre-gl').then((module) => {
      if (disposed || !containerRef.current) return;

      const maplibregl = module.default;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
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
            'circle-stroke-color': '#d9ff66',
            'circle-stroke-width': 2.5,
            'circle-stroke-opacity': 0.95,
          },
        });

        map.on('click', 'quake-points', (event) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id as string | undefined;
          if (id) onSelectRef.current(id);
        });

        map.on('mouseenter', 'quake-points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'quake-points', () => {
          map.getCanvas().style.cursor = '';
        });
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
