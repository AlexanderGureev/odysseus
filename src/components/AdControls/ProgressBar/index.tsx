import { Range } from 'components/UIKIT/Range';
import React from 'react';
import { secToHumanReadeable } from 'utils';

import Styles from './index.module.css';

export const ProgressBar: React.FC<{ currentTime: number; duration: number }> = ({ currentTime, duration }) => {
  return (
    <div className={Styles.progress}>
      <Range
        ariaLabel="ad creative progress slider"
        progressColor="--ad-primary-color"
        radius="3px"
        value={currentTime}
        max={duration}
        getFormattedLabel={(value) => secToHumanReadeable(value)}
      />
    </div>
  );
};
