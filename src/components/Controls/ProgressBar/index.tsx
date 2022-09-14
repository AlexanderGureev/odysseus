import { Range } from 'components/UIKIT/Range';
import { useAppDispatch, useAppSelector } from 'hooks';
import React, { useRef } from 'react';
import { sendEvent } from 'store';
import { secToHumanReadeable } from 'utils';

import Styles from './index.module.css';

export const ProgressBar = () => {
  const dispatch = useAppDispatch();
  const { currentTime, duration } = useAppSelector((state) => state.playback);
  const { bufferedEnd } = useAppSelector((state) => state.buffering);

  const time = secToHumanReadeable(currentTime || 0);

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
      <div className={Styles['time-info']}>
        <span
          className={Styles.time}
          style={{
            minWidth: time.length < 6 ? 38 : 54,
          }}>
          {time}
        </span>
        <span className={Styles.separator}>{'/'}</span>
        <span>{secToHumanReadeable(duration || 0)}</span>
      </div>
    </div>
  );
};
