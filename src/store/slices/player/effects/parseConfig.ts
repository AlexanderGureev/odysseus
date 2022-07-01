import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { TConfig, THydraResponse, TParsedFeatures } from 'types';
import { ERROR_ITEM_MAP, ERROR_TYPE } from 'types/errors';
import { toNum } from 'utils';
import { v4 as uuidv4 } from 'uuid';

export const BASE_SUBSCRIPTION_TITLE = 'Оформить подписку';
export const EMBEDED_SUBSCRIPTION_TITLE = 'Смотреть без рекламы';

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

export const parseConfig = async (rawConfig: TConfig, opts: EffectOpts) => {
  const { getState, dispatch } = opts;

  try {
    if (!rawConfig) throw new Error('rawConfig is undefined');

    const {
      meta: { isEmbedded },
      session,
    } = getState().player;

    const config = {
      ...rawConfig,
      context: window.CONTEXT,
    };

    const features = createFeaturesConfig(isEmbedded, config.features);

    const payload = {
      config,
      features,
      meta: {
        isEmbedded,
        partnerId: config.features.partner_id,
        skin: config.features.skin_theme_class,
        trackId: Number(config.context.track_id),
      },
      session: {
        ...session,
        id: uuidv4(),
      },
    };

    dispatch(
      sendEvent({
        type: 'PARSE_CONFIG_RESOLVE',
        payload,
      })
    );
  } catch (err) {
    dispatch(
      sendEvent({
        type: 'PARSE_CONFIG_REJECT',
        payload: {
          error: {
            ...ERROR_ITEM_MAP[ERROR_TYPE.NOT_AVAILABLE],
            details: err?.message,
          },
        },
      })
    );
  }
};
