import { PayloadAction } from '@reduxjs/toolkit';
import { createProblemList } from 'components/Controls/Menu/Complain';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const errorReports = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  const {
    playback: { currentTime },
    root: {
      meta: { trackId },
      session,
      config,
    },
  } = getState();

  switch (payload.type) {
    case 'SET_OVERLAY':
      const { overlayType } = payload.payload;
      if (overlayType === 'complain') {
        postMessageService.emit('BI', {
          payload: {
            page: 'player',
            block: 'header',
            event_type: 'click',
            event_name: 'error_response',
            project_id: config.config?.project_id,
            track_id: trackId,
            videosession_id: session.videosession_id,
            time_cursor: currentTime || 0,
          },
        });
      }
      break;
    case 'CLICK_REPORT_BUTTON':
      const { other } = payload.meta;

      const res = `${
        createProblemList(payload.meta)
          .reduce((acc, problem) => {
            return (acc += problem.labelText.split(' ').join('_') + '+');
          }, '')
          .slice(0, -1) || '_'
      }?${other || '_'}`;

      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'header',
          event_type: 'click',
          event_name: 'error_response_send',
          project_id: config.config?.project_id,
          track_id: trackId,
          videosession_id: session.videosession_id,
          time_cursor: currentTime || 0,
          event_value: res,
        },
      });
      break;
    case 'CLICK_SEND_REPORT_BUTTON':
      const { email } = payload.meta;
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'header',
          event_type: 'click',
          event_name: 'error_response_ok',
          project_id: config.config?.project_id,
          track_id: trackId,
          videosession_id: session.videosession_id,
          time_cursor: currentTime || 0,
          event_value: email?.value || '_',
        },
      });
      break;
    case 'CLOSING_REPORT_FORM_RESOLVE':
      const { step } = payload.meta;
      postMessageService.emit('BI', {
        payload: {
          page: 'player',
          block: 'header',
          event_type: 'click',
          event_name: 'error_close',
          project_id: config.config?.project_id,
          track_id: trackId,
          videosession_id: session.videosession_id,
          time_cursor: currentTime || 0,
          event_value: step === 'IDLE' ? 'Сообщить_об_ошибке' : 'Спасибо,_мы_всё_проверим',
        },
      });
      break;
  }
};
