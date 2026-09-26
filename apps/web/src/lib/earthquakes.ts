export type TimeRange = 'day' | 'week' | 'month';
export type MapMode = 'points' | 'heat';

export interface UsgsFeatureCollection {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  bbox?: number[];
  features: UsgsFeature[];
}

export interface UsgsFeature {
  type: 'Feature';
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    url: string;
    detail?: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: 'green' | 'yellow' | 'orange' | 'red' | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids?: string;
    sources?: string;
    types?: string;
    nst?: number | null;
    dmin?: number | null;
    rms?: number | null;
    gap?: number | null;
    magType?: string | null;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number];
  };
}

export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  longitude: number;
  latitude: number;
  depth: number;
  felt: number;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  tsunami: boolean;
  significance: number;
  status: string;
  type: string;
  magnitudeType: string | null;
  url: string;
  detailUrl: string | null;
}

export interface EarthquakeDataset {
  generated: number;
  sourceTitle: string;
  count: number;
  events: EarthquakeEvent[];
}

export const RANGE_MS: Record<TimeRange, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export function normalizeEarthquake(
  feature: UsgsFeature,
): EarthquakeEvent {
  const [longitude, latitude, depth] = feature.geometry.coordinates;

  return {
    id: feature.id,
    magnitude: feature.properties.mag ?? 0,
    place: feature.properties.place ?? 'Local não informado',
    time: feature.properties.time,
    updated: feature.properties.updated,
    longitude,
    latitude,
    depth,
    felt: feature.properties.felt ?? 0,
    cdi: feature.properties.cdi,
    mmi: feature.properties.mmi,
    alert: feature.properties.alert,
    tsunami: feature.properties.tsunami === 1,
    significance: feature.properties.sig,
    status: feature.properties.status,
    type: feature.properties.type,
    magnitudeType: feature.properties.magType ?? null,
    url: feature.properties.url,
    detailUrl: feature.properties.detail ?? null,
  };
}

export function normalizeDataset(
  collection: UsgsFeatureCollection,
): EarthquakeDataset {
  return {
    generated: collection.metadata.generated,
    sourceTitle: collection.metadata.title,
    count: collection.metadata.count,
    events: collection.features
      .map(normalizeEarthquake)
      .filter((event) => event.type === 'earthquake'),
  };
}

export function buildUsgsQuery({
  range,
  minMagnitude,
  minDepth,
  now = Date.now(),
}: {
  range: TimeRange;
  minMagnitude: number;
  minDepth: number;
  now?: number;
}) {
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: new Date(now - RANGE_MS[range]).toISOString(),
    endtime: new Date(now).toISOString(),
    minmagnitude: String(minMagnitude),
    mindepth: String(minDepth),
    orderby: 'time',
    eventtype: 'earthquake',
    limit: '2000',
  });

  return (
    'https://earthquake.usgs.gov/fdsnws/event/1/query?' +
    params.toString()
  );
}

export function getMagnitudeColor(magnitude: number) {
  if (magnitude >= 7) return '#ff3b57';
  if (magnitude >= 6) return '#ff5c45';
  if (magnitude >= 5) return '#ff9045';
  if (magnitude >= 4) return '#ffd34e';
  if (magnitude >= 3) return '#d7ef63';
  return '#77d8be';
}

export function formatMagnitude(value: number) {
  return value.toFixed(1);
}

export function formatDepth(value: number) {
  return Math.round(value) + ' km';
}

export function formatRelativeTime(time: number, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return 'há ' + minutes + ' min';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return 'há ' + hours + ' h';
  const days = Math.floor(hours / 24);
  return 'há ' + days + ' d';
}

export function magnitudeBuckets(events: EarthquakeEvent[]) {
  const buckets = [
    { label: '< 3', min: -Infinity, max: 3, count: 0 },
    { label: '3–4', min: 3, max: 4, count: 0 },
    { label: '4–5', min: 4, max: 5, count: 0 },
    { label: '5–6', min: 5, max: 6, count: 0 },
    { label: '6+', min: 6, max: Infinity, count: 0 },
  ];

  events.forEach((event) => {
    const bucket = buckets.find(
      (item) => event.magnitude >= item.min && event.magnitude < item.max,
    );
    if (bucket) bucket.count += 1;
  });

  return buckets.map(({ label, count }) => ({ label, count }));
}

export function activitySeries(
  events: EarthquakeEvent[],
  range: TimeRange,
  localeTag = 'pt-BR',
) {
  const bucketMs =
    range === 'day'
      ? 60 * 60 * 1000
      : range === 'week'
        ? 6 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
  const buckets = new Map<number, number>();

  events.forEach((event) => {
    const key = Math.floor(event.time / bucketMs) * bucketMs;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, count]) => ({
      time,
      label:
        range === 'month'
          ? new Intl.DateTimeFormat(localeTag, {
              day: '2-digit',
              month: '2-digit',
            }).format(time)
          : new Intl.DateTimeFormat(localeTag, {
              hour: '2-digit',
              minute: '2-digit',
            }).format(time),
      count,
    }));
}

export function datasetStats(events: EarthquakeEvent[]) {
  if (events.length === 0) {
    return {
      strongest: null,
      averageMagnitude: 0,
      averageDepth: 0,
      tsunamiCount: 0,
      feltCount: 0,
    };
  }

  const strongest = [...events].sort(
    (a, b) => b.magnitude - a.magnitude,
  )[0]!;
  const averageMagnitude =
    events.reduce((sum, event) => sum + event.magnitude, 0) /
    events.length;
  const averageDepth =
    events.reduce((sum, event) => sum + event.depth, 0) /
    events.length;

  return {
    strongest,
    averageMagnitude,
    averageDepth,
    tsunamiCount: events.filter((event) => event.tsunami).length,
    feltCount: events.reduce((sum, event) => sum + event.felt, 0),
  };
}
