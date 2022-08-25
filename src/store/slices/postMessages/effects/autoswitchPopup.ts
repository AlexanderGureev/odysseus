import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';
import { getStatusTrialSelector } from 'store/selectors';

export const autoswitchPopup = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  const {
    root: { session, meta, config },
    autoSwitch,
  } = getState();

  if (autoSwitch.autoswitchNotifyType !== 'avod_popup') return;

  switch (payload.type) {
    case 'HIDE_AUTOSWITCH_NOTIFY':
      if (payload.meta?.source === 'close-icon') {
        postMessageService.emit('on_close_off_ads_experiment');
        postMessageService.emit('BI', {
          payload: {
            page: 'player',
            block: 'nv_avod_popup',
            event_type: 'click',
            event_name: 'button',
            event_value: 'close',
            project_id: config.config.project_id,
            track_id: meta.trackId,
          },
        });
      }
      break;
    case 'CLICK_SUB_BUTTON':
      const isTrial = getStatusTrialSelector(getState());
      postMessageService.emit('on_close_off_ads_experiment');
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'nv_avod_popup',
          event_type: 'click',
          event_name: 'button',
          event_value: isTrial ? 'buy_trial' : 'buy_subscription',
          project_id: config.config.project_id,
          track_id: meta.trackId,
        },
      });
      break;
    case 'START_AUTOSWITCH':
      postMessageService.emit('on_close_off_ads_experiment');
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'nv_avod_popup',
          event_type: 'click',
          event_name: 'button',
          event_value: 'to_project',
          project_id: config.config.project_id,
          track_id: meta.trackId,
        },
      });
      break;
    case 'AUTOSWITCH_NOTIFY_SHOWN': {
      postMessageService.emit('on_open_off_ads_experiment');
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'next_video',
          event_type: 'auto',
          event_name: 'show',
          event_value: 'nv_avod_popup',
          project_id: config.config.project_id,
          track_id: meta.trackId,
          videosession_id: session.videosession_id,
        },
      });
      break;
    }
  }
};
