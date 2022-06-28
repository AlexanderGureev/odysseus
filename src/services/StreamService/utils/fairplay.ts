/* eslint-disable @typescript-eslint/ban-ts-comment */
import { base64DecodeUint8Array, base64EncodeUint8Array, PLAYER_ERROR } from './utils';

const CERTIFICATE_URL = window?.ENV?.FAIRPLAY_CERT_ENDPOINT;

const getContentId = (_src: string, uint8Array: any) => {
  const hashStr = new TextDecoder('utf-8').decode(new Uint8Array(uint8Array));

  // @ts-ignore
  window.hashStr = hashStr;
  // @ts-ignore
  window.uint8Array = uint8Array;
  // eslint-disable-next-line no-control-regex
  const parsed = hashStr.replace(/[\x00-\x1F\x7F-\x9F/]/g, '');
  const sliced = parsed.slice(5);
  return sliced;
};

export const handleFairplaySource = (licenseServerUrl: string) => {
  function getCertificate(emeOptions: any, callback: any) {
    const certificateUrl = CERTIFICATE_URL;

    const handleCertificateLoadError = (ev: any) => {
      // licenseErrorHandler(DRM_TYPE.FAIRPLAY);
      callback(ev);
    };

    const handleCertificateLoadSuccess = (ev: any) => {
      const { response, status } = ev.target;

      if (status !== 200) {
        // licenseErrorHandler(DRM_TYPE.FAIRPLAY);
        callback(PLAYER_ERROR.FETCH_CERTIFICATE);
        return;
      }

      const certificate = new Uint8Array(response);
      callback(null, certificate);
    };

    const request = new XMLHttpRequest();
    request.responseType = 'arraybuffer';

    request.addEventListener('error', handleCertificateLoadError);
    request.addEventListener('load', handleCertificateLoadSuccess);

    request.open('GET', certificateUrl, true);
    request.setRequestHeader('Pragma', 'Cache-Control: no-cache');
    request.setRequestHeader('Cache-Control', 'max-age=0');
    request.send();
  }

  function getLicense(emeOptions: any, contentId: string, keyMessage: any, callback: any) {
    const handleLicenseLoadError = (ev: any) => {
      // licenseErrorHandler(DRM_TYPE.FAIRPLAY);
      callback(ev);
    };

    const handleLicenseLoadSuccess = (ev: any) => {
      const { response, status } = ev.target;

      if (status !== 200) {
        // licenseErrorHandler(DRM_TYPE.FAIRPLAY);
        callback(PLAYER_ERROR.FETCH_LICENSE);
        return;
      }

      const keyText = response.ckc_message;
      const key = base64DecodeUint8Array(keyText);
      callback(null, key);
    };

    const request = new XMLHttpRequest();
    const params = {
      content_id: contentId,
      spc_message: base64EncodeUint8Array(keyMessage),
    };

    request.responseType = 'json';

    request.addEventListener('error', handleLicenseLoadError);
    request.addEventListener('load', handleLicenseLoadSuccess);

    request.open('POST', licenseServerUrl, true);
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify(params));
  }

  return {
    keySystems: {
      'com.apple.fps.1_0': {
        getCertificate,
        getLicense,
        getContentId,
      },
    },
  };
};
