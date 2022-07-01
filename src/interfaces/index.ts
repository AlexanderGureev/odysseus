import { CrashEventPayload, TAmberdataParams } from 'services/AmberdataService';
import { TStoresConfig } from 'services/IDBService/types';
import { TSubscriber } from 'services/MediatorService';
import {
  INPUT_PLAYER_POST_MESSAGE,
  OUTPUT_PLAYER_POST_MESSAGE,
  TOutputMessage,
} from 'services/PostMessageService/types';
import { TSauronSubscriber } from 'services/SauronService/types';
import { Params } from 'services/UTMService/types';
import { TVigoParams } from 'services/VigoService/types';
import { YMQueryParams } from 'services/YmService/types';
import { TOptions, TYouboraEvent } from 'services/YouboraService';
import { AppDispatch, AppState } from 'store';
import { Nullable, TStreamItem } from 'types';
import { VideoJsPlayer } from 'video.js';

export interface IEmbeddedCheckService {
  getEmbededStatus: () => Promise<boolean>;
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
}

export interface IPostMessageService {
  init: () => void;
  emit: (event: OUTPUT_PLAYER_POST_MESSAGE, data?: TOutputMessage) => void;
  on: (event: INPUT_PLAYER_POST_MESSAGE, callback: TSubscriber) => () => void;
  one: (event: INPUT_PLAYER_POST_MESSAGE, callback: TSubscriber) => void;
}

export interface ISauronService {
  init: () => void;
  subscribe: (callback: TSauronSubscriber) => void;
}

export interface IStreamService {
  init: (
    sources: TStreamItem[],
    capabilities: string[],
    historyKeys: string[]
  ) => { getStream: () => Nullable<TStreamItem>; createKey: (stream: TStreamItem) => string };
}

export interface IUTMService {
  buildUTMQueryParams: (params: Params) => string;
}

export interface IVigoService {
  init: (params: TVigoParams) => void;
}

export interface IYMService {
  init: (params: Partial<YMQueryParams>) => void;
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
  youboraService: IYouboraService;
}

export type EffectOpts = {
  dispatch: AppDispatch;
  getState: () => AppState;
  services: IServices;
};
