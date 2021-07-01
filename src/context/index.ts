import React from 'react';
import { TConfig } from 'server/types';
import { Nullable } from 'types';
import { TPlayerApi } from 'components/Player';
import { TParsedAdConfig } from 'providers/AdConfigProvider';
import { TParsedFeatures } from 'providers/FeaturesProvider';
import { TExtendedConfig } from 'providers/PlayerConfigProvider';
import { TSource } from 'services/StreamService';

export enum THEME {
  MORETV = 'MORETV',
  DEFAULT = 'DEFAULT',
}

type TPlayerConfigContext = {
  config: TExtendedConfig;
  setConfig: (config: TConfig) => void;
};

type TAdStreamContext = { source: Nullable<TSource>; nextStream: () => void };

export const ThemeContext = React.createContext(THEME.DEFAULT);
export const PlayerApiContext = React.createContext<TPlayerApi>({} as TPlayerApi);
export const PlayerConfigContext = React.createContext<TPlayerConfigContext>({} as TPlayerConfigContext);

export const AdConfigContext = React.createContext<TParsedAdConfig>({ adConfig: {}, adPoints: [] });
export const StreamContext = React.createContext<TAdStreamContext>({
  source: null,
  nextStream: () => undefined,
});

export const FeaturesContext = React.createContext<Partial<TParsedFeatures>>({});
