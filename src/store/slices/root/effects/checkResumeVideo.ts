import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';

export const checkResumeVideo = async ({ getState, dispatch }: EffectOpts) => {
  const {} = getState().root;

  dispatch(
    sendEvent({
      type: 'SKIP_RESUME_VIDEO_NOTIFY',
    })
  );
};
