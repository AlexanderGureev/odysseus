export type PlaybackParameters = {
  bufferFullTimeout?: number;
  videoTimeout?: number;
  vpaidTimeout?: number;
  pauseOnClickThrough?: boolean;
  skipDelay?: number;
  title?: string;
  controlsSettings?: {
    controlsVisibility?:
      | Partial<{
          mute: boolean;
          skip: boolean;
          title: boolean;
          adLabel: boolean;
          timeline: boolean;
          loader: boolean;
          timeLeft: boolean;
        }>
      | boolean;
  };
};

export type VideoPlayingState = 'pause' | 'play';

export type AdPlaybackControllerEvent =
  | 'AdClickThru'
  | 'AdPlayingStateChange'
  | 'AdPodClose'
  | 'AdPodComplete'
  | 'AdPodError'
  | 'AdPodImpression'
  | 'AdPodSkipped'
  | 'AdPodStarted'
  | 'AdPodStopped'
  | 'AdPodVideoFirstQuartile'
  | 'AdPodVideoMidpoint'
  | 'AdPodVideoThirdQuartile'
  | 'AdRemainingTimeChange'
  | 'AdSkippableStateChange'
  | 'AdStarted'
  | 'AdStopped'
  | 'AdVolumeAvailabilityStateChange'
  | 'AdVolumeChange'
  | 'AllAdPodVideoComplete';

export type AdPlaybackControllerCallback = (data: Record<string, any>) => void;
export type AdPlaybackController = {
  getAdPlayingState(): VideoPlayingState;
  getAdSkippableState(): boolean;
  pauseAd(): void;
  playAd(): void;
  resumeAd(): void;
  skipAd(): void;
  stopAd(): void;
  subscribe(event: AdPlaybackControllerEvent, handler: AdPlaybackControllerCallback): void;
  getAdVolume(): number;
  setAdVolume(v: number): void;
  getAdVolumeAvailabilityState(): boolean;
  getAdDuration(): number;
  getAdRemainingTime(): number;
};

export type VastTree = { xmlString: string; children: VastTree[] };
export type PreloadParams = Record<string, any>;
export type AdViewer = {
  createPlaybackController(
    videoSlot: HTMLVideoElement,
    slot: HTMLElement,
    playbackParameters?: PlaybackParameters
  ): AdPlaybackController;
  destroy(): void;
  getNonYandexVastXmlTree(): VastTree;
  preload(preloadParams?: PreloadParams): Promise<void>;
  showAd(videoSlot: HTMLVideoElement, slot: HTMLElement): Promise<void>;
  hasYandexCreative(): boolean;
};
export type AdLoader = {
  loadAd(): Promise<AdViewer>;
};

export type TAdFoxParameters = {
  ownerId: string;
  params: Record<string, string>;
};

export type AdBreakType = 'preroll' | 'midroll' | 'overlay' | 'postroll';

export type AdConfig = {
  category?: number;
  desiredBitrate?: number;
  partnerId?: number;
  showGuiForVpaid?: boolean;
  vastUrl?: string;
  adBreakType?: AdBreakType;
  adFoxParameters?: TAdFoxParameters;
};

export type LoadedModuleApi = {
  create(adConfig: AdConfig): Promise<AdLoader>;
};

export type AdErrorCode =
  | 'NO_AD_SECTION'
  | 'INPAGE_CONTAINER_ELEMENT_NOT_SUPPORTS_SHADOW'
  | 'VIDEO_PLAY_REJECTED'
  | 'VPAID_METHOD_CALL_ERROR'
  | 'YANDEX_VPAID_FRIENDLY_IFRAME_SECURITY_POLICY_VIOLATION'
  | 'YANDEX_BAD_PARTNER_OR_DOMAIN_FOR_VAST_REQUEST'
  | 'BAD_PARTNER_OR_DOMAIN_FOR_VAST_REQUEST'
  | 'SLOT_SMALL_SIZE'
  | 'VPAID_START_TIMEOUT'
  | 'VPAIDPlayingError'
  | 'VMAP_LOAD_TIMEOUT'
  | 'YANDEX_VPAID_METHOD_CALL_ERROR'
  | 'VMAP_LOAD_ERRORVMAP_LOAD_ERROR'
  | 'MEDIA_ERR_SRC_NOT_SUPPORTED'
  | 'AD_VIEWER_PLAYING_PREVENTED'
  | 'INPAGE_CONTAINER_ZERO_WIDTH'
  | 'VPAIDLoadingError'
  | 'BUFFER_FULL_TIMEOUT'
  | 'WRAPPER_LOAD_TIMEOUT'
  | 'MEDIA_ERR_DECODE_ON_START'
  | 'WRAPPER_LOAD_ERROR'
  | 'INVALID_VMAP_RESPONSE_STATUS'
  | 'YANDEX_VAST_LOAD_TIMEOUT'
  | 'CANNOT_SHOW_CPC_CONTROLS'
  | 'VMAP_CONFIG_WITHOUT_PARTNER_ID'
  | 'BUFFER_EMPTY_LIMIT'
  | 'YANDEX_WRAPPER_LOAD_ERROR'
  | 'YANDEX_WRAPPER_LOAD_TIMEOUT'
  | 'VIDEO_TIMEOUT'
  | 'YANDEX_NO_GET_VPAID_AD_FUNC'
  | 'WRAPPER_OR_VIDEO_NODE_NOT_IN_DOM'
  | 'YANDEX_WRAPPER_MAX_COUNT_LIMIT'
  | 'YANDEX_VPAID_FRIENDLY_IFRAME_UNHANDLED_GLOBAL_ERROR'
  | 'MSE_VIDEO_ATTACH_FAIL'
  | 'PUBLIC_CONTROLLER_PLAY_ERROR';

export type VideoAdError = {
  code: AdErrorCode;
  message: string;
};

export type LoadedModule<T extends string> = Record<T, LoadedModuleApi>;
export type VideoAd = {
  loadModule<T extends 'AdLoader'>(module: T): Promise<LoadedModule<T>>;
};

export type Ya = {
  videoAd: VideoAd;
};
