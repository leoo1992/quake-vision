'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
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

interface ActivitySelection {
  start: number;
  end: number;
  label: string;
}

export function ActivityChart({
  events,
  range,
  activeLabel,
  onSelect,
}: {
  events: EarthquakeEvent[];
  range: TimeRange;
  activeLabel?: string | null;
  onSelect?: (selection: ActivitySelection) => void;
}) {
  const { localeTag, theme, t } = useExperience();
  const data = activitySeries(events, range, localeTag);
  const axis = theme === 'dark' ? '#8e97a5' : '#56606c';
  const grid =
    theme === 'dark' ? 'rgba(255,255,255,.075)' : 'rgba(22,30,42,.11)';
  const tooltipBackground = theme === 'dark' ? '#10141c' : '#ffffff';
  const tooltipBorder =
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.14)'
      : '1px solid rgba(22,30,42,.15)';
  const tooltipText = theme === 'dark' ? '#c7cdd6' : '#303844';
  const bucketMs =
    range === 'day'
      ? 60 * 60 * 1000
      : range === 'week'
        ? 6 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 14, right: 8, bottom: 2, left: -18 }}
        style={{ cursor: onSelect ? 'pointer' : 'default' }}
        onClick={(state) => {
          const index = Number(state.activeTooltipIndex);
          const payload = Number.isInteger(index) ? data[index] : undefined;
          if (!payload || !onSelect) return;
          onSelect({
            start: payload.time,
            end: payload.time + bucketMs,
            label: payload.label,
          });
        }}
      >
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9db22" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#a9db22" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          minTickGap={34}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: tooltipBackground,
            border: tooltipBorder,
            borderRadius: 10,
            fontSize: 13,
            color: tooltipText,
          }}
          labelStyle={{ color: tooltipText }}
        />
        {activeLabel ? (
          <ReferenceLine
            x={activeLabel}
            stroke="#ff715b"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        ) : null}
        <Area
          type="monotone"
          dataKey="count"
          stroke="#b8ed3f"
          strokeWidth={2.4}
          fill="url(#activityFill)"
          name={t('eventsChart')}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MagnitudeChart({
  events,
  activeBucket,
  onSelect,
}: {
  events: EarthquakeEvent[];
  activeBucket?: string | null;
  onSelect?: (label: string) => void;
}) {
  const { theme, t } = useExperience();
  const data = magnitudeBuckets(events);
  const axis = theme === 'dark' ? '#8e97a5' : '#56606c';
  const grid =
    theme === 'dark' ? 'rgba(255,255,255,.075)' : 'rgba(22,30,42,.11)';
  const tooltipBackground = theme === 'dark' ? '#10141c' : '#ffffff';
  const tooltipBorder =
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.14)'
      : '1px solid rgba(22,30,42,.15)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 12, right: 8, bottom: 2, left: -18 }}
        style={{ cursor: onSelect ? 'pointer' : 'default' }}
        onClick={(state) => {
          const index = Number(state.activeTooltipIndex);
          const payload = Number.isInteger(index) ? data[index] : undefined;
          if (payload?.label && onSelect) onSelect(payload.label);
        }}
      >
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{
            fill:
              theme === 'dark'
                ? 'rgba(255,255,255,.04)'
                : 'rgba(20,28,40,.045)',
          }}
          contentStyle={{
            background: tooltipBackground,
            border: tooltipBorder,
            borderRadius: 10,
            fontSize: 13,
          }}
        />
        <Bar
          dataKey="count"
          name={t('earthquakesChart')}
          radius={[6, 6, 1, 1]}
        >
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill={entry.label === activeBucket ? '#b8ed3f' : '#ff715b'}
              opacity={activeBucket && entry.label !== activeBucket ? 0.42 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
