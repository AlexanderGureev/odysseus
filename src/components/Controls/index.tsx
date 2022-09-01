import { IconLogoMap } from 'components/ErrorManager/templates';
import { useAppSelector, useFeatures, useSkin } from 'hooks';
import React from 'react';

import { ChangeTrackButtom } from './ChangeTrackButtom';
import { FavouritesButton } from './FavouritesButton';
import { FullscreenButton } from './FullscreenButton';
import Styles from './index.module.css';
import { Logo } from './Logo';
import { Menu } from './Menu';
import { PlaybackButton } from './PlaybackButton';
import { ProgressBar } from './ProgressBar';
import { QualityMenu } from './QualityMenu';
import { RewindBackwardButton, RewindForwardButton } from './RewindButton';
import { SetupVolume, UnmuteButton } from './SetupVolume';
import { TrackDescription } from './TrackDescription';

export const Controls = () => {
  const skin = useSkin();
  const changeTrack = useAppSelector((state) => state.changeTrack);
  const { muted, unmuted } = useAppSelector((state) => state.volume);
  const { INFO_BAR_LOGO } = useFeatures();

  return (
    <div className={Styles.controls}>
      <div className={Styles.top}>
        <div className={Styles['top-left']}>
          {INFO_BAR_LOGO && <Logo src={IconLogoMap[skin]} />}
          <TrackDescription />
        </div>
        <div className={Styles['top-right']}>
          <FavouritesButton />
          <QualityMenu />
          <Menu />
        </div>
      </div>
      <div className={Styles.middle}>
        <RewindBackwardButton />
        <PlaybackButton />
        <RewindForwardButton />
      </div>
      <div className={Styles.bottom}>
        {muted && !unmuted ? <UnmuteButton /> : <SetupVolume />}
        <ProgressBar />
        {changeTrack.prev && <ChangeTrackButtom type="prev" data={changeTrack.prev} />}
        {changeTrack.next && <ChangeTrackButtom type="next" data={changeTrack.next} />}
        <FullscreenButton />
      </div>
    </div>
  );
};
