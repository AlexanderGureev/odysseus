import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { ERROR_ITEM_MAP, ERROR_TYPE } from 'types/errors';

export const checkConfigError = async ({ getState, dispatch, services: { amberdataService } }: EffectOpts) => {
  const {
    config,
    meta,
    session: { videosession_id },
  } = getState().player;

  if (!config) {
    amberdataService.sendAmberdataCrashEvent({
      partnerId: meta.partnerId,
      trackId: meta.trackId,
      videosessionId: videosession_id,
    });

    const error = {
      ...ERROR_ITEM_MAP[ERROR_TYPE.NOT_AVAILABLE],
      details: 'config is undefined',
    };

    dispatch(sendEvent({ type: 'CHECK_ERROR_REJECT', payload: { error } }));
    return;
  }

  const error = config.playlist?.items?.[0]?.errors?.[0];

  if (!error) {
    dispatch(sendEvent({ type: 'CHECK_ERROR_RESOLVE' }));
    return;
  }

  const paid = config.playlist?.items?.[0]?.paid;
  const streams = config.playlist?.items?.[0]?.streams;

  // 103 код ошибки подтверждает, что трек недоступен для просмотра юзеру из за отстуствия подписки
  const isNotAvailable = paid && error.code === 103;

  if (isNotAvailable && !streams?.length) {
    dispatch(sendEvent({ type: 'CHECK_PREVIEW' }));
    return;
  }

  const err = ERROR_ITEM_MAP[error.code] || ERROR_ITEM_MAP[ERROR_TYPE.UNKNOWN];

  dispatch(sendEvent({ type: 'CHECK_ERROR_REJECT', payload: { error: err } }));
};
