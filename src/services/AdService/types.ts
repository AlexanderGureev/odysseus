import { Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { Puid12, TParsedFeatures } from 'types';
import { AdCategory, AdLinkType, TAdPointConfig, TAdPointsConfig } from 'types/ad';
import { AdViewer } from 'types/yasdk';

import { TAdFoxConfig } from './utils';

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

export type TAdLinkItem = {
  link: string;
  status: AD_BLOCK_STATUS;
  index: number;
  tnsInitEvent: boolean;
};

export type AdLinksByType = {
  [key in AdLinkType]?: TAdLinkItem[];
};

export type Events = {
  AdFoxParams: (params: TAdFoxConfig) => void;
  AdInitialized: (payload: TAdLinkItem) => void;
  AdClickThru: () => void;
  AdPlayingStateChange: () => void;
  // AdPodClose: () => void;
  // AdPodComplete: () => void;
  AdPodError: () => void;
  AdPodImpression: () => void;
  AdPodSkipped: () => void;
  // AdPodStarted: () => void;
  AdPodStopped: () => void;
  AdPodVideoFirstQuartile: () => void;
  AdPodVideoMidpoint: () => void;
  AdPodVideoThirdQuartile: () => void;
  AdPodVideoQuartile: (quartile: number) => void;
  AdRemainingTimeChange: (payload: { currentTime: number; duration: number; remainingTime: number }) => void;
  AdSkippableStateChange: (payload: { skippable: boolean }) => void;
  AdStarted: () => void;
  AdPlay: () => void;
  AdPause: () => void;
  AdStopped: () => void;
  AdVolumeAvailabilityStateChange: (value: boolean) => void;
  AdVolumeChange: (payload: { volume: number }) => void;
  AllAdPodVideoComplete: () => void;
};

export type AdServiceHooks = {
  adBlockCreated: (block: TAdBlock) => void;
  canPlayAd: (category: AdCategory) => boolean;
  initAdBreak: (point: TAdPointConfig) => Promise<void>;
};

export type AdHookType = keyof AdServiceHooks;

export type AdControllerHooks = {
  [key in AdHookType]: AdServiceHooks[key][];
};

export type TAdBlock = {
  resumeAd: () => void;
  pauseAd: () => void;
  skipAd: () => void;
  on: Subscribe<Events>;
  off: Unsubscribe<Events>;
  getLinks: () => AdLinksByType;
  play: () => Promise<void>;
  preload: () => Promise<AdViewer>;
  isExclusive: () => boolean;
  isPromo: boolean;
  isDisposed: () => boolean;
  getAdVolumeAvailability: () => boolean;
  setVolume: (value: number) => void;
  getVolume: () => number | undefined;
  getAdFoxParams: () => {
    [x: string]: any;
  };
  isYandexCreative: () => boolean;
};

export type InitOpts = {
  playerId: string;
  controlsId: string;
  features: TParsedFeatures;
};

export type NewBlockOpts = {
  config: TAdPointConfig;
  index: number;
  limit: number;
  isPromo: boolean;
  creativeOpts: CreativeOpts;
};

export type BlockOpts = {
  links: AdLinksByType;
  videoSlot: HTMLVideoElement;
  controlsSlot: HTMLDivElement;
  features: {
    ADV_PLAY_WAIT_TIMEOUT: number;
    ADV_CACHE_TIMEOUT: number;
  };
  isPromo: boolean;
  creativeOpts: CreativeOpts;
};

export type CreativeOpts = {
  isMobile: boolean;
  sauronId: string | null;
  ssid: string;
  videosessionId: string;
  userId: number | null;
  outerHost: string | null;
  isEmbedded: boolean;
  puid12: Puid12 | undefined;
};

export type AdService = {
  init: (opts: InitOpts) => Promise<void>;
  isInitialized: boolean;
  isCachedPoint: (preloadedBlocks: Record<string, TAdBlock>, { point, category }: TAdPointConfig) => boolean;
  getPreCachePoint: (points: TAdPointsConfig, currentTime: number) => TAdPointConfig | undefined;
  updatePreloadedBlocks: (data: Record<string, TAdBlock>, currentTime: number) => Record<string, TAdBlock>;
  getCurrentPoint: (points: TAdPointsConfig, currentTime: number) => TAdPointConfig | undefined;
  updateTimeout: () => void;
};

export type Extensions = Partial<{
  addClick: string;
  closeAct: string;
  exclusive: 0 | 1;
  isClickable: 0 | 1;
  linkTxt: string;
  skipAd: string;
  skipTime: string;
  skipTime2: string;
  startTime: string;
}>;

export type ExtensionItem = {
  type: keyof Extensions;
  '#text': string;
};

export type BlockMeta = {
  id: string | null;
  extensions: Extensions;
  type: 'VAST' | 'VPAID' | null;
  vpaidURL: string | null;
};
