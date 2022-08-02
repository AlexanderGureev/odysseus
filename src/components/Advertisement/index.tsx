// /* eslint-disable @typescript-eslint/ban-ts-comment */
// import { VIDEO_TYPE } from 'components/Player/types';
// import { useAdConfig, useFeatures, usePlayerApi } from 'hooks';
// import { TAdPointConfig } from 'providers/AdConfigProvider';
import React from 'react';
// import { Events, TAdBlock } from 'services/AdService/types';
// import { Mediator } from 'services/MediatorService';
// import { Nullable } from 'types';
// import { AdCategory, TAdConfig } from 'types/ad';
// import { logger } from 'utils/logger';

// import { getAdFoxParameters } from './utils';
// import { loadYaSdk } from './yaSdkLoader';

// const DEFAULT_ADV_CONTROLS_ID = 'adv-controls';

// export enum AD_BLOCK_STATUS {
//   UNITIALIZED = 'UNITIALIZED',
//   INITIALIZING = 'INITIALIZING',
//   INITIALIZED = 'INITIALIZED',
//   CODE_LOADING = 'CODE_LOADING',
//   CODE_LOADED = 'CODE_LOADED',
//   PRELOADING = 'PRELOADING',
//   PRELOADED = 'PRELOADED',
//   PLAYING = 'PLAYING',
//   FINISHED_SUCCESS = 'FINISHED_SUCCESS',
//   ERROR = 'ERROR',
// }

// type TAdLinkItem = {
//   link: string;
//   status: AD_BLOCK_STATUS;
//   index: number;
// };

// type TProps = {
//   currentTime: number;
//   videoNode: HTMLVideoElement;
//   videoType: VIDEO_TYPE;
//   paused: boolean;
// };

// const AdBlock = (adConfig: TAdConfig, video: HTMLVideoElement, slot: HTMLDivElement): TAdBlock => {
//   const state = createState(adConfig);
//   const _video = video;
//   const _slot = slot;
//   let _preload: Nullable<Promise<void>> = null;
//   let isActive = true;
//   const mediator = Mediator<Events>();

//   function createState({ links }: TAdConfig): TAdLinkItem[] {
//     return links.map((link, index) => ({
//       link,
//       status: AD_BLOCK_STATUS.UNITIALIZED,
//       index,
//     }));
//   }

//   const reset = () => {
//     // _preload = null;
//     // state = null;
//   };

//   const preload = (item: TAdLinkItem) => {
//     if (!_preload) {
//       _preload = new Promise<any>((resolve, reject) => {
//         if (!window.ya || !item) return reject('yaSdk or link is undefined');

//         item.status = AD_BLOCK_STATUS.INITIALIZING;

//         window.ya.videoAd
//           .loadModule('AdLoader')
//           .then(function (module: any) {
//             return module.AdLoader.create({
//               adFoxParameters: getAdFoxParameters(item.link),
//             });
//           })
//           .then(function (adLoader: any) {
//             item.status = AD_BLOCK_STATUS.INITIALIZED;
//             return adLoader.loadAd();
//           })
//           .then(function (adStore: any) {
//             item.status = AD_BLOCK_STATUS.PRELOADING;

//             // resolve(adStore);

//             adStore
//               .preload({
//                 videoSlot: _video,
//                 desiredBitrate: 1000, //если не задать, то в safari реклама не играет
//               })
//               .then(() => {
//                 item.status = AD_BLOCK_STATUS.PRELOADED;
//                 resolve(adStore);
//               })
//               .catch(reject);
//           })
//           .catch((e: any) => {
//             logger.log('PRELOAD ERR', e);
//             reject(e);
//           });
//       });
//     }

//     return _preload;
//   };

//   const play = (item: TAdLinkItem) =>
//     new Promise<void>((resolve, reject) => {
//       if (!window.ya) return reject('yaSdk or link is undefined');

//       logger.log('PLAY', item, _preload);

//       Promise.resolve()
//         .then(() => (_preload ? _preload : preload(item)))
//         .then(function (adViewer: any) {
//           if (!adViewer) {
//             return reject(new Error('adViewer is undefined'));
//           }

//           logger.log('adViewer', adViewer);

//           // @ts-ignore
//           const adPlaybackController = adViewer.createPlaybackController(_video, _slot, {
//             // videoTimeout: 5000,
//             // vpaidTimeout: 5000,
//             // bufferFullTimeout: 30000,
//             controlsSettings: {
//               controlsVisibility: {
//                 mute: false,
//                 skip: false,
//                 title: false,
//                 adLabel: false,
//                 timeline: false,
//               },
//             },
//           });

//           let isStarted = false;

//           adPlaybackController.subscribe('AdPodError', (e: any) => {
//             console.error('Ad error', e);
//             reject(e);
//           });

//           adPlaybackController.subscribe('AdStarted', () => {
//             logger.log('Ad start playing');

//             isStarted = true;
//             mediator.emit('AdStarted');
//           });

//           adPlaybackController.subscribe('AdPlayingStateChange', (data: any) => {
//             const stateMap: Record<string, () => void> = {
//               play: () => mediator.emit('AdPlay'),
//               pause: () => {
//                 if (!isStarted) {
//                   adPlaybackController.resumeAd(); // в сафари реклама не автоплеет
//                   return;
//                 }

//                 mediator.emit('AdPause');
//               },
//             };

//             stateMap[data?.playingState]?.();
//           });

//           adPlaybackController.subscribe('AdPodSkipped', (e: any) => {
//             logger.log('AdPodSkipped');
//             // reject(e);
//           });
//           adPlaybackController.subscribe('AdPodStopped', (e: any) => {
//             logger.log('AdPodStopped');
//             // reject(e);
//           });
//           adPlaybackController.subscribe('AdStopped', (e: any) => {
//             logger.log('AdStopped');
//             resolve();
//           });

//           item.status = AD_BLOCK_STATUS.PLAYING;
//           adPlaybackController.playAd();
//           // adPlaybackController.resumeAd(); // в сафари не автоплеет реклама
//         })
//         .catch(function (error) {
//           logger.error(error);
//           reject(error);
//         });
//     });

//   const emitAction = async (type: 'preload' | 'play') => {
//     const ActionMap: Record<'preload' | 'play', any> = {
//       preload: {
//         [AD_BLOCK_STATUS.UNITIALIZED]: preload,
//         [AD_BLOCK_STATUS.PRELOADING]: preload,
//       },
//       play: {
//         [AD_BLOCK_STATUS.UNITIALIZED]: play,
//         [AD_BLOCK_STATUS.PRELOADING]: play,
//         [AD_BLOCK_STATUS.PRELOADED]: play,
//       },
//     };

//     for (const link of state) {
//       try {
//         if (!ActionMap[type][link.status]) continue;

//         await ActionMap[type][link.status](link);
//         if (type === 'play') {
//           link.status = AD_BLOCK_STATUS.FINISHED_SUCCESS;
//           isActive = false;
//         }

//         return;
//       } catch (e) {
//         link.status = AD_BLOCK_STATUS.ERROR;
//         logger.log(e);
//       }
//     }

//     isActive = false;
//     throw new Error(`failed ${type}`);
//   };

//   return {
//     on: mediator.on,
//     off: mediator.off,
//     isActive,
//     getLinks: () => state,
//     play: () => emitAction('play'),
//     preload: () => emitAction('preload'),
//     reset,
//   };
// };

// const AdController: React.FC<TProps> = ({ currentTime, videoNode, videoType, paused }) => {
//   const {
//     ADV_CACHE_LOOKAHEAD = 10000,
//     ADV_CACHE_TIMEOUT = 1000,
//     ADV_MAX_TIMELINE_OFFSET = 1000,
//     ADV_PLAY_WAIT_TIMEOUT = 500,
//     ADV_INTERSECTION_TIMEOUT = 180000,
//     ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT = 5000,
//   } = useFeatures();

//   const { adPoints, adConfig } = useAdConfig();
//   const { initializeAdvertisement, resumePlainVideo, play, isPaused } = usePlayerApi();
//   const cache = React.useRef<{ [key in string]: TAdBlock }>({});
//   const stopTick = React.useRef(false);
//   const slotRef = React.useRef<Nullable<HTMLDivElement>>(null);
//   const timer = React.useRef(null);
//   const isPauseRoll = React.useRef(false);

//   const [isLoaded, setLoad] = React.useState(false);

//   const setCache = ({ point, category }: TAdPointConfig, adBlock: TAdBlock, index: number) => {
//     cache.current = {
//       ...cache.current,
//       [`${point}:${category}:${index}`]: adBlock,
//     };
//   };

//   const preloadAd = async (adBlock: TAdBlock) => {
//     await adBlock.preload();
//   };

//   const startAd = React.useCallback(
//     async ({ point, category }: TAdPointConfig) => {
//       stopTick.current = true;
//       await initializeAdvertisement();

//       // const filterState = (adBlock: TAdBlock, { links, ...rest }: TAdConfig) => {
//       //   return {
//       //     links: links.filter(
//       //       (link, i) => ![AD_BLOCK_STATUS.ERROR, AD_BLOCK_STATUS.FINISHED_SUCCESS].includes(adBlock.state[i].status)
//       //     ),
//       //     ...rest,
//       //   };
//       // };

//       const { limit } = adConfig[category] as TAdConfig; // TODO FIX

//       let adBlock: Nullable<TAdBlock> = null;
//       const state = adConfig[category] as TAdConfig;

//       for (let i = 0; i < limit; i++) {
//         if (!state.links.length) break;

//         try {
//           logger.log('START BLOCK', i, state);
//           adBlock = cache.current[`${point}:${category}:${i}`];
//           if (!adBlock) {
//             // @ts-ignore
//             adBlock = AdBlock(state, videoNode, slotRef.current);
//           }

//           adBlock.on('AdStarted', () => {
//             if (i + 1 < limit) {
//               // @ts-ignore
//               // state = filterState(adBlock, state);
//               // @ts-ignore
//               const next = AdBlock(state, videoNode, slotRef.current);
//               setCache({ point, category }, next, i + 1);
//               next.preload();
//             }
//           });

//           // adBlock.on('loaded', () => {
//           //   setTimeout(() => {
//           //     if (isPaused()) play();
//           //   }, 300);
//           // });

//           await adBlock.play();
//         } catch (e) {
//           logger.error(e, 'startAd ERROR');
//         } finally {
//           // @ts-ignore
//           // state = filterState(adBlock, state);
//         }
//       }

//       await resumePlainVideo();
//       stopTick.current = false;
//     },
//     [initializeAdvertisement, adConfig, resumePlainVideo, videoNode, isPaused, play]
//   );

//   // React.useEffect(() => {
//   //   const clear = () => {
//   //     clearTimeout(timer.current);
//   //     timer.current = null;
//   //   };

//   //   if (paused) {
//   //     timer.current = setTimeout(() => {
//   //       isPauseRoll.current = true;
//   //     }, ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT);
//   //   } else {
//   //     clear();
//   //     if (isPauseRoll.current) {
//   //     }
//   //   }

//   //   return clear;
//   // }, [ADV_PAUSE_ROLL_ACTIVATE_TIMEOUT, paused]);

//   React.useEffect(() => {
//     if (!adConfig) return;

//     loadYaSdk()
//       .then(() => setLoad(true))
//       .catch((e: any) => {
//         console.error(e);
//       });
//   }, [adConfig]);

//   React.useEffect(() => {
//     if (!isLoaded) return;

//     startAd({ point: 0, category: AdCategory.PRE_ROLL });
//   }, [isLoaded, startAd]);

//   React.useEffect(() => {
//     if (stopTick.current || !isLoaded) return;

//     const isCachedPoint = ({ point, category }: TAdPointConfig) =>
//       Object.keys(cache.current).some((k) => k.includes(`${point}:${category}`));

//     const getPreCachePoint = () => {
//       logger.log('[ADB]', adPoints, currentTime, ADV_CACHE_LOOKAHEAD);
//       return adPoints.find(({ point }) => point > currentTime && point - currentTime < ADV_CACHE_LOOKAHEAD / 1000);
//     };

//     const updateCache = () => {
//       cache.current = Object.keys(cache.current).reduce((acc, key) => {
//         const point = +key.split(':')[0];
//         if (currentTime > point + ADV_MAX_TIMELINE_OFFSET / 1000) return acc;

//         return { ...acc, [key]: cache.current[key] };
//       }, {});
//     };

//     const getCurrentPoint = () => {
//       return adPoints.find(({ point }) => {
//         // TODO и блок не обработан
//         return currentTime >= point && currentTime - point < ADV_MAX_TIMELINE_OFFSET / 1000;
//       });
//     };

//     updateCache();

//     const preCachePoint = getPreCachePoint();

//     logger.log('preCachePoint', currentTime, preCachePoint);
//     if (preCachePoint && !isCachedPoint(preCachePoint)) {
//       // @ts-ignore
//       const adBlock = AdBlock(adConfig[preCachePoint.category], videoNode, slotRef.current); // TODO FIX TYPES
//       setCache(preCachePoint, adBlock, 0);
//       preloadAd(adBlock);
//     }

//     const point = getCurrentPoint();
//     if (point) startAd(point);
//   }, [currentTime, adConfig, adPoints, startAd, videoNode, isLoaded, ADV_CACHE_LOOKAHEAD, ADV_MAX_TIMELINE_OFFSET]);

//   return isLoaded ? <div ref={slotRef}></div> : null;
// };

// export { AdBlock, AdController };

export const AdBlock = () => {
  return <div></div>;
};
export const AdController = () => {
  return <div></div>;
};
