import { EffectOpts } from 'interfaces';
import { TParams } from 'server/utils';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { sendEvent } from 'store/actions';
import { TConfig, THydraResponse, TParsedFeatures, TRawPlaylist } from 'types';
import {
  AdCategory,
  TAdConfigByCategory,
  TAdPointsConfig,
  TContentRollsConfig,
  TMiddleRollsConfig,
  TPreRollsConfig,
  TRawAdConfig,
} from 'types/ad';
import { ERROR_CODES } from 'types/errors';
import { toNum } from 'utils';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';
import { getTokenExpiredTime } from 'utils/token';
import { v4 as uuidv4 } from 'uuid';

import { TrackParams } from '..';
import { parseQueryParams } from './parseQueryParams';

export const BASE_SUBSCRIPTION_TITLE = 'Оформить подписку';
export const EMBEDED_SUBSCRIPTION_TITLE = 'Смотреть без рекламы';

type TAdKeys = 'midrolls' | 'contentrolls' | 'prerolls';

const ParseMap = {
  midrolls: ({ points = [] }: TMiddleRollsConfig) =>
    points.map(({ point }) => ({
      point,
      category: AdCategory.MID_ROLL,
    })),
  contentrolls: ({ points = [] }: TContentRollsConfig) =>
    points.map(({ point, placeholders }) => ({
      point,
      placeholders,
      category: AdCategory.CONTENT_ROLL,
    })),
  prerolls: ({ points }: TPreRollsConfig) => [
    {
      point: points.point,
      category: AdCategory.PRE_ROLL,
    },
  ],
};

const createAdConfig = (ad: TRawAdConfig, playlist: TRawPlaylist) => {
  const adConfig = Object.keys(ad).reduce((acc: TAdConfigByCategory, category) => {
    const key = category as AdCategory;

    if (!ad[key]) return acc;

    const config = {
      ...acc,
      [key]: {
        links: ad[key].items.filter((i) => i.item),
        limit: ad[key].params.limiter,
      },
    };

    return config;
  }, {});

  const adPoints = ['midrolls', 'contentrolls', 'prerolls'].reduce((acc: TAdPointsConfig, key) => {
    const category = key as TAdKeys;
    const adConfig = playlist?.items?.[0]?.[category];
    if (!adConfig) return acc;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const config = ParseMap[category](adConfig);
    return config ? [...acc, ...config] : acc;
  }, []);

  return { adConfig, adPoints };
};

const createFeaturesConfig = (isEmbedded: boolean, { base, embedded }: THydraResponse) => {
  const features = isEmbedded ? { ...base, ...embedded } : base;
  features.SUBSCRIPTION_TITLE =
    features.SUBSCRIPTION_TITLE || isEmbedded ? EMBEDED_SUBSCRIPTION_TITLE : BASE_SUBSCRIPTION_TITLE;

  return Object.entries(features).reduce(
    (acc: TParsedFeatures, [key, value]) => ({
      ...acc,
      [key]: toNum(value),
    }),
    {}
  );
};

export const parseConfig = async (
  rawConfig: TConfig,
  ctx: TParams | null,
  params: TrackParams | undefined,
  opts: EffectOpts
) => {
  const {
    getState,
    dispatch,
    services: { localStorageService },
  } = opts;

  try {
    if (!rawConfig) throw new Error('rawConfig is undefined');

    const { meta, session } = getState().root;

    const config = {
      ...rawConfig,
      context: ctx,
    };

    const features = createFeaturesConfig(meta.isEmbedded, config.features);
    const { adConfig = null, adPoints = [] } = config.config.ad
      ? createAdConfig(config.config.ad, config.playlist)
      : {};

    const queryParams = parseQueryParams(features);

    const payload = {
      config,
      features,
      adConfig,
      adPoints,
      params: {
        ...queryParams,
        ...params,
      },
      meta: {
        ...meta,
        partnerId: config.features.partner_id,
        skin: config.features.skin_theme_class,
        trackId: config.playlist?.items[0]?.track_id ?? null,
        userToken: config.context?.user_token ?? null,
        tokenExpiredAt: config.context?.user_token ? getTokenExpiredTime(config.context.user_token) : null,
      },
      session: {
        ...session,
        id: uuidv4(),
      },
    };

    localStorageService.setItemByDomain(STORAGE_SETTINGS.USER_ID, config.config?.user_id || null);
    localStorageService.setItemByDomain(STORAGE_SETTINGS.USER_TOKEN, config.context?.user_token || null);

    dispatch(
      sendEvent({
        type: 'PARSE_CONFIG_RESOLVE',
        payload,
      })
    );
  } catch (err) {
    logger.error('[parseConfig]', err);

    dispatch(
      sendEvent({
        type: 'PARSE_CONFIG_REJECT',
        meta: {
          error: new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, err?.message).serialize(),
        },
      })
    );
  }
};
