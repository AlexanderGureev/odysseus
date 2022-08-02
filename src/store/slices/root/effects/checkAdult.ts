import { EffectOpts } from 'interfaces';
import { ERROR_CODE } from 'services/PostMessageService/types';
import { sendEvent } from 'store';
import { getPlaylistItem } from 'store/selectors';

const ADULT_AGE = 18;

export const checkAdult = async ({ getState, dispatch, services: { postMessageService } }: EffectOpts) => {
  const data = getPlaylistItem(getState());

  dispatch(
    sendEvent({
      type: data.confirm_min_age && data.min_age >= ADULT_AGE ? 'SHOW_ADULT_NOTIFY' : 'SKIP_ADULT_NOTIFY',
    })
  );

  postMessageService.emit('error', {
    code: ERROR_CODE.ADULT_CONTENT,
  });
};
