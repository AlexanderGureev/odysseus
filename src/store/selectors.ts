import { ILocalStorageService } from 'interfaces';
import { isIOS, isMobile } from 'react-device-detect';
import { Device, FavouritesItemMeta } from 'services/FavouritesService/types';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { AppState } from 'store';
import { TConfig } from 'types';
import { AppliedTariffModifiers, SubscriptionStatus, SubscriptionType, UserSubscription } from 'types/UserSubscription';
import { pad } from 'utils';

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
  opts: { userId: number | null }
) => {
  const lsUserId = localStorageService.getItemByDomain(STORAGE_SETTINGS.USER_ID);
  return lsUserId === opts.userId;
};

export const getSavedProgressTime = (state: AppState, localStorageService: ILocalStorageService) => {
  const {
    root: {
      config: {
        config: { user_id },
      },
      meta: { trackId },
    },
  } = state;

  if (
    !trackId ||
    !isCurrentUserEqualsLocalStorage(localStorageService, {
      userId: user_id,
    })
  ) {
    return null;
  }

  const savedTime = localStorageService.getItemByProject<number>(trackId, STORAGE_SETTINGS.CURRENT_TIME);
  return savedTime;
};

export const isOldSafari = (state: AppState) => {
  const { deviceInfo } = state.root;
  return Boolean(deviceInfo.isSafari && deviceInfo.browserVersion && parseInt(deviceInfo.browserVersion) <= 13);
};

export const getStartAt = (state: AppState) => {
  const { duration } = getPlaylistItem(state);
  const {
    root: {
      params: { startAt },
    },
  } = state;

  if (!duration) return startAt;

  return typeof startAt === 'number' && startAt < duration ? startAt : null;
};

export const getUserSubscriptionType = (userSubscriptions: UserSubscription | null): SubscriptionType => {
  if (!userSubscriptions) return 'none';

  if (
    userSubscriptions.appliedTariffModifiers.includes(AppliedTariffModifiers.GOOGLE_FREE_TRIAL) ||
    userSubscriptions.appliedTariffModifiers.includes(AppliedTariffModifiers.APPLE_FREE_TRIAL) ||
    userSubscriptions.appliedTariffModifiers.includes(AppliedTariffModifiers.MAP_FREE_TRIAL)
  )
    return 'trial';

  if (
    userSubscriptions.appliedTariffModifiers.includes(AppliedTariffModifiers.GOOGLE_INTRODUCTORY_PRICE) ||
    userSubscriptions.appliedTariffModifiers.includes(AppliedTariffModifiers.APPLE_INTRODUCTORY_PRICE)
  )
    return 'introductory_price';

  if (userSubscriptions.promocodeActivatedId) return 'promocode';
  return 'full_price';
};

const SubscriptionTypeMap: Record<SubscriptionType, SubscriptionStatus> = {
  unknown: SubscriptionStatus.UNSUBSCIBED,
  none: SubscriptionStatus.UNSUBSCIBED,
  full_price: SubscriptionStatus.SUBSCRIBED,
  promocode: SubscriptionStatus.SUBSCRIBED,
  introductory_price: SubscriptionStatus.SUBSCRIBED,
  trial: SubscriptionStatus.TRIAL,
};

export const getFavouritesMeta = (state: AppState): FavouritesItemMeta => {
  const {
    root: {
      config: { subscription },
    },
  } = state;

  const timezoneOffset = -new Date().getTimezoneOffset();
  const mark = timezoneOffset >= 0 ? '+' : '-';
  const timezone = `${mark}${pad(Math.floor(Math.abs(timezoneOffset) / 60))}:${pad(Math.abs(timezoneOffset) % 60)}`;
  const type = getUserSubscriptionType(subscription?.[0] || null);

  return {
    device: isIOS ? Device.WEB_MOBILE_IOS : isMobile ? Device.WEB_MOBILE_ANDROID : Device.WEB_DESKTOP,
    timezone: String(timezone),
    subscribe: SubscriptionTypeMap[type],
  };
};

export const featuresSelector = (isEmbedded: boolean) => {
  const { base = {}, embedded = {} } = window?.ODYSSEUS_PLAYER_CONFIG?.features || {};
  return isEmbedded ? { ...base, ...embedded } : base;
};

export const getPlaylistError = (config: TConfig) => {
  const [error = null] = config?.playlist?.items?.[0]?.errors || [];
  return error;
};
