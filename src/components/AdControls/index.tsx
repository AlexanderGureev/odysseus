import cn from 'classnames';
import { useAppSelector } from 'hooks';
import React from 'react';

import Styles from './index.module.css';

const AdControls = () => {
  const { step } = useAppSelector((state) => state.adController);

  return (
    <div
      id={'adv-controls'}
      className={cn(Styles.ad_controls, {
        [Styles.active]: step === 'AD_BREAK',
      })}
    />
  );
};

export { AdControls };
