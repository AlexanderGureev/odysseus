import cn from 'classnames';
import { AdSkin } from 'components/AdSkin';
import { AdultConfirmationNotice } from 'components/AdultConfirmationNotice';
import { Autoswitch } from 'components/Autoswitch';
import { AutoswitchAvodPopup } from 'components/AutoswitchAvodPopup';
import { BigPlayButton } from 'components/BigPlayButton';
import { Controls } from 'components/Controls';
import { Complain } from 'components/Controls/Menu/Complain';
import { Embedding } from 'components/Controls/Menu/Embedding';
import { Hotkeys } from 'components/Controls/Menu/Hotkeys';
import { Sharing } from 'components/Controls/Menu/Sharing';
import { ErrorManager } from 'components/ErrorManager';
import { NetworkNotice } from 'components/NetworkNotice';
import { Paywall } from 'components/Paywall';
import { ResumeVideoNotice } from 'components/ResumeVideoNotice';
import { SpashScreen } from 'components/SpashScreen';
import { Modal } from 'components/UIKIT/Modal';
import { Overlay } from 'components/UIKIT/Overlay';
import { useAppDispatch, useAppSelector } from 'hooks';
import { MenuProvider } from 'providers/MenuProvider';
import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { DEFAULT_PLAYER_ID } from 'services/PlayerService/types';
import { sendEvent } from 'store';
import { OverlayType } from 'store/slices/overlay';
import { AppThemeBySkin, SkinClass } from 'types';

const Player = ({ children }: React.PropsWithChildren) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(sendEvent({ type: 'DO_PLAYER_INIT' }));
  }, [dispatch]);

  return (
    <div data-vjs-player>
      <video id={DEFAULT_PLAYER_ID} preload="metadata" muted playsInline />
      {children}
    </div>
  );
};

const theme = AppThemeBySkin[window?.ODYSSEUS_PLAYER_CONFIG?.features?.skin_theme_class || SkinClass.DEFAULT];

const OverlayContentByType: { [key in OverlayType]?: () => React.ReactElement | null } = {
  embedding: Embedding,
  hotkeys: Hotkeys,
  sharing: Sharing,
};

const ModalContentByType: { [key in OverlayType]?: () => React.ReactElement | null } = {
  complain: Complain,
};

const PlayerManager = () => {
  const { step, isShowPlayerUI } = useAppSelector((state) => state.root);
  const isRenderControls = useAppSelector((state) =>
    Boolean(state.root.step === 'READY' && state.adController.step !== 'AD_BREAK' && state.playback.duration)
  );

  const isFullscreen = useAppSelector((state) => state.fullscreen.step === 'FULLSCREEN');
  const isEmbedded = useAppSelector((state) => state.root.meta.isEmbedded);
  const paywall = useAppSelector((state) => state.paywall);
  const resumeVideoNotify = useAppSelector((state) => state.resumeVideoNotify);
  const adultNotify = useAppSelector((state) => state.adultNotify);
  const splashscreen = useAppSelector((state) => state.splashscreen);
  const networkRecovery = useAppSelector((state) => state.networkRecovery);
  const autoSwitch = useAppSelector((state) => state.autoSwitch);
  const isOverlay = useAppSelector((state) => state.overlay.step === 'READY');

  const isTrialSuggestion = useAppSelector(
    (state) =>
      state.trialSuggestion.step === 'SHOWING_TRIAL_NOTICE' &&
      state.trialSuggestion.notifyType === 'triggerBeforePauserolls'
  );

  const overlayType = useAppSelector((state) => state.overlay.overlayType);
  const OverlayContent = OverlayContentByType[overlayType];
  const ModalContent = ModalContentByType[overlayType];

  return (
    <div
      className={cn(
        'wrapper',
        theme,
        isFullscreen && 'fullscreen',
        isEmbedded && 'embedded',
        paywall.step === 'READY' && 'paywall',
        autoSwitch.step === 'AUTOSWITCH_NOTIFY' && 'autoswitch',
        isTrialSuggestion && 'trial-suggestion',
        isOverlay && 'overlay',
        isMobile && 'mobile'
      )}>
      <ErrorManager>
        {isShowPlayerUI && (
          <>
            <Player>
              <MenuProvider>{isRenderControls && <Controls />}</MenuProvider>

              {step === 'BIG_PLAY_BUTTON' && <BigPlayButton />}

              {paywall.step === 'READY' && <Paywall />}

              {resumeVideoNotify.step === 'RESUME_VIDEO_NOTIFY' && resumeVideoNotify.time && (
                <ResumeVideoNotice time={resumeVideoNotify.time} />
              )}

              {['ADULT_NOTIFY_REJECTED', 'ADULT_NOTIFY'].includes(adultNotify.step) && <AdultConfirmationNotice />}

              {splashscreen.step === 'SHOWING_SPLASHCREEN' && <SpashScreen data={splashscreen.screens} />}

              {networkRecovery.step !== 'DISABLED' && <NetworkNotice />}

              {autoSwitch.step === 'AUTOSWITCH_NOTIFY' ? (
                autoSwitch.autoswitchNotifyType === 'avod_popup' ? (
                  <AutoswitchAvodPopup />
                ) : (
                  <Autoswitch />
                )
              ) : null}

              <Overlay>{OverlayContent ? <OverlayContent /> : null}</Overlay>
              <Modal>{ModalContent ? <ModalContent /> : null}</Modal>
            </Player>
            <AdSkin />
          </>
        )}
      </ErrorManager>
    </div>
  );
};

export const App: React.FC = () => {
  return <PlayerManager />;
};
