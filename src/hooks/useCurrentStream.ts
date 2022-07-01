import React from 'react';

import { StreamContext } from '../context';

export const useCurrentStream = () => {
  const ctx = React.useContext(StreamContext);
  return ctx;
};
