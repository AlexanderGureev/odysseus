import React from 'react';
import { useEffect, useState } from 'react';
import { TFeatureConfig, THydraResponse } from 'server/types';
import { FeaturesContext } from 'context';
import { usePlayerConfig } from 'hooks';
import { EmbeddedCheckService } from 'services/EmbeddedCheckService';
import { toNum } from 'utils';

export type TParsedFeatures = Partial<
  TFeatureConfig & {
    ADV_CACHE_LOOKAHEAD: number;
    ADV_CACHE_TIMEOUT: number;
    ADV_MAX_TIMELINE_OFFSET: number;
    ADV_PLAY_WAIT_TIMEOUT: number;
    ADV_INTERSECTION_TIMEOUT: number;
    ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT: number;
  }
>;

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

export const FeaturesProvider: React.FC = ({ children }) => {
  const { isEmbedded } = EmbeddedCheckService.getState();
  const { config } = usePlayerConfig();
  const [features, set] = useState(createFeaturesConfig(isEmbedded, config.features));

  useEffect(() => {
    set(createFeaturesConfig(isEmbedded, config.features));
  }, [config.features, isEmbedded]);

  return <FeaturesContext.Provider value={features}>{children}</FeaturesContext.Provider>;
};
