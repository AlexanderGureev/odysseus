import { Nullable } from 'types';
import { handleFairplaySource, handlePlayreadySource, handleWidevineSource } from 'utils/drm';
import { DRM_TYPE, StreamProtocol, TStreamItem, TKeySystemExt, TSource } from './types';

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

export type THistoryStreams = string[];
export const LS_KEY_STREAM = '@stream_service';

export const isEncryptedStream = (s: TStreamItem) => Boolean(s.drm_type && s.ls_url);

export type TStreamService = {
  getStream: () => Nullable<TStreamItem>;
  createKey: (stream: TStreamItem) => string;
};

export const StreamService = (
  sources: TStreamItem[],
  capabilities: string[],
  streamHistoryKeys: string[] = []
): TStreamService => {
  const streams = createSupportedStreamsList(sources, capabilities);
  const streamIterator = streamGenerator();

  function createKey({ drm_type, protocol }: TStreamItem) {
    return drm_type ? `${protocol}:${drm_type}` : `${protocol}`;
  }

  function isSupported(stream: TStreamItem, capabilities: string[]) {
    const keys = isEncryptedStream(stream) ? [stream.drm_type, stream.protocol] : [stream.protocol];
    return (keys as string[]).every((k) => capabilities.includes(k.toLowerCase()));
  }

  function createSupportedStreamsList(streams: TStreamItem[] = [], capabilities: string[]) {
    const data = streams.reduce((acc: Record<string, TStreamItem>, source) => {
      const key = createKey(source);
      if (!isSupported(source, capabilities)) return acc;

      return {
        ...acc,
        [key]: source,
      };
    }, {});

    const priorityList = [...streamHistoryKeys, ...PRIORITY_BY_PROTOCOL.filter((k) => !streamHistoryKeys.includes(k))];
    return priorityList.reduce(
      (acc: Record<string, TStreamItem>, key) => (data[key] ? { ...acc, [key]: data[key] } : acc),
      {}
    );
  }

  function* streamGenerator() {
    for (const [key, value] of Object.entries(streams)) {
      yield value;
    }
  }

  return {
    getStream: () => streamIterator.next().value || null,
    createKey,
  };
};

const keySystemsExtension = ({ drm_type, ls_url }: TStreamItem) => {
  const DataMap: Record<DRM_TYPE, (url: string) => TKeySystemExt> = {
    [DRM_TYPE.WIDEVINE]: (url: string) => ({
      keySystems: handleWidevineSource(url),
    }),
    [DRM_TYPE.FAIRPLAY]: (url: string) => ({
      keySystems: handleFairplaySource(url),
    }),
    [DRM_TYPE.PLAYREADY]: (url: string) => ({
      keySystems: handlePlayreadySource(url),
    }),
  };

  if (!ls_url || !drm_type || !DataMap[drm_type]) return null;
  return DataMap[drm_type](ls_url);
};

export const createSource = (stream: TStreamItem, options = {}): TSource => {
  const ext = isEncryptedStream(stream) ? keySystemsExtension(stream) : {};

  return {
    src: stream.url,
    type: VIDEO_EXTENSION[stream.protocol],
    ...ext,
    handleManifestRedirects: true,
    ...options,
  };
};

// export const FAKE_STREAM = {
//   url: fakeVideoSrc,
//   protocol: StreamProtocol.MP4,
//   drm_type: null,
//   ls_url: null,
//   manifest_expires_at: null,
// };

// export const createFakeSource = () => createSource(FAKE_STREAM);
