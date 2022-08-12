import type { CreateListenerMiddlewareOptions, TypedAddListener, TypedStartListening } from '@reduxjs/toolkit';
import { addListener, createListenerMiddleware } from '@reduxjs/toolkit';
import { IServices } from 'interfaces';
import {
  AmberdataService,
  BeholderService,
  DemonService,
  EmbeddedCheckService,
  FavouritesService,
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
import { createDispatch, CreateDispatchOpts, SessionDispatch } from './dispatch';

type MiddlewareDeps = {
  services: IServices;
  createDispatch: (opts: CreateDispatchOpts) => SessionDispatch;
};

const opts: CreateListenerMiddlewareOptions<MiddlewareDeps> = {
  extra: {
    createDispatch,
    services: {
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
      favouritesService: FavouritesService,
    },
  },
};

export const listenerMiddleware = createListenerMiddleware(opts);

export type AppStartListening = TypedStartListening<AppState, AppDispatch, MiddlewareDeps>;

export const startListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<AppState, AppDispatch>;

// мы не хотим вызывать мидлварь при переходе в IDLE состояние
// с этого состояния начинают все автоматы
// есть сценарии, при которых автомат возвращается в IDLE состояние (event - change track) и слушает ивент PARSE_CONFIG_RESOLVE
// в этом случае вызывается редьюсер в ответ на ивент PARSE_CONFIG_RESOLVE, что порождает 2 вызова мидлвари
// 1 при переходе в IDLE, второй если в ответ на PARSE_CONFIG_RESOLVE происходит смена состояния
export const isStepChange = (prev: AppState, current: AppState, name: keyof AppState) =>
  !['IDLE', prev[name]?.step].includes(current[name]?.step);

// Пример сценария который нельзя использовать при написании автомата
/*

  Автомат 1)
  A {
    DO_B: B
  },
  B {
    DO_C: C
  }
  C: {}
  
  middleware автомата 1)
  эффект B -> dispatch('DO_C')

  Автомат 2)
  A {
    DO_B: B
  },
  B {
    DO_C: C
  }
  C: {}

  middleware автомата 2)
  эффект B -> логирование...
  эффект C -> конец...

  ------
  start app -> dispatch('DO_B')

  Порядок исполнения:
  1) автомат 1. A-> DO_B -> B
  2) автомат 2. A-> DO_B -> B
  3) автомат 1. вызов middleware -> dispatch 'DO_C'
  4) автомат 1. B -> DO_C -> C
  5) авматот 2. B -> DO_C -> C
  6) автомат 2. вызов middleware, текущий step C
  7) автомат 2. повторный вызов middleware, текущий step C

  тут видно, что для автомата 2 произошло два вызова middleware и так как мы используем всегда текущее состояние,
  эффект для состояния B будет пропущен и будет 2 вызова эффекта для состояния C
  */
