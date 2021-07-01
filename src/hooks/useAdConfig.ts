import React from 'react';
import { AdConfigContext } from '../context';

export const useAdConfig = () => {
  const ctx = React.useContext(AdConfigContext);
  return ctx;
};
