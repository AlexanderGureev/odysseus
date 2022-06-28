import { PLAYER_ERROR } from './utils';

export const handleWidevineSource = (licenseServerUrl: string) => {
  return {
    keySystems: {
      'com.widevine.alpha': {
        getLicense: (emeOptions: any, keyMessage: any, callback: any) => {
          const handleLicenseLoadError = (ev: any) => {
            // licenseErrorHandler(DRM_TYPE.WIDEVINE); // TODO FIX
            callback(ev);
          };

          const handleLicenseLoadSuccess = (ev: any) => {
            const { response, status } = ev.target;

            if (status !== 200) {
              // licenseErrorHandler(DRM_TYPE.WIDEVINE);
              callback(PLAYER_ERROR.FETCH_LICENSE);
              return;
            }

            callback(null, response);
          };

          const xhr = new XMLHttpRequest();
          xhr.responseType = 'arraybuffer';

          xhr.open('POST', licenseServerUrl, true);
          xhr.send(keyMessage);

          xhr.addEventListener('error', handleLicenseLoadError);
          xhr.addEventListener('load', handleLicenseLoadSuccess);
        },
      },
    },
  };
};
