/* eslint-disable @typescript-eslint/no-explicit-any */

import { Nullable } from 'types';

export type TStreamItem = {
  drm_type: Nullable<DRM_TYPE>;
  ls_url: Nullable<string>;
  manifest_expires_at: number | null;
  protocol: StreamProtocol;
  url: string;
  pak_fallback_stream?: boolean;
};

export enum StreamProtocol {
  HLS = 'HLS',
  DASH = 'DASH',
  MSS = 'MSS',
  MP4 = 'MP4',
}

export enum DRM_TYPE {
  FAIRPLAY = 'fairplay',
  WIDEVINE = 'widevine',
  PLAYREADY = 'playready',
}

export enum STREAM_STATE {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  IN_PROCESS = 'IN_PROCESS',
  NOT_USED = 'NOT_USED',
}

export type TKeySystemExt = {
  keySystems: Record<
    string,
    | {
        getLicense: (...args: any[]) => void;
        getCertificate?: (...args: any[]) => void;
        getContentId?: (...args: any[]) => string;
      }
    | string
  >;
};
export type TSource = {
  src: string;
  type: string;
  handleManifestRedirects: boolean;
} & Partial<TKeySystemExt>;
