import React from 'react';

import { ThemeContext } from '../context';

export const useTheme = () => {
  const theme = React.useContext(ThemeContext);
  return theme;
};
