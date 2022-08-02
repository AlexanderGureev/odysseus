import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';

export const startPlayback = (opts: EffectOpts) => {
  const {
    getState,
    dispatch,
    services: { vigoService },
  } = opts;

  const { manifestData } = getState().root;
  if (manifestData?.responseUrl) {
    vigoService.sendStat({ type: 'updateHost', payload: manifestData.responseUrl });
  }

  vigoService.sendStat({ type: 'resumeStats' });

  dispatch(
    sendEvent({
      type: 'START_PLAYBACK',
    })
  );
};
