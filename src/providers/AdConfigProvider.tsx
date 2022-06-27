import React from 'react';
import { AdConfigContext } from '../context';
import {
  TRawAdConfig,
  TRawPlaylist,
  AdCategory,
  TContentRollsConfig,
  TMiddleRollsConfig,
  TPlaceholder,
  TPreRollsConfig,
} from 'server/types';
import { TAdConfigByCategory } from 'components/Advertisement';
import { usePlayerConfig } from 'hooks';

export type TAdPointConfig = {
  point: number;
  category: AdCategory;
  placeholders?: TPlaceholder;
};

export type TAdPointsConfig = TAdPointConfig[];
export type TParsedAdConfig = {
  adConfig: TAdConfigByCategory;
  adPoints: TAdPointsConfig;
};

type TAdKeys = 'midrolls' | 'contentrolls' | 'prerolls';
type TMap = {
  midrolls: (p: TMiddleRollsConfig) => TAdPointsConfig;
  contentrolls: (p: TContentRollsConfig) => TAdPointsConfig;
  prerolls: (p: TPreRollsConfig) => TAdPointsConfig;
};

const ParseMap: TMap = {
  midrolls: ({ points }: TMiddleRollsConfig) =>
    points.map(({ point }) => ({
      point,
      category: AdCategory.MID_ROLL,
    })),
  contentrolls: ({ points }: TContentRollsConfig) =>
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

    const config = {
      ...acc,
      [key]: {
        links: ad[key]?.items.filter((i) => i.item).map((i) => i.item),
        limit: ad[key]?.params.limiter,
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

export const AdConfigProvider = ({ children }: React.PropsWithChildren) => {
  const {
    config: {
      config: { ad = {} },
      playlist,
    },
  } = usePlayerConfig();
  const [config] = React.useState(createAdConfig(ad, playlist));

  return <AdConfigContext.Provider value={config}>{children}</AdConfigContext.Provider>;
};
