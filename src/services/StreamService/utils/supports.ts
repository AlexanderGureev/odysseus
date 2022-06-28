const createVideoTag = () => document.createElement('video');

export const nativeHlsSupport = () => {
  const video = createVideoTag();
  if (!video.canPlayType) return false;

  return ['probably', 'maybe'].includes(
    video.canPlayType('application/vnd.apple.mpegURL') || video.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')
  );
};

export const hlsIsSupported = () => {
  const mediaSource = (window.MediaSource = window.MediaSource || window.WebKitMediaSource);
  const sourceBuffer = (window.SourceBuffer = window.SourceBuffer || window.WebKitSourceBuffer);

  const isTypeSupported =
    mediaSource &&
    typeof mediaSource.isTypeSupported === 'function' &&
    mediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');

  // if SourceBuffer is exposed ensure its API is valid
  // safari and old version of Chrome doe not expose SourceBuffer globally so checking SourceBuffer.prototype is impossible
  const sourceBufferValidAPI =
    !sourceBuffer ||
    (sourceBuffer.prototype &&
      typeof sourceBuffer.prototype.appendBuffer === 'function' &&
      typeof sourceBuffer.prototype.remove === 'function');

  return (!!isTypeSupported && !!sourceBufferValidAPI) || nativeHlsSupport();
};

export const isMediaSourceSupported =
  'MediaSource' in window || 'WebKitMediaSource' in window || 'mozMediaSource' in window || 'msMediaSource' in window;

const hasEMESupport = function () {
  return 'MediaKeys' in window || 'WebKitMediaKeys' in window || 'MSMediaKeys' in window;
};

const hasRMKSASupport = function () {
  return 'requestMediaKeySystemAccess' in window.navigator;
};

const config = [
  {
    initDataTypes: ['cenc'],
    audioCapabilities: [
      {
        contentType: 'audio/mp4;codecs="mp4a.40.2"',
      },
    ],
    videoCapabilities: [
      {
        contentType: 'video/mp4;codecs="avc1.42E01E"',
      },
    ],
  },
];

const isMimeCodecSupport = (codecs: string[]) => {
  if (isMediaSourceSupported && codecs.every((c) => MediaSource.isTypeSupported(c))) return true;

  return nativeHlsSupport();
};

export enum KEY_SYSTEMS {
  WIDEVINE = 'com.widevine.alpha',
  PLAYERREADY = 'com.microsoft.playready',
  FAIRPLAY = 'com.apple.fps',
  FPS1 = 'com.apple.fps.1_0',
  FPS2 = 'com.apple.fps.2_0',
  FPS3 = 'com.apple.fps.3_0',
}

const checkEMESupport = async (type: KEY_SYSTEMS) => {
  if (
    !window.navigator ||
    !hasRMKSASupport() ||
    !hasEMESupport() ||
    !isMimeCodecSupport([config[0].audioCapabilities[0].contentType, config[0].videoCapabilities[0].contentType])
  )
    return false;

  try {
    await window.navigator.requestMediaKeySystemAccess(type, config).then((mediaKeySystemAccess) => {
      return mediaKeySystemAccess.createMediaKeys();
    });

    return true;
  } catch (e) {
    return false;
  }
};

async function checkEMELegacySupport() {
  try {
    createVideoTag().webkitSetMediaKeys(new window.WebKitMediaKeys(KEY_SYSTEMS.FPS1));
    return true;
  } catch (error) {
    return false;
  }
}

export type TCapabilities = {
  hls: boolean;
  dash: boolean;
  mss: boolean;
  widevine: boolean;
  fairplay: boolean;
  playready: boolean;
};

type TKey = keyof TCapabilities;

export const getCapabilities = async (): Promise<TKey[]> => {
  const widevine = await checkEMESupport(KEY_SYSTEMS.WIDEVINE);
  const promises = [KEY_SYSTEMS.FAIRPLAY, KEY_SYSTEMS.FPS1, KEY_SYSTEMS.FPS2, KEY_SYSTEMS.FPS3].map(checkEMESupport);
  const fairplay = await Promise.all([...promises, checkEMELegacySupport()]).then((res) => res.includes(true));
  const playready = await checkEMESupport(KEY_SYSTEMS.PLAYERREADY);

  const capabilities: TCapabilities = {
    hls: hlsIsSupported(),
    dash: isMediaSourceSupported,
    mss: isMediaSourceSupported,
    widevine,
    fairplay,
    playready,
  } as const;

  return (Object.keys(capabilities) as TKey[]).filter((k) => capabilities[k]);
};
