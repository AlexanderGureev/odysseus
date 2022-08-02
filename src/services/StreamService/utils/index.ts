import { VIDEO_EXTENSION } from '..';
import { fakeVideoSrc } from '../fake-video';
import { DRM_TYPE, StreamProtocol, TKeySystemExt, TSource, TStreamItem } from '../types';
import { handleFairplaySource } from './fairplay';
import { handlePlayreadySource } from './playready';
import { handleWidevineSource } from './widevine';

export const isEncryptedStream = (s: TStreamItem) => Boolean(s.drm_type && s.ls_url);

const keySystemsExtension = ({ drm_type, ls_url }: TStreamItem) => {
  const DataMap: Record<DRM_TYPE, (url: string) => TKeySystemExt> = {
    [DRM_TYPE.WIDEVINE]: (url: string) => handleWidevineSource(url),
    [DRM_TYPE.FAIRPLAY]: (url: string) => handleFairplaySource(url),
    [DRM_TYPE.PLAYREADY]: (url: string) => handlePlayreadySource(url),
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

export const FAKE_STREAM = {
  url: fakeVideoSrc,
  protocol: StreamProtocol.MP4,
  drm_type: null,
  ls_url: null,
  manifest_expires_at: null,
};

export const createFakeSource = () => createSource(FAKE_STREAM);

export { handleFairplaySource, handlePlayreadySource, handleWidevineSource };
