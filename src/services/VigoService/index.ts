import { TSkinClass } from 'server/types';
import md5 from 'md5';
import { randomHash32 } from 'utils/randomHash';
import { Nullable } from 'types';
import { LocalStorageService, STORAGE_SETTINGS } from '../LocalStorageService';

export const SERVICE_ID = {
  MORE_TV: 1,
  CTC: 2,
};

export type TVigoParams = {
  referrer: string;
  ssid: string;
  skinName: TSkinClass;
};

type TVigoService = {
  init: (params: TVigoParams) => void;
};

type TVigoState = {
  svcid: Nullable<string>;
  cid: Nullable<string>;
  wid: Nullable<string>;
  quality: Nullable<number>;
  player: string;
  host?: string;
};

// Constants API.VIGO.RU
const VIGO_SVCID_MORE_TV = '5ccc';
const VIGO_SVCID_CTC = 'a201';

export enum QUALITY_MARKS {
  AQ = 'AQ',
  LD = 'LD',
  SD = 'SD',
  HD = 'HD',
}

export const VIGO_QUALITY_INDEX: Record<QUALITY_MARKS, number> = {
  [QUALITY_MARKS.AQ]: 100,
  [QUALITY_MARKS.LD]: 3,
  [QUALITY_MARKS.SD]: 4,
  [QUALITY_MARKS.HD]: 5,
};

const VigoService = (): TVigoService => {
  let state: TVigoState = {
    svcid: null,
    cid: null,
    wid: null,
    quality: null,
    player: 'HTML5',
    host: undefined,
  };

  const init = ({ referrer = '', ssid, skinName }: TVigoParams) => {
    const qualityMark = LocalStorageService.getItemByDomain<QUALITY_MARKS>(referrer, STORAGE_SETTINGS.LOCAL_QUALITY);
    const svcid = skinName === 'MORE_TV' ? VIGO_SVCID_MORE_TV : VIGO_SVCID_CTC;
    const cid = md5(ssid);
    const wid = randomHash32();

    state = {
      ...state,
      svcid,
      cid,
      wid,
      quality: qualityMark ? VIGO_QUALITY_INDEX[qualityMark] : 0,
    };
  };

  return { init };
};

const instance = VigoService();
export { instance as VigoService };
