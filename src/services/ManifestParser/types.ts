import { StreamProtocol } from 'types';

export type Playlist = {
  uri: string;
  attributes: {
    'VIDEO-RANGE': string;
    CODECS: string;
    'FRAME-RATE': string;
    RESOLUTION: {
      width: number;
      height: number;
    };
    BANDWIDTH: number;
    'PROGRAM-ID': number;
    NAME?: string;
  };
};

export type TParserMap = {
  [key in StreamProtocol]?: {
    parse: (txt: string, options?: any) => RawManifest;
  };
};

export type RawManifest = { playlists: Playlist[]; mediaGroups: TMediaGroup };
export type TParsedManifest = { playlists: Playlist[]; audioFormat: string | null };
export type TManifestData = { url: string; responseUrl: string; manifestText: string; parsedManifest: TParsedManifest };
export type TMediaGroup = { AUDIO: any; VIDEO: any; 'CLOSED-CAPTIONS': any; SUBTITLES: any };
