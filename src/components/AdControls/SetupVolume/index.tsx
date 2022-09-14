import volumeOff from 'assets/sprite/icons-app-player-volume-off.svg';
import volumeHigh from 'assets/sprite/icons-web-player-sound-on-high.svg';
import volumeLow from 'assets/sprite/icons-web-player-sound-on-low.svg';
import cn from 'classnames';
import { Range } from 'components/UIKIT/Range';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useState } from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const UnmuteButton = () => {
  const dispatch = useAppDispatch();

  const onUnmute = () => {
    dispatch(sendEvent({ type: 'SET_MUTE_AD_BLOCK', payload: { value: false } }));
  };

  return (
    <div className={Styles['unmute-button']} onClick={onUnmute}>
      <img src={volumeOff} />
      <span className={Styles.label}>{'без звука'}</span>
    </div>
  );
};

export const SetupVolume = () => {
  const dispatch = useAppDispatch();
  const { muted, volume } = useAppSelector((state) => state.volume);
  const [isDrag, setIsDrag] = useState(false);

  const onVolumeChange = (value: number) => {
    dispatch(sendEvent({ type: 'SET_VOLUME_AD_BLOCK', payload: { value } }));
  };

  const onMuteChange = () => {
    dispatch(sendEvent({ type: 'SET_MUTE_AD_BLOCK', payload: { value: !muted } }));
  };

  return (
    <div className={cn(Styles.volume, isDrag && Styles.dragging)}>
      <Range
        direction="vertical"
        ariaLabel="ad volume slider"
        progressColor="--ad-primary-color"
        radius="3px"
        onChange={onVolumeChange}
        step={0.1}
        value={muted ? 0 : volume}
        max={1}
        transitionStep={null}
        getFormattedLabel={() => null}
        onDrag={setIsDrag}
      />

      <img
        key={`${muted}`}
        className={Styles['mute-button']}
        onClick={onMuteChange}
        src={muted ? volumeOff : volume > 0.5 ? volumeHigh : volumeLow}
      />
    </div>
  );
};
