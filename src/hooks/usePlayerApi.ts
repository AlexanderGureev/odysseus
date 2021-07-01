import React from 'react';
import { PlayerApiContext } from '../context';

export const usePlayerApi = () => {
  const api = React.useContext(PlayerApiContext);
  return api;
};
