import { describe, expect, it } from 'vitest';
import {
  activitySeries,
  buildUsgsQuery,
  datasetStats,
  magnitudeBuckets,
  normalizeEarthquake,
  type EarthquakeEvent,
  type UsgsFeature,
} from './earthquakes';

const feature: UsgsFeature = {
  type: 'Feature',
  id: 'test-id',
  properties: {
    mag: 5.4,
    place: '120 km south of Test',
    time: 1000,
    updated: 2000,
    url: 'https://example.com',
    detail: 'https://example.com/detail',
    felt: 12,
    cdi: 4.1,
    mmi: 3.2,
    alert: 'green',
    status: 'reviewed',
    tsunami: 0,
    sig: 500,
    net: 'us',
    code: 'test',
    type: 'earthquake',
    title: 'M 5.4',
  },
  geometry: {
    type: 'Point',
    coordinates: [-49.2, -28.6, 17],
  },
};

const events: EarthquakeEvent[] = [
  normalizeEarthquake(feature),
  {
    ...normalizeEarthquake(feature),
    id: 'b',
    magnitude: 3.5,
    depth: 10,
    time: 1000 + 60 * 60 * 1000,
  },
  {
    ...normalizeEarthquake(feature),
    id: 'c',
    magnitude: 6.2,
    depth: 30,
    time: 1000 + 2 * 60 * 60 * 1000,
    tsunami: true,
  },
];

describe('earthquake utilities', () => {
  it('normalizes GeoJSON features', () => {
    const quake = normalizeEarthquake(feature);
    expect(quake.id).toBe('test-id');
    expect(quake.magnitude).toBe(5.4);
    expect(quake.latitude).toBe(-28.6);
    expect(quake.depth).toBe(17);
  });

  it('builds a constrained USGS query', () => {
    const url = buildUsgsQuery({
      range: 'day',
      minMagnitude: 2.5,
      maxDepth: 300,
      now: Date.UTC(2026, 8, 25, 12),
    });

    expect(url).toContain('format=geojson');
    expect(url).toContain('minmagnitude=2.5');
    expect(url).toContain('maxdepth=300');
    expect(url).toContain('eventtype=earthquake');
  });

  it('creates magnitude buckets', () => {
    expect(magnitudeBuckets(events)).toEqual([
      { label: '< 3', count: 0 },
      { label: '3–4', count: 1 },
      { label: '4–5', count: 0 },
      { label: '5–6', count: 1 },
      { label: '6+', count: 1 },
    ]);
  });

  it('calculates aggregate statistics', () => {
    const stats = datasetStats(events);
    expect(stats.strongest?.magnitude).toBe(6.2);
    expect(stats.tsunamiCount).toBe(1);
    expect(stats.averageDepth).toBeGreaterThan(0);
  });

  it('aggregates activity into timeline buckets', () => {
    const series = activitySeries(events, 'day');
    expect(series.length).toBe(3);
    expect(series.reduce((sum, item) => sum + item.count, 0)).toBe(3);
  });
});
