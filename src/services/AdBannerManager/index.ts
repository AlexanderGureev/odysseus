import { logger } from 'utils/logger';

type TOptions = {
  bannerStates: Array<'desktop' | 'tablet' | 'phone'>;
  adaptiveOptions: Partial<{
    tabletWidth: number;
    phoneWidth: number;
    isAutoReloads: boolean;
  }>;
};

const AdBannerManager = () => {
  let promise: Promise<boolean> | null = null;
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
    if (promise) return promise;

    promise = new Promise<boolean>((resolve, reject) => {
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

    return promise;
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

  const show = (
    containerId: string,
    key: string,
    bannerParamsJSON: string,
    options: TOptions = {
      bannerStates: ['desktop', 'tablet'],
      adaptiveOptions: {
        tabletWidth: 1280,
        phoneWidth: 768,
        isAutoReloads: false,
      },
    }
  ) =>
    new Promise<boolean>(async (resolve) => {
      try {
        const w = options?.adaptiveOptions?.phoneWidth || 480;

        if (window.innerWidth < w) {
          resolve(false);
          return;
        }

        if (banners[key]) {
          banners[key].show();
          resolve(true);
          return;
        }

        if (!(await loadCode())) return;

        const params = parse(bannerParamsJSON);
        if (!params) return;

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
      }
    });

  const hide = (key: string) => {
    banners[key]?.hide();
  };

  const dispose = (key: string) => {
    banners[key]?.destroy();
    banners[key] = null;
  };

  const isHidden = (key: string): boolean => {
    return Boolean(banners[key]?.isHidden);
  };

  return { show, hide, replaceParams, isHidden, dispose };
};

const instance = AdBannerManager();
export { instance as AdBannerManager };
