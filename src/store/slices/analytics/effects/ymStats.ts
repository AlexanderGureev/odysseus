import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload, sendEvent } from 'store';
import { getTrackInfo } from 'store/selectors';

let isFullscreenGoalSent = false;

export const ymStats = async (
  { payload }: PayloadAction<EventPayload>,
  { dispatch, getState, services: { postMessageService, ymService } }: EffectOpts
) => {
  const {
    playback,
    root: { meta, session, config, deviceInfo, previews },
    analytics: { isViewSent, isActiveWatchProgress },
  } = getState();

  switch (payload.type) {
    case 'GO_TO_NEXT_TRACK':
      ymService.reachGoal('next_episode');
      break;
    case 'GO_TO_PREV_TRACK':
      ymService.reachGoal('previous_episode');
      break;
    case 'CLICK_PAY_BUTTON':
      ymService.reachGoal('disable_adv');
    case 'CLICK_SUB_BUTTON':
      if (previews) ymService.reachGoal('pay_and_watch'); // TODO возможно нужно отправлять всегда
      ymService.sendEvent('click_subscribe');
      break;
    case 'MENU_SHOWN':
      ymService.reachGoal('menu');
      break;
    case 'TRACK_DESCRIPTION_CLICK':
      const { type } = payload.meta;
      if (type === 'project') ymService.reachGoal('project');
      if (type === 'season') ymService.reachGoal('season');
      break;
    case 'CHANGE_CURRENT_QUALITY':
      ymService.reachGoal('quality');
      break;
    case 'CLICK_MENU_ITEM':
      const { title } = payload.meta;
      if (title === 'Код вставки') ymService.reachGoal('insert');
      if (title === 'Поделиться') ymService.reachGoal('shering_button');
      if (title === 'Горячие клавиши') ymService.reachGoal('hotkeys');
      break;
    case 'ENTER_FULLCREEN':
      if (!isFullscreenGoalSent && !deviceInfo.isMobile) {
        isFullscreenGoalSent = true;
        ymService.reachGoal('fullscreen');
      }
      break;
    case 'DO_PLAY_RESOLVE':
      const { isFirstPlay } = payload.meta;

      if (isFirstPlay) {
        const { project_name, season_name, episode_name } = getTrackInfo(getState());

        ymService.log({
          video_start: {
            project_title: project_name || 'empty',
            season_number: season_name || 'empty',
            episode_number: episode_name || 'empty',
          },
        });

        postMessageService.emit('play', {
          payload: {
            track_id: meta.trackId,
            videosession_id: session.videosession_id,
          },
        });
      }
      break;
    case 'WATCHPOINT':
      if (!isViewSent && payload.payload.value.value === '30sec') {
        const { project_name, season_name, episode_name } = getTrackInfo(getState());

        ymService.log({
          video_30_sec: {
            project_title: project_name || 'empty',
            season_number: season_name || 'empty',
            episode_number: episode_name || 'empty',
          },
        });

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
      if (payload.payload.value === 10 && isActiveWatchProgress) {
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
