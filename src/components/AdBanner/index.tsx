import cn from 'classnames';
import { useAppSelector } from 'hooks';
import React from 'react';
import { AD_BANNER_CONTAINER_ID } from 'store/slices/adBanner';

import Styles from './index.module.css';

export const AdBanner: React.FC = () => {
  const adBanner = useAppSelector((state) => state.adBanner);

  return (
    <div
      className={cn(Styles.wrapper, {
        [Styles.active]: adBanner.step === 'VISIBLE',
      })}>
      <div className={Styles.banner} id={AD_BANNER_CONTAINER_ID} />
    </div>
  );
};
