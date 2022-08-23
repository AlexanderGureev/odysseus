import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { ERROR_CODE } from 'services/PostMessageService/types';
import { EventPayload } from 'store';

export const adultNotify = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  switch (payload.type) {
    case 'SHOW_ADULT_NOTIFY':
      postMessageService.emit('error', {
        code: ERROR_CODE.ADULT_CONTENT,
      });
      break;
  }
};
