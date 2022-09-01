import { Range } from 'components/UIKIT/Range';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { secToHumanReadeable } from 'utils';

import Styles from './index.module.css';

export const ProgressBar = () => {
  const dispatch = useAppDispatch();
  const { currentTime, duration } = useAppSelector((state) => state.playback);
  const { bufferedEnd } = useAppSelector((state) => state.buffering);

  return (
    <div className={Styles.progress}>
      <Range
        ariaLabel="video progress slider"
        onDragEnd={(value) => {
          dispatch(sendEvent({ type: 'SEEK', meta: { to: value } }));
        }}
        progressColor="--primary-color"
        radius="3px"
        bufferValue={bufferedEnd}
        value={currentTime || 0}
        max={duration || 0}
        step={30}
        getFormattedLabel={(value) => secToHumanReadeable(value)}
      />
      <div className={Styles.duration}>{secToHumanReadeable(duration || 0)}</div>
    </div>
  );
};
