import { VIDEO_TYPE } from 'components/Player/types';
import { isNil } from 'lodash';
import md5 from 'md5';
import { CounterWatchingOpts } from 'types/MediascopeCounter';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

import { MediascopeEventParams, MediascopeInitOpts } from './types';

export const MEDIASCOPE_EVENT = {
  VIDEO_END: 0,
  VIDEO_START: 1,
  HEARTBEAT: 2,
  VIDEO_PAUSE: 3,
};

const MEDIASCOPE_EVENT_NAME = Object.keys(MEDIASCOPE_EVENT);

const AD_CONTENT_ID = 'advContentId';
const PARAMS_PLACEHOLDER = '**$$$params$$$**';

const MediascopeCounter = () => {
  let isInitialized = false;
  let counter: CounterWatchingOpts;

  const init = (opts: MediascopeInitOpts) => {
    logger.log('[MediascopeCounter]', 'init', opts);

    if (!opts.isEnabled || !opts.params || isInitialized) return;

    counter = opts.params;
    isInitialized = true;
  };

  const sendEvent = (event: keyof typeof MEDIASCOPE_EVENT, params: MediascopeEventParams) => {
    if (!isInitialized) return;

    const link = createLink(MEDIASCOPE_EVENT[event], params);
    send(link);
  };

  const createLink = (eventId: number, { currentTime, trackId, userId, videoType }: MediascopeEventParams) => {
    const params: { [key in string]: () => unknown } = {
      hid: () => (userId ? md5(`${userId}`) : null),
      idlc: () => (videoType === VIDEO_TYPE.PLAIN ? trackId : AD_CONTENT_ID),
      view: () => eventId,
      fts: () => Math.floor(currentTime),
    };

    const payload = Object.entries(counter.params).reduce((acc, [key, val]) => {
      const value = typeof params[key] === 'function' ? params[key]() : val;
      return isNil(value) ? acc : { ...acc, [key]: value };
    }, {});

    const query = new URLSearchParams(payload);
    const link = counter.link.replace(PARAMS_PLACEHOLDER, query.toString());

    logger.log('[MediascopeCounter]', `${MEDIASCOPE_EVENT_NAME[eventId]}`, { payload, link });
    return link;
  };

  const send = async (link: string | null) => {
    try {
      if (!link) throw new Error('link is null');

      const response = await request.get(link, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`failed to send, status - ${response.status}, statusText: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[MediascopeCounter]', err?.message);
    }
  };

  return {
    init,
    sendEvent,
  };
};

const instance = MediascopeCounter();
export { instance as MediascopeCounter };
