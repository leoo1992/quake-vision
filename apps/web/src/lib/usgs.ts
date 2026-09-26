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
  minDepth,
}: {
  range: TimeRange;
  minMagnitude: number;
  minDepth: number;
}): Promise<EarthquakeDataset> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  if (apiUrl) {
    const params = new URLSearchParams({
      range,
      minMagnitude: String(minMagnitude),
      minDepth: String(minDepth),
    });

    const response = await fetch(
      apiUrl + '/api/earthquakes?' + params.toString(),
    );

    if (response.ok) {
      return (await response.json()) as EarthquakeDataset;
    }
  }

  const response = await fetch(
    buildUsgsQuery({ range, minMagnitude, minDepth }),
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
