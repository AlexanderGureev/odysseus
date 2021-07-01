import { useMemo } from 'react';
import { toNum, isNil } from '../utils';
import { useFeatures } from './useFeatures';

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

const PARSE_MAP: Record<string, (value?: string) => string | number | boolean | undefined | null> = {
  sign: (value?: string) => value,
  pf: (value?: string) => toNum(value) ?? null,
  pt: (value?: string) => toNum(value) ?? null,
  userId: (value?: string) => value,
  p2p: (value?: string) => ['1', 'true'].includes(value || ''),
  adult: (value?: string) => (value ? ['1', 'true'].includes(value) : true),
  autoplay: (value?: string) => value?.toLowerCase(),
  trial_available: (value?: string) => ['1', 'true'].includes(value || ''),
  startAt: (value?: string) => toNum(value) ?? null,
};

export const useQueryParams = (): TQueryParams => {
  const { AUTOPLAY = 'ON' } = useFeatures();

  return useMemo(() => {
    const queryParams = new URLSearchParams(window?.location?.search || '');

    const params: Record<string, any> = {};
    queryParams.forEach((value, key) => {
      const v = PARSE_MAP[key]?.(value.toLowerCase());
      if (!isNil(v)) params[key] = v;
    });

    const __ref = queryParams.get('__ref');
    if (__ref) params.isVkApp = VK_APP_REFS.some((ref) => ref === __ref);

    const value: TAutoplay = params.autoplay || EMPTY_QUERY_VALUE;
    const autoplay = AUTOPLAY_MATRIX[AUTOPLAY]?.[value];
    params.autoplay = autoplay;
    return params;
  }, [AUTOPLAY]);
};
