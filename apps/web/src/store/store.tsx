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

interface QuakeUiState {
  range: TimeRange;
  minMagnitude: number;
  maxDepth: number;
  mapMode: MapMode;
  selectedId: string | null;
  search: string;
}

const initialState: QuakeUiState = {
  range: 'day',
  minMagnitude: 2.5,
  maxDepth: 700,
  mapMode: 'points',
  selectedId: null,
  search: '',
};

const quakeSlice = createSlice({
  name: 'quakeUi',
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<TimeRange>) {
      state.range = action.payload;
      state.selectedId = null;
    },
    setMinMagnitude(state, action: PayloadAction<number>) {
      state.minMagnitude = action.payload;
      state.selectedId = null;
    },
    setMaxDepth(state, action: PayloadAction<number>) {
      state.maxDepth = action.payload;
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
  },
});

export const {
  selectEarthquake,
  setMapMode,
  setMaxDepth,
  setMinMagnitude,
  setRange,
  setSearch,
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
