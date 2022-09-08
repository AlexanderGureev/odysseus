import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const playback = (
  { payload }: PayloadAction<EventPayload>,
  { services: { postMessageService } }: EffectOpts
) => {
  switch (payload.type) {
    case 'CLICK_MENU_ITEM':
      if (payload.meta.title === 'Скорость')
        postMessageService.emit('BI', {
          payload: {
            page: 'player',
            block: 'settings',
            event_name: 'button',
            event_type: 'click',
            event_value: 'playback-speed',
          },
        });
      break;
    case 'SET_PLAYBACK_SPEED':
      const { value } = payload.payload;
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'settings',
          event_name: 'speed_sel',
          event_type: 'click',
          event_value: `${value}`,
        },
      });
      break;
  }
};
