import controlPlayIcon from 'assets/icons/icons-web-player-control-play-m.svg';
import controlPauseIcon from 'assets/sprite/icons-web-player-control-pause-m.svg';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const PlaybackButton = () => {
  const dispatch = useAppDispatch();
  const { step } = useAppSelector((state) => state.playback);

  const onClick = () => {
    dispatch(sendEvent({ type: step === 'PAUSED' ? 'DO_PLAY' : 'DO_PAUSE' }));
  };

  return (
    <div className={Styles.playback} onClick={onClick}>
      <img className={Styles.icon} key={step} src={step === 'PAUSED' ? controlPlayIcon : controlPauseIcon} />
    </div>
  );
};
