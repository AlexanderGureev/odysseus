import { configureStore, combineReducers } from '@reduxjs/toolkit';
import playerFSM from './slices/playerFSM';

const rootReducer = combineReducers({
  playerFSM: playerFSM.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
