import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';
import { getStatusTrialSelector } from 'store/selectors';

export const adDisableSuggestion = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  const {
    root: { meta, config },
    adDisableSuggestion,
  } = getState();

  if (adDisableSuggestion.step === 'DISABLED') return;

  switch (payload.type) {
    case 'CLICK_CLOSE_AD_DISABLE_SUGGESTION':
      postMessageService.emit('on_close_off_ads_before_preroll_experiment');

      const data = {
        page: 'project',
        block: 't2_avod_popup',
        event_type: 'click',
        event_name: 'button',
        project_id: config.config.project_id,
        track_id: meta.trackId,
      };

      if (payload.meta?.source === 'close-icon') {
        postMessageService.emit('BI', {
          payload: {
            ...data,
            event_value: 'close',
          },
        });
      } else {
        postMessageService.emit('BI', {
          payload: {
            ...data,
            event_value: 'continue',
          },
        });
      }
      break;
    case 'SHOW_AD_DISABLE_SUGGESTION':
      postMessageService.emit('on_open_off_ads_before_preroll_experiment');
      postMessageService.emit('BI', {
        payload: {
          page: 'project',
          block: 'default',
          event_type: 'auto',
          event_name: 'show',
          event_value: 't2_avod_popup',
          project_id: config.config.project_id,
          track_id: meta.trackId,
        },
      });
      break;
    case 'CLICK_SUB_BUTTON':
      const isTrial = getStatusTrialSelector(getState());
      postMessageService.emit('on_close_off_ads_before_preroll_experiment');
      postMessageService.emit('BI', {
        payload: {
          page: 'project',
          block: 't2_avod_popup',
          event_type: 'click',
          event_name: 'button',
          event_value: isTrial ? 'buy_trial' : 'buy_subscription',
          project_id: config.config.project_id,
          track_id: meta.trackId,
        },
      });
      break;
  }
};
