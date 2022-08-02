import { Nullable, SkinClass } from 'types';

export type TVigoParams = {
  playerId: string;
  sid: string;
  skinName: SkinClass;
};

export type VigoInfo = {
  svcid: Nullable<string>;
  cid: Nullable<string>;
  wid: Nullable<string>;
  quality: Nullable<number>;
  player: string;
  host?: string;
};

export type VigoInitOpts = VigoInfo & {
  getBitrate: () => number | null;
  getBytes: () => number | null;
};

export type VigoSDK = {
  endPlayback: () => void;
  suspendStats: () => void;
  resumeStats: () => void;
  updateHost: (host: string) => void;
};

export type VigoEvent =
  | {
      type: 'endPlayback';
    }
  | {
      type: 'suspendStats';
    }
  | {
      type: 'resumeStats';
    }
  | {
      type: 'updateHost';
      payload: string;
    };

export type TVigoService = {
  init: (params: TVigoParams) => void;
  sendStat: (event: VigoEvent) => void;
};
