import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { getSavedProgressTime, getStartAt } from 'store/selectors';

export const checkResumeVideo = async ({ getState, dispatch, services: { localStorageService } }: EffectOpts) => {
  const {
    resumeVideoNotify: { isActive },
    root: { features, previews },
  } = getState();

  const savedTime = getSavedProgressTime(getState(), localStorageService);
  const time = getStartAt(getState()) ?? savedTime ?? 0;

  if (isActive && !previews && features.CONTINUE_WATCHING_NOTIFY && time > 1) {
    dispatch(
      sendEvent({
        type: 'SHOW_RESUME_VIDEO_NOTIFY',
        payload: { time },
      })
    );
  } else {
    dispatch(
      sendEvent({
        type: 'SKIP_RESUME_VIDEO_NOTIFY',
      })
    );
  }
};
