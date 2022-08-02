import { AppState } from 'store';

export const getPlaylistItem = (state: AppState) => state.root.config.playlist.items[0];

export const getSources = (state: AppState) => getPlaylistItem(state).streams;
