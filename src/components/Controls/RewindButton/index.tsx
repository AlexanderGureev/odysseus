import controlBackwardIcon from 'assets/icons/icons-web-player-control-backward-m.svg';
import controlForwardIcon from 'assets/icons/icons-web-player-control-forward-m.svg';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';

import Styles from './index.module.css';

export const RewindBackwardButton = () => {
  const dispatch = useAppDispatch();
  const { dec } = useAppSelector((state) => state.rewindAcc);

  const onClick = () => {
    dispatch(sendEvent({ type: 'DEC_SEEK', payload: { value: -15 } }));
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
    dispatch(sendEvent({ type: 'INC_SEEK', payload: { value: 30 } }));
  };

  return (
    <div className={Styles.forward} onClick={onClick}>
      {inc > 0 && <span className={Styles.acc}>+ {inc} сек</span>}
      <img src={controlForwardIcon} />
    </div>
  );
};
