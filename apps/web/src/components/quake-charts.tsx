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
import { useExperience } from '@/components/experience-provider';
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
  const { localeTag, theme, t } = useExperience();
  const data = activitySeries(events, range, localeTag);
  const axis = theme === 'dark' ? '#747b89' : '#626b78';
  const grid = theme === 'dark'
    ? 'rgba(255,255,255,.06)'
    : 'rgba(22,30,42,.10)';
  const tooltipBackground = theme === 'dark' ? '#10141c' : '#ffffff';
  const tooltipBorder = theme === 'dark'
    ? '1px solid rgba(255,255,255,.12)'
    : '1px solid rgba(22,30,42,.14)';
  const tooltipText = theme === 'dark' ? '#aeb5c1' : '#303844';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 4, bottom: 0, left: -28 }}
      >
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9db22" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#a9db22" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: tooltipBackground,
            border: tooltipBorder,
            borderRadius: 10,
            fontSize: 11,
            color: tooltipText,
          }}
          labelStyle={{ color: tooltipText }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#b8ed3f"
          strokeWidth={2}
          fill="url(#activityFill)"
          name={t('eventsChart')}
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
  const { theme, t } = useExperience();
  const data = magnitudeBuckets(events);
  const axis = theme === 'dark' ? '#747b89' : '#626b78';
  const grid = theme === 'dark'
    ? 'rgba(255,255,255,.06)'
    : 'rgba(22,30,42,.10)';
  const tooltipBackground = theme === 'dark' ? '#10141c' : '#ffffff';
  const tooltipBorder = theme === 'dark'
    ? '1px solid rgba(255,255,255,.12)'
    : '1px solid rgba(22,30,42,.14)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 4, bottom: 0, left: -28 }}
      >
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{
            fill:
              theme === 'dark'
                ? 'rgba(255,255,255,.03)'
                : 'rgba(20,28,40,.04)',
          }}
          contentStyle={{
            background: tooltipBackground,
            border: tooltipBorder,
            borderRadius: 10,
            fontSize: 11,
          }}
        />
        <Bar
          dataKey="count"
          name={t('earthquakesChart')}
          fill="#ff715b"
          radius={[5, 5, 1, 1]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
