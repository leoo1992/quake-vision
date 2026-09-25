import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

type TimeRange = 'day' | 'week' | 'month';

interface UsgsFeatureCollection {
  metadata: {
    generated: number;
    title: string;
    count: number;
  };
  features: Array<{
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
      alert: string | null;
      status: string;
      tsunami: number;
      sig: number;
      magType?: string | null;
      type: string;
    };
    geometry: {
      coordinates: [number, number, number];
    };
  }>;
}

export interface Dataset {
  generated: number;
  sourceTitle: string;
  count: number;
  events: Array<{
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
  }>;
}

const RANGE_MS: Record<TimeRange, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseRange(value?: string): TimeRange {
  return value === 'week' || value === 'month' ? value : 'day';
}

@Injectable()
export class EarthquakesService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; data: Dataset }
  >();

  async getEarthquakes(input: {
    range?: string;
    minMagnitude?: string;
    maxDepth?: string;
  }): Promise<Dataset> {
    const range = parseRange(input.range);
    const minMagnitude = clamp(
      Number(input.minMagnitude ?? 2.5) || 0,
      0,
      9.9,
    );
    const maxDepth = clamp(
      Number(input.maxDepth ?? 700) || 700,
      1,
      1000,
    );
    const cacheKey = range + ':' + minMagnitude + ':' + maxDepth;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const now = Date.now();
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: new Date(now - RANGE_MS[range]).toISOString(),
      endtime: new Date(now).toISOString(),
      minmagnitude: String(minMagnitude),
      maxdepth: String(maxDepth),
      orderby: 'time',
      eventtype: 'earthquake',
      limit: '2000',
    });

    const response = await fetch(
      'https://earthquake.usgs.gov/fdsnws/event/1/query?' +
        params.toString(),
      {
        headers: {
          Accept: 'application/geo+json, application/json',
          'User-Agent': 'QuakeVision/1.0',
        },
      },
    );

    if (!response.ok) {
      throw new BadGatewayException(
        'USGS respondeu com status ' + response.status + '.',
      );
    }

    const collection =
      (await response.json()) as UsgsFeatureCollection;

    const data: Dataset = {
      generated: collection.metadata.generated,
      sourceTitle: collection.metadata.title,
      count: collection.metadata.count,
      events: collection.features
        .filter((feature) => feature.properties.type === 'earthquake')
        .map((feature) => {
          const [longitude, latitude, depth] =
            feature.geometry.coordinates;

          return {
            id: feature.id,
            magnitude: feature.properties.mag ?? 0,
            place:
              feature.properties.place ?? 'Local não informado',
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
        }),
    };

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + 60_000,
      data,
    });

    return data;
  }
}
