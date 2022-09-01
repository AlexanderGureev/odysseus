import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { AppEvent, EventPayload } from 'store';
import { ERROR_CODES } from 'types/errors';

const EventNameByError: Record<string, (type: AppEvent) => string> = {
  [ERROR_CODES.STORMWALL_GEOBLOCK_ERROR]: (t) => (t === 'RELOAD' ? 'geolocation_reload_error' : 'geolocation_error'),
  [ERROR_CODES.WAF_ERROR]: (t) => (t === 'RELOAD' ? 'unusual_reload_error' : 'unusual_error'),
  [ERROR_CODES.NETWORK_TIMEOUT_ERROR]: (t) => (t === 'RELOAD' ? 'unusual_reload_error' : 'unusual_error'),
};

export const errors = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  switch (payload.type) {
    case 'RELOAD':
    case 'ERROR_SHOWN':
      const { error } = getState().error;
      const name = EventNameByError[`${error?.code}`]?.(payload.type);

      if (name) {
        postMessageService.emit('BI', {
          payload: {
            page: 'player',
            block: 'error',
            event_type: payload.type === 'RELOAD' ? 'click' : 'auto',
            event_name: name,
          },
        });
      }
      break;
  }
};
