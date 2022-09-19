import cn from 'classnames';
import { AdBanner } from 'components/AdBanner';
import { AdCountdown } from 'components/AdCountdown';
import { IconLogoMap } from 'components/ErrorManager/templates';
import { TrialSuggestionNotice } from 'components/TrialSuggestionNotice';
import { useAppDispatch, useAppSelector, useFeatures, useSkin } from 'hooks';
import { useMenu } from 'hooks/useMenu';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { sendEvent } from 'store';
import { Nullable } from 'types';
import { dbclick } from 'utils/dbclick';
import { debounce } from 'utils/debounce';

import { AudioTracksMenu } from './AudioTracksMenu';
import { ChangeTrackButtom } from './ChangeTrackButtom';
import { FavouritesButton } from './FavouritesButton';
import { FullscreenButton } from './FullscreenButton';
import Styles from './index.module.css';
import { Logo } from './Logo';
import { Menu } from './Menu';
import { PayButton } from './PayButton';
import { PayNotice } from './PayNotice';
import { PlaybackButton } from './PlaybackButton';
import { ProgressBar } from './ProgressBar';
import { QualityMenu } from './QualityMenu';
import { RewindBackwardButton, RewindForwardButton } from './RewindButton';
import { SetupVolume, UnmuteButton } from './SetupVolume';
import { TrackDescription } from './TrackDescription';
import { TrailerSubNotice } from './TrailerSubNotice';

const CONTROLS_HIDE_TIMEOUT = 4000;
const MIDDLE_ID = 'middle-controls-group';

const Wrapper = React.memo(({ children, className }: React.PropsWithChildren<{ className?: string }>) => {
  const isUnmuteButton = useAppSelector((state) => state.volume.muted && !state.volume.unmuted);
  const playbackStep = useAppSelector((state) => state.playback.step);
  const rewindStep = useAppSelector((state) => state.rewind.step);
  const { setState } = useMenu();

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
    if (status === 'controls-hidden' && isMobile) {
      setState((s) =>
        Object.keys(s).reduce((acc, key) => {
          return { ...acc, [key]: s[key] ? 'leave' : null };
        }, {})
      );
    }
  }, [setState, status]);

  useEffect(() => {
    if (playbackStep === 'PLAYING') hide();
    else show();
  }, [hide, playbackStep, show]);

  useEffect(() => {
    if (rewindStep === 'SEEKING') show();
  }, [rewindStep, show]);

  const onMouseMove = useCallback(() => {
    show();
    hide();
  }, [hide, show]);

  return (
    <div
      className={cn(Styles.controls, isUnmuteButton && 'unmute-btn', status, className)}
      onMouseMove={onMouseMove}
      onMouseEnter={show}
      onMouseLeave={() => {
        if (playbackStep === 'PLAYING') {
          setControlsStatus('controls-hidden');
        }
      }}
      onClick={show}>
      <div className={Styles.wrapper}>{children}</div>
    </div>
  );
});

export const Controls = React.memo(() => {
  const dispatch = useAppDispatch();
  const skin = useSkin();
  const changeTrack = useAppSelector((state) => state.changeTrack);
  const favourites = useAppSelector((state) => state.favourites);
  const isUnmuteButton = useAppSelector(
    (state) => state.volume.muted && (!state.volume.unmuted || state.root.deviceInfo.isMobile)
  );
  const qualityList = useAppSelector((state) => state.quality.qualityList);
  const selected = useAppSelector((state) => state.quality.currentQualityMark);
  const audioTracksConfig = useAppSelector((state) => state.audioTracks.currentConfig);
  const payNotify = useAppSelector((state) => state.payNotify);
  const payButton = useAppSelector((state) => state.payButton);
  const adNotify = useAppSelector((state) => state.adTimeNotify);
  const trialSuggestion = useAppSelector((state) => state.trialSuggestion);
  const trailerSubNotice = useAppSelector((state) => state.trailerSubNotice);
  const playback = useAppSelector((state) => state.playback);
  const fullscreen = useAppSelector((state) => state.fullscreen);

  const { INFO_BAR_LOGO, ALLOW_FULLSCREEN = true } = useFeatures();
  const middleNodeRef = useRef<HTMLDivElement | null>(null);

  const [isActiveVolumeRange, setIsActiveVolumeRange] = useState(false);
  const onVisibleVolumeChange = useCallback((visible: boolean) => {
    setIsActiveVolumeRange(visible);
  }, []);

  useEffect(() => {
    if (!middleNodeRef.current || isMobile) return;

    return dbclick(middleNodeRef.current, () => {
      dispatch(sendEvent({ type: fullscreen.step === 'FULLSCREEN' ? 'EXIT_FULLCREEN' : 'ENTER_FULLCREEN' }));
    });
  }, [dispatch, fullscreen.step]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isMobile && e.currentTarget === e.target) {
        dispatch(sendEvent({ type: playback.step === 'PAUSED' ? 'DO_PLAY' : 'DO_PAUSE' }));
      }
    },
    [dispatch, playback.step]
  );

  return (
    <Wrapper className={cn(isActiveVolumeRange && 'volume-range-active')}>
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
      <div ref={middleNodeRef} id={MIDDLE_ID} className={cn(Styles['controls-group'], Styles.middle)} onClick={onClick}>
        <RewindBackwardButton />
        <PlaybackButton />
        <RewindForwardButton />
      </div>
      <div className={cn(Styles['controls-group'], Styles.bottom)}>
        {!isUnmuteButton && <SetupVolume onVisibleVolumeChange={onVisibleVolumeChange} />}
        <ProgressBar />
        {changeTrack.prev && <ChangeTrackButtom type="prev" data={changeTrack.prev} />}
        {changeTrack.next && <ChangeTrackButtom type="next" data={changeTrack.next} />}
        {ALLOW_FULLSCREEN && <FullscreenButton />}
      </div>

      {isUnmuteButton && <UnmuteButton />}
      {payNotify.step === 'READY' && <PayNotice />}
      {payButton.step === 'READY' && <PayButton />}

      {trialSuggestion.step === 'SHOWING_TRIAL_NOTICE' &&
        trialSuggestion.notifyType &&
        trialSuggestion.notifyContent && (
          <TrialSuggestionNotice type={trialSuggestion.notifyType} content={trialSuggestion.notifyContent} />
        )}

      {!!adNotify.time && <AdCountdown time={adNotify.time} />}

      {trailerSubNotice.step === 'READY' && <TrailerSubNotice />}
      <AdBanner />
    </Wrapper>
  );
});
