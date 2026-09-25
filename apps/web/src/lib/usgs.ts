import {
  buildUsgsQuery,
  normalizeDataset,
  type EarthquakeDataset,
  type TimeRange,
  type UsgsFeatureCollection,
} from './earthquakes';

export async function loadEarthquakes({
  range,
  minMagnitude,
  maxDepth,
}: {
  range: TimeRange;
  minMagnitude: number;
  maxDepth: number;
}): Promise<EarthquakeDataset> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  if (apiUrl) {
    const params = new URLSearchParams({
      range,
      minMagnitude: String(minMagnitude),
      maxDepth: String(maxDepth),
    });

    const response = await fetch(
      apiUrl + '/api/earthquakes?' + params.toString(),
    );

    if (response.ok) {
      return (await response.json()) as EarthquakeDataset;
    }
  }

  const response = await fetch(
    buildUsgsQuery({ range, minMagnitude, maxDepth }),
    {
      headers: {
        Accept: 'application/geo+json, application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      'USGS respondeu com status ' + response.status + '.',
    );
  }

  const collection =
    (await response.json()) as UsgsFeatureCollection;

  return normalizeDataset(collection);
}
