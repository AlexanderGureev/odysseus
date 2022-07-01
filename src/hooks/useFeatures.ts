import React from 'react';

import { FeaturesContext } from '../context';

export const useFeatures = () => {
  const features = React.useContext(FeaturesContext);
  return features;
};
