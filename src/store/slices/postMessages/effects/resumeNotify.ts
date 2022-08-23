import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { ERROR_CODE } from 'services/PostMessageService/types';
import { EventPayload } from 'store';

export const resumeNotify = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  switch (payload.type) {
    case 'SHOW_RESUME_VIDEO_NOTIFY':
      postMessageService.emit('error', {
        code: ERROR_CODE.RESUME_NOTIFY,
      });
      break;
    case 'RESUME_VIDEO_NOTIFY_RESOLVE':
    case 'RESUME_VIDEO_NOTIFY_REJECT':
      const {
        root: {
          config: { trackInfo },
          meta: { trackId },
        },
      } = getState();

      const data = {
        page: 'player',
        block: 'default',
        event_type: 'click',
        event_name: 'continue_watching_question',
        project_id: trackInfo?.project?.id,
        track_id: trackId,
      };

      postMessageService.emit('BI', {
        payload: {
          ...data,
          answer: payload.type === 'RESUME_VIDEO_NOTIFY_RESOLVE' ? 'continue' : 'start',
        },
      });
      break;
  }
};
