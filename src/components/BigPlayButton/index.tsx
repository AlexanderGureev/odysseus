import controlPlayIcon from 'assets/sprite/icons-web-player-control-play-m.svg';
import { useAppDispatch, useAppSelector } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { getPlaylistItem } from 'store/selectors';

import Styles from './index.module.css';

export const BigPlayButton = () => {
  const dispatch = useAppDispatch();
  const poster = useAppSelector((state) => getPlaylistItem(state)?.thumbnail_url);

  return (
    <div className={Styles.wrapper} style={{ backgroundImage: `url(${poster})` }}>
      <img
        onClick={() => {
          dispatch(sendEvent({ type: 'CLICK_BIG_PLAY_BUTTON' }));
        }}
        src={controlPlayIcon}
      />
    </div>
  );
};
