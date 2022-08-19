import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload, sendEvent } from 'store';

export const ymStats = async (
  { payload }: PayloadAction<EventPayload>,
  { dispatch, getState, services: { postMessageService } }: EffectOpts
) => {
  const {
    playback,
    root: { meta, session, config },
  } = getState();

  switch (payload.type) {
    case 'DO_PLAY_RESOLVE':
      const { isFirstPlay } = payload.meta;

      if (isFirstPlay) {
        postMessageService.emit('play', {
          payload: {
            track_id: meta.trackId,
            videosession_id: session.videosession_id,
          },
        });
      }
      break;
    case 'WATCHPOINT':
      if (payload.payload.value.value === '30sec') {
        postMessageService.emit('view', {
          payload: {
            track_id: meta.trackId,
            videosession_id: session.videosession_id,
          },
        });

        dispatch(sendEvent({ type: 'SET_ANALYTICS_DATA', payload: { isViewSent: true } }));
      }

      postMessageService.emit('watchpoint', {
        payload: {
          duration: playback.duration,
          sid: session.sid,
          time_cursor: playback.currentTime || 0,
          user_id: config.config.user_id,
          track_id: meta.trackId,
          videosession_id: session.videosession_id,
          value: payload.payload.value.value,
        },
      });
      break;
    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 10) {
        postMessageService.emit('watchprogress', {
          data: {
            track_id: meta.trackId,
            duration: playback.duration,
            project_id: config.config.project_id,
            time_cursor: playback.currentTime || 0,
          },
        });
      }
      break;
  }
};
