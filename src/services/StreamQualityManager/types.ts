import { Playlist } from 'services/ManifestParser/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { Nullable } from 'types';

export type TMeta = {
  playlist: Playlist[];
  url: string;
  width: number | null;
  height: number | null;
};

export type TInitOptions = {
  player: any;
  vigo: any;
};

export type TRepresentation = {
  bandwidth: number;
  codecs: { video: string; audio: string };
  enabled: (status?: boolean) => boolean;
  height: number;
  id: string;
  playlist: Playlist;
  width: number;
};

export type TQualityItem = { height: number; uri: string; qualityMark: QUALITY_MARKS };
export type TQualityRecord = { [key in QUALITY_MARKS]?: TQualityItem };
export type TQualityList = QUALITY_MARKS[];

export type TQualityManager = {
  buildQualityList: () => TQualityRecord;
  setQuality: (qualityObj: TQualityItem) => Promise<void>;
  isRepresentationsSupport: () => boolean;
  init: (options: TMeta) => void;
  getLinkByCurrentQuality: () => Nullable<string>;
  getCurrentQualityObj: () => Nullable<TQualityItem>;
  onChangeQuality: (qualityMark: QUALITY_MARKS) => void;
  getCurrentQualityMark: () => QUALITY_MARKS;
};
