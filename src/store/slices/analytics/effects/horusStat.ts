import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { LS_KEY_STREAM, THistoryStreams } from 'services/StreamService/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { EventPayload } from 'store';

export const horusStat = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { horusService, localStorageService } }: EffectOpts
) => {
  const {
    quality,
    playback,
    error: { error },
    visibility,
  } = getState();

  switch (payload.type) {
    case 'RESET_PLAYBACK_RESOLVE':
    case 'PARSE_CONFIG_RESOLVE':
      horusService.routeEvent('HORUS_SESSION_STARTED');
      break;
    case 'START_PLAYBACK':
      horusService.routeEvent('HORUS_AUTO_PLAY');
      break;
    case 'DO_PLAY':
      horusService.routeEvent('HORUS_CLICK_PLAY');
      break;
    case 'DO_PLAY_RESOLVE':
      horusService.routeEvent('HORUS_VIDEO_STARTED');
      break;
    case 'DO_PAUSE':
      horusService.routeEvent('HORUS_CLICK_PAUSE');
      break;
    case 'SET_PLAYING':
      horusService.routeEvent('HORUS_VIDEO_STARTED');
      break;
    case 'AUTO_PAUSE_RESOLVE':
      horusService.routeEvent('HORUS_AUTO_PAUSE');
      break;
    case 'SET_PAUSED':
      const { isEnded } = payload.meta;
      const isHidden = visibility.step === 'HIDDEN';
      horusService.routeEvent(isEnded || isHidden ? 'HORUS_AUTO_PAUSE' : 'HORUS_CLICK_PAUSE');
      break;
    case 'SET_SEEKING':
    case 'SEEK':
      horusService.routeEvent('HORUS_GOTO');
      break;
    case 'CHANGE_CURRENT_QUALITY':
      horusService.routeEvent('HORUS_CHANGE_QUALITY');
      break;
    case 'TIME_UPDATE':
      if (quality.previousBitrate !== quality.videoMeta.bitrate && quality.currentQualityMark === QUALITY_MARKS.AQ) {
        horusService.routeEvent('HORUS_BITRATE_ADOPTION');
      }
      break;
    case 'AUTOSWITCH_NOTIFY_SHOWN':
      horusService.routeEvent('HORUS_AUTO_SWITCH_START');
      break;
    case 'HIDE_AUTOSWITCH_NOTIFY':
      horusService.routeEvent('HORUS_AUTO_SWITCH_CLICK_CANCEL');
      break;
    case 'START_AUTOSWITCH':
      horusService.routeEvent('HORUS_AUTO_SWITCH_CLICK_NEXT_TRACK');
      break;
    case 'GO_TO_NEXT_TRACK':
      horusService.routeEvent('HORUS_AUTO_SWITCH_SWITCH_NEXT_TRACK');
      break;

    case 'BUFFERING_START':
      horusService.routeEvent('HORUS_REBUFFER');
      break;
    case 'BUFFERING_END':
      const { bufferingTime } = payload.payload;

      if (playback.step === 'PLAYING') {
        horusService.routeEvent('HORUS_AUTO_PLAY');
        horusService.routeEvent('HORUS_VIDEO_STARTED');
      }

      if (bufferingTime > 0.16) {
        horusService.routeEvent('HORUS_CUSTOM_EVENT', {
          type: 'rebuffer',
          duration: bufferingTime,
        });
      }
      break;

    case 'AD_CREATIVE_INITIALIZED':
      horusService.routeEvent('HORUS_AD_REQUEST');
      break;
    case 'AD_BLOCK_IMPRESSION':
      horusService.routeEvent('HORUS_AD_SHOW_START');
      break;
    case 'AD_BLOCK_END':
      horusService.routeEvent('HORUS_AD_SHOW_END');
      break;
    case 'AD_BLOCK_ERROR':
      horusService.routeEvent('HORUS_AD_ERROR');
      break;

    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 30) {
        horusService.routeEvent('HEARTBEAT');
      }
      break;

    case 'ERROR_SHOWN':
      const history = localStorageService.getItem<THistoryStreams>(LS_KEY_STREAM) || [];
      const {
        root: { currentStream, manifestData },
      } = getState();

      horusService.routeEvent('HORUS_VIDEO_ERROR', {
        ...error,
        additional: {
          location: window.location.href,
          video_type: playback.step === 'AD_BREAK' ? 'ad' : 'video',
        },
        currentStream: currentStream
          ? {
              ls_url: currentStream.ls_url,
              manifest_expires_at: currentStream.manifest_expires_at,
              url: currentStream.url,
              history,
            }
          : null,
        stream_src: manifestData?.responseUrl || null,
      });
      break;

    case 'BEFORE_UNLOAD':
      horusService.routeEvent('HORUS_SESSION_FINISHED');
      // TODO в сафари ивент может не успеть отправиться (indexeddb transaction aborted)
      horusService.routeEvent('HORUS_CLOSE');
      break;

    case 'CHANGE_TRACK':
      horusService.routeEvent('HORUS_SESSION_FINISHED');
      break;

    case 'VIDEO_END':
      const { beforeAutoswitch } = payload.meta || {};
      if (!beforeAutoswitch) horusService.routeEvent('HORUS_SESSION_FINISHED');
      break;
  }
};
