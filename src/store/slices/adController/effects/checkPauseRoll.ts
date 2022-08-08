/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const checkPauseRoll = ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  const {
    autoSwitch: { step },
    playback: { pausedAt },
    root: { adConfig },
  } = getState();

  const point = pausedAt ? adService.getPauseRoll(pausedAt) : null;
  const data = point ? adConfig?.[point.category] : null;

  if (step !== 'AUTOSWITCH_NOTIFY' && adService.canPlayAd() && point && data) {
    dispatch(
      sendEvent({
        type: 'INIT_AD_BREAK',
        payload: {
          data,
          point,
        },
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'CHECK_PAUSE_ROLL_RESOLVE',
      })
    );
  }
};
