import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const demonStat = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { demonService } }: EffectOpts
) => {
  const { playback, resumeVideo, buffering, quality } = getState();

  const currentTime = playback.currentTime || 0;

  const params = {
    bufferTime: buffering.bufferingTime,
    currentTime,
    initialBufferTime: buffering.initialBufferTime,
    playTimeByQuality: quality.qualityStats,
  };

  switch (payload.type) {
    case 'START_PLAYBACK':
      if (Math.floor(resumeVideo.startPosition) === 0) {
        demonService.sendStat(params);
      }
      break;
    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 30) {
        demonService.sendStat(params);
      }
      break;
  }
};
