/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { AdCategory } from 'types/ad';

export const checkPostRoll = ({ getState, dispatch, services: { adService } }: EffectOpts) => {
  const {
    autoSwitch: { step },
    root: { adConfig },
  } = getState();

  const data = adConfig?.post_roll;

  if (step !== 'AUTOSWITCH_PENDING' && adService.canPlayAd() && data) {
    dispatch(
      sendEvent({
        type: 'INIT_AD_BREAK',
        payload: {
          data,
          point: {
            point: 0,
            category: AdCategory.POST_ROLL,
          },
        },
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'CHECK_POST_ROLL_RESOLVE',
      })
    );
  }
};
