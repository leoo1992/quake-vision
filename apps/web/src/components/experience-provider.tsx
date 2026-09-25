'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Locale = 'pt' | 'en' | 'es';
export type ThemePreference = 'light' | 'dark';

const localeTags: Record<Locale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};

const dictionary = {
  pt: {
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    globalSeismicMonitor: 'Monitor sísmico global',
    usgsLiveData: 'Dados USGS ao vivo',
    syncing: 'sincronizando',
    monitorConfig: 'Configuração',
    seismicFilters: 'Filtros sísmicos',
    filters: 'Filtros',
    events: 'Eventos',
    analytics: 'Análises',
    close: 'Fechar',
    expand: 'Expandir',
    collapse: 'Recolher',
    filteredEvents: 'eventos filtrados',
    chartFilterHint: 'Clique nos gráficos para filtrar o mapa',
    clearFilters: 'Limpar filtros',
    period: 'Período',
    minimumMagnitude: 'Magnitude mínima',
    maximumDepth: 'Profundidade máx.',
    visualization: 'Visualização',
    epicenters: 'Epicentros',
    heatmap: 'Mapa de calor',
    magnitude: 'Magnitude',
    dataPipeline: 'Pipeline de dados',
    pipelineCopy: 'USGS GeoJSON → NestJS cache/normalização → Redux → MapLibre.',
    eventsMetric: 'Eventos',
    last24h: 'últimas 24h',
    last7d: 'últimos 7 dias',
    last30d: 'últimos 30 dias',
    strongestMagnitude: 'Maior mag.',
    noEvents: 'sem eventos',
    averageMagnitude: 'Mag. média',
    loadedEvents: 'eventos carregados',
    averageDepth: 'Prof. média',
    tsunamiAlerts: 'alerta(s) tsunami',
    syncingUsgs: 'Sincronizando USGS',
    catalogingEpicenters: 'catalogando epicentros',
    dataSourceFailure: 'Falha na fonte de dados',
    visibleEpicenters: 'epicentros visíveis',
    mapHint: 'clusters separam ao aproximar · o ponto central marca o epicentro exato',
    seismicFeed: 'Feed sísmico',
    relevantEvents: 'Eventos relevantes',
    searchLocation: 'Buscar local...',
    activity: 'Atividade',
    seismicFrequency: 'Frequência sísmica',
    distribution: 'Distribuição',
    byMagnitude: 'Por magnitude',
    magnitudeScale: 'M escala',
    eventInspector: 'Inspector do evento',
    selectedEarthquake: 'Terremoto selecionado',
    noSelection: 'Sem seleção',
    depth: 'Profundidade',
    significance: 'Significância',
    felt: 'Sentiram',
    tsunami: 'Tsunami',
    yes: 'Sim',
    no: 'Não',
    coordinates: 'Coordenadas',
    openOfficialEvent: 'Abrir evento oficial no USGS',
    selectEpicenter: 'Selecione um epicentro no mapa ou um item da lista.',
    eventsChart: 'Eventos',
    earthquakesChart: 'Terremotos',
    now: 'agora',
    ago: 'há',
  },
  en: {
    languageLabel: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    globalSeismicMonitor: 'Global seismic monitor',
    usgsLiveData: 'USGS live data',
    syncing: 'syncing',
    monitorConfig: 'Monitor config',
    seismicFilters: 'Seismic filters',
    filters: 'Filters',
    events: 'Events',
    analytics: 'Analytics',
    close: 'Close',
    expand: 'Expand',
    collapse: 'Collapse',
    filteredEvents: 'filtered events',
    chartFilterHint: 'Click charts to filter the map',
    clearFilters: 'Clear filters',
    period: 'Period',
    minimumMagnitude: 'Minimum magnitude',
    maximumDepth: 'Maximum depth',
    visualization: 'Visualization',
    epicenters: 'Epicenters',
    heatmap: 'Heatmap',
    magnitude: 'Magnitude',
    dataPipeline: 'Data pipeline',
    pipelineCopy: 'USGS GeoJSON → NestJS cache/normalization → Redux → MapLibre.',
    eventsMetric: 'Events',
    last24h: 'last 24 hours',
    last7d: 'last 7 days',
    last30d: 'last 30 days',
    strongestMagnitude: 'Strongest',
    noEvents: 'no events',
    averageMagnitude: 'Avg. magnitude',
    loadedEvents: 'loaded events',
    averageDepth: 'Avg. depth',
    tsunamiAlerts: 'tsunami alert(s)',
    syncingUsgs: 'Syncing USGS',
    catalogingEpicenters: 'cataloging epicenters',
    dataSourceFailure: 'Data source failure',
    visibleEpicenters: 'visible epicenters',
    mapHint: 'clusters split as you zoom · the center dot marks the exact epicenter',
    seismicFeed: 'Seismic feed',
    relevantEvents: 'Relevant events',
    searchLocation: 'Search location...',
    activity: 'Activity',
    seismicFrequency: 'Seismic frequency',
    distribution: 'Distribution',
    byMagnitude: 'By magnitude',
    magnitudeScale: 'M scale',
    eventInspector: 'Event inspector',
    selectedEarthquake: 'Selected earthquake',
    noSelection: 'No selection',
    depth: 'Depth',
    significance: 'Significance',
    felt: 'Felt reports',
    tsunami: 'Tsunami',
    yes: 'Yes',
    no: 'No',
    coordinates: 'Coordinates',
    openOfficialEvent: 'Open official event on USGS',
    selectEpicenter: 'Select an epicenter on the map or an item from the list.',
    eventsChart: 'Events',
    earthquakesChart: 'Earthquakes',
    now: 'now',
    ago: 'ago',
  },
  es: {
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    globalSeismicMonitor: 'Monitor sísmico global',
    usgsLiveData: 'Datos USGS en vivo',
    syncing: 'sincronizando',
    monitorConfig: 'Configuración',
    seismicFilters: 'Filtros sísmicos',
    filters: 'Filtros',
    events: 'Eventos',
    analytics: 'Análisis',
    close: 'Cerrar',
    expand: 'Expandir',
    collapse: 'Contraer',
    filteredEvents: 'eventos filtrados',
    chartFilterHint: 'Haz clic en los gráficos para filtrar el mapa',
    clearFilters: 'Limpiar filtros',
    period: 'Período',
    minimumMagnitude: 'Magnitud mínima',
    maximumDepth: 'Profundidad máx.',
    visualization: 'Visualización',
    epicenters: 'Epicentros',
    heatmap: 'Mapa de calor',
    magnitude: 'Magnitud',
    dataPipeline: 'Pipeline de datos',
    pipelineCopy: 'USGS GeoJSON → NestJS caché/normalización → Redux → MapLibre.',
    eventsMetric: 'Eventos',
    last24h: 'últimas 24 h',
    last7d: 'últimos 7 días',
    last30d: 'últimos 30 días',
    strongestMagnitude: 'Mayor mag.',
    noEvents: 'sin eventos',
    averageMagnitude: 'Mag. media',
    loadedEvents: 'eventos cargados',
    averageDepth: 'Prof. media',
    tsunamiAlerts: 'alerta(s) de tsunami',
    syncingUsgs: 'Sincronizando USGS',
    catalogingEpicenters: 'catalogando epicentros',
    dataSourceFailure: 'Fallo en la fuente de datos',
    visibleEpicenters: 'epicentros visibles',
    mapHint: 'los clusters se separan al acercar · el punto central marca el epicentro exacto',
    seismicFeed: 'Feed sísmico',
    relevantEvents: 'Eventos relevantes',
    searchLocation: 'Buscar lugar...',
    activity: 'Actividad',
    seismicFrequency: 'Frecuencia sísmica',
    distribution: 'Distribución',
    byMagnitude: 'Por magnitud',
    magnitudeScale: 'Escala M',
    eventInspector: 'Inspector del evento',
    selectedEarthquake: 'Terremoto seleccionado',
    noSelection: 'Sin selección',
    depth: 'Profundidad',
    significance: 'Significancia',
    felt: 'Reportes',
    tsunami: 'Tsunami',
    yes: 'Sí',
    no: 'No',
    coordinates: 'Coordenadas',
    openOfficialEvent: 'Abrir evento oficial en USGS',
    selectEpicenter: 'Selecciona un epicentro en el mapa o un elemento de la lista.',
    eventsChart: 'Eventos',
    earthquakesChart: 'Terremotos',
    now: 'ahora',
    ago: 'hace',
  },
} as const;

export type TranslationKey = keyof typeof dictionary.pt;

interface ExperienceValue {
  locale: Locale;
  localeTag: string;
  setLocale: (locale: Locale) => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  t: (key: TranslationKey) => string;
  relativeTime: (time: number, now?: number) => string;
}

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const subscribe = useCallback((callback: () => void) => {
    const handleStorage = () => callback();
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    window.addEventListener('storage', handleStorage);
    window.addEventListener('quakevision-preference-change', handleStorage);
    media.addEventListener('change', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('quakevision-preference-change', handleStorage);
      media.removeEventListener('change', handleStorage);
    };
  }, []);

  const locale = useSyncExternalStore(
    subscribe,
    () => {
      const saved = window.localStorage.getItem('quakevision-locale');
      return saved === 'pt' || saved === 'en' || saved === 'es' ? saved : 'pt';
    },
    () => 'pt' as Locale,
  );

  const theme = useSyncExternalStore(
    subscribe,
    () => {
      const saved = window.localStorage.getItem('quakevision-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    () => 'dark' as ThemePreference,
  );

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem('quakevision-locale', nextLocale);
    window.dispatchEvent(new Event('quakevision-preference-change'));
  }, []);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    window.localStorage.setItem('quakevision-theme', nextTheme);
    window.dispatchEvent(new Event('quakevision-preference-change'));
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeTags[locale];
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    const color = theme === 'dark' ? '#07090d' : '#f4f6f2';
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', color));
  }, [theme]);

  const t = useCallback(
    (key: TranslationKey) => dictionary[locale][key],
    [locale],
  );

  const relativeTime = useCallback(
    (time: number, now = Date.now()) => {
      const seconds = Math.max(0, Math.floor((now - time) / 1000));
      if (seconds < 60) return dictionary[locale].now;
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (locale === 'en') {
        if (minutes < 60) return minutes + ' min ago';
        if (hours < 24) return hours + ' h ago';
        return days + ' d ago';
      }

      const prefix = dictionary[locale].ago + ' ';
      if (minutes < 60) return prefix + minutes + ' min';
      if (hours < 24) return prefix + hours + ' h';
      return prefix + days + ' d';
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      localeTag: localeTags[locale],
      setLocale,
      theme,
      setTheme,
      t,
      relativeTime,
    }),
    [locale, relativeTime, setLocale, setTheme, t, theme],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error('useExperience must be used inside ExperienceProvider');
  }
  return context;
}
