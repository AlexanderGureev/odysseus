import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const tnsStats = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { tnsCounter } }: EffectOpts
) => {
  const { playback } = getState();
  const currentTime = playback.currentTime || 0;

  switch (payload.type) {
    case 'INIT_SERVICES_RESOLVE':
      tnsCounter.sendEvent('video_load');
      break;
    case 'AD_CREATIVE_INITIALIZED':
      const { tnsInitEvent } = payload.meta;
      if (tnsInitEvent) {
        tnsCounter.sendEvent('load_ad_start');
      }
      break;
    case 'DO_PLAY_RESOLVE':
      const { isFirstPlay } = payload.meta;
      if (isFirstPlay) tnsCounter.sendEvent('video_start');
    case 'SET_PLAYING':
      tnsCounter.sendTnsHeartBeatStat('play', currentTime);
      break;
    case 'SET_PAUSED':
    case 'DO_PAUSE':
      tnsCounter.sendTnsHeartBeatStat('pause', currentTime);
      break;
    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 30) {
        tnsCounter.sendTnsHeartBeatStat('time-update', currentTime);
      }
      break;
    case 'SET_SEEKING':
    case 'SEEK_STARTED':
      tnsCounter.sendTnsHeartBeatStat('jump', currentTime);
      break;
    case 'VIDEO_END':
      tnsCounter.sendTnsHeartBeatStat('stop', currentTime);
      tnsCounter.sendEvent('video_end');
      break;
  }
};
