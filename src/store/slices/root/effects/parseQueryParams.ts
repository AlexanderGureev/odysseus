import { Experiments } from '@moretv/types';
import { toNumber } from 'server/utils';
import { TParsedFeatures } from 'types';
import { isNil } from 'utils';

export type TAutoplay = 'never' | 'always' | 'on' | 'off' | '1' | '0';

export type TQueryParams = Partial<{
  sign: string;
  pf: string;
  pt: string;
  userId: string;
  p2p: boolean;
  adult: boolean;
  autoplay: boolean;
  trial_available: boolean;
  startAt: number;
  isVkApp: boolean;
  web_version: string;
  experiments: { [key in Experiments]?: string };
}>;

export const VK_IOS = 'vk.iphone';
export const VK_ANDROID = 'vk.android';

export const VK_APP_REFS = [VK_IOS, VK_ANDROID];

export const EMPTY_QUERY_VALUE = 'EMPTY_QUERY_VALUE';

type TAutoPlayMatrix = {
  [key in 'ALWAYS' | 'NEVER' | 'ON' | 'OFF']: Record<TAutoplay | 'EMPTY_QUERY_VALUE', boolean>;
};

export const AUTOPLAY_MATRIX: TAutoPlayMatrix = {
  ['ALWAYS']: {
    ['never']: true,
    ['always']: true,
    '1': true,
    '0': true,
    on: true,
    off: true,
    [EMPTY_QUERY_VALUE]: true,
  },
  ['NEVER']: {
    ['never']: false,
    ['always']: false,
    '1': false,
    '0': false,
    on: false,
    off: false,
    [EMPTY_QUERY_VALUE]: false,
  },
  ['ON']: {
    ['never']: false,
    ['always']: true,
    '1': true,
    '0': false,
    on: true,
    off: false,
    [EMPTY_QUERY_VALUE]: true,
  },
  ['OFF']: {
    ['never']: false,
    ['always']: true,
    '1': true,
    '0': false,
    on: true,
    off: false,
    [EMPTY_QUERY_VALUE]: false,
  },
};

const PARSE_MAP: Record<string, (value?: string) => any> = {
  sign: (value?: string) => value,
  pf: (value?: string) => toNumber(value),
  pt: (value?: string) => toNumber(value),
  userId: (value?: string) => value,
  p2p: (value?: string) => ['1', 'true'].includes(value || ''),
  adult: (value?: string) => (value ? ['1', 'true'].includes(value) : true),
  autoplay: (value?: string) => value?.toLowerCase(),
  trial_available: (value?: string) => !['0', 'false'].includes(value || ''),
  startAt: (value?: string) => {
    const num = toNumber(value);
    return typeof num === 'number' && num >= 0 ? num : null;
  },
  web_version: (value?: string) => value,
  experiments: (value?: string) => {
    try {
      const data = JSON.parse(value || '{}');
      return Object.keys(data).reduce((acc, key) => ({ ...acc, [`${key.toUpperCase()}`]: data[key] }), {});
    } catch (err) {
      return {};
    }
  },
};

export const parseQueryParams = (features: TParsedFeatures): TQueryParams => {
  const queryParams = new URLSearchParams(window?.location?.search || '');

  const params: Record<string, any> = {};
  queryParams.forEach((value, key) => {
    const v = PARSE_MAP[key]?.(value.toLowerCase());
    if (!isNil(v)) params[key] = v;
  });

  const __ref = queryParams.get('__ref');
  if (__ref) params.isVkApp = VK_APP_REFS.some((ref) => ref === __ref);

  const value: TAutoplay = params.autoplay || EMPTY_QUERY_VALUE;
  const autoplay = AUTOPLAY_MATRIX[features.AUTOPLAY || 'ALWAYS']?.[value];
  params.autoplay = autoplay;
  return params;
};
