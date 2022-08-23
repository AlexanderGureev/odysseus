import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { getPlaylistItem } from 'store/selectors';

const ADULT_AGE = 18;

export const checkAdult = async ({ getState, dispatch }: EffectOpts) => {
  const data = getPlaylistItem(getState());
  const {
    adultNotify: { confirmed },
  } = getState();

  if (!confirmed && data.confirm_min_age && data.min_age >= ADULT_AGE) {
    dispatch(
      sendEvent({
        type: 'SHOW_ADULT_NOTIFY',
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'SKIP_ADULT_NOTIFY',
      })
    );
  }
};
