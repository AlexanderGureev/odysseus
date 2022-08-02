import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { getPlaylistItem } from 'store/selectors';
import { ERROR_CODES, ERROR_ITEM_MAP } from 'types/errors';
import { PlayerError } from 'utils/errors';

export const checkConfigError = async ({ getState, dispatch, services: { amberdataService } }: EffectOpts) => {
  const {
    config,
    meta,
    session: { videosession_id },
  } = getState().root;

  if (!config) {
    amberdataService.sendAmberdataCrashEvent({
      partnerId: meta.partnerId,
      trackId: meta.trackId,
      videosessionId: videosession_id,
    });

    const error = new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, 'config is undefined');
    dispatch(sendEvent({ type: 'CHECK_ERROR_REJECT', meta: { error } }));
    return;
  }

  const data = getPlaylistItem(getState());
  const error = data?.errors?.[0];

  if (!error) {
    dispatch(sendEvent({ type: 'CHECK_ERROR_RESOLVE' }));
    return;
  }

  const paid = data?.paid;
  const streams = data?.streams;

  // 103 код ошибки подтверждает, что трек недоступен для просмотра юзеру из за отстуствия подписки
  const isNotAvailable = paid && error.code === 103;

  if (isNotAvailable && !streams?.length) {
    dispatch(sendEvent({ type: 'CHECK_PREVIEW' }));
    return;
  }

  const err = new PlayerError(error.code).serialize();
  dispatch(sendEvent({ type: 'CHECK_ERROR_REJECT', meta: { error: err } }));
};
