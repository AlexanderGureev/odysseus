import { PayloadAction } from '@reduxjs/toolkit';
import { qualityOptions } from 'components/Controls/QualityMenu';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const quality = ({ payload }: PayloadAction<EventPayload>, { services: { postMessageService } }: EffectOpts) => {
  switch (payload.type) {
    case 'MENU_SHOWN':
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'default',
          event_type: 'click',
          event_name: 'button',
          event_value: 'settings',
        },
      });
      break;
    case 'QUALITY_MENU_SHOWN':
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'default',
          event_type: 'click',
          event_name: 'button',
          event_value: 'quality',
        },
      });
      break;
    case 'CHANGE_CURRENT_QUALITY':
      const {
        meta: { block },
        payload: { value },
      } = payload;

      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block,
          event_type: 'click',
          event_name: 'quality_sel',
          event_value: qualityOptions[value]?.title || 'unknown',
        },
      });
      break;
    case 'CLICK_MENU_ITEM':
      const { title } = payload.meta;

      if (title === 'Качество') {
        postMessageService.emit('BI', {
          payload: {
            page: 'player',
            block: 'settings',
            event_type: 'click',
            event_name: 'button',
            event_value: 'quality',
          },
        });
      }
      break;
  }
};
