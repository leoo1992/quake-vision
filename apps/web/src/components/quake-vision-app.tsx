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
  selectEarthquake,
  setMapMode,
  setMaxDepth,
  setMinMagnitude,
  setRange,
  setSearch,
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

export function QuakeVisionApp() {
  const dispatch = useAppDispatch();
  const { localeTag, theme, t, relativeTime } = useExperience();
  const {
    range,
    minMagnitude,
    maxDepth,
    mapMode,
    selectedId,
    search,
  } = useAppSelector((state) => state.quakeUi);
  const [dataset, setDataset] = useState<EarthquakeDataset | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<
    'none' | 'filters' | 'events' | 'details'
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
          maxDepth,
        });
        if (cancelled) return;
        setDataset(result);
      } catch (reason) {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : t('dataSourceFailure'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void execute();

    return () => {
      cancelled = true;
    };
  }, [range, minMagnitude, maxDepth, t]);

  const events = useMemo(() => dataset?.events ?? [], [dataset]);
  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return events;

    return events.filter((event) =>
      event.place.toLowerCase().includes(normalizedSearch),
    );
  }, [events, search]);

  const selected =
    events.find((event) => event.id === selectedId) ?? null;
  const stats = useMemo(() => datasetStats(events), [events]);

  const prominentEvents = useMemo(
    () =>
      [...filteredEvents]
        .sort(
          (a, b) =>
            b.magnitude - a.magnitude ||
            b.significance - a.significance,
        )
        .slice(0, 12),
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
              {dataset
                ? relativeTime(dataset.generated)
                : t('syncing')}
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
          </div>
        </div>
      </header>

      <section className="workspace">
        <aside
          className="control-panel glass-panel"
          data-mobile-open={mobilePanel === 'filters'}
        >
          <div className="panel-heading">
            <div>
              <span>{t('monitorConfig').toUpperCase()}</span>
              <h2>{t('seismicFilters')}</h2>
            </div>
            <button
              type="button"
              className="mobile-close"
              onClick={() => setMobilePanel('none')}
            >
              Fechar
            </button>
          </div>

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
              <label>{t('maximumDepth').toUpperCase()}</label>
              <b>{maxDepth} km</b>
            </div>
            <input
              type="range"
              min="30"
              max="700"
              step="10"
              value={maxDepth}
              onChange={(event) =>
                dispatch(setMaxDepth(Number(event.target.value)))
              }
            />
          </div>

          <div className="filter-block">
            <label>{t('visualization').toUpperCase()}</label>
            <div className="segmented-control">
              <button
                type="button"
                data-active={mapMode === 'points'}
                onClick={() => dispatch(setMapMode('points'))}
              >
                Epicentros
              </button>
              <button
                type="button"
                data-active={mapMode === 'heat'}
                onClick={() => dispatch(setMapMode('heat'))}
              >
                Heatmap
              </button>
            </div>
          </div>

          <div className="legend">
            <span>{t('magnitude').toUpperCase()}</span>
            {[2, 3, 4, 5, 6, 7].map((magnitude) => (
              <div key={magnitude}>
                <i
                  style={{
                    background: getMagnitudeColor(magnitude),
                  }}
                />
                <small>
                  {magnitude === 7 ? '7+' : magnitude.toString()}
                </small>
              </div>
            ))}
          </div>

          <div className="source-note">
            <span>{t('dataPipeline').toUpperCase()}</span>
            <p>
              {t('pipelineCopy')}
            </p>
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
              value={events.length.toLocaleString(localeTag)}
              detail={
                range === 'day'
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
              <strong>{filteredEvents.length} {t('visibleEpicenters')}</strong>
              <small>
                {t('mapHint')}
              </small>
            </div>
          </div>
        </section>

        <aside
          className="events-panel glass-panel"
          data-mobile-open={mobilePanel === 'events'}
        >
          <div className="panel-heading">
            <div>
              <span>{t('seismicFeed').toUpperCase()}</span>
              <h2>{t('relevantEvents')}</h2>
            </div>
            <button
              type="button"
              className="mobile-close"
              onClick={() => setMobilePanel('none')}
            >
              Fechar
            </button>
          </div>

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
        </aside>

        <section className="analytics-panel glass-panel">
          <div className="chart-block">
            <div className="chart-heading">
              <div>
                <span>{t('activity').toUpperCase()}</span>
                <strong>{t('seismicFrequency')}</strong>
              </div>
              <small>{events.length} eventos</small>
            </div>
            <div className="chart-body">
              <ActivityChart events={events} range={range} />
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
              <MagnitudeChart events={events} />
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
              <h2>{selected ? t('selectedEarthquake') : t('noSelection')}</h2>
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
                <span
                  style={{
                    color: getMagnitudeColor(selected.magnitude),
                  }}
                >
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
                  <strong>
                    {selected.felt.toLocaleString(localeTag)}
                  </strong>
                </div>
                <div>
                  <span>{t('tsunami').toUpperCase()}</span>
                  <strong>{selected.tsunami ? t('yes').toUpperCase() : t('no').toUpperCase()}</strong>
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
              <p>
                {t('selectEpicenter')}
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
