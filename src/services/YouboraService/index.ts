/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-ignore
import { uniqueId } from 'lodash';
// @ts-ignore
import platform from 'platform';
import * as detector from 'react-device-detect';
import { QUALITY_MARKS } from 'services/VigoService';
import { store } from 'store';
import { Nullable } from 'types';
import { ERROR_TYPE } from 'types/errors';
import { getCurrentTime } from 'utils';
import { logger } from 'utils/logger';
import { VideoJsPlayer } from 'video.js';
// @ts-ignore
import youbora from 'youboralib';

import { AdsAdapter, VideoAdapter } from './adapters';
import { TAdsAdapter } from './adapters/AdsAdapter/types';
import { TVideoAdapter } from './adapters/VideoAdapter/types';
import { getTrackMetaSelector, getViewEventParamsSelector } from './selectors';
import { TOptions, TYouboraEvent, TYouboraService, YEvent } from './types';
import { filterOptions } from './utils';

const IS_DEV = window?.ENV?.NODE_ENV === 'development';
youbora.Log.logLevel = IS_DEV || window?.ENV?.DEBUG_MODE ? youbora.Log.Level.DEBUG : youbora.Log.Level.WARNING;

const defaultOptions: TOptions = {
  'content.isLive': false,
  'ad.blockDetection': true,
  'ad.resource': 'unknown',
};

const getDeviceInfo = (): TOptions => {
  return {
    'device.name': platform.product,
    'device.brand': platform.manufacturer,
    'device.type': detector.isMobile ? 'mobile' : 'desktop',
    'device.osName': detector.osName,
    'device.osVersion': detector.osVersion,
    'device.browserName': detector.browserName,
    'device.browserVersion': detector.browserVersion,
    'device.browserType': detector.isMobile ? 'mobile browser' : 'desktop browser',
    'device.browserEngine': detector.engineVersion,
  };
};

const YouboraService = (): TYouboraService => {
  let plugin: any = null;
  let isInitialized = false;

  // let playerMediator: Nullable<TMediator> = null;
  const adsAdapter: Nullable<TAdsAdapter> = null;
  const videoAdapter: Nullable<TVideoAdapter> = null;
  // const _mediator = MediatorService();

  const init = () => {
    // const { YOUBORA_ENABLED = false } = featuresSelector(store.getState());

    if (!window?.ENV?.YOUBORA_ACCOUNT_CODE || !window?.ENV?.YOUBORA_SERVICE_ENABLED) return; // !YOUBORA_ENABLED

    plugin = new youbora.Plugin({ accountCode: window.ENV.YOUBORA_ACCOUNT_CODE, 'session.context': true });
    // playerMediator = patchWithModuleInfo(new Mediator(), {
    //   id: uniqueId(),
    //   name: 'YouboraService',
    // });

    registerServiceListeners();
    registerPlayerListeners();

    isInitialized = true;
  };

  const registerPlayerListeners = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // playerMediator.subscribe(M_EVENTS.PLAYER_CHANGE_PROJECT, ({ payload: { projectConfig } }) => {
    //   emit('CUSTOM_EVENT', YEvent.CHANGE_TRACK, getTrackMetaSelector(projectConfig));
    //   emit('STOP_SESSION');
    // });
    // playerMediator.subscribe(
    //   M_EVENTS.PLAYER_SET_QUALITY,
    //   ({ payload }: { payload: { qualityMark: QUALITY_MARKS } }) => {
    //     emit('CUSTOM_EVENT', YEvent.CHANGE_QUALITY, { quality_mark: payload.qualityMark });
    //   }
    // );
    // playerMediator.subscribe(M_EVENTS.POST_MESSAGE_VIEW, () => {
    //   emit('CUSTOM_EVENT', YEvent.VIEW, getViewEventParamsSelector(store.getState()));
    // });
    // playerMediator.subscribe(M_EVENTS.POST_MESSAGE_WATCH_POINT, ({ payload: { module, ...rest } }) => {
    //   emit('CUSTOM_EVENT', YEvent.WATCH_POINT, rest);
    // });
  };

  const registerServiceListeners = () => {
    // _mediator.on('ERROR', (code: number, title: ERROR_TYPE, debugInfo: Record<string, any> = {}) => {
    //   if (!isInitialized || videoAdapter) return;
    //   plugin.fireFatalError(code, title, JSON.stringify(debugInfo), 'error');
    // });
  };

  const setOptions = (options: TOptions = {}) => {
    if (!isInitialized) return;
    plugin.setOptions(filterOptions(options));
  };

  const attachAdapter = (player: VideoJsPlayer, options: TOptions = {}) => {
    if (!isInitialized) return;

    setOptions({
      ...defaultOptions,
      ...options,
      ...getDeviceInfo(),
    });

    // adsAdapter = AdsAdapter.init(_mediator, player);
    // videoAdapter = VideoAdapter.init(_mediator, player);

    plugin.setAdapter(videoAdapter);
    plugin.setAdsAdapter(adsAdapter);
  };

  const emit = <T extends any[]>(event: TYouboraEvent, ...payload: T) => {
    if (!isInitialized) return;

    logger.log('[YouboraService]', `[${event}], payload - ${payload}`);
    // _mediator.emit(event, ...payload);
  };

  return {
    init,
    attachAdapter,
    setOptions,
    emit,
  };
};

const YouboraServiceInstance = YouboraService();

export { YouboraServiceInstance as YouboraService };
export * from './types';
