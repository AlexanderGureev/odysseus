import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { getPlaylistItem } from 'store/selectors';
import { BeholderPayload } from 'types/beholder';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

const getDateTime = () => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

const CONTAIN_NUMBER_REGEX = /\d+/gi;

export const sendViews = ({ getState, dispatch }: EffectOpts) => {
  const {
    playback: { currentTime, duration },
    root: {
      config: {
        config: { user_id, project_id },
      },
      meta: { trackId },
    },
    beholder: { hostname, serviceId, token },
  } = getState();

  const item = getPlaylistItem(getState());

  const season = item?.season_name?.match(CONTAIN_NUMBER_REGEX)?.[0];

  const data: BeholderPayload = {
    user_id: user_id,
    track_id: trackId,
    stop_time: currentTime || 0,
    total_time: duration || 0,
    project_id,
    datetime: getDateTime(),
  };

  if (season) data.season = Number(season);

  const payload = {
    user_id: data.user_id,
    views: [data],
  };

  logger.log('[sendViews]', `save time: ${currentTime}`, payload);

  request
    .post(`${hostname}/views`, {
      params: {
        service_id: serviceId,
      },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      json: payload,
    })
    .catch((err) => {
      logger.error('[sendViews]', err?.message);
    });

  dispatch(
    sendEvent({
      type: 'SEND_VIEWS_RESOLVE',
    })
  );
};
