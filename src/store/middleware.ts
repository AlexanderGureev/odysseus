import type { CreateListenerMiddlewareOptions, TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';
import { IServices } from 'interfaces';
import {
  AmberdataService,
  BeholderService,
  DemonService,
  EmbeddedCheckService,
  GAService,
  HorusService,
  IDBService,
  LocalStorageService,
  ManifestParser,
  PlayerService,
  PostMessageService,
  SauronService,
  StreamQualityManager,
  StreamService,
  TNSCounter,
  UTMService,
  VigoService,
  WindowController,
  YMService,
  YouboraService,
} from 'services';
import { AdService } from 'services/AdService/controller';

import type { AppDispatch, AppState } from '.';

const opts: CreateListenerMiddlewareOptions<IServices> = {
  extra: {
    embeddedCheckService: EmbeddedCheckService,
    dbService: IDBService,
    windowService: WindowController,
    amberdataService: AmberdataService,
    postMessageService: PostMessageService,
    sauronService: SauronService,
    streamService: StreamService,
    utmService: UTMService,
    vigoService: VigoService,
    ymService: YMService,
    gaService: GAService,
    youboraService: YouboraService,
    beholderService: BeholderService,
    horusService: HorusService,
    playerService: PlayerService,
    localStorageService: LocalStorageService,
    adService: AdService,
    tnsCounter: TNSCounter,
    manifestService: ManifestParser,
    qualityService: StreamQualityManager,
    demonService: DemonService,
  },
};

export const listenerMiddleware = createListenerMiddleware(opts);

export type AppStartListening = TypedStartListening<AppState, AppDispatch, IServices>;

export const startListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<AppState, AppDispatch>;
