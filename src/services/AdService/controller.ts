/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ILocalStorageService, ITNSCounter } from 'interfaces';
import { LocalStorageService } from 'services/LocalStorageService';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { TNSCounter } from 'services/TNSCounter';
import { AdCategory, AdLinkType, TAdConfig, TAdPointConfig, TAdPointsConfig } from 'types/ad';
import { logger } from 'utils/logger';

import { AdBlock } from './block';
import { AD_BLOCK_STATUS, AdLinksByType, InitOpts, NewBlockOpts, TAdBlock } from './types';
import { loadYaSdk } from './yaSdkLoader';

const STAT_ADV_CATEGORY = [AdCategory.PRE_ROLL, AdCategory.PAUSE_ROLL, AdCategory.MID_ROLL, AdCategory.POST_ROLL];
const TNS_COUNTER_ADV_CALL_MAX_COUNT = 2;

const AdService = (tnsCounter: ITNSCounter, localStorageService: ILocalStorageService) => {
  let ADV_CACHE_LOOKAHEAD: number;
  let ADV_CACHE_TIMEOUT: number;
  let ADV_MAX_TIMELINE_OFFSET: number;
  let ADV_PLAY_WAIT_TIMEOUT: number;
  let ADV_INTERSECTION_TIMEOUT: number;
  let ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT: number;

  let videoSlot: HTMLVideoElement;
  let controlsSlot: HTMLDivElement;
  let isInitialized = false;
  let preloaded: Record<string, TAdBlock> = {};

  const init = async ({ playerId, controlsId, features }: InitOpts) => {
    videoSlot = document.getElementById(playerId) as HTMLVideoElement;
    controlsSlot = document.getElementById(controlsId) as HTMLDivElement;
    preloaded = {};

    if (!videoSlot || !controlsSlot) throw new Error('videoSlot or controlsSlot is not found');

    ADV_CACHE_LOOKAHEAD = 0; //features.ADV_CACHE_LOOKAHEAD || 10000;
    ADV_CACHE_TIMEOUT = features.ADV_CACHE_TIMEOUT || 1000;
    ADV_MAX_TIMELINE_OFFSET = features.ADV_MAX_TIMELINE_OFFSET || 1000;
    ADV_PLAY_WAIT_TIMEOUT = features.ADV_PLAY_WAIT_TIMEOUT || 1000;
    ADV_INTERSECTION_TIMEOUT = features.ADV_INTERSECTION_TIMEOUT || 180000;
    ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT = features.ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT || 5000;

    const sdk = await loadYaSdk();
    isInitialized = Boolean(sdk);

    // TODO DELETE
    // throw new Error('test');
  };

  const isPreloadable = () => ADV_CACHE_LOOKAHEAD > 0;

  const addListeners = (block: TAdBlock, { config, index, limit }: NewBlockOpts) => {
    block
      .on('AdInitialized', (data) => {
        if (data.tnsInitEvent) {
          tnsCounter.sendEvent('load_ad_start');
        }
      })
      .on('AdPodImpression', () => {
        // updateTimeout();
      })
      .on('AdStarted', () => {
        if (!isPreloadable() || block.isPromo) return;

        if (index + 1 < limit) {
          logger.log('[AdService]', 'preload next');

          const isExclusive = index === 0 && block.isExclusive();
          const nextBlock = createBlock(block.getLinks(), {
            config,
            index: index + 1,
            isPromo: isExclusive,
            limit,
          });

          nextBlock.preload().catch((err) => {
            logger.error('[AdService]', 'preload next block failed', err?.message);
          });
        }
      });
  };

  const createBlock = (links: AdLinksByType, opts: NewBlockOpts) => {
    const block = AdBlock({
      isPromo: opts.isPromo,
      links,
      videoSlot,
      controlsSlot,
      features: {
        ADV_PLAY_WAIT_TIMEOUT,
        ADV_CACHE_TIMEOUT,
      },
    });

    addListeners(block, opts);
    saveBlock(block, opts.config, opts.index);
    return block;
  };

  const isCachedPoint = ({ point, category }: TAdPointConfig) =>
    Object.keys(preloaded).some((k) => k.includes(`${point}:${category}`));

  const getPauseRoll = (pausedAt: number): TAdPointConfig | null => {
    return Date.now() - pausedAt > ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT
      ? {
          point: 0,
          category: AdCategory.PAUSE_ROLL,
        }
      : null;
  };

  const canPlayAd = () => {
    const time = localStorageService.getItemByDomain<number>(STORAGE_SETTINGS.AD_TIMEOUT) || 0;
    return Date.now() - time > ADV_INTERSECTION_TIMEOUT;
  };

  const updateTimeout = () => {
    localStorageService.setItemByDomain(STORAGE_SETTINGS.AD_TIMEOUT, Date.now());
  };

  const getPreCachePoint = (points: TAdPointsConfig, currentTime: number) => {
    const point = points.find(({ point }) => point > currentTime && point - currentTime < ADV_CACHE_LOOKAHEAD / 1000);
    if (!point || isCachedPoint(point)) return null;
    return point;
  };

  const fillPlaceholders = (url: string, placeholders: Record<string, any> | undefined) => {
    if (!placeholders) return url;

    let tempUrl = url;

    Object.keys(placeholders).forEach((key) => {
      const regExpString = new RegExp('\\${3}' + key + '\\${3}', 'g');
      tempUrl = tempUrl.replace(regExpString, placeholders[key]);
    });

    return tempUrl;
  };

  const createState = ({ links }: TAdConfig, { category, placeholders }: TAdPointConfig) => {
    const isStatCategory = STAT_ADV_CATEGORY.includes(category);

    return links.reduce((acc: AdLinksByType, link) => {
      const type = link.type || AdLinkType.NO_TYPE;
      const prev = acc[type] || [];
      const index = prev.length;

      return {
        ...acc,
        [type]: [
          ...prev,
          {
            tnsInitEvent: isStatCategory && index < TNS_COUNTER_ADV_CALL_MAX_COUNT,
            link: fillPlaceholders(link.item, placeholders),
            status: AD_BLOCK_STATUS.UNITIALIZED,
            index,
          },
        ],
      };
    }, {});
  };

  const saveBlock = (block: TAdBlock, { point, category }: TAdPointConfig, index: number) => {
    preloaded = {
      ...preloaded,
      [`${point}:${category}:${index}`]: block,
    };

    logger.log('[AdService]', 'saveblock', { preloaded });
  };

  const getBlock = ({ point, category }: TAdPointConfig, index: number) => {
    return preloaded[`${point}:${category}:${index}`];
  };

  const isPassed = (currentTime: number, point: number) => currentTime > point + ADV_MAX_TIMELINE_OFFSET / 1000;

  const updatePreloadedBlocks = (currentTime: number) => {
    preloaded = Object.keys(preloaded).reduce((acc, key) => {
      const point = +key.split(':')[0];
      if (isPassed(currentTime, point)) return acc;

      return { ...acc, [key]: preloaded[key] };
    }, {});
  };

  const resetPreloadedBlocks = () => {
    preloaded = {};
  };

  const getCurrentPoint = (points: TAdPointsConfig, currentTime: number) => {
    return points.find(({ point }) => {
      // TODO и блок не обработан
      return currentTime >= point && currentTime - point < ADV_MAX_TIMELINE_OFFSET / 1000;
    });
  };

  return {
    init,
    isInitialized,
    isCachedPoint,
    getPreCachePoint,
    updatePreloadedBlocks,
    getCurrentPoint,
    createBlock,
    saveBlock,
    getBlock,
    createState,
    isPassed,
    resetPreloadedBlocks,
    getPauseRoll,
    canPlayAd,
    updateTimeout,
    isPreloadable,
  };
};

const instance = AdService(TNSCounter, LocalStorageService);
export { instance as AdService };
