import closeIcon from 'assets/sprite/icons-24-cross.svg';
import cn from 'classnames';
import { useAppDispatch } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const Overlay = ({ children }: React.PropsWithChildren) => {
  const dispatch = useAppDispatch();

  const onClose = () => {
    dispatch(sendEvent({ type: 'CLOSE_OVERLAY' }));
  };

  return (
    <div className={cn(Styles.wrapper, Boolean(children) && Styles.visible)}>
      <img onClick={onClose} className={Styles.close} src={closeIcon} />
      {children}
    </div>
  );
};
