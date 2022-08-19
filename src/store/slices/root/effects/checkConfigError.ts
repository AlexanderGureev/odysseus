import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { getPlaylistItem } from 'store/selectors';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';

export const checkConfigError = async ({ getState, dispatch }: EffectOpts) => {
  const { config } = getState().root;

  if (!config) {
    const error = new PlayerError(ERROR_CODES.ERROR_NOT_AVAILABLE, 'config is undefined').serialize();
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
