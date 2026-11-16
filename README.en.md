# QuakeVision

[Versão em português](README.md)

A seismic monitoring interface that transforms real data from the **USGS Earthquake Catalog** into an interactive global map, filters, metrics, and time-based analysis.

## Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Redux Toolkit, MapLibre GL, OpenFreeMap, and Recharts.

**Backend:** NestJS, in-memory cache for USGS requests, data proxy/normalization, and a Vercel-compatible serverless endpoint.

## Features

- WebGL world map and live USGS data
- 24-hour, 7-day, and 30-day periods
- Minimum magnitude and maximum depth filters
- Epicenter and heatmap modes
- Event list synchronized with map selection
- Magnitude, depth, tsunami, and felt-event metrics
- Magnitude distribution and hourly/daily activity charts
- Loading/error handling and responsive desktop/mobile layouts
- Direct USGS fallback when the NestJS API is unavailable

## Run locally

Requires Node.js 22.12+.

```bash
npm install
npm run dev:api
```

In a second terminal:

```bash
npm run dev:web
```

Web: http://localhost:3000  
API: http://localhost:3001

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

No API key is required for USGS or OpenFreeMap.

## Quality

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Data sources

Earthquake data comes from the USGS FDSN Event Web Service in GeoJSON. The map uses OpenFreeMap and MapLibre GL.
