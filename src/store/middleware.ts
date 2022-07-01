import type { CreateListenerMiddlewareOptions, TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';
import { IServices } from 'interfaces';
import {
  AmberdataService,
  EmbeddedCheckService,
  IDBService,
  PostMessageService,
  SauronService,
  StreamService,
  UTMService,
  VigoService,
  WindowController,
  YouboraService,
} from 'services';
import { YMService } from 'services/YmService/service';

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
    youboraService: YouboraService,
  },
};

export const listenerMiddleware = createListenerMiddleware(opts);

export type AppStartListening = TypedStartListening<AppState, AppDispatch, IServices>;

export const startListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<AppState, AppDispatch>;
