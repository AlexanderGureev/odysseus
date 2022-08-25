import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { OutputEvents } from 'services/PostMessageService/types';
import { EventPayload } from 'store';

export const trialSuggestion = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  switch (payload.type) {
    case 'CLICK_PAY_BUTTON_TRIAL_NOTICE':
    case 'CLICK_CLOSE_TRIAL_NOTICE':
    case 'TRIAL_NOTICE_SHOWN':
    case 'AUTO_CLOSE_TRIAL_NOTICE':
      const {
        playback,
        root: { session },
        trialSuggestion: { notifyType },
      } = getState();

      const mapEvent: { [key in EventPayload['type']]?: keyof OutputEvents } = {
        CLICK_PAY_BUTTON_TRIAL_NOTICE: 'on_click_bt_turnoff_adv_at_trial_suggestion',
        CLICK_CLOSE_TRIAL_NOTICE: 'on_click_bt_close_trial_suggestion',
        TRIAL_NOTICE_SHOWN: 'on_show_trial_suggestion',
        AUTO_CLOSE_TRIAL_NOTICE: 'timeout_close_suggestion',
      };

      const event = mapEvent[payload.type];

      if (event && notifyType) {
        const data = {
          time_cursor: playback.currentTime || 0,
          videosession_id: session.videosession_id,
          triggerType: notifyType,
        };

        postMessageService.emit(event, {
          payload: data,
        });
      }
      break;
  }
};
