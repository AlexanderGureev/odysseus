/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Player } from 'components/Player';
import { findLastIndex } from 'lodash';
import { browserVersion,isSafari } from 'react-device-detect';
import { HORUS_EVENT } from 'services/HorusService/types';
import { LocalStorageService, STORAGE_SETTINGS } from 'services/LocalStorageService';
import { Playlist } from 'services/ManifestParser';
import { Mediator } from 'services/MediatorService';
import { createSource } from 'services/StreamService';
import { QUALITY_MARKS } from 'services/VigoService';
import { store } from 'store';
import { StreamProtocol } from 'types';
import { Nullable } from 'types';
import { ERROR_CODES, ERROR_ITEM_MAP, ERROR_TYPE, PlayerError } from 'types/errors';

const QUALITY_MARK_LIST = [QUALITY_MARKS.LD, QUALITY_MARKS.SD, QUALITY_MARKS.HD, QUALITY_MARKS.UHD];
const RESOLUTIONS_LIST = [360, 480, 720, 1080];

const VIGO_QUALITY_INDEX_MAP = {
  [QUALITY_MARKS.LD]: 3,
  [QUALITY_MARKS.SD]: 4,
  [QUALITY_MARKS.HD]: 5,
  [QUALITY_MARKS.UHD]: 6,
  [QUALITY_MARKS.AQ]: 100,
};

type TMeta = {
  protocol: StreamProtocol;
  playlist: Playlist[];
  manifestUrl: string;
  url: string;
};

type TInitOptions = {
  player: any;
  vigo: any;
};

export type TRepresentation = {
  bandwidth: number;
  codecs: { video: string; audio: string };
  enabled: (status?: boolean) => boolean;
  height: number;
  id: string;
  playlist: Playlist;
  width: number;
};

export type TQualityItem = { height: number; uri: string; qualityMark: QUALITY_MARKS };
export type TQualityRecord = { [key in QUALITY_MARKS]?: TQualityItem };
export type TQualityList = QUALITY_MARKS[];

export type TQualityManager = {
  buildQualityList: () => TQualityRecord;
  setQuality: (qualityObj: TQualityItem) => Promise<void>;
  isRepresentationsSupport: () => boolean;
  init: (options: TMeta) => void;
  getLinkByCurrentQuality: () => Nullable<string>;
  getCurrentQualityObj: () => Nullable<TQualityItem>;
  onChangeQuality: (qualityMark: QUALITY_MARKS) => void;
  getCurrentQualityMark: () => QUALITY_MARKS;
};

const StreamQualityManager = ({ player, vigo }: TInitOptions): TQualityManager => {
  // const mediator = patchWithModuleInfo(new Mediator(), {
  //   id: uniqueId('StreamQualityManager'),
  //   name: 'StreamQualityManager',
  // });

  const playerManager = player;
  const vigoStat = vigo;

  let meta: Nullable<TMeta> = null;
  // let prevBitrate: Nullable<number> = null;
  let currentQualityMark = QUALITY_MARKS.AQ;
  let qualityRecord: TQualityRecord = {};

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

  const init = ({ protocol, playlist, manifestUrl, url }: TMeta) => {
    meta = { protocol, playlist, manifestUrl, url };
    qualityRecord = buildQualityList();
    currentQualityMark = getInitialQuality(qualityRecord);

    const qualityList = [QUALITY_MARKS.AQ, ...Object.keys(qualityRecord).reverse()] as TQualityList;
    // mediator.dispatch({
    //   type: M_EVENTS.CONTROL_SET_QUALITY_OPTIONS,
    //   payload: {
    //     qualityList,
    //   },
    // });

    // Logger.log(
    //   '[StreamQualityManager] init: ',
    //   JSON.stringify({ meta, qualityRecord, qualityList, currentQualityMark }, null, 2)
    // );
  };

  const getInitialQuality = (data: TQualityRecord) => {
    const qualityMark = LocalStorageService.getItemByDomain<QUALITY_MARKS>('', STORAGE_SETTINGS.LOCAL_QUALITY);

    // const savedQualityMark: QUALITY_MARKS =
    //   getCommonSettingsForDomain({
    //     domain: store.getState().config.video_data.referrer,
    //     setting: LOCAL_QUALITY,
    //   }) || QUALITY_MARKS.AQ;

    // return data[savedQualityMark] ? savedQualityMark : QUALITY_MARKS.AQ;

    return QUALITY_MARKS.AQ;
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

  const buildQualityList = () => {
    const list = meta!.playlist.reduce((acc: Omit<TQualityItem, 'qualityMark'>[], playlistObj) => {
      const height = playlistObj.attributes?.RESOLUTION?.height;
      const uri = playlistObj.uri;
      return height ? [...acc, { height, uri }] : acc;
    }, []);

    return parse(list);
  };

  const isRepresentationsSupport = () => Boolean(playerManager.getTech()?.representations?.());

  const getLinkByCurrentQuality = (qualityMark: QUALITY_MARKS = currentQualityMark) => {
    // if (qualityMark === QUALITY_MARKS.AQ) return meta?.url;
    // return qualityRecord[qualityMark]?.uri || null;

    return null;
  };

  const setQuality = async (qualityItem: Nullable<TQualityItem>) => {
    try {
      if (!meta) return;

      // Logger.log('[StreamQualityManager] setQuality - ', qualityItem);

      const tech = playerManager.getTech();
      const qualityMark = qualityItem?.qualityMark || QUALITY_MARKS.AQ;

      if (isRepresentationsSupport()) {
        tech.representations().forEach((r: TRepresentation) => {
          r.enabled(qualityItem ? r.height === qualityItem.height : true);
        });
      } else {
        // const currentStream = store.getState().stream.currentStream;
        // if (!currentStream) throw new Error('[setQuality]: source is undefined');
        // const url = getLinkByCurrentQuality(qualityMark);
        // if (!url) throw new Error('[setQuality]: playlist url is undefined');
        // const source = createSource({ ...currentStream, url });
        // await playerManager.setSourceMiddleware({ source });
        // await playerManager.setCurrentTimeMiddleware(
        //   store.getState().player.video_position,
        //   isSafari && parseInt(browserVersion) <= 13
        // );
        // await playerManager.playMiddleware();
      }

      onChangeQuality(qualityMark);
    } catch (e) {
      // Logger.error('[StreamQualityManager] setQuality error:', e?.message);

      const error: PlayerError = e?.code ? e : ERROR_ITEM_MAP[ERROR_CODES[ERROR_TYPE.DATA_LOADING]];
      const details = e?.message || e?.details;
      await playerManager.showError({ ...error, details }, `StreamQualityManager / setQuality`);
    }
  };

  const sendQualityStat = (quality: QUALITY_MARKS) => {
    const qualityIndex = VIGO_QUALITY_INDEX_MAP[quality];
    // invoke(vigoStat, 'bitrateChange', qualityIndex);
  };

  const onChangeQuality = (qualityMark: QUALITY_MARKS = QUALITY_MARKS.AQ) => {
    // Logger.log('[StreamQualityManager] onChangeQuality - ', qualityMark);
    currentQualityMark = qualityMark;

    // saveCommonSettingsForDomain({
    //   domain: store.getState().config.video_data.referrer,
    //   setting: LOCAL_QUALITY,
    //   value: qualityMark,
    // });

    // sendQualityStat(qualityMark);
    // mediator.dispatch({
    //   type: M_EVENTS.PLAYER_SWITCHED_QUALITY,
    //   payload: {
    //     qualityMark,
    //   },
    // });
  };

  const getCurrentQualityObj = () => qualityRecord[currentQualityMark] || null;
  const getCurrentQualityMark = () => currentQualityMark;

  return {
    buildQualityList,
    setQuality,
    isRepresentationsSupport,
    init,
    getLinkByCurrentQuality,
    getCurrentQualityObj,
    getCurrentQualityMark,
    onChangeQuality,
  };
};

export { StreamQualityManager };
