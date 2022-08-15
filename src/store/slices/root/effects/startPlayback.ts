import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const startPlayback = ({ getState, dispatch }: EffectOpts) => {
  const { isFirstStartPlayback } = getState().root;

  dispatch(
    sendEvent({
      type: 'START_PLAYBACK',
      meta: {
        isFirst: isFirstStartPlayback,
      },
    })
  );
};
