import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { Nullable } from 'types';

let timer: Nullable<NodeJS.Timeout> = null;
const TIMEOUT = 500;

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

export const accumulation = ({ getState, dispatch }: EffectOpts) => {
  const { inc, dec, type } = getState().rewind;
  const { currentTime } = getState().playback;
  clearTimer();

  timer = setTimeout(() => {
    clearTimer();
    dispatch(
      sendEvent({
        type: 'SEEK',
        meta: {
          to: (currentTime || 0) + (type === 'inc' ? inc : dec),
        },
      })
    );
  }, TIMEOUT);

  dispatch(
    sendEvent({
      type: 'ACCUMULATION_RESOLVE',
    })
  );
};
