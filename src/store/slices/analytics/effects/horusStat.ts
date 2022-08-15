import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const horusStat = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { horusService } }: EffectOpts
) => {
  const { playback, resumeVideo, buffering, quality } = getState();

  const currentTime = playback.currentTime || 0;

  switch (payload.type) {
    case 'START_PLAYBACK':
      break;
    case 'HEARTBEAT_VIDEO':
      break;
  }
};
