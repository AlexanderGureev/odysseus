import { ILocalStorageService } from 'interfaces';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { AppState } from 'store';

export const getPlaylistItem = (state: AppState) => state.root.config.playlist.items[0];

export const getSources = (state: AppState) => getPlaylistItem(state).streams;

export const getProjectName = (state: AppState) => getPlaylistItem(state).project_name;

export const getMinAge = (state: AppState) => getPlaylistItem(state).min_age;

export const getSeasonName = (state: AppState) => getPlaylistItem(state).season_name;

export const getEpisodeName = (state: AppState) => getPlaylistItem(state).episode_name;

export const getTrackInfo = (state: AppState) => {
  const { project_name, min_age, season_name, episode_name } = getPlaylistItem(state);
  return {
    project_name,
    min_age,
    season_name,
    episode_name,
  };
};

export const isCurrentUserEqualsLocalStorage = (
  localStorageService: ILocalStorageService,
  opts: { userId: number | null; userToken: string | null }
) => {
  const lsUserId = localStorageService.getItemByDomain(STORAGE_SETTINGS.USER_ID);
  const lsToken = localStorageService.getItemByDomain(STORAGE_SETTINGS.USER_TOKEN);
  return !(lsUserId !== opts.userId || lsToken !== opts.userToken);
};

export const getSavedProgressTime = (state: AppState, localStorageService: ILocalStorageService) => {
  const {
    root: {
      config: {
        config: { user_id },
      },
      meta: { trackId, userToken },
    },
  } = state;

  if (
    !trackId ||
    !isCurrentUserEqualsLocalStorage(localStorageService, {
      userId: user_id,
      userToken,
    })
  ) {
    return null;
  }

  const savedTime = localStorageService.getItemByProject<number>(trackId, STORAGE_SETTINGS.CURRENT_TIME);
  return savedTime;
};

export const isOldSafari = (state: AppState) => {
  const { deviceInfo } = state.root;
  return deviceInfo.isSafari && deviceInfo.browserVersion && parseInt(deviceInfo.browserVersion) <= 13;
};
