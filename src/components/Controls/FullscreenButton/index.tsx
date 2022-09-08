import exitFullscreenIcon from 'assets/sprite/icons-app-player-fullscreen-off.svg';
import enterFullcreenIcon from 'assets/sprite/icons-app-player-fullscreen-on.svg';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const FullscreenButton = () => {
  const dispatch = useAppDispatch();
  const { step } = useAppSelector((state) => state.fullscreen);

  const onClick = () => {
    dispatch(sendEvent({ type: step === 'FULLSCREEN' ? 'EXIT_FULLCREEN' : 'ENTER_FULLCREEN' }));
  };

  return (
    <div className={Styles.wrapper} onClick={onClick}>
      <img key={step} src={step === 'FULLSCREEN' ? exitFullscreenIcon : enterFullcreenIcon} />
    </div>
  );
};
