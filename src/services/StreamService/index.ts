import { Nullable } from 'types';
import { logger } from 'utils/logger';

import { DRM_TYPE, StreamProtocol, TStreamItem } from './types';
import { isEncryptedStream } from './utils';

export const VIDEO_EXTENSION: Record<StreamProtocol, string> = {
  [StreamProtocol.HLS]: 'application/x-mpegURL',
  [StreamProtocol.MP4]: 'video/mp4',
  [StreamProtocol.DASH]: 'application/dash+xml',
  [StreamProtocol.MSS]: 'application/dash+xml',
};

export const PRIORITY_BY_PROTOCOL = [
  `${StreamProtocol.DASH}:${DRM_TYPE.WIDEVINE}`,
  `${StreamProtocol.HLS}:${DRM_TYPE.FAIRPLAY}`,
  `${StreamProtocol.DASH}:${DRM_TYPE.PLAYREADY}`,
  `${StreamProtocol.MSS}:${DRM_TYPE.PLAYREADY}`,
  StreamProtocol.HLS,
  StreamProtocol.DASH,
  StreamProtocol.MSS,
  StreamProtocol.MP4,
];

export type TStreamService = {
  init: (sources: TStreamItem[], capabilities: string[], historyKeys: string[]) => void;
  getStream: () => Nullable<TStreamItem>;
  createKey: (stream: TStreamItem) => string;
};

const StreamServiceFactory = (): TStreamService => {
  let streams: Record<string, TStreamItem>;
  let streamIterator: Generator<TStreamItem, void, unknown>;

  function init(sources: TStreamItem[], capabilities: string[], historyKeys: string[] = []) {
    logger.log('[StreamService]', 'init');

    streams = createSupportedStreamsList(sources, capabilities, historyKeys);
    streamIterator = streamGenerator();
  }

  function createKey({ drm_type, protocol }: TStreamItem) {
    return drm_type ? `${protocol}:${drm_type}` : `${protocol}`;
  }

  function isSupported(stream: TStreamItem, capabilities: string[]) {
    const keys = isEncryptedStream(stream) ? [stream.drm_type, stream.protocol] : [stream.protocol];
    return (keys as string[]).every((k) => capabilities.includes(k.toLowerCase()));
  }

  function createSupportedStreamsList(streams: TStreamItem[] = [], capabilities: string[], historyKeys: string[]) {
    const data = streams.reduce((acc: Record<string, TStreamItem>, source) => {
      const key = createKey(source);
      if (!isSupported(source, capabilities)) return acc;

      return {
        ...acc,
        [key]: source,
      };
    }, {});

    const priorityList = [...historyKeys, ...PRIORITY_BY_PROTOCOL.filter((k) => !historyKeys.includes(k))];
    return priorityList.reduce(
      (acc: Record<string, TStreamItem>, key) => (data[key] ? { ...acc, [key]: data[key] } : acc),
      {}
    );
  }

  function* streamGenerator() {
    for (const [, value] of Object.entries(streams)) {
      yield value;
    }
  }

  return {
    init,
    getStream: () => {
      if (!streamIterator) throw new Error('service is not initialized');
      return streamIterator.next().value || null;
    },
    createKey,
  };
};

const instance = StreamServiceFactory();
export { instance as StreamService };
