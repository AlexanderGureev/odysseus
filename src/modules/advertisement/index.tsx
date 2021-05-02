/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { useFeatures, usePlayerConfig, usePlayerApi } from '../../hooks';
import { getAdFoxParameters } from './utils';
import { DEFAULT_PLAYER_ID, VIDEO_TYPE } from '../player';
import { MediatorService } from '../mediator';
import { loadYaSdk } from './yaSdkLoader';
import { MediatorFactory } from '../mediator';
import {
  AdCategory,
  TContentRollsConfig,
  TMiddleRollsConfig,
  TPlaceholder,
  TPreRollsConfig,
  TRawAdConfig,
  TRawPlaylist,
} from '../../../server/types';
import { Nullable } from '../../../types';

const DEFAULT_ADV_CONTROLS_ID = 'adv-controls';

const AD_CATEGORY = {
  PRE_ROLL: 'pre_roll',
  MID_ROLL: 'mid_roll',
  PAUSE_ROLL: 'pause_roll',
  POST_ROLL: 'post_roll',
  CONTENT_ROLL: 'content_roll',
};

type TAdPointConfig = {
  point: number;
  category: AdCategory;
  placeholders?: TPlaceholder;
};

type TAdPointsConfig = TAdPointConfig[];
type TAdKeys = 'midrolls' | 'contentrolls' | 'prerolls';

type TMap = {
  midrolls: (p: TMiddleRollsConfig) => TAdPointsConfig;
  contentrolls: (p: TContentRollsConfig) => TAdPointsConfig;
  prerolls: (p: TPreRollsConfig) => TAdPointsConfig;
};

const ParseMap: TMap = {
  midrolls: ({ points }: TMiddleRollsConfig) =>
    points.map(({ point }) => ({
      point,
      category: AdCategory.MID_ROLL,
    })),
  contentrolls: ({ points }: TContentRollsConfig) =>
    points.map(({ point, placeholders }) => ({
      point,
      placeholders,
      category: AdCategory.CONTENT_ROLL,
    })),
  prerolls: ({ points }: TPreRollsConfig) => [
    {
      point: points.point,
      category: AdCategory.PRE_ROLL,
    },
  ],
};

type TAdConfig = { links: string[]; limit: number };
type TAdConfigByCategory = Partial<Record<AdCategory, TAdConfig>>;

type TParsedAdConfig = {
  adConfig: TAdConfigByCategory;
  adPoints: TAdPointsConfig;
};

const createAdConfig = (ad: TRawAdConfig, playlist: TRawPlaylist) => {
  const adConfig = Object.keys(ad).reduce((acc: TAdConfigByCategory, category) => {
    const key = category as AdCategory;

    const config = {
      ...acc,
      [key]: {
        links: ad[key]?.items.filter((i) => i.item).map((i) => i.item),
        limit: ad[key]?.params.limiter,
      },
    };

    return config;
  }, {});

  const adPoints = ['midrolls', 'contentrolls', 'prerolls'].reduce((acc: TAdPointsConfig, key) => {
    const category = key as TAdKeys;
    const adConfig = playlist.items[0][category];
    if (!adConfig) return acc;

    const config = ParseMap[category](adConfig as any); // TODO FIX
    return config ? [...acc, ...config] : acc;
  }, []);

  return { adConfig, adPoints };
};

const useAdConfig = () => {
  const [
    {
      config: { ad = {} },
      playlist,
    },
  ] = usePlayerConfig();

  const [{ adConfig, adPoints }, set] = React.useState<TParsedAdConfig>({ adConfig: {}, adPoints: [] });

  React.useEffect(() => {
    set(createAdConfig(ad, playlist));
  }, [ad, playlist]);

  return { adConfig, adPoints };
};

export enum AD_BLOCK_STATUS {
  UNITIALIZED = 'UNITIALIZED',
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  CODE_LOADING = 'CODE_LOADING',
  CODE_LOADED = 'CODE_LOADED',
  PRELOADING = 'PRELOADING',
  PRELOADED = 'PRELOADED',
  PLAYING = 'PLAYING',
  FINISHED_SUCCESS = 'FINISHED_SUCCESS',
  ERROR = 'ERROR',
}

type TAdLinkItem = {
  link: string;
  status: AD_BLOCK_STATUS;
  index: number;
};

export type TAdBlock = {
  on: (event: string, callback: () => void) => void;
  isActive: boolean;
  state: TAdLinkItem[];
  play: () => Promise<void>;
  preload: () => Promise<void>;
  reset: () => void;
};

const AdBlock = (adConfig: TAdConfig, video: HTMLVideoElement, slot: HTMLDivElement): TAdBlock => {
  const state = createState(adConfig);
  const _video = video;
  const _slot = slot;
  let _preload: Nullable<Promise<void>> = null;
  let isActive = true;
  const mediator = MediatorFactory();

  function createState({ links }: TAdConfig): TAdLinkItem[] {
    return links.map((link, index) => ({
      link,
      status: AD_BLOCK_STATUS.UNITIALIZED,
      index,
    }));
  }

  const reset = () => {
    console.log('reset');
    // _preload = null;
    // state = null;
  };

  const preload = (item: TAdLinkItem) => {
    if (!_preload) {
      _preload = new Promise<any>((resolve, reject) => {
        if (!window.ya || !item) return reject('yaSdk or link is undefined');

        item.status = AD_BLOCK_STATUS.INITIALIZING;

        window.ya.videoAd
          .loadModule('AdLoader')
          .then(function (module: any) {
            return module.AdLoader.create({
              adFoxParameters: getAdFoxParameters(item.link),
            });
          })
          .then(function (adLoader: any) {
            item.status = AD_BLOCK_STATUS.INITIALIZED;
            return adLoader.loadAd();
          })
          .then(function (adViewer: any) {
            item.status = AD_BLOCK_STATUS.PRELOADING;

            adViewer
              .preload({
                videoSlot: _video,
              })
              .then(() => {
                item.status = AD_BLOCK_STATUS.PRELOADED;
                resolve(adViewer);
              })
              .catch((e: any) => {
                reject(e);
              });
          })
          .catch((e: any) => {
            console.log('PRELOAD ERR', e);
            reject(e);
          });
      });
    }

    return _preload;
  };

  const play = (item: TAdLinkItem) =>
    new Promise<void>((resolve, reject) => {
      if (!window.ya) return reject('yaSdk or link is undefined');

      console.log('PLAY', item);
      Promise.resolve()
        .then(() => (_preload ? _preload : preload(item)))
        .then(function (adViewer: any) {
          if (!adViewer) {
            return reject(new Error('adViewer is undefined'));
          }

          console.log(adViewer);

          // @ts-ignore
          const adPlaybackController = adViewer.createPlaybackController(_video, _slot, {
            videoTimeout: 5000,
            vpaidTimeout: 5000,
            bufferFullTimeout: 30000,
            controlsSettings: {
              controlsVisibility: {
                mute: false,
                skip: false,
                title: false,
                adLabel: false,
                timeline: false,
              },
            },
          });

          adPlaybackController.subscribe('AdPodError', (e: any) => {
            console.log('Ad error', e);
            reject(e);
          });

          adPlaybackController.subscribe('AdStarted', () => {
            console.log('Ad start playing');
            mediator.emit('started');
          });

          adPlaybackController.subscribe('AdStopped', function () {
            console.log('Ad stopped playing');
            resolve();
          });

          item.status = AD_BLOCK_STATUS.PLAYING;
          adPlaybackController.playAd();
        })
        .catch(function (error) {
          console.error(error);
          reject(error);
        });
    });

  const emitAction = async (type: 'preload' | 'play') => {
    const ActionMap: Record<'preload' | 'play', any> = {
      preload: {
        [AD_BLOCK_STATUS.UNITIALIZED]: preload,
        [AD_BLOCK_STATUS.PRELOADING]: preload,
      },
      play: {
        [AD_BLOCK_STATUS.UNITIALIZED]: play,
        [AD_BLOCK_STATUS.PRELOADING]: play,
        [AD_BLOCK_STATUS.PRELOADED]: play,
      },
    };

    for (const link of state) {
      try {
        if (!ActionMap[type][link.status]) continue;

        await ActionMap[type][link.status](link);
        if (type === 'play') {
          link.status = AD_BLOCK_STATUS.FINISHED_SUCCESS;
          isActive = false;
        }

        return;
      } catch (e) {
        link.status = AD_BLOCK_STATUS.ERROR;
        console.log(e);
      }
    }

    isActive = false;
    throw new Error(`failed ${type}`);
  };

  const on = (event: string, callback: () => void) => mediator.on(event, callback);

  return {
    on,
    isActive,
    state,
    play: () => emitAction('play'),
    preload: () => emitAction('preload'),
    reset,
  };
};

type TProps = {
  currentTime: number;
  videoNode: HTMLVideoElement;
  videoType: VIDEO_TYPE;
  paused: boolean;
};

const AdController: React.FC<TProps> = ({ currentTime, videoNode, videoType, paused }) => {
  const {
    ADV_CACHE_LOOKAHEAD = 10000,
    ADV_CACHE_TIMEOUT = 1000,
    ADV_MAX_TIMELINE_OFFSET = 1000,
    ADV_PLAY_WAIT_TIMEOUT = 500,
    ADV_INTERSECTION_TIMEOUT = 180000,
    ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT = 5000,
  } = useFeatures();

  const { adPoints, adConfig } = useAdConfig();
  const { initializeAdvertisement, resumePlainVideo } = usePlayerApi();
  const cache = React.useRef<{ [key in string]: TAdBlock }>({});
  const stopTick = React.useRef(false);
  const slotRef = React.useRef<Nullable<HTMLDivElement>>(null);
  const timer = React.useRef(null);
  const isPauseRoll = React.useRef(false);

  const [isLoaded, setLoad] = React.useState(false);

  const setCache = ({ point, category }: TAdPointConfig, adBlock: TAdBlock, index: number) => {
    cache.current = {
      ...cache.current,
      [`${point}:${category}:${index}`]: adBlock,
    };
  };

  const preloadAd = async (adBlock: TAdBlock) => {
    await adBlock.preload();
  };

  const startAd = React.useCallback(
    async ({ point, category }: TAdPointConfig) => {
      stopTick.current = true;
      await initializeAdvertisement();

      const filterState = (adBlock: TAdBlock, { links, ...rest }: TAdConfig) => {
        return {
          links: links.filter(
            (link, i) => ![AD_BLOCK_STATUS.ERROR, AD_BLOCK_STATUS.FINISHED_SUCCESS].includes(adBlock.state[i].status)
          ),
          ...rest,
        };
      };

      const { limit } = adConfig[category] as TAdConfig; // TODO FIX

      let adBlock: Nullable<TAdBlock> = null;
      let state = adConfig[category] as TAdConfig;

      for (let i = 0; i < limit; i++) {
        if (!state.links.length) break;

        try {
          console.log('START BLOCK', i, state);
          adBlock = cache.current[`${point}:${category}:${i}`];
          if (!adBlock) {
            // @ts-ignore
            adBlock = AdBlock(state, videoNode, slotRef.current);
          }

          adBlock.on('started', () => {
            if (i + 1 < limit) {
              // @ts-ignore
              state = filterState(adBlock, state);
              // @ts-ignore
              const next = AdBlock(state, videoNode, slotRef.current);
              setCache({ point, category }, next, i + 1);
              next.preload();
            }
          });

          await adBlock.play();
        } catch (e) {
          console.log(e);
        } finally {
          // @ts-ignore
          state = filterState(adBlock, state);
        }
      }

      await resumePlainVideo();
      stopTick.current = false;
    },
    [adConfig, videoNode, initializeAdvertisement, resumePlainVideo]
  );

  // React.useEffect(() => {
  //   const clear = () => {
  //     clearTimeout(timer.current);
  //     timer.current = null;
  //   };

  //   if (paused) {
  //     timer.current = setTimeout(() => {
  //       isPauseRoll.current = true;
  //     }, ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT);
  //   } else {
  //     clear();
  //     if (isPauseRoll.current) {
  //     }
  //   }

  //   return clear;
  // }, [ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT, paused]);

  React.useEffect(() => {
    if (!adConfig) return;

    loadYaSdk()
      .then(() => setLoad(true))
      .catch((e: any) => {
        console.error(e);
      });
  }, [adConfig]);

  React.useEffect(() => {
    if (!isLoaded) return;

    startAd({ point: 0, category: AdCategory.PRE_ROLL });
  }, [isLoaded, startAd]);

  React.useEffect(() => {
    if (stopTick.current || !isLoaded) return;

    const isCachedPoint = ({ point, category }: TAdPointConfig) =>
      Object.keys(cache.current).some((k) => k.includes(`${point}:${category}`));

    const getPreCachePoint = () => {
      console.log(adPoints, currentTime, ADV_CACHE_LOOKAHEAD);
      return adPoints.find(({ point }) => point > currentTime && point - currentTime < ADV_CACHE_LOOKAHEAD / 1000);
    };

    const updateCache = () => {
      cache.current = Object.keys(cache.current).reduce((acc, key) => {
        const point = +key.split(':')[0];
        if (currentTime > point + ADV_MAX_TIMELINE_OFFSET / 1000) return acc;

        return { ...acc, [key]: cache.current[key] };
      }, {});
    };

    const getCurrentPoint = () => {
      return adPoints.find(({ point }) => {
        // TODO и блок не обработан
        return currentTime >= point && currentTime - point < ADV_MAX_TIMELINE_OFFSET / 1000;
      });
    };

    updateCache();

    const preCachePoint = getPreCachePoint();

    console.log('preCachePoint', currentTime, preCachePoint);
    if (preCachePoint && !isCachedPoint(preCachePoint)) {
      // @ts-ignore
      const adBlock = AdBlock(adConfig[preCachePoint.category], videoNode, slotRef.current); // TODO FIX TYPES
      setCache(preCachePoint, adBlock, 0);
      preloadAd(adBlock);
    }

    const point = getCurrentPoint();
    if (point) startAd(point);
  }, [currentTime, adConfig, adPoints, startAd, videoNode, isLoaded, ADV_CACHE_LOOKAHEAD, ADV_MAX_TIMELINE_OFFSET]);

  return isLoaded ? <div ref={slotRef}></div> : null;
};

export { AdBlock, AdController };
