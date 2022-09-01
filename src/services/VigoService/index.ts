import { IPlayerService } from 'interfaces';
import md5 from 'md5';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { PlayerService } from 'services/PlayerService';
import { VIDEO_TYPE } from 'services/PlayerService/types';
import { logger } from 'utils/logger';
import { randomHash32 } from 'utils/randomHash';

import { LocalStorageService } from '../LocalStorageService';
import { TVigoParams, TVigoService, VigoEvent, VigoInfo, VigoSDK } from './types';

export const SERVICE_ID = {
  MORE_TV: 1,
  CTC: 2,
};

// Constants API.VIGO.RU
const VIGO_SVCID_MORE_TV = '5ccc';
const VIGO_SVCID_CTC = 'a201';

export enum QUALITY_MARKS {
  AQ = 'AQ',
  LD = 'LD',
  SD = 'SD',
  HD = 'HD',
  UHD = 'UHD',
}

export const VIGO_QUALITY_INDEX: Record<QUALITY_MARKS, number> = {
  [QUALITY_MARKS.AQ]: 100,
  [QUALITY_MARKS.LD]: 3,
  [QUALITY_MARKS.SD]: 4,
  [QUALITY_MARKS.HD]: 5,
  [QUALITY_MARKS.UHD]: 6,
};

const VIGO_SCRIPT_ID = 'v_vigo_script';

const VigoService = (playerService: IPlayerService): TVigoService => {
  let vigoStat: VigoSDK | null = null;
  let isHookInitialized = false;

  const getBitrate = () => {
    const tech = playerService.getTech();
    return tech?.bandwidth || null;
  };

  const getBytes = () => {
    const tech = playerService.getTech();
    return tech?.stats?.mediaBytesTransferred || null;
  };

  const sendStat = (event: VigoEvent) => {
    if (!vigoStat) return;

    try {
      logger.log('[VigoService]', 'sendStat', event);

      switch (event.type) {
        case 'updateHost':
          const { hostname } = new URL(event.payload);
          vigoStat[event.type](hostname);
          break;
        case 'bitrateChange':
          const idx = VIGO_QUALITY_INDEX[event.payload];
          vigoStat[event.type](idx);
          break;
        default:
          vigoStat[event.type]();
      }
    } catch (err) {
      logger.error('[VigoService]', 'sendStat', err?.message);
    }
  };

  const initializeVigo = (playerId: string, info: VigoInfo) => {
    try {
      if (vigoStat) vigoStat.endPlayback();

      logger.log('[VigoService]', 'init', { playerId });

      const videoNode = document.getElementById(playerId);
      if (!videoNode) throw new Error('video tag not found');

      vigoStat = window.initVigo(videoNode, {
        ...info,
        getBitrate,
        getBytes,
      });
    } catch (err) {
      logger.error('[VigoService]', 'initializeVigo', err?.message);
      vigoStat = null;
    } finally {
      window._vigo = vigoStat;
    }
  };

  const init = ({ playerId, sid, skinName }: TVigoParams) => {
    const qualityMark = LocalStorageService.getItemByDomain<QUALITY_MARKS>(STORAGE_SETTINGS.LOCAL_QUALITY);
    const svcid = skinName === 'MORE_TV' ? VIGO_SVCID_MORE_TV : VIGO_SVCID_CTC;
    const cid = md5(sid);
    const wid = randomHash32({ charset: 'hex' });

    const info = {
      player: 'HTML5',
      host: undefined,
      svcid,
      cid,
      wid,
      quality: qualityMark ? VIGO_QUALITY_INDEX[qualityMark] : 0,
    };

    if (!isHookInitialized) {
      playerService.addHook('beforeSetSource', (type) => {
        if (type === VIDEO_TYPE.FAKE_VIDEO) {
          vigoStat?.suspendStats();
        }
      });

      isHookInitialized = true;
    }

    if (window.V_VIGO_SCRIPT_LOADED) {
      initializeVigo(playerId, info);
    } else {
      const script = document.getElementById(VIGO_SCRIPT_ID);
      script?.addEventListener('load', () => initializeVigo(playerId, info));
    }
  };

  return { init, sendStat };
};

const instance = VigoService(PlayerService);
export { instance as VigoService };
