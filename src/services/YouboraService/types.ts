import { AdCategory } from 'types/ad';
import { VideoJsPlayer } from 'video.js';

import { AdsAdapterEvent } from './adapters/AdsAdapter/types';
import { VideoAdapterEvent } from './adapters/VideoAdapter/types';

export enum YEvent {
  SET_SOURCE = 'SET_SOURCE',
  UPDATE_TOKEN = 'UPDATE_TOKEN', // Обновление токена
  UPDATE_MANIFEST = 'UPDATE_MANIFEST', // Обновление манифеста
  CHANGE_TRACK = 'CHANGE_TRACK', // Переключение трека
  CHANGE_QUALITY = 'CHANGE_QUALITY', // Смена качества

  AUTO_SWITCH_START = 'AUTO_SWITCH_START', // Показе блок "Автопереключение на следующий трек"
  AUTO_SWITCH_NEXT_TRACK = 'AUTO_SWITCH_NEXT_TRACK', //Автоматическое переключение на следующий трек
  AUTO_SWITCH_CLICK_NEXT_TRACK = 'AUTO_SWITCH_CLICK_NEXT_TRACK', //Клик на кнопку "следующий трек" в блоке "Автопереключение"
  AUTO_SWITCH_CLICK_CANCEL = 'AUTO_SWITCH_CLICK_CANCEL', // Клик на кнопку "смотреть титры" в блоке "Автопереключение",

  AD_REQUEST = 'AD_REQUEST',

  VIEW = 'VIEW',
  WATCH_POINT = 'WATCH_POINT',

  CURRENT_MEDIA_RESOURCE = 'CURRENT_MEDIA_RESOURCE',
}

export type TAdBreakConfig = {
  category: AdCategory;
  numBreaks?: number;
  numExpectedBreaks?: number;
  breaksTimeList?: number[];
  numAds: number;
  numExpectedAds: number;
  creativeId?: string;
  isSkippable?: boolean;
  isAudioEnabled?: boolean;
  isFullscreen?: boolean;
};

export type TOptions = Partial<{
  accountCode: string;
  username: string;
  transactionCode: string;
  enabled: boolean;

  'content.ssid': string;
  'content.sauronId': string;
  'content.userId': number;
  'content.trackId': number;
  'content.partnerId': number;

  'session.context': boolean;

  'content.customDimension.1': string;
  'content.customDimension.2': string;
  'content.customDimension.3': string;
  'content.customDimension.4': string;
  'content.customDimension.5': string;
  'content.customDimension.6': string;
  'content.customDimension.7': string;
  'content.customDimension.8': string;
  'content.customDimension.9': string;
  'content.customDimension.10': string;
  'content.customDimensions': Record<string, any>;

  'content.title': string;
  'content.program': string;
  'content.duration': number;
  'content.isLive': boolean;
  'content.bitrate': number;
  'content.rendition': string;
  'content.resource': string;
  'content.cdn': string;
  'content.metadata': Record<string, any>;
  'content.streamingProtocol': string;
  'content.cdnNode': string;
  'content.cdnType': number;
  'content.package': string;
  'content.saga': string;
  'content.tvShow': string;
  'content.season': string;
  'content.episodeTitle': string;
  'content.channel': string;
  'content.id': string;
  'content.imdbId': string;
  'content.gracenoteId': string;
  'content.type': string;
  'content.genre': string;
  'content.language': string;
  'content.subtitles': string;
  'content.contractedResolution': string;
  'content.cost': string;
  'content.price': string;
  'content.playbackType': string;
  'content.drm': string;
  'content.encoding.videoCodec': string;
  'content.encoding.audioCodec': string;
  'content.encoding.codecSettings': string;
  'content.encoding.codecProfile': string;
  'content.encoding.containerFormat': string;

  'network.ip': string;
  'network.isp': string;
  'network.connectionType': string;

  'device.name': string; //'Android';
  'device.model': string; //'s8';
  'device.brand': string; //'samsung';
  'device.type': string; //'smartphone';
  'device.osName': string; //'android';
  'device.osVersion': string; //'8.1';
  'device.browserName': string; //'chrome';
  'device.browserVersion': string; //'72';
  'device.browserType': string; //'mobile browser';
  'device.browserEngine': string; //'v8';
  'device.code': string; //'xbox360';

  'ad.ignore': boolean;
  'ad.blockDetection': boolean;
  'ad.campaign': string;
  'ad.creativeId': string;
  'ad.provider': string;
  'ad.resource': string;
  'ad.title': string;
  'ad.expectedPattern': {
    pre: number[];
    mid: number[];
    post: number[];
  };
  'ad.givenAds': number;
  'ad.breaksTime': number;
  'ad.expectedBreaks': number;
  'ad.givenBreaks': number;
  'ad.metadata': {
    custom_field?: string;
  };

  'ad.customDimension.1': string;
}>;

export type TYouboraService = {
  init: () => void;
  attachAdapter: (player: VideoJsPlayer, options?: TOptions) => void;
  setOptions: (options: TOptions) => void;
  emit: <T extends any[]>(event: TYouboraEvent, ...payload: T) => void;
};

export type TYouboraEvent = keyof typeof AdsAdapterEvent | keyof typeof VideoAdapterEvent;
