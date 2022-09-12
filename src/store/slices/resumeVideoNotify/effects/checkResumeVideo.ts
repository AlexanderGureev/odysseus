import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { getSavedProgressTime, getStartAt } from 'store/selectors';
import { VIEW_TYPE } from 'types/TrackInfo';

export const checkResumeVideo = async ({ getState, dispatch, services: { localStorageService } }: EffectOpts) => {
  const {
    resumeVideoNotify: { isActive },
    root: {
      features,
      previews,
      config: { trackInfo },
    },
  } = getState();

  const savedTime = getSavedProgressTime(getState(), localStorageService);
  const time = getStartAt(getState()) ?? savedTime ?? 0;

  if (
    features.CONTINUE_WATCHING_NOTIFY &&
    trackInfo?.track?.viewType === VIEW_TYPE.NORMAL &&
    isActive &&
    !previews &&
    time > 5
  ) {
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
