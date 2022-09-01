import volumeOff from 'assets/icons/icons-app-player-volume-off.svg';
import unmuteIcon from 'assets/icons/icons-web-player-sound-off-in-circle.svg';
import volumeHigh from 'assets/icons/icons-web-player-sound-on-high.svg';
import volumeLow from 'assets/icons/icons-web-player-sound-on-low.svg';
import cn from 'classnames';
import { Range } from 'components/UIKIT/Range';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useState } from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const UnmuteButton = () => {
  const dispatch = useAppDispatch();

  const onUnmute = () => {
    dispatch(sendEvent({ type: 'SET_MUTE', payload: { value: false } }));
  };

  return (
    <div className={Styles['unmute-button']} onClick={onUnmute}>
      <img src={unmuteIcon} />
    </div>
  );
};

export const SetupVolume = () => {
  const dispatch = useAppDispatch();
  const { muted, volume } = useAppSelector((state) => state.volume);
  const [isDrag, setIsDrag] = useState(false);

  const onVolumeChange = (value: number) => {
    dispatch(sendEvent({ type: 'SET_VOLUME', payload: { value } }));
  };

  const onMuteChange = () => {
    dispatch(sendEvent({ type: 'SET_MUTE', payload: { value: !muted } }));
  };

  return (
    <div className={cn(Styles.volume, isDrag && Styles.dragging)}>
      <Range
        direction="vertical"
        ariaLabel="volume slider"
        progressColor="--primary-color"
        radius="3px"
        onChange={onVolumeChange}
        step={0.1}
        value={muted ? 0 : volume}
        max={1}
        getFormattedLabel={() => null}
        onDrag={setIsDrag}
      />

      <img
        className={Styles['mute-button']}
        onClick={onMuteChange}
        src={muted ? volumeOff : volume > 0.5 ? volumeHigh : volumeLow}
      />
    </div>
  );
};
