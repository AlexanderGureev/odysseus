import cn from 'classnames';
import { AdControls } from 'components/AdControls';
import { AdDisableSuggestionNotice } from 'components/AdDisableSuggestionNotice';
import { AdultConfirmationNotice } from 'components/AdultConfirmationNotice';
import { Autoswitch } from 'components/Autoswitch';
import { AutoswitchAvodPopup } from 'components/AutoswitchAvodPopup';
import { BigPlayButton } from 'components/BigPlayButton';
import { Controls } from 'components/Controls';
import { Complain } from 'components/Controls/Menu/Complain';
import { Embedding } from 'components/Controls/Menu/Embedding';
import { Hotkeys } from 'components/Controls/Menu/Hotkeys';
import { Sharing } from 'components/Controls/Menu/Sharing';
import { HotkeysNotice } from 'components/HotkeysNotice';
import { Loader } from 'components/Loader';
import { Paywall } from 'components/Paywall';
import { ResumeVideoNotice } from 'components/ResumeVideoNotice';
import { SpashScreen } from 'components/SpashScreen';
import { Modal } from 'components/UIKIT/Modal';
import { Overlay } from 'components/UIKIT/Overlay';
import { useAppSelector, useFeatures } from 'hooks';
import { Player } from 'Player';
import { MenuProvider } from 'providers/MenuProvider';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { OverlayType } from 'store/slices/overlay';
import { AppThemeBySkin, SkinClass } from 'types';

const theme = AppThemeBySkin[window?.ODYSSEUS_PLAYER_CONFIG?.features?.skin_theme_class || SkinClass.DEFAULT];

const OverlayContentByType: { [key in OverlayType]?: () => React.ReactElement | null } = {
  embedding: Embedding,
  hotkeys: Hotkeys,
  sharing: Sharing,
};

const ModalContentByType: { [key in OverlayType]?: () => React.ReactElement | null } = {
  complain: Complain,
};

export const PlayerManager = React.memo(() => {
  const { step, theme: playerControlsTheme, previews } = useAppSelector((state) => state.root);

  const isRenderControls = useAppSelector((state) =>
    Boolean(state.root.step === 'READY' && state.adController.step !== 'AD_BREAK' && state.playback.duration)
  );

  const isFullscreen = useAppSelector((state) => state.fullscreen.step === 'FULLSCREEN');
  const isEmbedded = useAppSelector((state) => state.root.meta.isEmbedded);
  const paywall = useAppSelector((state) => state.paywall);
  const resumeVideoNotify = useAppSelector((state) => state.resumeVideoNotify);
  const adultNotify = useAppSelector((state) => state.adultNotify);
  const splashscreen = useAppSelector((state) => state.splashscreen);
  const autoSwitch = useAppSelector((state) => state.autoSwitch);
  const isOverlay = useAppSelector((state) => state.overlay.step === 'READY');
  const isAutoswitch = ['AUTOSWITCH_NOTIFY'].includes(autoSwitch.step);
  const adDisableSuggestion = useAppSelector((state) => state.adDisableSuggestion);
  const trialSuggestion = useAppSelector((state) => state.trialSuggestion);
  const payNotify = useAppSelector((state) => state.payNotify);
  const isUnmuteButton = useAppSelector((state) => state.volume.muted && !state.volume.unmuted);
  const adNotify = useAppSelector((state) => state.adTimeNotify);

  const { CONTROLS = true } = useFeatures();

  const overlayType = useAppSelector((state) => state.overlay.overlayType);
  const OverlayContent = OverlayContentByType[overlayType];
  const ModalContent = ModalContentByType[overlayType];

  return (
    <div
      className={cn(
        'wrapper',
        theme,
        `controls-theme-${playerControlsTheme}`,
        previews?.length && 'preview',
        isFullscreen && 'fullscreen',
        isEmbedded && 'embedded',
        paywall.step === 'READY' && 'paywall',
        isAutoswitch && 'autoswitch',
        payNotify.step === 'READY' && 'pay-notice',
        !!adNotify.time && 'ad-countdown',
        isAutoswitch && autoSwitch.autoswitchNotifyType && `autoswitch-${autoSwitch.autoswitchNotifyType}`,
        trialSuggestion.step === 'SHOWING_TRIAL_NOTICE' && 'trial-suggestion',
        trialSuggestion.notifyType === 'triggerBeforePauserolls' && 'trial-suggestion-before-pauseroll',
        isUnmuteButton && 'unmute-button',
        isOverlay && 'overlay',
        isMobile && 'mobile'
      )}>
      <Player>
        {isRenderControls && CONTROLS && (
          <>
            <MenuProvider>
              <Controls />
            </MenuProvider>

            <Overlay>{OverlayContent ? <OverlayContent /> : null}</Overlay>
            <Modal>{ModalContent ? <ModalContent /> : null}</Modal>
          </>
        )}

        <AdControls />

        <HotkeysNotice />

        {CONTROLS && <Loader />}

        {step === 'BIG_PLAY_BUTTON' && <BigPlayButton />}

        {paywall.step === 'READY' && <Paywall />}

        {resumeVideoNotify.step === 'RESUME_VIDEO_NOTIFY' && resumeVideoNotify.time && (
          <ResumeVideoNotice time={resumeVideoNotify.time} />
        )}

        {['ADULT_NOTIFY_REJECTED', 'ADULT_NOTIFY'].includes(adultNotify.step) && <AdultConfirmationNotice />}

        {splashscreen.step === 'SHOWING_SPLASHCREEN' && <SpashScreen data={splashscreen.screens} />}

        {isAutoswitch ? (
          autoSwitch.autoswitchNotifyType === 'avod_popup' ? (
            <AutoswitchAvodPopup />
          ) : (
            <Autoswitch />
          )
        ) : null}

        {adDisableSuggestion.step === 'SHOWING_AD_DISABLE_SUGGESTION' && (
          <AdDisableSuggestionNotice content={adDisableSuggestion} />
        )}
      </Player>
    </div>
  );
});
