'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  activitySeries,
  magnitudeBuckets,
  type EarthquakeEvent,
  type TimeRange,
} from '@/lib/earthquakes';

export function ActivityChart({
  events,
  range,
}: {
  events: EarthquakeEvent[];
  range: TimeRange;
}) {
  const data = activitySeries(events, range);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 4, bottom: 0, left: -28 }}
      >
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9ff66" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#d9ff66" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="rgba(255,255,255,.06)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: '#747b89', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#747b89', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#10141c',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 10,
            fontSize: 11,
          }}
          labelStyle={{ color: '#aeb5c1' }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#d9ff66"
          strokeWidth={2}
          fill="url(#activityFill)"
          name="Eventos"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MagnitudeChart({
  events,
}: {
  events: EarthquakeEvent[];
}) {
  const data = magnitudeBuckets(events);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 4, bottom: 0, left: -28 }}
      >
        <CartesianGrid
          stroke="rgba(255,255,255,.06)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: '#747b89', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#747b89', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,.03)' }}
          contentStyle={{
            background: '#10141c',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 10,
            fontSize: 11,
          }}
        />
        <Bar
          dataKey="count"
          name="Terremotos"
          fill="#ff715b"
          radius={[5, 5, 1, 1]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
