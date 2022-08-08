import { EffectOpts } from 'interfaces';
import { ERROR_CODE } from 'services/PostMessageService/types';
import { sendEvent } from 'store';
import { getSavedProgressTime } from 'store/selectors';

export const checkResumeVideo = async ({
  getState,
  dispatch,
  services: { localStorageService, postMessageService },
}: EffectOpts) => {
  const {
    resumeVideoNotify: { isActive },
    root: {
      params: { startAt },
      features,
    },
  } = getState();

  const savedTime = getSavedProgressTime(getState(), localStorageService);
  const time = startAt ?? savedTime ?? 0;

  if (isActive && features.CONTINUE_WATCHING_NOTIFY && time > 1) {
    dispatch(
      sendEvent({
        type: 'SHOW_RESUME_VIDEO_NOTIFY',
        payload: { time },
      })
    );

    postMessageService.emit('error', {
      code: ERROR_CODE.RESUME_NOTIFY,
    });
  } else {
    dispatch(
      sendEvent({
        type: 'SKIP_RESUME_VIDEO_NOTIFY',
      })
    );
  }
};
