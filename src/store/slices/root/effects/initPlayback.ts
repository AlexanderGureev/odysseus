import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const initPlayback = ({ getState, dispatch }: EffectOpts) => {
  const {
    root: { isFirstStartPlayback },
    resumeVideo: { startPosition },
    playback: { ended },
  } = getState();

  if (ended) {
    dispatch(
      sendEvent({
        type: 'END_PLAYBACK',
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'START_PLAYBACK',
        payload: {
          currentTime: startPosition,
        },
        meta: {
          isFirst: isFirstStartPlayback,
        },
      })
    );
  }
};
