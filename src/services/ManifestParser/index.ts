/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Base64 } from 'js-base64';
// @ts-ignore
import { Parser } from 'm3u8-parser';
// @ts-ignore
import * as MPDParser from 'mpd-parser';
import { VIDEO_EXTENSION } from 'services/StreamService';
import { StreamProtocol, TStreamItem } from 'services/StreamService/types';
import { Nullable } from 'types';
import { ERROR_CODES } from 'types/errors';
import { PlayerError } from 'utils/errors';
import { logger } from 'utils/logger';

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

export const getAudioFormatFromParsedManifest = (manifest: any) => {
  const { BANDWIDTH = null, CODECS = null } =
    manifest?.mediaGroups?.AUDIO?.audio?.main?.playlists?.[0]?.attributes || {};

  return BANDWIDTH && CODECS ? `${CODECS}@${Math.floor(BANDWIDTH / 1024)}k` : null;
};

// @ts-ignore
const HLSParser = new Parser();

type TParserMap = {
  [key in StreamProtocol]?: {
    parse: (txt: string, options?: any) => TParsedManifest;
  };
};

const ParserByProtocol: TParserMap = {
  DASH: {
    parse: (txt, options: { manifestUri?: string } = {}) => {
      return MPDParser.parse(txt, options) as TParsedManifest;
    },
  },
  HLS: {
    parse: (txt) => {
      HLSParser.push(txt);
      HLSParser.end();
      return HLSParser.manifest;
    },
  },
};

export type TParsedManifest = { playlists: Playlist[]; mediaGroups: TMediaGroup };
export type TManifestData = { url: string; responseUrl: string; manifestText: string; parsedManifest: TParsedManifest };
export type TMediaGroup = { AUDIO: any; VIDEO: any; 'CLOSED-CAPTIONS': any; SUBTITLES: any };

export const stringToMpdXml = (manifestString: string): Nullable<HTMLElement> => {
  if (manifestString === '') {
    throw new Error('DASH_EMPTY_MANIFEST');
  }

  const parser = new DOMParser();
  let xml: Document | null = null;
  let mpd: HTMLElement | null = null;

  try {
    xml = parser.parseFromString(manifestString, 'application/xml');
    mpd = xml && xml.documentElement.tagName === 'MPD' ? xml.documentElement : null;
  } catch (e) {
    // ie 11 throwsw on invalid xml
  }

  if (!mpd || (mpd && mpd.getElementsByTagName('parsererror').length > 0)) {
    throw new Error('DASH_INVALID_XML');
  }

  return mpd;
};

export const serializeToString = (manifest: any) => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(manifest);
};

const ManifestParser = () => {
  let manifestData: Nullable<TManifestData> = null;

  const modifyManifest = (manifestURL: string, manifestText: string, protocol: StreamProtocol) => {
    const URL_DATA = new URL(manifestURL);

    const PARSER_BY_PROTOCOL: { [key in StreamProtocol]?: () => string } = {
      [StreamProtocol.DASH]: () => {
        const path = URL_DATA.pathname.split('/').slice(0, -1).join('/') + '/';

        const root = stringToMpdXml(manifestText);
        if (!root) return manifestText;

        const bNode = Array.from(root?.childNodes || []).find((n) => n.nodeName === 'BaseURL');

        if (bNode) {
          if (bNode.textContent?.includes('://')) return manifestText;

          const { href } = new URL(path + bNode.textContent, URL_DATA.origin);
          bNode.textContent = href;
          return serializeToString(root);
        }

        const { href } = new URL(path, URL_DATA.origin);
        const node = document.createElementNS('', 'BaseURL');
        node.innerHTML = href;
        root.appendChild(node);

        return serializeToString(root);
      },
      [StreamProtocol.HLS]: () => {
        const parseURI = (uri: string) => {
          if (uri.includes('://')) return uri;

          const { pathname } = URL_DATA;
          const playlistPath = [...pathname.split('/').slice(0, -1), uri].join('/');

          return new URL(playlistPath, URL_DATA.origin).href;
        };

        const text = manifestText.split('\n').reduce((acc: string[], line) => {
          if (line[0] && line[0] !== '#') return [...acc, parseURI(line)];

          if (line.indexOf('#EXT-X-MEDIA:TYPE') === 0) {
            const result = line.replace(/URI="(.+?)"/, (_, group) => {
              return `URI="${parseURI(group)}"`;
            });

            return [...acc, result];
          }

          return [...acc, line];
        }, []);

        return text.join('\n');
      },
    };

    return PARSER_BY_PROTOCOL[protocol]?.() || manifestText;
  };

  const request = async (url: string) => {
    try {
      const response = await fetch(url);
      return response;
    } catch (e) {
      throw new PlayerError(ERROR_CODES.BALANCER_UNAVAILABLE, e?.message);
    }
  };

  const fetchManifest = async (source: TStreamItem): Promise<TManifestData> => {
    const response = await request(source.url);
    if (!response.ok) {
      const { origin } = new URL(source.url);
      const balancerUnavailable = response.url.includes(origin);
      throw new PlayerError(balancerUnavailable ? ERROR_CODES.BALANCER_REQUEST_FAILED : ERROR_CODES.CDN_REQUEST_FAILED);
    }

    const text = await response.text();
    if (!text) throw new PlayerError(ERROR_CODES.BALANCER_NO_DATA);

    try {
      const manifestText = modifyManifest(response.url, text, source.protocol);
      const parsedManifest = parse(source.protocol, manifestText);

      manifestData = {
        url: `data:${VIDEO_EXTENSION[source.protocol]};base64,${Base64.encode(manifestText)}`,
        responseUrl: response.url,
        manifestText,
        parsedManifest,
      };

      return manifestData;
    } catch (e) {
      logger.error('[ManifestParser]', 'fetchManifest error:', e?.message);
      throw new PlayerError(ERROR_CODES.CDN_INVALID_DATA, e?.message);
    }
  };

  const getManifest = (): Nullable<TManifestData> => manifestData;

  const parse = (protocol: StreamProtocol, text: string): TParsedManifest => {
    const parser = ParserByProtocol[protocol];
    if (!parser) throw new PlayerError(ERROR_CODES.UNKNOWN, `no parser found for protocol: ${protocol}`);
    return parser.parse(text);
  };

  return { parse, fetchManifest, getManifest };
};

const instance = ManifestParser();
export { instance as ManifestParser };
