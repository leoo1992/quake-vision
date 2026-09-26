'use client';

import {
  configureStore,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  Provider,
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from 'react-redux';
import type { ReactNode } from 'react';
import type { MapMode, TimeRange } from '@/lib/earthquakes';

export interface TimeBucketFilter {
  start: number;
  end: number;
  label: string;
}

interface QuakeUiState {
  range: TimeRange;
  minMagnitude: number;
  minDepth: number;
  mapMode: MapMode;
  selectedId: string | null;
  search: string;
  magnitudeBucket: string | null;
  timeBucket: TimeBucketFilter | null;
}

const initialState: QuakeUiState = {
  range: 'day',
  minMagnitude: 2.5,
  minDepth: 0,
  mapMode: 'points',
  selectedId: null,
  search: '',
  magnitudeBucket: null,
  timeBucket: null,
};

const quakeSlice = createSlice({
  name: 'quakeUi',
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<TimeRange>) {
      state.range = action.payload;
      state.selectedId = null;
      state.timeBucket = null;
    },
    setMinMagnitude(state, action: PayloadAction<number>) {
      state.minMagnitude = action.payload;
      state.selectedId = null;
    },
    setMinDepth(state, action: PayloadAction<number>) {
      state.minDepth = action.payload;
      state.selectedId = null;
    },
    setMapMode(state, action: PayloadAction<MapMode>) {
      state.mapMode = action.payload;
    },
    selectEarthquake(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    toggleMagnitudeBucket(state, action: PayloadAction<string>) {
      state.magnitudeBucket =
        state.magnitudeBucket === action.payload ? null : action.payload;
      state.selectedId = null;
    },
    toggleTimeBucket(state, action: PayloadAction<TimeBucketFilter>) {
      state.timeBucket =
        state.timeBucket?.start === action.payload.start &&
        state.timeBucket?.end === action.payload.end
          ? null
          : action.payload;
      state.selectedId = null;
    },
    clearChartFilters(state) {
      state.magnitudeBucket = null;
      state.timeBucket = null;
      state.selectedId = null;
    },
  },
});

export const {
  selectEarthquake,
  setMapMode,
  setMinDepth,
  setMinMagnitude,
  setRange,
  setSearch,
  toggleMagnitudeBucket,
  toggleTimeBucket,
  clearChartFilters,
} = quakeSlice.actions;

export const store = configureStore({
  reducer: {
    quakeUi: quakeSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function StoreProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
