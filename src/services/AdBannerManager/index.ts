/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from 'utils/logger';

import { BannerOptions } from './types';

const AdBannerManager = () => {
  let loadPromise: Promise<boolean> | null = null;
  const bannerPromise: { [key in string]?: Promise<any> } = {};
  const banners: Record<string, any> = {};

  const getContainer = () => {
    const [head] = document.getElementsByTagName('head');
    return head;
  };

  const append = (node: HTMLElement) => {
    const container = getContainer();
    container.appendChild(node);
  };

  const loadCode = () => {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise<boolean>((resolve, reject) => {
      const code = document.createElement('script');
      code.innerHTML = 'window.yaContextCb = window.yaContextCb || []';

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://yandex.ru/ads/system/context.js';
      script.onload = () => {
        logger.log('[AdBannerManager]', 'loadCode success');
        resolve(true);
      };

      script.onerror = () => {
        logger.log('[AdBannerManager]', 'loadCode failure');
        reject(false);
      };

      append(code);
      append(script);
    });

    return loadPromise;
  };

  const replaceParams = (code: string, params: Record<string, any>) => {
    return Object.keys(params).reduce((acc, key) => acc.replace(key, params[key]), code);
  };

  const parse = (code: string) => {
    try {
      const params = JSON.parse(code);
      return params;
    } catch (e) {
      console.error('[AdBannerManager] parseCode error: ', e?.message);
      return null;
    }
  };

  const show = async (
    containerId: string,
    key: string,
    bannerParamsJSON: string,
    options: BannerOptions = {
      bannerStates: ['desktop', 'tablet'],
      adaptiveOptions: {
        tabletWidth: 1280,
        phoneWidth: 768,
        isAutoReloads: false,
      },
    }
  ) => {
    if (bannerPromise[key]) await bannerPromise[key];

    bannerPromise[key] = new Promise<boolean>(async (resolve) => {
      try {
        const w = options?.adaptiveOptions?.phoneWidth || 480;

        if (window.innerWidth < w) throw new Error(`window.innerWidth < ${w}`);

        if (banners[key]) {
          banners[key].show();
          resolve(true);
          return;
        }

        if (!(await loadCode())) throw new Error('code load failed');

        const params = parse(bannerParamsJSON);
        if (!params) throw new Error('banner params is undefined');

        logger.log('[AdBannerManager] params', params);

        window.yaContextCb.push(() => {
          banners[key] = window.Ya.adfoxCode.createAdaptive(
            {
              ownerId: window.ENV.AD_FOX_OWNER_ID,
              containerId,
              params,
              onLoad: function (data: any) {
                logger.log('[AdBannerManager]', 'onLoad: ', data);
              },
              onRender: function () {
                logger.log('[AdBannerManager]', 'onRender');
                resolve(true);
              },
              onError: function (error: any) {
                logger.error('[AdBannerManager]', 'onError', error);
                resolve(false);
              },
              onStub: function () {
                logger.log('[AdBannerManager]', 'onStub');
                resolve(false);
              },
            },
            options.bannerStates,
            options.adaptiveOptions
          );
        });
      } catch (e) {
        console.error('[AdBannerManager] show error: ', e?.message);
        resolve(false);
      }
    });

    return bannerPromise[key];
  };

  const hide = async (key: string) => {
    if (bannerPromise[key]) await bannerPromise[key];
    banners[key]?.hide();
  };

  const dispose = async (key: string) => {
    if (bannerPromise[key]) await bannerPromise[key];
    banners[key]?.destroy();
    banners[key] = null;
    bannerPromise[key] = undefined;
  };

  const isHidden = (key: string): boolean => {
    return Boolean(banners[key]?.isHidden);
  };

  return {
    show,
    hide,
    dispose,
    replaceParams,
    isHidden,
  };
};

const instance = AdBannerManager();
export { instance as AdBannerManager };
