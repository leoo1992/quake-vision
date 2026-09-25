'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ActivityChart,
  MagnitudeChart,
} from '@/components/quake-charts';
import {
  datasetStats,
  formatDepth,
  formatMagnitude,
  formatRelativeTime,
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
          {formatRelativeTime(event.time)} · {formatDepth(event.depth)}
        </small>
      </span>
      {event.tsunami ? <b className="tsunami-tag">TSU</b> : null}
    </button>
  );
}

export function QuakeVisionApp() {
  const dispatch = useAppDispatch();
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
            : 'Falha ao carregar terremotos.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void execute();

    return () => {
      cancelled = true;
    };
  }, [range, minMagnitude, maxDepth]);

  const events = dataset?.events ?? [];
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
            <small>GLOBAL SEISMIC MONITOR</small>
          </div>
        </div>

        <div className="live-source">
          <span className="live-dot" />
          <div>
            <strong>USGS LIVE DATA</strong>
            <small>
              {dataset
                ? 'atualizado ' + formatRelativeTime(dataset.generated)
                : 'sincronizando'}
            </small>
          </div>
        </div>

        <div className="mobile-actions">
          <button
            type="button"
            onClick={() =>
              setMobilePanel((panel) =>
                panel === 'filters' ? 'none' : 'filters',
              )
            }
          >
            Filtros
          </button>
          <button
            type="button"
            onClick={() =>
              setMobilePanel((panel) =>
                panel === 'events' ? 'none' : 'events',
              )
            }
          >
            Eventos
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside
          className="control-panel glass-panel"
          data-mobile-open={mobilePanel === 'filters'}
        >
          <div className="panel-heading">
            <div>
              <span>MONITOR CONFIG</span>
              <h2>Filtros sísmicos</h2>
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
            <label>PERÍODO</label>
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
              <label>MAGNITUDE MÍNIMA</label>
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
              <label>PROFUNDIDADE MÁX.</label>
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
            <label>VISUALIZAÇÃO</label>
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
            <span>MAGNITUDE</span>
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
            <span>DATA PIPELINE</span>
            <p>
              USGS GeoJSON → NestJS cache/normalização → Redux → MapLibre.
            </p>
          </div>
        </aside>

        <section className="map-region">
          <SeismicMap
            events={filteredEvents}
            selectedId={selectedId}
            mode={mapMode}
            onSelect={selectEvent}
          />

          <div className="metrics-strip">
            <Metric
              label="EVENTOS"
              value={events.length.toLocaleString('pt-BR')}
              detail={
                range === 'day'
                  ? 'últimas 24h'
                  : range === 'week'
                    ? 'últimos 7 dias'
                    : 'últimos 30 dias'
              }
            />
            <Metric
              label="MAIOR MAG."
              value={
                stats.strongest
                  ? formatMagnitude(stats.strongest.magnitude)
                  : '—'
              }
              detail={stats.strongest?.place ?? 'sem eventos'}
              accent={
                stats.strongest
                  ? getMagnitudeColor(stats.strongest.magnitude)
                  : undefined
              }
            />
            <Metric
              label="MAG. MÉDIA"
              value={stats.averageMagnitude.toFixed(1)}
              detail="eventos carregados"
            />
            <Metric
              label="PROF. MÉDIA"
              value={Math.round(stats.averageDepth) + ' km'}
              detail={stats.tsunamiCount + ' alerta(s) tsunami'}
            />
          </div>

          {loading ? (
            <div className="map-status">
              <span className="seismic-loader" />
              <strong>Sincronizando USGS</strong>
              <small>catalogando epicentros</small>
            </div>
          ) : null}

          {error ? (
            <div className="error-banner">
              <strong>Falha na fonte de dados</strong>
              <span>{error}</span>
            </div>
          ) : null}

          <div className="map-caption">
            <span className="pulse-icon" />
            <div>
              <strong>{filteredEvents.length} epicentros visíveis</strong>
              <small>
                tamanho e cor representam magnitude · clique para inspecionar
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
              <span>SEISMIC FEED</span>
              <h2>Eventos relevantes</h2>
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
              placeholder="Buscar local..."
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
                <span>ATIVIDADE</span>
                <strong>Frequência sísmica</strong>
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
                <span>DISTRIBUIÇÃO</span>
                <strong>Por magnitude</strong>
              </div>
              <small>M escala</small>
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
              <span>EVENT INSPECTOR</span>
              <h2>{selected ? 'Terremoto selecionado' : 'Sem seleção'}</h2>
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
                  {new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  }).format(selected.time)}
                </small>
              </div>

              <div className="detail-grid">
                <div>
                  <span>PROFUNDIDADE</span>
                  <strong>{formatDepth(selected.depth)}</strong>
                </div>
                <div>
                  <span>SIGNIFICÂNCIA</span>
                  <strong>{selected.significance}</strong>
                </div>
                <div>
                  <span>SENTIRAM</span>
                  <strong>
                    {selected.felt.toLocaleString('pt-BR')}
                  </strong>
                </div>
                <div>
                  <span>TSUNAMI</span>
                  <strong>{selected.tsunami ? 'SIM' : 'NÃO'}</strong>
                </div>
              </div>

              <div className="coordinates">
                <span>COORDENADAS</span>
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
                Abrir evento oficial no USGS ↗
              </a>
            </>
          ) : (
            <div className="empty-detail">
              <span>◎</span>
              <p>
                Selecione um epicentro no mapa ou um item da lista.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
