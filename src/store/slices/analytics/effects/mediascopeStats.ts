import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { VIDEO_TYPE } from 'services/PlayerService/types';
import { EventPayload } from 'store';

export const mediascopeStats = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { mediascopeCounter } }: EffectOpts
) => {
  const {
    adBlock,
    playback,
    root: {
      meta: { trackId, skin },
      config,
    },
  } = getState();

  const currentTime = playback.currentTime || 0;
  const adTime = adBlock.currentTime || 0;

  const eventParams = {
    currentTime,
    trackId: skin === 'MORE_TV' ? config?.trackInfo?.track.morpheusId : trackId,
    userId: config?.config?.user_id,
  };

  switch (payload.type) {
    case 'DO_PLAY_RESOLVE':
    case 'SET_PLAYING':
      mediascopeCounter.sendEvent('VIDEO_START', {
        ...eventParams,
        videoType: VIDEO_TYPE.PLAIN,
      });
      break;
    case 'AUTO_PAUSE_RESOLVE':
    case 'SET_PAUSED':
    case 'DO_PAUSE':
      mediascopeCounter.sendEvent('VIDEO_PAUSE', {
        ...eventParams,
        videoType: VIDEO_TYPE.PLAIN,
      });
      break;
    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 30) {
        mediascopeCounter.sendEvent('HEARTBEAT', {
          ...eventParams,
          videoType: VIDEO_TYPE.PLAIN,
        });
      }
      break;
    case 'SET_SEEKING':
      mediascopeCounter.sendEvent('VIDEO_END', {
        ...eventParams,
        currentTime,
        videoType: VIDEO_TYPE.PLAIN,
      });
      break;
    case 'SEEK_STARTED':
      const { from } = payload.meta;
      mediascopeCounter.sendEvent('VIDEO_END', {
        ...eventParams,
        currentTime: from,
        videoType: VIDEO_TYPE.PLAIN,
      });
      break;
    case 'SEEK_END':
      mediascopeCounter.sendEvent('VIDEO_START', {
        ...eventParams,
        videoType: VIDEO_TYPE.PLAIN,
      });
      break;

    case 'VIDEO_END':
      const { beforeAutoswitch } = payload.meta || {};
      if (!beforeAutoswitch) {
        mediascopeCounter.sendEvent('VIDEO_END', {
          ...eventParams,
          videoType: VIDEO_TYPE.PLAIN,
        });
      }
      break;
    case 'GO_TO_PREV_TRACK':
    case 'GO_TO_NEXT_TRACK':
      mediascopeCounter.sendEvent('VIDEO_END', {
        ...eventParams,
        videoType: VIDEO_TYPE.PLAIN,
      });
      break;

    case 'HEARTBEAT_AD':
      if (payload.payload.value === 30) {
        mediascopeCounter.sendEvent('HEARTBEAT', {
          ...eventParams,
          currentTime: adTime,
          videoType: VIDEO_TYPE.AD,
        });
      }
      break;
    case 'PLAY_AD_BLOCK_RESOLVE':
      mediascopeCounter.sendEvent('VIDEO_START', {
        ...eventParams,
        currentTime: adTime,
        videoType: VIDEO_TYPE.AD,
      });
      break;
    case 'PAUSE_AD_BLOCK_RESOLVE':
      mediascopeCounter.sendEvent('VIDEO_PAUSE', {
        ...eventParams,
        currentTime: adTime,
        videoType: VIDEO_TYPE.AD,
      });
      break;
    case 'AD_BLOCK_END':
      mediascopeCounter.sendEvent('VIDEO_END', {
        ...eventParams,
        currentTime: adTime,
        videoType: VIDEO_TYPE.AD,
      });
      break;
  }
};
