import React from 'react';

import { PlayerConfigContext } from '../context';

export const usePlayerConfig = () => {
  const ctx = React.useContext(PlayerConfigContext);
  return ctx;
};
