import cn from 'classnames';
import { IconLogoMap } from 'components/ErrorManager/templates';
import { useAppSelector, useFeatures, useSkin } from 'hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Nullable } from 'types';
import { debounce } from 'utils/debounce';

import { AudioTracksMenu } from './AudioTracksMenu';
import { ChangeTrackButtom } from './ChangeTrackButtom';
import { FavouritesButton } from './FavouritesButton';
import { FullscreenButton } from './FullscreenButton';
import Styles from './index.module.css';
import { Logo } from './Logo';
import { Menu } from './Menu';
import { PayNotice } from './PayNotice';
import { PlaybackButton } from './PlaybackButton';
import { ProgressBar } from './ProgressBar';
import { QualityMenu } from './QualityMenu';
import { RewindBackwardButton, RewindForwardButton } from './RewindButton';
import { SetupVolume, UnmuteButton } from './SetupVolume';
import { TrackDescription } from './TrackDescription';

const CONTROLS_HIDE_TIMEOUT = 4000;

const Wrapper = React.memo(({ children }: React.PropsWithChildren) => {
  const isUnmuteButton = useAppSelector((state) => state.volume.muted && !state.volume.unmuted);
  const playbackStep = useAppSelector((state) => state.playback.step);

  const [status, setControlsStatus] = useState<'controls-visible' | 'controls-hidden'>('controls-visible');
  const timer = useRef<Nullable<NodeJS.Timeout>>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hide = useCallback(
    debounce(() => {
      timer.current = setTimeout(() => {
        if (playbackStep === 'PLAYING') {
          setControlsStatus('controls-hidden');
        }
      }, CONTROLS_HIDE_TIMEOUT);
    }),
    [playbackStep]
  );

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (status === 'controls-hidden') setControlsStatus('controls-visible');
  }, [status]);

  useEffect(() => {
    if (playbackStep === 'PLAYING') hide();
    else show();
  }, [hide, playbackStep, show]);

  const onMouseMove = useCallback(() => {
    show();
    hide();
  }, [hide, show]);

  return (
    <div className={cn(Styles.controls, isUnmuteButton && 'unmute-btn', status)} onMouseMove={onMouseMove}>
      {children}
    </div>
  );
});

export const Controls = React.memo(() => {
  const skin = useSkin();
  const changeTrack = useAppSelector((state) => state.changeTrack);
  const favourites = useAppSelector((state) => state.favourites);
  const isUnmuteButton = useAppSelector((state) => state.volume.muted && !state.volume.unmuted);
  const qualityList = useAppSelector((state) => state.quality.qualityList);
  const selected = useAppSelector((state) => state.quality.currentQualityMark);
  const audioTracksConfig = useAppSelector((state) => state.audioTracks.currentConfig);
  const payNotify = useAppSelector((state) => state.payNotify);

  const { INFO_BAR_LOGO } = useFeatures();

  return (
    <Wrapper>
      <div className={cn(Styles['controls-group'], Styles.top)}>
        <div className={Styles['top-left']}>
          {INFO_BAR_LOGO && <Logo src={IconLogoMap[skin]} />}
          <TrackDescription />
        </div>
        <div className={Styles['top-right']}>
          {favourites.step === 'READY' && <FavouritesButton />}
          {audioTracksConfig && <AudioTracksMenu config={audioTracksConfig} />}
          <QualityMenu data={qualityList} selected={selected} />
          <Menu />
        </div>
      </div>
      <div className={cn(Styles['controls-group'], Styles.middle)}>
        <RewindBackwardButton />
        <PlaybackButton />
        <RewindForwardButton />
      </div>
      <div className={cn(Styles['controls-group'], Styles.bottom)}>
        {!isUnmuteButton && <SetupVolume />}
        <ProgressBar />
        {changeTrack.prev && <ChangeTrackButtom type="prev" data={changeTrack.prev} />}
        {changeTrack.next && <ChangeTrackButtom type="next" data={changeTrack.next} />}
        <FullscreenButton />
      </div>

      {isUnmuteButton && <UnmuteButton />}
      {payNotify.step === 'READY' && <PayNotice />}
    </Wrapper>
  );
});
