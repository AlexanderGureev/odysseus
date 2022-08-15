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
    case 'START_PLAYBACK':
      const { isFirst } = payload.meta;
      if (isFirst) tnsCounter.sendEvent('video_start');

      console.log('[TEST] START_PLAYBACK', { isFirst: isFirst });
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
    case 'SEEK_STARTED':
      tnsCounter.sendTnsHeartBeatStat('jump', currentTime);
      break;
    case 'RESET_RESOLVE':
      tnsCounter.sendTnsHeartBeatStat('stop', currentTime);
      tnsCounter.sendEvent('video_end');
      break;
  }
};
