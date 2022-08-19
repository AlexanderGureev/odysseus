import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const startPlayback = ({ getState, dispatch }: EffectOpts) => {
  const {
    root: { isFirstStartPlayback },
    playback: { ended },
  } = getState();

  if (ended) {
    dispatch(
      sendEvent({
        type: 'DO_END_PLAYBACK',
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'START_PLAYBACK',
        meta: {
          isFirst: isFirstStartPlayback,
        },
      })
    );
  }
};
