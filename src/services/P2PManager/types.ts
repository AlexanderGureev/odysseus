import videojs from 'video.js';

export type TeleportInstance = {
  onPeeringModeChanged: (mode: PeeringMode) => void;
  onPeerConnectionOpened: (peerId: string) => void;
  onPeerConnectionClosed: (peerId: string) => void;
  onSegmentLoaded: (segment: Record<string, any>) => void;
  onSegmentUploaded: (segment: Record<string, any>) => void;
  buffering: () => void;
  getStatTotals: () => Record<string, any>;
  getStatDetails: () => Record<string, any>;
  dispose: () => Promise<void>;

  version: string;
  apiKey: string;
  connectionId: string;
  connected: boolean;
  peeringMode: PeeringMode;
};

export type SegmentType = 'Video' | 'Audio' | 'Caption' | 'Other' | 'Unknown';
export enum PeeringMode {
  'Off' = 0,
  'Download' = 1,
  'Upload' = 2,
  'Full' = 3,
}

export type InitOpts = {
  apiKey?: string;
  loader: {
    type: 'videojs.v7';
    params: {
      videojs: typeof videojs;
      segmentTypeGetter?: (uri: string) => SegmentType;
      urlCleaner?: (uri: string) => string;
    };
  };
};

export type TeleportSDK = {
  initialize: (opts: InitOpts) => Promise<TeleportInstance>;
  PeeringMode: Record<PeeringMode, PeeringMode>;
  SegmentType: Record<SegmentType, SegmentType>;
};

export type TeleportDevTools = (
  tlpt: TeleportInstance,
  opts: {
    container: HTMLElement;
    apiKey: string;
  }
) => void;
