import { combineReducers,configureStore } from '@reduxjs/toolkit';

import { listenerMiddleware } from './middleware';
import ad from './slices/ad/reducer';
import player from './slices/player/reducer';

const rootReducer = combineReducers({
  player: player.reducer,
  ad: ad.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './actions';
export * from './types';
