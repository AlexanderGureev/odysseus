import controlPlayIcon from 'assets/icons/icons-web-player-control-play-m.svg';
import rewindBackwardIcon from 'assets/sprite/icons-24-hotkeys-rewind-backward.svg';
import rewindForwardIcon from 'assets/sprite/icons-24-hotkeys-rewind-forward.svg';
import volumeOffIcon from 'assets/sprite/icons-app-player-volume-off.svg';
import volumeIcon from 'assets/sprite/icons-app-player-volume-on-high.svg';
import controlPauseIcon from 'assets/sprite/icons-web-player-control-pause-m.svg';
import cn from 'classnames';
import { useAppSelector } from 'hooks';
import React from 'react';
import { HotkeysAction } from 'store/slices/hotkeysNotice';

import Styles from './index.module.css';

const IconByType: { [key in HotkeysAction]: string } = {
  play: controlPlayIcon,
  pause: controlPauseIcon,
  backward_seek: rewindBackwardIcon,
  forward_seek: rewindForwardIcon,
  volume: volumeIcon,
  mute: volumeOffIcon,
};

export const HotkeysNotice: React.FC = React.memo(() => {
  const { type, text, key } = useAppSelector((state) => state.hotkeysNotice);

  if (!type) return null;
  const icon = IconByType[type];

  return (
    <div className={cn(Styles.wrapper, Styles[`${type}`])}>
      <div key={key} className={Styles.notice}>
        <img className={Styles.icon} src={icon} />
        {text}
      </div>
    </div>
  );
});
