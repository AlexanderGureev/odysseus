/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Player } from 'components/Player';
import { ILocalStorageService, IPlayerService } from 'interfaces';
import { findLastIndex } from 'lodash';
import { browserVersion, isSafari } from 'react-device-detect';
import { HORUS_EVENT } from 'services/HorusService/types';
import { LocalStorageService } from 'services/LocalStorageService';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { Playlist } from 'services/ManifestParser/types';
import { Mediator } from 'services/MediatorService';
import { PlayerService } from 'services/PlayerService';
import { createSource } from 'services/StreamService/utils';
import { QUALITY_MARKS } from 'services/VigoService';
import { store } from 'store';
import { StreamProtocol, TStreamItem } from 'types';
import { Nullable } from 'types';
import { ERROR_CODES, ERROR_ITEM_MAP } from 'types/errors';
import { logger } from 'utils/logger';

import {
  TInitOptions,
  TMeta,
  TQualityItem,
  TQualityList,
  TQualityManager,
  TQualityRecord,
  TRepresentation,
} from './types';

const QUALITY_MARK_LIST = [QUALITY_MARKS.LD, QUALITY_MARKS.SD, QUALITY_MARKS.HD, QUALITY_MARKS.UHD];
const RESOLUTIONS_LIST = [360, 480, 720, 1080];

const VIGO_QUALITY_INDEX_MAP = {
  [QUALITY_MARKS.LD]: 3,
  [QUALITY_MARKS.SD]: 4,
  [QUALITY_MARKS.HD]: 5,
  [QUALITY_MARKS.UHD]: 6,
  [QUALITY_MARKS.AQ]: 100,
};

const StreamQualityManager = (playerService: IPlayerService, localStorageService: ILocalStorageService) => {
  // const mediator = patchWithModuleInfo(new Mediator(), {
  //   id: uniqueId('StreamQualityManager'),
  //   name: 'StreamQualityManager',
  // });

  // const playerManager = player;
  // const vigoStat = vigo;

  // const meta: Nullable<TMeta> = null;
  // let prevBitrate: Nullable<number> = null;
  // let currentQualityMark = QUALITY_MARKS.AQ;
  // let qualityRecord: TQualityRecord = {};

  // mediator.subscribe(
  //   M_EVENTS.PLAYER_SET_QUALITY,
  //   ({ payload: { qualityMark } }: { payload: { qualityMark: QUALITY_MARKS } }) => {
  //     setQuality(qualityRecord[qualityMark]);
  //   }
  // );

  // mediator.subscribe(M_EVENTS.PLAYER_TIME_UPDATE, () => {
  //   const bitrate = playerManager.getBitrate();

  //   if (bitrate !== prevBitrate) {
  //     prevBitrate = bitrate;
  //     sendQualityStat(currentQualityMark);

  //     if (currentQualityMark === QUALITY_MARKS.AQ) {
  //       mediator.dispatch({ type: HORUS_EVENT.HORUS_BITRATE_ADOPTION });
  //     }
  //   }
  // });

  const init = ({ playlist, url }: TMeta) => {
    const qualityRecord = {
      ...buildQualityList(playlist),
      [QUALITY_MARKS.AQ]: {
        height: -1,
        uri: url,
        qualityMark: QUALITY_MARKS.AQ,
      },
    };

    const currentQualityMark = getInitialQuality(qualityRecord);
    const qualityList = [...Object.keys(qualityRecord).reverse()] as TQualityList;

    logger.log(
      '[StreamQualityManager]',
      'init',
      JSON.stringify({ qualityRecord, qualityList, currentQualityMark }, null, 2)
    );

    return {
      qualityRecord,
      qualityList,
      currentQualityMark,
    };
  };

  const getInitialQuality = (data: TQualityRecord) => {
    const savedQualityMark =
      localStorageService.getItemByDomain<QUALITY_MARKS>(STORAGE_SETTINGS.LOCAL_QUALITY) || QUALITY_MARKS.AQ;

    return data[savedQualityMark] ? savedQualityMark : QUALITY_MARKS.AQ;
  };

  const parse = (list: Omit<TQualityItem, 'qualityMark'>[]): TQualityRecord => {
    return list
      .sort((a, b) => a.height - b.height)
      .reduce((acc: TQualityRecord, item) => {
        const idx = findLastIndex(RESOLUTIONS_LIST, (r) => item.height >= r);
        const qualityMark = QUALITY_MARK_LIST[idx];
        return idx !== -1 ? { ...acc, [qualityMark]: { ...item, qualityMark } } : acc;
      }, {});
  };

  const buildQualityList = (playlist: Playlist[]) => {
    const list = playlist.reduce((acc: Omit<TQualityItem, 'qualityMark'>[], playlistObj) => {
      const height = playlistObj.attributes?.RESOLUTION?.height;
      const uri = playlistObj.uri;
      return height ? [...acc, { height, uri }] : acc;
    }, []);

    return parse(list);
  };

  const isRepresentationsSupport = () => Boolean(playerService.getRepresentations());

  // const getLinkByCurrentQuality = (qualityMark: QUALITY_MARKS = currentQualityMark): Nullable<string> => {
  //   if (qualityMark === QUALITY_MARKS.AQ) return meta?.url || null;
  //   return qualityRecord[qualityMark]?.uri || null;
  // };

  const setQuality = async (
    qualityItem: TQualityItem,
    opts: { currentStream: TStreamItem; currentTime: number; isOldSafari: boolean }
  ) => {
    logger.log('[StreamQualityManager]', 'setQuality', qualityItem);

    if (isRepresentationsSupport()) {
      const tech = playerService.getTech();
      tech.representations().forEach((r: TRepresentation) => {
        r.enabled(qualityItem.qualityMark !== QUALITY_MARKS.AQ ? r.height === qualityItem.height : true);
      });
    } else {
      const source = createSource({ ...opts.currentStream, url: qualityItem.uri });

      await playerService.setSource(source);

      if (opts.isOldSafari) {
        playerService.one('timeupdate', () => {
          playerService.setCurrentTime(opts.currentTime);
        });
      } else {
        playerService.setCurrentTime(opts.currentTime);
      }

      await playerService.play();
    }

    localStorageService.setItemByDomain(STORAGE_SETTINGS.LOCAL_QUALITY, qualityItem.qualityMark);

    // try {
    //   logger.log('[StreamQualityManager]', 'setQuality', qualityItem);

    //   if (isRepresentationsSupport()) {
    //     const tech = playerService.getTech();
    //     tech.representations().forEach((r: TRepresentation) => {
    //       r.enabled(qualityItem.qualityMark !== QUALITY_MARKS.AQ ? r.height === qualityItem.height : true);
    //     });
    //   } else {
    //     const source = createSource({ ...opts.currentStream, url: qualityItem.uri });
    //     await playerService.setSource(source);
    //     await playerService.setCurrentTime(opts.currentTime);
    //     await playerService.play();
    //   }

    //   // onChangeQuality(qualityMark);
    // } catch (e) {
    //   // Logger.error('[StreamQualityManager] setQuality error:', e?.message);
    //   // const error: PlayerError = e?.code ? e : ERROR_ITEM_MAP[ERROR_CODES.ERROR_DATA_LOADING];
    //   // const details = e?.message || e?.details;
    //   // await playerManager.showError({ ...error, details }, `StreamQualityManager / setQuality`);
    // }
  };

  const sendQualityStat = (quality: QUALITY_MARKS) => {
    const qualityIndex = VIGO_QUALITY_INDEX_MAP[quality];
    // invoke(vigoStat, 'bitrateChange', qualityIndex);
  };

  const onChangeQuality = (qualityMark: QUALITY_MARKS = QUALITY_MARKS.AQ) => {
    // Logger.log('[StreamQualityManager] onChangeQuality - ', qualityMark);
    // currentQualityMark = qualityMark;
    localStorageService.setItemByDomain(STORAGE_SETTINGS.LOCAL_QUALITY, qualityMark);

    // sendQualityStat(qualityMark);
    // mediator.dispatch({
    //   type: M_EVENTS.PLAYER_SWITCHED_QUALITY,
    //   payload: {
    //     qualityMark,
    //   },
    // });
  };

  // const getCurrentQualityObj = () => qualityRecord[currentQualityMark] || null;
  // const getCurrentQualityMark = () => currentQualityMark;

  return {
    setQuality,
    init,
    // getLinkByCurrentQuality,
    // getCurrentQualityObj,
    // getCurrentQualityMark,
  };
};

const instance = StreamQualityManager(PlayerService, LocalStorageService);
export { instance as StreamQualityManager };
