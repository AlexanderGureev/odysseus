import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { QUALITY_MARKS } from 'services/VigoService';
import { EventPayload } from 'store';
import { AdCategory } from 'types/ad';

export const youboraStats = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { horusService, localStorageService } }: EffectOpts
) => {
  const {
    adController,
    quality,
    playback,
    error: { error },
  } = getState();

  switch (payload.type) {
    case 'PARSE_CONFIG_RESOLVE':
      break;
    case 'START_PLAYBACK':
      break;
    case 'DO_PLAY':
      break;
    case 'DO_PLAY_RESOLVE':
      break;
    case 'DO_PAUSE':
      break;
    case 'SET_PLAYING':
      break;
    case 'SET_PAUSED':
      break;
    case 'SET_SEEKING':
    case 'SEEK':
      break;
    case 'CHANGE_CURRENT_QUALITY':
      break;
    case 'TIME_UPDATE':
      if (quality.previousBitrate !== quality.videoMeta.bitrate && quality.currentQualityMark === QUALITY_MARKS.AQ) {
      }
      break;
    case 'AUTOSWITCH_NOTIFY_SHOWN':
      break;
    case 'HIDE_AUTOSWITCH_NOTIFY':
      break;
    case 'START_AUTOSWITCH':
      break;
    case 'GO_TO_NEXT_TRACK':
      break;

    case 'BUFFERING_START':
      break;
    case 'BUFFERING_END':
      const { bufferingTime } = payload.payload;

      if (playback.step === 'PLAYING') {
      }

      if (bufferingTime > 0.16) {
      }
      break;

    case 'AD_CREATIVE_INITIALIZED':
      break;
    case 'AD_BREAK_STARTED':
      if (adController.point?.point === 0 && adController.point?.category === AdCategory.PRE_ROLL) return;

      break;
    case 'AD_BLOCK_IMPRESSION':
      break;
    case 'AD_BLOCK_END':
      break;
    case 'AD_BLOCK_ERROR':
      break;

    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 30) {
      }
      break;

    case 'ERROR_SHOWN':
      break;

    case 'BEFORE_UNLOAD':
      break;

    case 'CHANGE_TRACK':
    case 'RESET_RESOLVE':
      break;
  }
};
