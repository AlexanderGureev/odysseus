import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { NOTIFY_TYPES } from 'services/PostMessageService/types';
import { EventPayload } from 'store';
import { getPlaylistItem } from 'store/selectors';
import { TLinkedTracks } from 'types';

export const baseEvents = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  const {
    playback,
    root: { session, meta, adConfig, config },
    analytics: { hacks_detected },
    error: { error },
  } = getState();

  switch (payload.type) {
    case 'DO_INIT':
      postMessageService.emit('loaded');
      break;
    case 'PARSE_CONFIG_RESOLVE':
      postMessageService.emit('inited', {
        payload: {
          adv: Boolean(adConfig && !hacks_detected.includes('adblock')),
          tracks: config.playlist?.items?.[0]?.linked_tracks || null,
        },
      });

      break;
    case 'PLAYER_INIT_RESOLVE':
      postMessageService.emit('inited-player');
      break;
    case 'AD_INIT':
      postMessageService.emit('launch-player');
      break;

    case 'AUTO_PAUSE_RESOLVE':
    case 'DO_PAUSE':
    case 'SET_PAUSED':
      postMessageService.emit('paused', {
        time: playback.currentTime || 0,
      });
      break;
    case 'DO_PLAY_RESOLVE':
      const { isFirstPlay } = payload.meta;

      if (isFirstPlay) {
        postMessageService.emit('playerStarted');
        postMessageService.emit('video-started');
      }
    case 'SET_PLAYING':
      postMessageService.emit('started', {
        time: playback.currentTime || 0,
      });
      break;
    case 'SEEK_STARTED':
      const { from, to } = payload.meta;
      postMessageService.emit('rewound', {
        time: to,
        previousTime: from,
      });
      break;
    case 'INC_SEEK':
    case 'DEC_SEEK':
      postMessageService.emit('time_roll', {
        payload: {
          event_value: payload.type === 'INC_SEEK' ? '+30' : '-15',
          time_cursor: playback.currentTime || 0,
          track_id: meta.trackId,
          videosession_id: session.videosession_id,
          project_id: config.config?.project_id,
        },
      });
      break;

    case 'DO_PLAY':
    case 'DO_PAUSE':
      postMessageService.emit('play_btn_click', {
        payload: {
          btn_type: payload.type === 'DO_PLAY' ? 'play' : 'pause',
        },
      });
      break;
    case 'SET_VOLUME':
      const { value } = payload.payload;
      postMessageService.emit('volume', {
        payload: {
          volume: Number(value.toFixed(2)),
        },
      });
      break;
    case 'ENTER_FULLCREEN_RESOLVE':
      postMessageService.emit('enter-full-screen');
      break;
    case 'EXIT_FULLCREEN_RESOLVE':
      postMessageService.emit('exit-full-screen');
      break;
    case 'VIDEO_END':
      postMessageService.emit('ended', { time: playback.currentTime || 0 });
      break;

    case 'PAYWALL_SHOWN':
      postMessageService.emit('notify', {
        code: NOTIFY_TYPES.PAYWALL_ON_START,
      });
      break;
    case 'CLICK_PAY_BUTTON':
      postMessageService.emit('button_disable_ad');
    case 'CLICK_SUB_BUTTON':
      postMessageService.emit('pay_and_watch_button', {
        payload: {
          time_cursor: playback.currentTime || 0,
          btn_type: undefined,
        },
      });
      break;

    case 'GO_TO_NEXT_TRACK':
    case 'GO_TO_PREV_TRACK': {
      const type = payload.type === 'GO_TO_PREV_TRACK' ? 'previous' : 'next';
      const { linked_tracks, project_id } = getPlaylistItem(getState()) || {};
      const data = linked_tracks?.[`${type as keyof TLinkedTracks}`];
      if (!data) return;

      const { auto = false, overlay = false } = payload.meta || {};

      postMessageService.emit('new_track', {
        payload: {
          auto,
          overlay,
          project_id,
          target: type === 'previous' ? 'prev' : 'next',
          time_cursor: playback.currentTime || 0,
          track_id: meta.trackId,
          videosession_id: session.videosession_id,
          trackDescription: {
            ...data,
          },
        },
      });
      break;
    }
    case 'HIDE_AUTOSWITCH_NOTIFY':
    case 'AUTOSWITCH_NOTIFY_SHOWN': {
      const type = payload.type === 'HIDE_AUTOSWITCH_NOTIFY' ? 'switch_cancel' : 'auto_switch';
      const { linked_tracks, project_id } = getPlaylistItem(getState()) || {};
      const data = linked_tracks?.next;
      if (!data) return;

      postMessageService.emit(type, {
        payload: {
          projectId: project_id,
          time_cursor: playback.currentTime || 0,
          trackId: meta.trackId,
          videosession_id: session.videosession_id,
          trackDescription: {
            ...data,
          },
        },
      });
      break;
    }
    case 'ERROR_SHOWN':
      if (error) {
        postMessageService.emit('error', {
          payload: {
            code: error.code,
            type: error.title,
            track_id: meta.trackId,
          },
        });
      }
      break;
  }
};
