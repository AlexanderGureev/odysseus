/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Mediator } from 'services/MediatorService';
import { Nullable } from 'types';
import { AdPlaybackController, AdViewer } from 'types/yasdk';
import { logger } from 'utils/logger';
import { sleep } from 'utils/retryUtils';

import { AdPodError, PreloadTimeoutExpired } from './errors';
import { AD_BLOCK_STATUS, BlockMeta, BlockOpts, Events, TAdBlock, TAdLinkItem } from './types';
import { getAdFoxParameters, parseCreativeXML } from './utils';

export const AdBlock = ({
  isPromo,
  links: { no_type = [], promo = [], ...rest },
  videoSlot,
  controlsSlot,
  features: { ADV_CACHE_TIMEOUT, ADV_PLAY_WAIT_TIMEOUT },
}: BlockOpts): TAdBlock => {
  const mediator = Mediator<Events>();
  const state = (isPromo ? promo : no_type).map((link) => ({ ...link }));

  const _video = videoSlot;
  const _slot = controlsSlot;

  let _preload: Nullable<Promise<AdViewer>> = null;
  let adViewer: Nullable<AdViewer> = null;
  let adPlaybackController: Nullable<AdPlaybackController> = null;
  let isYaCreative = false;
  let isDisposed = false;
  let meta: BlockMeta = {
    id: null,
    extensions: {},
    type: null,
  };

  const filterLinks = (links: TAdLinkItem[]) => {
    return links
      .map((link) => ({ ...link }))
      .filter((link) => ![AD_BLOCK_STATUS.FINISHED_SUCCESS, AD_BLOCK_STATUS.ERROR].includes(link.status));
  };

  const dispose = async () => {
    try {
      isDisposed = true;
      adViewer?.destroy();
      _preload = null;
      adViewer = null;
      adPlaybackController = null;
    } catch (err) {
      logger.error('[AdBlock]', 'dispose', err?.message);
    }
  };

  const preloadLink = (item: TAdLinkItem) =>
    new Promise<AdViewer>((resolve, reject) => {
      if (!window.ya) return reject(new Error('yaSdk or link is undefined'));

      item.status = AD_BLOCK_STATUS.INITIALIZING;

      window.ya.videoAd
        .loadModule('AdLoader')
        .then((module) => {
          return module.AdLoader.create({
            adFoxParameters: getAdFoxParameters(item.link),
          });
        })
        .then((adLoader) => {
          item.status = AD_BLOCK_STATUS.INITIALIZED;
          mediator.emit('AdInitialized', item);
          return adLoader.loadAd();
        })
        .then((adStore) => {
          const xml = adStore.getNonYandexVastXmlTree();
          isYaCreative = adStore.hasYandexCreative();
          if (xml?.xmlString) meta = parseCreativeXML(xml.xmlString);

          logger.log('[preloadLink]', { adStore, isYaCreative, xml, meta });
          return adStore;
        })
        .then((adStore) => {
          item.status = AD_BLOCK_STATUS.PRELOADING;

          return adStore
            .preload({
              videoSlot: _video,
              desiredBitrate: 1000, //если не задать, то в safari реклама не играет
            })
            .then(() => adStore)
            .catch(() => {
              // Игнорируем, если в предзагрузке что-то пошло не так.
              // Не является блокером для проигрывания
              return adStore;
            });
        })
        .then((adStore) => {
          item.status = AD_BLOCK_STATUS.PRELOADED;
          adViewer = adStore;
          resolve(adStore);
        })
        .catch(reject);
    });

  const playLink = (adViewer: AdViewer, item: TAdLinkItem) =>
    new Promise<void>((resolve, reject) => {
      if (!window.ya) return reject(new Error('yaSdk or link is undefined'));

      adPlaybackController = adViewer.createPlaybackController(_video, _slot, {
        videoTimeout: ADV_PLAY_WAIT_TIMEOUT,
        vpaidTimeout: ADV_PLAY_WAIT_TIMEOUT,
        bufferFullTimeout: 30000,
        // pauseOnClickThrough: false,
        controlsSettings: {
          controlsVisibility: true,
        },
      });

      // {
      //   mute: false,
      //   skip: false,
      //   title: false,
      //   adLabel: false,
      //   timeline: false,
      // },

      adPlaybackController.subscribe('AdStarted', () => {
        mediator.emit('AdStarted');
      });
      adPlaybackController.subscribe('AdPodImpression', () => {
        mediator.emit('AdPodImpression');
      });
      adPlaybackController.subscribe('AdPodVideoFirstQuartile', () => {
        mediator.emit('AdPodVideoQuartile', 1);
      });
      adPlaybackController.subscribe('AdPodVideoMidpoint', () => {
        mediator.emit('AdPodVideoQuartile', 2);
      });
      adPlaybackController.subscribe('AdPodVideoThirdQuartile', () => {
        mediator.emit('AdPodVideoQuartile', 3);
      });
      adPlaybackController.subscribe('AdRemainingTimeChange', () => {
        if (!adPlaybackController) return;

        const duration = adPlaybackController.getAdDuration();
        const remainingTime = adPlaybackController.getAdRemainingTime();

        // yasdk присылает отрицательный remainingTime при постановке креатива на паузу
        if (remainingTime > 0) {
          mediator.emit('AdRemainingTimeChange', {
            duration,
            remainingTime,
            currentTime: duration - remainingTime,
          });
        }
      });
      adPlaybackController.subscribe('AdPlayingStateChange', (data) => {
        const stateMap: Record<string, () => void> = {
          play: () => mediator.emit('AdPlay'),
          pause: () => mediator.emit('AdPause'),
        };

        stateMap[data.playingState]?.();
      });
      adPlaybackController.subscribe('AdSkippableStateChange', (data) => {
        mediator.emit('AdSkippableStateChange', { skippable: data.skippableState });
      });
      adPlaybackController.subscribe('AdVolumeAvailabilityStateChange', () => {
        mediator.emit('AdVolumeAvailabilityStateChange');
      });
      adPlaybackController.subscribe('AdVolumeChange', () => {
        if (!adPlaybackController?.getAdVolumeAvailabilityState()) return;

        const volume = adPlaybackController.getAdVolume();
        mediator.emit('AdVolumeChange', { volume });
      });
      adPlaybackController.subscribe('AdClickThru', () => {
        mediator.emit('AdClickThru');
      });
      adPlaybackController.subscribe('AdPodSkipped', () => {
        mediator.emit('AdPodSkipped');
      });
      adPlaybackController.subscribe('AdPodStopped', () => {
        mediator.emit('AdPodStopped');
      });
      adPlaybackController.subscribe('AdStopped', () => {
        mediator.emit('AdStopped');
        item.status = AD_BLOCK_STATUS.FINISHED_SUCCESS;
        resolve();
      });
      adPlaybackController.subscribe('AdPodError', (e) => {
        mediator.emit('AdPodError');
        reject(new AdPodError(e?.code));
      });

      item.status = AD_BLOCK_STATUS.PLAYING;
      adPlaybackController.playAd();
    });

  const preload = () => {
    if (_preload) return _preload;

    _preload = new Promise(async (resolve, reject) => {
      let isTimeout = false;
      sleep(ADV_CACHE_TIMEOUT).then(() => {
        isTimeout = true;
        reject(new PreloadTimeoutExpired(`preload timer ${ADV_CACHE_TIMEOUT} expired`));
      });

      for (const link of state) {
        if (isTimeout) return;

        try {
          switch (link.status) {
            case AD_BLOCK_STATUS.UNITIALIZED:
            case AD_BLOCK_STATUS.INITIALIZING:
            case AD_BLOCK_STATUS.INITIALIZED:
            case AD_BLOCK_STATUS.PRELOADING:
            case AD_BLOCK_STATUS.PRELOADED: {
              const adViewer = await preloadLink(link);
              resolve(adViewer);
              return;
            }
          }
        } catch (err) {
          link.status = AD_BLOCK_STATUS.ERROR;
          logger.error('[AdBlock]', 'preload', err);
        }
      }

      reject(new Error('preload block failed'));
    });

    return _preload;
  };

  const play = () =>
    new Promise<void>(async (resolve, reject) => {
      try {
        const adViewer = await preload();

        for (const link of state) {
          switch (link.status) {
            case AD_BLOCK_STATUS.UNITIALIZED:
            case AD_BLOCK_STATUS.INITIALIZING:
            case AD_BLOCK_STATUS.INITIALIZED:
            case AD_BLOCK_STATUS.PRELOADING:
            case AD_BLOCK_STATUS.PRELOADED: {
              try {
                await playLink(adViewer, link);
                return resolve();
              } catch (err) {
                link.status = AD_BLOCK_STATUS.ERROR;
                throw err;
              }
            }
          }
        }

        throw new Error('play block failed (not found link');
      } catch (err) {
        reject(err);
      } finally {
        dispose();
      }
    });

  const resumeAd = () => {
    adPlaybackController?.resumeAd();
  };

  const pauseAd = () => {
    adPlaybackController?.pauseAd();
  };

  const skipAd = () => {
    adPlaybackController?.skipAd();
  };

  return {
    resumeAd,
    pauseAd,
    skipAd,
    on: mediator.on,
    off: mediator.off,
    getLinks: () => ({
      ...rest,
      promo,
      no_type,
      [isPromo ? 'promo' : 'no_type']: filterLinks(state),
    }),
    play,
    preload,
    isPromo,
    isExclusive: () => Boolean(meta.extensions?.exclusive),
    isDisposed: () => isDisposed,
  };
};
