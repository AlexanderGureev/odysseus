import React from 'react';
import { TConfig, TFeatureConfig } from '../../server/types';
import { ThemeContext, PlayerApiContext } from '../context';

const useTheme = () => {
  const theme = React.useContext(ThemeContext);
  return theme;
};

const usePlayerApi = () => {
  const api = React.useContext(PlayerApiContext);
  return api;
};

const usePlayerConfig = (): [TConfig, React.Dispatch<React.SetStateAction<TConfig>>] => {
  const [config, setConfig] = React.useState<TConfig>(window.ODYSSEUS_PLAYER_CONFIG);
  return [config, setConfig];
};

const toNum = (value: string | boolean | null | undefined) => {
  if (typeof value !== 'string') return value;
  if (value && Number(value) !== NaN) return Number(value);
  return value;
};

type TParsedFeatures = Partial<
  TFeatureConfig & {
    ADV_CACHE_LOOKAHEAD: number;
    ADV_CACHE_TIMEOUT: number;
    ADV_MAX_TIMELINE_OFFSET: number;
    ADV_PLAY_WAIT_TIMEOUT: number;
    ADV_INTERSECTION_TIMEOUT: number;
    ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT: number;
  }
>;

const useFeatures = () => {
  const [config] = usePlayerConfig();
  const features = config.features.base;

  return Object.entries(features).reduce(
    (acc: TParsedFeatures, [key, value]) => ({
      ...acc,
      [key]: toNum(value),
    }),
    {}
  );
};

export { useTheme, usePlayerConfig, useFeatures, usePlayerApi };
