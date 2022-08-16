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
    case 'START_PLAYBACK':
      const { isFirst } = payload.meta;
      if (isFirst) tnsCounter.sendEvent('video_start');
      tnsCounter.sendTnsHeartBeatStat('play', currentTime);
      break;
    case 'DO_PLAY':
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
    case 'RESET_RESOLVE':
      tnsCounter.sendTnsHeartBeatStat('stop', currentTime);
      tnsCounter.sendEvent('video_end');
      break;
  }
};
