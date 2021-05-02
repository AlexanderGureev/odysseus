import React from 'react';

import { TPlayerApi } from '../modules/player';

export enum THEME {
  MORETV = 'MORETV',
  DEFAULT = 'DEFAULT',
}

export const ThemeContext = React.createContext(THEME.DEFAULT);
export const PlayerApiContext = React.createContext<TPlayerApi>({} as TPlayerApi);
