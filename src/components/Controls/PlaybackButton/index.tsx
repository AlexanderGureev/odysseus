import controlPauseIcon from 'assets/icons/icons-web-player-control-pause-m.svg';
import controlPlayIcon from 'assets/icons/icons-web-player-control-play-m.svg';
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
      <img src={step === 'PAUSED' ? controlPlayIcon : controlPauseIcon} />
    </div>
  );
};
