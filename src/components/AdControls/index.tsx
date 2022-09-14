import cn from 'classnames';
import { useAppDispatch, useAppSelector, useFeatures } from 'hooks';
import React from 'react';
import { sendEvent } from 'store';
import { DEFAULT_ADV_CONTROLS_ID } from 'store/slices/adController/effects/init';

import Styles from './index.module.css';
import { ProgressBar } from './ProgressBar';
import { SetupVolume, UnmuteButton } from './SetupVolume';

const AdControls = () => {
  const dispatch = useAppDispatch();
  const { SHOW_AD_NUMBER } = useFeatures();
  const { step } = useAppSelector((state) => state.adController);
  const isUnmuteButton = useAppSelector(
    (state) => state.volume.muted && (!state.volume.unmuted || state.root.deviceInfo.isMobile)
  );

  const { currentTime, duration, index, limit, skippable, isVolumeAvailable, isYandexCreative } = useAppSelector(
    (state) => state.adBlock
  );

  const onSkip = () => {
    dispatch(sendEvent({ type: 'DO_SKIP_AD_BLOCK' }));
  };

  return (
    <>
      <div
        id={DEFAULT_ADV_CONTROLS_ID}
        className={cn(Styles['yasdk-controls'], {
          [Styles.active]: step === 'AD_BREAK',
        })}
      />

      {step === 'AD_BREAK' && !isYandexCreative && duration && (
        <div className={Styles.wrapper}>
          {SHOW_AD_NUMBER && (
            <div className={Styles['ad-num']}>
              Реклама {index + 1} из {limit}
            </div>
          )}

          {!isVolumeAvailable ? null : isUnmuteButton ? <UnmuteButton /> : <SetupVolume />}
          <ProgressBar currentTime={currentTime || 0} duration={duration} />

          {skippable && (
            <button className={Styles['skip-btn']} onClick={onSkip}>
              пропустить
            </button>
          )}
        </div>
      )}
    </>
  );
};

export { AdControls };
