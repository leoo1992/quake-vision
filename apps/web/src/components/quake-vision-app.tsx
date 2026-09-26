'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExperienceControls } from '@/components/experience-controls';
import { useExperience } from '@/components/experience-provider';
import {
  ActivityChart,
  MagnitudeChart,
} from '@/components/quake-charts';
import {
  datasetStats,
  formatDepth,
  formatMagnitude,
  getMagnitudeColor,
  type EarthquakeDataset,
  type EarthquakeEvent,
  type TimeRange,
} from '@/lib/earthquakes';
import { loadEarthquakes } from '@/lib/usgs';
import {
  clearChartFilters,
  selectEarthquake,
  setMapMode,
  setMinDepth,
  setMinMagnitude,
  setRange,
  setSearch,
  toggleMagnitudeBucket,
  toggleTimeBucket,
  useAppDispatch,
  useAppSelector,
} from '@/store/store';

const SeismicMap = dynamic(
  () =>
    import('@/components/seismic-map').then(
      (module) => module.SeismicMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-[#07090d]">
        <span className="seismic-loader" />
      </div>
    ),
  },
);

function Metric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: string;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong style={accent ? { color: accent } : undefined}>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function RangeButton({
  value,
  label,
  active,
  onClick,
}: {
  value: TimeRange;
  label: string;
  active: boolean;
  onClick: (value: TimeRange) => void;
}) {
  return (
    <button
      type="button"
      data-active={active}
      onClick={() => onClick(value)}
      className="range-button"
    >
      {label}
    </button>
  );
}

function EventRow({
  event,
  selected,
  onSelect,
}: {
  event: EarthquakeEvent;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { relativeTime } = useExperience();

  return (
    <button
      type="button"
      className="event-row"
      data-selected={selected}
      onClick={() => onSelect(event.id)}
    >
      <span
        className="magnitude-badge"
        style={{
          borderColor: getMagnitudeColor(event.magnitude),
          color: getMagnitudeColor(event.magnitude),
        }}
      >
        {formatMagnitude(event.magnitude)}
      </span>
      <span className="event-row-copy">
        <strong>{event.place}</strong>
        <small>
          {relativeTime(event.time)} · {formatDepth(event.depth)}
        </small>
      </span>
      {event.tsunami ? <b className="tsunami-tag">TSU</b> : null}
    </button>
  );
}

function matchesMagnitudeBucket(magnitude: number, bucket: string | null) {
  if (!bucket) return true;
  if (bucket === '< 3') return magnitude < 3;
  if (bucket === '3–4') return magnitude >= 3 && magnitude < 4;
  if (bucket === '4–5') return magnitude >= 4 && magnitude < 5;
  if (bucket === '5–6') return magnitude >= 5 && magnitude < 6;
  return magnitude >= 6;
}

function CollapseButton({
  collapsed,
  onClick,
  label,
}: {
  collapsed: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="panel-collapse"
      onClick={onClick}
      aria-label={label}
      aria-expanded={!collapsed}
    >
      <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
    </button>
  );
}

export function QuakeVisionApp() {
  const dispatch = useAppDispatch();
  const { localeTag, theme, t, relativeTime } = useExperience();
  const {
    range,
    minMagnitude,
    minDepth,
    mapMode,
    selectedId,
    search,
    magnitudeBucket,
    timeBucket,
  } = useAppSelector((state) => state.quakeUi);
  const [dataset, setDataset] = useState<EarthquakeDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tsunamiOnly, setTsunamiOnly] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<
    'none' | 'filters' | 'events' | 'details' | 'analytics'
  >('none');

  useEffect(() => {
    let cancelled = false;

    const execute = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await loadEarthquakes({
          range,
          minMagnitude,
          minDepth,
        });
        if (cancelled) return;
        setDataset(result);
      } catch (reason) {
        if (cancelled) return;
        setError(
          reason instanceof Error ? reason.message : t('dataSourceFailure'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void execute();

    return () => {
      cancelled = true;
    };
  }, [range, minMagnitude, minDepth, t]);

  const events = useMemo(() => dataset?.events ?? [], [dataset]);
  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events.filter((event) => {
      if (
        normalizedSearch &&
        !event.place.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (tsunamiOnly && !event.tsunami) return false;

      if (!matchesMagnitudeBucket(event.magnitude, magnitudeBucket)) {
        return false;
      }

      if (
        timeBucket &&
        (event.time < timeBucket.start || event.time >= timeBucket.end)
      ) {
        return false;
      }

      return true;
    });
  }, [events, magnitudeBucket, search, timeBucket, tsunamiOnly]);

  const selected = events.find((event) => event.id === selectedId) ?? null;
  const stats = useMemo(() => datasetStats(filteredEvents), [filteredEvents]);
  const hasChartFilter = Boolean(magnitudeBucket || timeBucket);

  const prominentEvents = useMemo(
    () =>
      [...filteredEvents]
        .sort(
          (a, b) =>
            b.magnitude - a.magnitude ||
            b.significance - a.significance,
        )
        .slice(0, 16),
    [filteredEvents],
  );

  const selectEvent = (id: string) => {
    dispatch(selectEarthquake(id));
    if (window.innerWidth <= 760) setMobilePanel('details');
  };

  return (
    <main className="quake-app" data-mobile-panel={mobilePanel}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <b />
          </span>
          <div>
            <strong>QuakeVision</strong>
            <small>{t('globalSeismicMonitor').toUpperCase()}</small>
          </div>
        </div>

        <div className="live-source">
          <span className="live-dot" />
          <div>
            <strong>{t('usgsLiveData').toUpperCase()}</strong>
            <small>
              {dataset ? relativeTime(dataset.generated) : t('syncing')}
            </small>
          </div>
        </div>

        <div className="topbar-actions">
          <ExperienceControls />
          <div className="mobile-actions">
            <button
              type="button"
              onClick={() =>
                setMobilePanel((panel) =>
                  panel === 'filters' ? 'none' : 'filters',
                )
              }
            >
              {t('filters')}
            </button>
            <button
              type="button"
              onClick={() =>
                setMobilePanel((panel) =>
                  panel === 'events' ? 'none' : 'events',
                )
              }
            >
              {t('events')}
            </button>
            <button
              type="button"
              onClick={() =>
                setMobilePanel((panel) =>
                  panel === 'analytics' ? 'none' : 'analytics',
                )
              }
            >
              {t('analytics')}
            </button>
          </div>
        </div>
      </header>

      <section
        className="workspace"
        data-filters-collapsed={filtersCollapsed}
        data-events-collapsed={eventsCollapsed}
        data-analytics-collapsed={analyticsCollapsed}
      >
        <aside
          className="control-panel glass-panel collapsible-panel"
          data-collapsed={filtersCollapsed}
          data-mobile-open={mobilePanel === 'filters'}
        >
          <div className="panel-heading">
            <div>
              <span>{t('monitorConfig').toUpperCase()}</span>
              <h2>{t('seismicFilters')}</h2>
            </div>
            <div className="panel-heading-actions">
              <CollapseButton
                collapsed={filtersCollapsed}
                onClick={() => setFiltersCollapsed((value) => !value)}
                label={filtersCollapsed ? t('expand') : t('collapse')}
              />
              <button
                type="button"
                className="mobile-close"
                onClick={() => setMobilePanel('none')}
              >
                {t('close')}
              </button>
            </div>
          </div>

          <div className="panel-content">
            <div className="filter-block">
              <label>{t('period').toUpperCase()}</label>
              <div className="segmented-control">
                <RangeButton
                  value="day"
                  label="24H"
                  active={range === 'day'}
                  onClick={(value) => dispatch(setRange(value))}
                />
                <RangeButton
                  value="week"
                  label="7D"
                  active={range === 'week'}
                  onClick={(value) => dispatch(setRange(value))}
                />
                <RangeButton
                  value="month"
                  label="30D"
                  active={range === 'month'}
                  onClick={(value) => dispatch(setRange(value))}
                />
              </div>
            </div>

            <div className="filter-block">
              <div className="filter-label-row">
                <label>{t('minimumMagnitude').toUpperCase()}</label>
                <b>{minMagnitude.toFixed(1)}</b>
              </div>
              <input
                type="range"
                min="0"
                max="7"
                step="0.5"
                value={minMagnitude}
                onChange={(event) =>
                  dispatch(setMinMagnitude(Number(event.target.value)))
                }
              />
              <div className="range-scale">
                <span>0</span>
                <span>3</span>
                <span>5</span>
                <span>7+</span>
              </div>
            </div>

            <div className="filter-block">
              <div className="filter-label-row">
                <label>{t('minimumDepth').toUpperCase()}</label>
                <b>{minDepth} km</b>
              </div>
              <input
                type="range"
                min="0"
                max="700"
                step="10"
                value={minDepth}
                onChange={(event) =>
                  dispatch(setMinDepth(Number(event.target.value)))
                }
              />
            </div>

            <div className="filter-block">
              <label>{t('tsunamiFilter').toUpperCase()}</label>
              <div className="segmented-control">
                <button type="button" data-active={!tsunamiOnly} onClick={() => setTsunamiOnly(false)}>
                  {t('allEvents')}
                </button>
                <button type="button" data-active={tsunamiOnly} onClick={() => setTsunamiOnly(true)}>
                  {t('tsunamiOnly')}
                </button>
              </div>
            </div>

            <div className="filter-block">
              <label>{t('visualization').toUpperCase()}</label>
              <div className="segmented-control">
                <button
                  type="button"
                  data-active={mapMode === 'points'}
                  onClick={() => dispatch(setMapMode('points'))}
                >
                  {t('epicenters')}
                </button>
                <button
                  type="button"
                  data-active={mapMode === 'heat'}
                  onClick={() => dispatch(setMapMode('heat'))}
                >
                  {t('heatmap')}
                </button>
              </div>
            </div>

            <div className="legend">
              <span>{t('magnitude').toUpperCase()}</span>
              {[2, 3, 4, 5, 6, 7].map((magnitude) => (
                <div key={magnitude}>
                  <i style={{ background: getMagnitudeColor(magnitude) }} />
                  <small>
                    {magnitude === 7 ? '7+' : magnitude.toString()}
                  </small>
                </div>
              ))}
            </div>

            <div className="source-note">
              <span>{t('dataPipeline').toUpperCase()}</span>
              <p>{t('pipelineCopy')}</p>
            </div>
          </div>
        </aside>

        <section className="map-region">
          <SeismicMap
            events={filteredEvents}
            selectedId={selectedId}
            mode={mapMode}
            theme={theme}
            onSelect={selectEvent}
          />

          <div className="metrics-strip">
            <Metric
              label={t('eventsMetric').toUpperCase()}
              value={filteredEvents.length.toLocaleString(localeTag)}
              detail={
                hasChartFilter
                  ? t('filteredEvents')
                  : range === 'day'
                    ? t('last24h')
                    : range === 'week'
                      ? t('last7d')
                      : t('last30d')
              }
            />
            <Metric
              label={t('strongestMagnitude').toUpperCase()}
              value={
                stats.strongest
                  ? formatMagnitude(stats.strongest.magnitude)
                  : '—'
              }
              detail={stats.strongest?.place ?? t('noEvents')}
              accent={
                stats.strongest
                  ? getMagnitudeColor(stats.strongest.magnitude)
                  : undefined
              }
            />
            <Metric
              label={t('averageMagnitude').toUpperCase()}
              value={stats.averageMagnitude.toFixed(1)}
              detail={t('loadedEvents')}
            />
            <Metric
              label={t('averageDepth').toUpperCase()}
              value={Math.round(stats.averageDepth) + ' km'}
              detail={stats.tsunamiCount + ' ' + t('tsunamiAlerts')}
            />
          </div>

          {loading ? (
            <div className="map-status">
              <span className="seismic-loader" />
              <strong>{t('syncingUsgs')}</strong>
              <small>{t('catalogingEpicenters')}</small>
            </div>
          ) : null}

          {error ? (
            <div className="error-banner">
              <strong>{t('dataSourceFailure')}</strong>
              <span>{error}</span>
            </div>
          ) : null}

          <div className="map-caption">
            <span className="pulse-icon" />
            <div>
              <strong>
                {filteredEvents.length} {t('visibleEpicenters')}
              </strong>
              <small>{t('mapHint')}</small>
            </div>
            {hasChartFilter ? (
              <div className="chart-filter-chips">
                {magnitudeBucket ? <b>M {magnitudeBucket}</b> : null}
                {timeBucket ? <b>{timeBucket.label}</b> : null}
                <button
                  type="button"
                  onClick={() => dispatch(clearChartFilters())}
                >
                  ×
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <aside
          className="events-panel glass-panel collapsible-panel"
          data-collapsed={eventsCollapsed}
          data-mobile-open={mobilePanel === 'events'}
        >
          <div className="panel-heading">
            <div>
              <span>{t('seismicFeed').toUpperCase()}</span>
              <h2>{t('relevantEvents')}</h2>
            </div>
            <div className="panel-heading-actions">
              <CollapseButton
                collapsed={eventsCollapsed}
                onClick={() => setEventsCollapsed((value) => !value)}
                label={eventsCollapsed ? t('expand') : t('collapse')}
              />
              <button
                type="button"
                className="mobile-close"
                onClick={() => setMobilePanel('none')}
              >
                {t('close')}
              </button>
            </div>
          </div>

          <div className="panel-content events-panel-content">
            <label className="event-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => dispatch(setSearch(event.target.value))}
                placeholder={t('searchLocation')}
              />
            </label>

            <div className="event-list">
              {prominentEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  selected={event.id === selectedId}
                  onSelect={selectEvent}
                />
              ))}
            </div>
          </div>
        </aside>

        <section
          className="analytics-panel glass-panel"
          data-collapsed={analyticsCollapsed}
          data-mobile-open={mobilePanel === 'analytics'}
        >
          <div className="analytics-toolbar">
            <div>
              <span>{t('analytics').toUpperCase()}</span>
              <strong>{t('chartFilterHint')}</strong>
            </div>
            <div className="analytics-actions">
              {hasChartFilter ? (
                <button
                  type="button"
                  className="clear-chart-filter"
                  onClick={() => dispatch(clearChartFilters())}
                >
                  {t('clearFilters')}
                </button>
              ) : null}
              <button
                type="button"
                className="panel-collapse analytics-collapse"
                onClick={() => setAnalyticsCollapsed((value) => !value)}
                aria-label={
                  analyticsCollapsed ? t('expand') : t('collapse')
                }
                aria-expanded={!analyticsCollapsed}
              >
                <span aria-hidden="true">
                  {analyticsCollapsed ? '⌃' : '⌄'}
                </span>
              </button>
              <button
                type="button"
                className="mobile-close"
                onClick={() => setMobilePanel('none')}
              >
                {t('close')}
              </button>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-block">
              <div className="chart-heading">
                <div>
                  <span>{t('activity').toUpperCase()}</span>
                  <strong>{t('seismicFrequency')}</strong>
                </div>
                <small>{events.length.toLocaleString(localeTag)} {t('events').toLowerCase()}</small>
              </div>
              <div className="chart-body">
                <ActivityChart
                  events={events}
                  range={range}
                  activeLabel={timeBucket?.label}
                  onSelect={(selection) =>
                    dispatch(toggleTimeBucket(selection))
                  }
                />
              </div>
            </div>

            <div className="chart-block">
              <div className="chart-heading">
                <div>
                  <span>{t('distribution').toUpperCase()}</span>
                  <strong>{t('byMagnitude')}</strong>
                </div>
                <small>{t('magnitudeScale')}</small>
              </div>
              <div className="chart-body">
                <MagnitudeChart
                  events={events}
                  activeBucket={magnitudeBucket}
                  onSelect={(bucket) =>
                    dispatch(toggleMagnitudeBucket(bucket))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <aside
          className="detail-panel glass-panel"
          data-open={Boolean(selected)}
          data-mobile-open={mobilePanel === 'details'}
        >
          <div className="panel-heading">
            <div>
              <span>{t('eventInspector').toUpperCase()}</span>
              <h2>
                {selected ? t('selectedEarthquake') : t('noSelection')}
              </h2>
            </div>
            {selected ? (
              <button
                type="button"
                onClick={() => {
                  dispatch(selectEarthquake(null));
                  setMobilePanel('none');
                }}
              >
                ×
              </button>
            ) : null}
          </div>

          {selected ? (
            <>
              <div className="selected-main">
                <span style={{ color: getMagnitudeColor(selected.magnitude) }}>
                  M {formatMagnitude(selected.magnitude)}
                </span>
                <strong>{selected.place}</strong>
                <small>
                  {new Intl.DateTimeFormat(localeTag, {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  }).format(selected.time)}
                </small>
              </div>

              <div className="detail-grid">
                <div>
                  <span>{t('depth').toUpperCase()}</span>
                  <strong>{formatDepth(selected.depth)}</strong>
                </div>
                <div>
                  <span>{t('significance').toUpperCase()}</span>
                  <strong>{selected.significance}</strong>
                </div>
                <div>
                  <span>{t('felt').toUpperCase()}</span>
                  <strong>{selected.felt.toLocaleString(localeTag)}</strong>
                </div>
                <div>
                  <span>{t('tsunami').toUpperCase()}</span>
                  <strong>
                    {selected.tsunami
                      ? t('yes').toUpperCase()
                      : t('no').toUpperCase()}
                  </strong>
                </div>
              </div>

              <div className="coordinates">
                <span>{t('coordinates').toUpperCase()}</span>
                <code>
                  {selected.latitude.toFixed(3)}°,{' '}
                  {selected.longitude.toFixed(3)}°
                </code>
              </div>

              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="usgs-link"
              >
                {t('openOfficialEvent')} ↗
              </a>
            </>
          ) : (
            <div className="empty-detail">
              <span>◎</span>
              <p>{t('selectEpicenter')}</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
