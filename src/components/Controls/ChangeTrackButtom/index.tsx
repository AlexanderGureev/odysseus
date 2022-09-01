import nextTrackIcon from 'assets/icons/icons-24-next-track.svg';
import prevTrackIcon from 'assets/icons/icons-24-previous-track.svg';
import { useAppDispatch } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { NextTrackInfo } from 'store/slices/changeTrack';

import Styles from './index.module.css';

export const ChangeTrackButtom: React.FC<{ type: 'next' | 'prev'; data: NextTrackInfo }> = ({
  type,
  data: { thumbnail, caption },
}) => {
  const dispatch = useAppDispatch();
  const onClick = () => {
    dispatch(sendEvent({ type: type === 'next' ? 'GO_TO_NEXT_TRACK' : 'GO_TO_PREV_TRACK' }));
  };

  return (
    <div className={Styles.wrapper} onClick={onClick}>
      <div className={Styles.thumb}>
        <img src={thumbnail} />
        <span className={Styles.caption}>{caption}</span>
      </div>
      <img className={Styles.btn} src={type === 'next' ? nextTrackIcon : prevTrackIcon} />
    </div>
  );
};
