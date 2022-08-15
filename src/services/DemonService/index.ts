import { QUALITY_MARKS } from 'services/VigoService';
import { toFixed } from 'utils';
import { logger } from 'utils/logger';
import { request } from 'utils/request';

import { DemonInitOpts, PlayerStats } from './types';

const DemonService = () => {
  let params: DemonInitOpts | null = null;
  let prevBufferTime = 0;

  const init = (opts: DemonInitOpts) => {
    prevBufferTime = 0;
    params = {
      ...opts,
    };
  };

  const send = async (url: string) => {
    try {
      await request.get(url, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } catch (err) {
      logger.error('[DemonService]', 'send error', err?.message);
    }
  };

  const sendStat = async ({ bufferTime, initialBufferTime, currentTime, playTimeByQuality }: PlayerStats) => {
    if (!params) return;

    const { statURL, trackId, referrer, projectId, configLoadingTime, skinId, userId, transactionId, sid } = params;

    const diff = Math.abs(prevBufferTime - toFixed(bufferTime / 60));
    prevBufferTime = toFixed(bufferTime / 60);

    if (statURL && trackId && referrer && projectId) {
      let url = `${statURL}
                ?t=${trackId}
                &ssid=&m=${toFixed(currentTime / 60)}
                &r=${referrer}
                &b0=${configLoadingTime}
                &b=${diff}
                &b1=${toFixed(initialBufferTime || 0) / 60}
                &p=${projectId}
                &lqs=${toFixed(playTimeByQuality[QUALITY_MARKS.LD] || 0) / 60}
                &sqs=${toFixed(playTimeByQuality[QUALITY_MARKS.SD] || 0) / 60}
                &hds=${toFixed(playTimeByQuality[QUALITY_MARKS.HD] || 0) / 60}
                &skin_id=${skinId}
                &u=${userId}
                &user_id=${userId}
                &s=${sid || undefined}`;

      url = transactionId ? `${url}&sub_id=${transactionId}` : url;
      url = url.replace(/\s+/g, '');
      logger.log('[DemonService]', `VIDEOMORE STAT URL: ${url}`);

      await send(url);
    }

    // this._playerStat = cloneDeep(DEFAULT_PLAYER_STAT_OBJ);
  };

  return {
    init,
    sendStat,
  };
};

const instance = DemonService();
export { instance as DemonService };
