import controlBackwardIcon from 'assets/sprite/icons-web-player-control-backward-m.svg';
import controlForwardIcon from 'assets/sprite/icons-web-player-control-forward-m.svg';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { BACKWARD_REWIND_STEP, FORWARD_REWIND_STEP } from 'store/slices/hotkeys/constants';

import Styles from './index.module.css';

export const RewindBackwardButton = () => {
  const dispatch = useAppDispatch();
  const { dec } = useAppSelector((state) => state.rewindAcc);

  const onClick = () => {
    dispatch(sendEvent({ type: 'DEC_SEEK', payload: { value: -BACKWARD_REWIND_STEP } }));
  };

  return (
    <div className={Styles.backward} onClick={onClick}>
      {dec < 0 && <span className={Styles.acc}>- {Math.abs(dec)} сек</span>}
      <img src={controlBackwardIcon} />
    </div>
  );
};

export const RewindForwardButton = () => {
  const dispatch = useAppDispatch();
  const { inc } = useAppSelector((state) => state.rewindAcc);

  const onClick = () => {
    dispatch(sendEvent({ type: 'INC_SEEK', payload: { value: FORWARD_REWIND_STEP } }));
  };

  return (
    <div className={Styles.forward} onClick={onClick}>
      {inc > 0 && <span className={Styles.acc}>+ {inc} сек</span>}
      <img src={controlForwardIcon} />
    </div>
  );
};
