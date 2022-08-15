/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ILocalStorageService, IPlayerService } from 'interfaces';
import { findLastIndex } from 'lodash';
import { LocalStorageService } from 'services/LocalStorageService';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { Playlist } from 'services/ManifestParser/types';
import { PlayerService } from 'services/PlayerService';
import { createSource } from 'services/StreamService/utils';
import { QUALITY_MARKS } from 'services/VigoService';
import { TStreamItem } from 'types';
import { logger } from 'utils/logger';

import { TMeta, TQualityItem, TQualityList, TQualityRecord, TRepresentation } from './types';

const QUALITY_MARK_LIST = [QUALITY_MARKS.LD, QUALITY_MARKS.SD, QUALITY_MARKS.HD, QUALITY_MARKS.UHD];
const RESOLUTIONS_LIST = [360, 480, 720, 1080];

const StreamQualityManager = (playerService: IPlayerService, localStorageService: ILocalStorageService) => {
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
  };

  return {
    setQuality,
    init,
  };
};

const instance = StreamQualityManager(PlayerService, LocalStorageService);
export { instance as StreamQualityManager };
