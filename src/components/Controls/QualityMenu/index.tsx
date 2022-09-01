import qualityMenuIcon from 'assets/icons/icons-app-player-settings.svg';
import React from 'react';

import Styles from './index.module.css';

export const QualityMenu = () => {
  return (
    <div className={Styles.quality}>
      <img className={Styles.icon} src={qualityMenuIcon} />
      <span>Качество</span>
    </div>
  );
};
