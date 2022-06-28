/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import youbora from 'youboralib';
import { TAdBreakConfig } from '../..';
import { Nullable } from '../../../../../types';
import { TMediatorHandlers } from '../../../MediatorService';
import { AD_CATEGORY_MAP } from '../../constants';
import { AdsAdapterEvent, TAdsAdapter } from './types';

const CustomAdsAdapter = youbora.Adapter.extend({
  getPosition: function () {
    return this._adConfig.adPosition;
  },
  getAdInsertionType: function () {
    return 'csai';
  },
  getGivenBreaks: function () {
    return this._adConfig.numBreaks;
  },
  getExpectedBreaks: function () {
    return this._adConfig.numExpectedBreaks;
  },
  // getBreaksTime: function () {
  //   return this._adConfig.breaksTimeList;
  // },
  getGivenAds: function () {
    return this._adConfig.numAds;
  },
  getExpectedAds: function () {
    return this._adConfig.numExpectedAds;
  },
  getCreativeId: function () {
    return this._adConfig.creativeId;
  },
  getAudioEnabled: function () {
    return this._adConfig.isAudioEnabled;
  },
  getIsSkippable: function () {
    return this._adConfig.isSkippable;
  },
  getIsFullscreen: function () {
    return this._adConfig.isFullscreen;
  },

  getProvider: function () {
    return 'yandex';
  },
  getTitle: function () {
    return `ad_creative:${this._adConfig.creativeId || -1}`;
  },
  _getTech: function () {
    return this.player?.tech?.({ IWillNotUseThisInPlugins: true })?.vhs;
  },

  registerListeners: function () {
    return;
  },
  unregisterListeners: function () {
    return;
  },

  getDuration: function () {
    let ret = this.player.duration();
    if (this.player.mediainfo && typeof this.player.mediainfo.duration !== 'undefined') {
      ret = this.player.mediainfo.duration;
    }

    return ret;
  },
  getResource: function () {
    return 'unknown';
  },
  setConfig: function ({ category, ...rest }: TAdBreakConfig) {
    this._adConfig = { adPosition: AD_CATEGORY_MAP[category], ...rest };
  },
  updateConfig: function ({ category, ...rest }: Partial<TAdBreakConfig>) {
    if (category) {
      this._adConfig.adPosition = AD_CATEGORY_MAP[category];
    }

    this._adConfig = { ...this._adConfig, ...rest };
  },
});

const AdsAdapter = (): TAdsAdapter => {
  let adapter: any = null;
  let mediator: Nullable<TMediatorHandlers> = null;

  const init = (serviceMediator: any, player: any) => {
    adapter = new CustomAdsAdapter(player);
    mediator = serviceMediator;

    registerListeners();
    return adapter;
  };

  const getVideoAdapter = () => adapter?.plugin?.getAdapter();

  const registerListeners = () => {
    if (!mediator) return;

    mediator
      .on(AdsAdapterEvent.FETCH_AD_MANIFEST, (config: TAdBreakConfig) => {
        const videoAdapter = getVideoAdapter();

        if (!videoAdapter || !adapter) return;

        if (!videoAdapter.flags.isStarted) {
          videoAdapter.setVideoType('adv');
          videoAdapter.fireStart();
          videoAdapter.fireJoin();
        }

        adapter.updateConfig(config);
        adapter.fireManifest();
      })
      .on(AdsAdapterEvent.AD_BREAK_START, (config: TAdBreakConfig) => {
        const videoAdapter = getVideoAdapter();

        if (!videoAdapter || !adapter) return;

        videoAdapter.setVideoType('adv');
        adapter.updateConfig(config);
        adapter.fireBreakStart();
      })
      .on(AdsAdapterEvent.SET_AD_CONFIG, (config: Partial<TAdBreakConfig>) => {
        adapter.updateConfig(config);
      })
      .on(AdsAdapterEvent.AD_START, () => {
        adapter.fireStart();
      })
      .on(AdsAdapterEvent.AD_JOIN, () => {
        adapter.fireJoin();
      })
      .on(AdsAdapterEvent.AD_QUARTILE, (q: number) => {
        adapter.fireQuartile(q);
      })
      .on(AdsAdapterEvent.AD_PAUSE, () => {
        adapter.firePause();
      })
      .on(AdsAdapterEvent.AD_RESUME, () => {
        adapter.fireResume();
      })
      .on(AdsAdapterEvent.AD_CLICK, (link: string) => {
        adapter.fireClick();
      })
      .on(AdsAdapterEvent.AD_ERROR, () => {
        adapter.fireError();
      })
      .on(AdsAdapterEvent.AD_SKIP, () => {
        adapter.fireSkip();
      })
      .on(AdsAdapterEvent.AD_STOP, () => {
        adapter.fireStop();
      })
      .on(AdsAdapterEvent.AD_BREAK_STOP, () => {
        adapter.fireBreakStop();
      });
  };

  return {
    init,
  };
};

const instance = AdsAdapter();
export { instance as AdsAdapter };
