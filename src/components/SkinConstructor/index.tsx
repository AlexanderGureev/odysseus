import cn from 'classnames';
import { useAppSelector } from 'hooks';
import React from 'react';

import Styles from './index.module.css';

const DEFAULT_SKIN_CONTROLS = 'skin-controls';

const SkinConstructor = ({ children }: React.PropsWithChildren) => {
  const { step } = useAppSelector((state) => state.adController);

  return (
    <>
      {children}
      <div id={DEFAULT_SKIN_CONTROLS}></div>
      <div
        id={'adv-controls'}
        className={cn(Styles.ad_controls, {
          [Styles.active]: step === 'AD_BREAK',
        })}></div>
    </>
  );
};

export { SkinConstructor };
