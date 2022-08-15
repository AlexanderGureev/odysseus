import { XMLParser } from 'fast-xml-parser';
import { isSafari } from 'react-device-detect';
import { getCookie } from 'utils/cookie';
import { logger } from 'utils/logger';

import { BlockMeta, CreativeOpts, ExtensionItem, Extensions } from './types';

export const ADV_DESKTOP_PLID = 229103;
export const ADV_OTHER_PLID = 229104;

export const parseUrl = (url: string) => {
  const link = document.createElement('a');
  link.href = url;

  return {
    protocol: link.protocol,
    host: link.host,
    hostname: link.hostname,
    port: link.port,
    pathname: link.pathname,
    hash: link.hash,
    search: link.search,
    origin: link.origin,
  };
};

export const getQueryParams = (url: string) => {
  const { search: searchString } = parseUrl(url);

  const result: Record<string, any> = {};

  const query = searchString.substring(1);
  const vars = query.split('&');

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (pair[0] && pair[1]) {
      result[pair[0]] = decodeURIComponent(pair[1]);
    }
  }

  return result;
};

export function getAdfoxQueryParameterForSafari() {
  const ADFOX_COOKIE_PARAMETER = 'af_lpdid';
  const ADFOX_QUERY_PARAMETER = 'extid';
  const ADFOX_ID_TAG = 'extid_tag=adfox';

  const id = getCookie(ADFOX_COOKIE_PARAMETER);
  return id ? `${ADFOX_ID_TAG}&${ADFOX_QUERY_PARAMETER}=${id}` : '';
}

export type TAdFoxConfig = {
  link: string;
  ownerId: string;
  params: Record<string, string>;
};

export type CreateAdFoxParams = CreativeOpts & {
  link: string;
  blockId: number;
};

export const getAdFoxParameters = ({
  link,
  blockId,
  isEmbedded,
  isMobile,
  outerHost,
  puid12,
  sauronId,
  ssid,
  userId,
  videosessionId,
}: CreateAdFoxParams): TAdFoxConfig => {
  const plid = isMobile ? ADV_OTHER_PLID : ADV_DESKTOP_PLID;
  const webVersion = null;

  let formattedUrl = link;
  formattedUrl = formattedUrl.replace(/\${3}eid1\${3}/g, `${ssid}`);
  formattedUrl = formattedUrl.replace(/\${3}pr\${3}/g, `${blockId}`);
  formattedUrl = formattedUrl.replace(/\${3}plid\${3}/g, `${plid}`);
  formattedUrl = formattedUrl.replace(/\${3}sauronid\${3}/g, `${sauronId}`);

  const adfoxSafariQueryParam = isSafari ? getAdfoxQueryParameterForSafari() : '';
  formattedUrl = `${formattedUrl}&${adfoxSafariQueryParam}`;
  formattedUrl = `${formattedUrl}&eid6=${userId || null}&eid7=${sauronId || ssid || null}&eid8=${
    videosessionId || null
  }`;

  formattedUrl = `${formattedUrl}&dl=${outerHost}`;
  formattedUrl = formattedUrl.replace(/&+/g, '&').replace(/&+$/g, '');
  const adFoxParams = getQueryParams(formattedUrl);

  if (isEmbedded && puid12?.embed) adFoxParams.puid12 = puid12.embed;
  if (!isEmbedded && puid12?.site) adFoxParams.puid12 = puid12.site;

  if (webVersion) adFoxParams.puid40 = webVersion;

  return {
    link: formattedUrl,
    ownerId: window.ENV.AD_FOX_OWNER_ID,
    params: { ...adFoxParams },
  };
};

export const parseCreativeXML = (xml: string): BlockMeta => {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const data = parser.parse(xml);

    const Ad = data?.VAST?.Ad;
    const id = Ad?.id || null;
    const obj = Ad?.InLine || Ad?.Wrapper;
    const ext = (obj?.Extensions?.Extension || []) as ExtensionItem[];
    const vpaidURL = Ad?.Wrapper?.VASTAdTagURI || null;
    const type = vpaidURL ? 'VPAID' : 'VAST';

    const extensions = ext.reduce((acc: Extensions, item: ExtensionItem) => {
      return {
        ...acc,
        [item.type]: item['#text'],
      };
    }, {});

    return {
      id,
      extensions,
      type,
      vpaidURL,
    };
  } catch (err) {
    logger.error('[getExtensions]', err?.message);
    return { id: null, extensions: {}, type: null, vpaidURL: null };
  }
};
