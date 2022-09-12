import cn from 'classnames';
import { useAppSelector } from 'hooks';
import React from 'react';

import Styles from './index.module.css';

export const Loader = () => {
  const { step, type } = useAppSelector((state) => state.loader);
  const isActive = step === 'SHOWING';

  return (
    <div className={cn(Styles.wrapper, { [Styles.active]: isActive && type === 'overlay' })}>
      <div className={cn(Styles.loader, { [Styles.active]: isActive })} />
    </div>
  );
};
