import { MailOpts } from 'components/ErrorManager/types';
import { ILocalStorageService } from 'interfaces';
import { isIOS, isMobile } from 'react-device-detect';
import { Device, FavouritesItemMeta } from 'services/FavouritesService/types';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { AppState } from 'store';
import { TConfig, TExtendedConfig } from 'types';
import { AppliedTariffModifiers, SubscriptionStatus, SubscriptionType, UserSubscription } from 'types/UserSubscription';
import { pad } from 'utils';
import { declOfNum } from 'utils/declOfNum';

export const getPlaylistItem = (state: AppState) => state.root.config.playlist?.items?.[0];

export const getSources = (state: AppState) => getPlaylistItem(state).streams;

export const getProjectName = (state: AppState) => getPlaylistItem(state).project_name;

export const getMinAge = (state: AppState) => getPlaylistItem(state).min_age;

export const getSeasonName = (state: AppState) => getPlaylistItem(state).season_name;

export const getEpisodeName = (state: AppState) => getPlaylistItem(state).episode_name;

export const getTrackInfo = (state: AppState) => {
  const { project_name, min_age, season_name, episode_name, thumbnail_url } = getPlaylistItem(state);

  return {
    min_age,
    project_name: project_name || '',
    season_name: season_name || '',
    episode_name: episode_name || '',
    thumbnail_url,
  };
};

export const getTrackUrls = (state: AppState) => {
  const { project_url, sharing_url, season_url } = getPlaylistItem(state);
  const { origin } = new URL(sharing_url);

  return {
    project_url: project_url ? (project_url.includes('://') ? project_url : `${origin}${project_url}`) : null,
    season_url: season_url ? (season_url.includes('://') ? season_url : `${origin}${season_url}`) : null,
    track_url: sharing_url,
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
    root: { subscription },
  } = state;

  const timezoneOffset = -new Date().getTimezoneOffset();
  const mark = timezoneOffset >= 0 ? '+' : '-';
  const timezone = `${mark}${pad(Math.floor(Math.abs(timezoneOffset) / 60))}:${pad(Math.abs(timezoneOffset) % 60)}`;
  const type = getUserSubscriptionType(subscription?.ACTIVE);

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

export const getPlaylistError = (config: TExtendedConfig) => {
  const [error = null] = config?.playlist?.items?.[0]?.errors || [];
  return error;
};

export const getStatusTrialSelector = (state: AppState) => {
  const activeTariff = state.root.config?.serviceTariffs?.[0]?.tariffs?.[0];
  const trialAvailable = state.root.params.trial_available;

  if (!activeTariff || trialAvailable === false) return false;
  const [paymentMethod] = activeTariff.paymentMethods ?? [];

  return Boolean(activeTariff.tariffModifiers.mapFreeTrialEligible && paymentMethod?.trial);
};

export const getTrialDurationSelector = (state: AppState) => {
  const activeTariff = state.root.config?.serviceTariffs?.[0]?.tariffs?.[0];
  return activeTariff?.paymentMethods?.[0]?.trial?.duration ?? null;
};

export const getTrialDurationText = (state: AppState) => {
  const duration = getTrialDurationSelector(state);
  if (!duration) return;

  const text = declOfNum(duration, ['день', 'дня', 'дней']);
  return `${duration} ${text}`;
};

export const getSubPrice = (state: AppState) => {
  const activeTariff = state.root.config?.serviceTariffs?.[0]?.tariffs?.[0];
  return activeTariff?.price?.amount ?? 299;
};

export const getSubPriceText = (state: AppState) => {
  const price = getSubPrice(state);
  const priceText = declOfNum(price, ['рубль', 'рубля', 'рублей']);
  return `${price} ${priceText}`;
};

export const selectMailOptions = (state: AppState): MailOpts => {
  const { project_name, season_name, episode_name } = getTrackInfo(state);
  const {
    meta: { partnerId, trackId },
    config,
    session,
    params,
  } = state.root;

  return {
    projectName: project_name,
    seasonName: season_name,
    episodeName: episode_name,
    partnerId,
    trackId,
    projectId: config.config?.project_id,
    sid: session.sid,
    ssid: session.id,
    userId: config.config?.user_id,
    webVersion: params.web_version,
  };
};

export const selectSharingURL = (config: TConfig) => config?.playlist?.items?.[0]?.sharing_url;
