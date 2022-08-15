import { Ya } from 'types/yasdk';

export const YASDK_URL = 'https://an.yandex.ru/system/video-ads-sdk/adsdk.js';

const createSdkLoader = () => {
  let sdk: Ya | null = null;

  return () =>
    new Promise((resolve, reject) => {
      if (sdk) return resolve(sdk);
      const script = document.createElement('script');

      script.setAttribute('src', YASDK_URL);
      script.async = true;

      script.onload = () => {
        if (!window.ya) {
          reject(new Error('Yandex Video Ads SDK - scripts failed to load'));
          return;
        }

        sdk = window.ya;
        resolve(sdk);
      };

      script.onerror = () => reject(new Error('Yandex Video Ads SDK - scripts failed to load'));
      document.head.appendChild(script);
    });
};

const loadYaSdk = createSdkLoader();
export { loadYaSdk };
