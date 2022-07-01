import { Nullable, SkinClass } from 'types';

export type TVigoParams = {
  referrer: string;
  ssid: string;
  skinName: SkinClass;
};

export type TVigoService = {
  init: (params: TVigoParams) => void;
};

export type TVigoState = {
  svcid: Nullable<string>;
  cid: Nullable<string>;
  wid: Nullable<string>;
  quality: Nullable<number>;
  player: string;
  host?: string;
};
