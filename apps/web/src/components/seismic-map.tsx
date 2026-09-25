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
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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

        map.addSource('quake-clusters', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
          promoteId: 'id',
          cluster: true,
          clusterRadius: 46,
          clusterMaxZoom: 5,
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
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0,0,0,0)',
              0.15,
              'rgba(71,197,255,0.30)',
              0.35,
              'rgba(82,224,172,0.48)',
              0.55,
              'rgba(215,239,99,0.62)',
              0.75,
              'rgba(255,144,69,0.78)',
              1,
              'rgba(255,72,72,0.96)',
            ],
            'heatmap-opacity': 0.4,
          },
          layout: {
            visibility: 'visible',
          },
        });

        map.addLayer({
          id: 'quake-cluster-glow',
          type: 'circle',
          source: 'quake-clusters',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              25,
              20,
              31,
              100,
              39,
              500,
              47,
            ],
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#77d8be',
              20,
              '#d7ef63',
              100,
              '#ff9045',
              500,
              '#ff5c45',
            ],
            'circle-opacity': 0.16,
            'circle-blur': 0.5,
          },
          layout: {
            visibility: 'visible',
          },
        });

        map.addLayer({
          id: 'quake-clusters',
          type: 'circle',
          source: 'quake-clusters',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              14,
              20,
              18,
              100,
              23,
              500,
              29,
            ],
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#77d8be',
              20,
              '#d7ef63',
              100,
              '#ff9045',
              500,
              '#ff5c45',
            ],
            'circle-opacity': 0.95,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-stroke-opacity': 0.9,
          },
          layout: {
            visibility: 'visible',
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
              8,
              4,
              15,
              7,
              30,
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.32,
            'circle-blur': 0.72,
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
              4.5,
              3,
              6,
              4,
              8,
              5,
              10.5,
              7,
              14.5,
            ],
            'circle-color': ['get', 'color'],
            'circle-opacity': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-stroke-opacity': 0.95,
          },
          layout: {
            visibility: 'visible',
          },
        });

        map.addLayer({
          id: 'quake-epicenter-center',
          type: 'circle',
          source: 'quakes',
                    paint: {
            'circle-radius': 2.4,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#101318',
            'circle-stroke-width': 1,
            'circle-opacity': 1,
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
              12,
              7,
              24,
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
          'quake-clusters',
          (
            event: import('maplibre-gl').MapMouseEvent & {
              features?: import('maplibre-gl').MapGeoJSONFeature[];
            },
          ) => {
            const feature = event.features?.[0];

            if (
              !feature ||
              feature.geometry.type !== 'Point'
            ) {
              return;
            }

            const coordinates = feature.geometry.coordinates as [
              number,
              number,
            ];

            map.easeTo({
              center: coordinates,
              zoom: Math.min(map.getZoom() + 2.2, 7),
              duration: 650,
            });
          },
        );

        map.on('mouseenter', 'quake-clusters', () => {
          map.getCanvas().style.cursor = 'zoom-in';
        });

        map.on('mouseleave', 'quake-clusters', () => {
          map.getCanvas().style.cursor = '';
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
    const data = toFeatureCollection(events);
    const source = map?.getSource(
      'quakes',
    ) as import('maplibre-gl').GeoJSONSource | undefined;
    const clusterSource = map?.getSource(
      'quake-clusters',
    ) as import('maplibre-gl').GeoJSONSource | undefined;

    source?.setData(data);
    clusterSource?.setData(data);

    if (map && events.length > 0) {
      if (events.length === 1) {
        const event = events[0]!;
        map.easeTo({
          center: [event.longitude, event.latitude],
          zoom: 5,
          duration: 650,
        });
      } else {
        const longitudes = events.map((event) => event.longitude);
        const latitudes = events.map((event) => event.latitude);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const longitudeSpan = maxLon - minLon;

        if (longitudeSpan > 300) {
          map.easeTo({
            center: [0, 12],
            zoom: 1.2,
            duration: 650,
          });
        } else {
          map.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            {
              padding:
                containerRef.current?.clientWidth &&
                containerRef.current.clientWidth < 760
                  ? 54
                  : 86,
              maxZoom: 5,
              duration: 700,
            },
          );
        }
      }
    }

    map?.triggerRepaint();
  }, [events, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const clusterVisibility = mode === 'points' ? 'visible' : 'none';

    map.setLayoutProperty(
      'quake-cluster-glow',
      'visibility',
      clusterVisibility,
    );
    map.setLayoutProperty(
      'quake-clusters',
      'visibility',
      clusterVisibility,
    );

    // Exact USGS epicenters remain visible in both visualization modes.
    map.setLayoutProperty('quake-points', 'visibility', 'visible');
    map.setLayoutProperty('quake-glow', 'visibility', 'visible');
    map.setLayoutProperty(
      'quake-epicenter-center',
      'visibility',
      'visible',
    );
    map.setLayoutProperty('quake-hit', 'visibility', 'visible');

    // Keep a colored seismic-density layer below the pins in both modes.
    map.setLayoutProperty('quake-heat', 'visibility', 'visible');
    map.setPaintProperty(
      'quake-heat',
      'heatmap-opacity',
      mode === 'heat' ? 0.9 : 0.34,
    );

    map.setPaintProperty(
      'quake-points',
      'circle-opacity',
      mode === 'heat' ? 0.78 : 1,
    );
    map.setPaintProperty(
      'quake-glow',
      'circle-opacity',
      mode === 'heat' ? 0.18 : 0.32,
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
