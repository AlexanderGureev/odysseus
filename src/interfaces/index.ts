import { VIDEO_TYPE } from 'components/Player/types';
import { AdLinksByType, InitOpts, NewBlockOpts, TAdBlock } from 'services/AdService/types';
import { AmberdataEventPayload, CrashEventPayload, TAmberdataParams } from 'services/AmberdataService/types';
import { TBeholderParams } from 'services/BeholderService/types';
import { DemonInitOpts, PlayerStats } from 'services/DemonService/types';
import { LocationState } from 'services/EmbeddedCheckService/types';
import { HORUS_EVENT } from 'services/HorusService/types';
import { TStoresConfig } from 'services/IDBService/types';
import { TManifestData, TParsedManifest } from 'services/ManifestParser';
import { OnceSubscribe, Subscribe, Unsubscribe } from 'services/MediatorService/types';
import { Events, Hooks, HookType } from 'services/PlayerService/types';
import {
  INPUT_PLAYER_POST_MESSAGE,
  OUTPUT_PLAYER_POST_MESSAGE,
  TOutputMessage,
} from 'services/PostMessageService/types';
import { TMeta, TQualityItem, TQualityList, TQualityRecord } from 'services/StreamQualityManager/types';
import { TSource } from 'services/StreamService/types';
import { TNSEvent } from 'services/TNSCounter/types';
import { Params } from 'services/UTMService/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { TVigoParams, VigoEvent } from 'services/VigoService/types';
import { YMQueryParams } from 'services/YmService/types';
import { TOptions, TYouboraEvent } from 'services/YouboraService';
import type { AppState } from 'store';
import { SessionDispatch } from 'store/dispatch';
import { DeviceInfo } from 'store/slices/root/types';
import { Nullable, StreamProtocol, THeartBeatTnsCounterConfig, TnsCounter, TStreamItem } from 'types';
import { TAdConfig, TAdPointConfig, TAdPointsConfig } from 'types/ad';
import { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';

export interface IEmbeddedCheckService {
  getEmbededStatus: () => Promise<boolean>;
  getIframeLocation: () => Promise<LocationState>;
  getState: () => LocationState;
}

export interface IDBService {
  connect: (dbName: string, stores: TStoresConfig, version?: number) => Promise<IDBDatabase>;
}

export interface IWindowService {
  init: () => Promise<void>;
}

export interface IAmberdataService {
  init: (opts: TAmberdataParams) => void;
  sendAmberdataCrashEvent: (payload: CrashEventPayload) => void;
  sendAmberdataStat: (payload: AmberdataEventPayload) => void;
}

export interface IPostMessageService {
  init: () => void;
  emit: (event: OUTPUT_PLAYER_POST_MESSAGE, data?: TOutputMessage) => void;
  on: Subscribe<INPUT_PLAYER_POST_MESSAGE>;
  one: OnceSubscribe<INPUT_PLAYER_POST_MESSAGE>;
  off: Unsubscribe<INPUT_PLAYER_POST_MESSAGE>;
}

export interface ISauronService {
  init: () => Promise<void>;
  getSauronId: () => string | null;
}

export interface IStreamService {
  init: (sources: TStreamItem[], capabilities: string[], historyKeys: string[]) => void;
  getStream: () => Nullable<TStreamItem>;
  createKey: (stream: TStreamItem) => string;
}

export interface IUTMService {
  buildUTMQueryParams: (params: Params) => string;
}

export interface IVigoService {
  init: (params: TVigoParams) => void;
  sendStat: (event: VigoEvent) => void;
}

export interface IYMService {
  init: (params: Partial<YMQueryParams>) => Promise<void>;
  reachGoal: (event: string) => void;
  sendUserParams: (payload: Partial<YMQueryParams>) => void;
  log: (payload?: Partial<YMQueryParams>) => void;
}

export interface IYouboraService {
  init: () => void;
  attachAdapter: (player: VideoJsPlayer, options?: TOptions) => void;
  setOptions: (options: TOptions) => void;
  emit: <T extends any[]>(event: TYouboraEvent, ...payload: T) => void;
}

export interface IGAService {
  init: () => Promise<void>;
}

export interface IBeholderService {
  init: (params: TBeholderParams) => Promise<void>;
  saveTime: (currentTime: number) => Promise<void>;
  onTimeUpdate: (currentTime: number, seeking: boolean) => void;
}

export interface IHorusService {
  init: () => Promise<void>;
  routeEvent: (event: HORUS_EVENT) => Promise<void>;
}

export interface IPlayerService {
  init: (playerId: string, options: VideoJsPlayerOptions) => Promise<void>;
  setSource: (source: TSource, type?: VIDEO_TYPE) => Promise<void>;
  checkPermissions: () => Promise<{ autoplay: boolean; mute: boolean }>;
  play: () => Promise<void>;
  pause: () => void;
  setCurrentTime: (value: number) => void;
  on: Subscribe<Events>;
  one: OnceSubscribe<Events>;
  off: Unsubscribe<Events>;
  getPlayer: () => VideoJsPlayer;
  getRepresentations: () => any;
  getTech: () => any;
  addHook: <T extends HookType, C extends Hooks[T]>(type: T, hook: C) => void;
  setPlaybackRate: (value: number) => void;
  getPlaybackRate: () => number;
  setMute: (status: boolean) => void;
  setVolume: (value: number) => void;
  enterFullcreen: () => Promise<void>;
  exitFullcreen: () => Promise<void>;
}

export interface ILocalStorageService {
  init: (host: string | null) => void;
  getItemByDomain: <T>(key: string) => Nullable<T>;
  setItemByDomain: <T>(key: string, value: T) => void;
  getItemByProject: <T>(trackId: number, key: string) => T | null;
  setItemByProject: <T>(trackId: number, key: string, value: T) => void;
  getItem: <T>(key: string) => Nullable<T>;
  setItem: <T>(key: string, value: T) => void;
}

export interface IAdService {
  init: (opts: InitOpts) => Promise<void>;
  isInitialized: boolean;
  isCachedPoint: (config: TAdPointConfig) => boolean;
  getPreCachePoint: (points: TAdPointsConfig, currentTime: number) => TAdPointConfig | null;
  updatePreloadedBlocks: (currentTime: number) => void;
  getCurrentPoint: (points: TAdPointsConfig, currentTime: number) => TAdPointConfig | undefined;
  createBlock: (links: AdLinksByType, opts: NewBlockOpts) => TAdBlock;
  saveBlock: (block: TAdBlock, { point, category }: TAdPointConfig, index: number) => void;
  getBlock: (config: TAdPointConfig, index: number) => TAdBlock;
  createState: (config: TAdConfig, point: TAdPointConfig) => AdLinksByType;
  isPassed: (currentTime: number, point: number) => boolean;
  resetPreloadedBlocks: () => void;
  getPauseRoll: (pausedAt: number) => TAdPointConfig | null;
  canPlayAd: () => boolean;
  updateTimeout: () => void;
  isPreloadable: () => boolean;
}

export interface ITNSCounter {
  init: (
    heartbeatCfg: THeartBeatTnsCounterConfig | undefined,
    events: TnsCounter | undefined,
    deviceInfo: DeviceInfo
  ) => void;
  sendEvent: (event: TNSEvent) => void;
}

export interface IManifestService {
  parse: (protocol: StreamProtocol, text: string) => TParsedManifest;
  fetchManifest: (source: TStreamItem) => Promise<TManifestData>;
}

export interface IQualityService {
  setQuality: (
    qualityItem: TQualityItem,
    opts: {
      currentStream: TStreamItem;
      currentTime: number;
    }
  ) => Promise<void>;

  init: (options: TMeta) => {
    qualityRecord: TQualityRecord;
    qualityList: TQualityList;
    currentQualityMark: QUALITY_MARKS;
  };
  // getLinkByCurrentQuality: () => Nullable<string>;
  // getCurrentQualityObj: () => Nullable<TQualityItem>;
  // onChangeQuality: (qualityMark: QUALITY_MARKS) => void;
  // getCurrentQualityMark: () => QUALITY_MARKS;
}

export interface IDemonService {
  init: (opts: DemonInitOpts) => void;
  sendStat: (payload: PlayerStats) => void;
}

export interface IServices {
  embeddedCheckService: IEmbeddedCheckService;
  dbService: IDBService;
  windowService: IWindowService;
  amberdataService: IAmberdataService;
  postMessageService: IPostMessageService;
  sauronService: ISauronService;
  streamService: IStreamService;
  utmService: IUTMService;
  vigoService: IVigoService;
  ymService: IYMService;
  gaService: IGAService;
  youboraService: IYouboraService;
  beholderService: IBeholderService;
  horusService: IHorusService;
  playerService: IPlayerService;
  localStorageService: ILocalStorageService;
  adService: IAdService;
  tnsCounter: ITNSCounter;
  manifestService: IManifestService;
  qualityService: IQualityService;
  demonService: IDemonService;
}

export type EffectOpts = {
  dispatch: SessionDispatch;
  getState: () => AppState;
  services: IServices;
};
