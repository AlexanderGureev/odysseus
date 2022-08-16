import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { AMBERDATA_BUFFERING_THRESHOLD, AmberdataEventValue, mapAmberDataError } from 'services/AmberdataService/types';
import { EventPayload } from 'store';
import { Nullable } from 'types';

let timer: Nullable<NodeJS.Timeout> = null;

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

export const amberdataStats = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { amberdataService } }: EffectOpts
) => {
  const {
    playback,
    error: { error },
    adController,
  } = getState();

  const currentTime = playback.currentTime || 0;

  switch (payload.type) {
    case 'ADULT_NOTIFY_REJECT':
      amberdataService.sendAmberdataStat({
        eventType: 'crash',
        eventPosition: 0,
        eventManual: 0,
        eventValue: AmberdataEventValue.ERROR.AGE,
      });
      break;
    case 'PAYWALL_SHOWN':
      amberdataService.sendAmberdataStat({
        eventType: 'crash',
        eventPosition: 0,
        eventManual: 0,
        eventValue: AmberdataEventValue.ERROR.ONLY_SUBSCRIPTION,
      });
      break;
    case 'START_PLAYBACK':
      amberdataService.sendAmberdataStat({
        eventType: 'play',
        eventPosition: currentTime,
        eventManual: 0,
      });
      break;
    case 'DO_PLAY':
      amberdataService.sendAmberdataStat({
        eventType: 'play',
        eventPosition: currentTime,
        eventManual: 1,
      });
      break;
    case 'DO_PAUSE':
      amberdataService.sendAmberdataStat({
        eventType: 'pause',
        eventPosition: currentTime,
        eventManual: 1,
      });
      break;
    case 'SET_PLAYING':
      amberdataService.sendAmberdataStat({
        eventType: 'play',
        eventPosition: currentTime,
        eventManual: 0,
      });
      break;
    case 'SET_PAUSED':
      amberdataService.sendAmberdataStat({
        eventType: 'pause',
        eventPosition: currentTime,
        eventManual: 0,
      });
      break;
    case 'HEARTBEAT_VIDEO':
      if (payload.payload.value === 30) {
        amberdataService.sendAmberdataStat({
          eventType: 'ping',
          eventPosition: currentTime,
          eventManual: 0,
        });
      }
      break;
    case 'SET_SEEKING':
      amberdataService.sendAmberdataStat({
        eventType: 'move',
        eventPosition: currentTime,
        eventManual: 1,
      });
      break;
    case 'SEEK_STARTED':
      amberdataService.sendAmberdataStat({
        eventType: 'move',
        eventPosition: payload.meta.from,
        eventManual: 1,
      });
      break;

    case 'BUFFERING_START':
      timer = setTimeout(() => {
        if (getState().buffering.step !== 'BUFFERING') return;

        amberdataService.sendAmberdataStat({
          eventType: 'buffering',
          eventPosition: currentTime,
          eventManual: 0,
        });
      }, AMBERDATA_BUFFERING_THRESHOLD);
      break;
    case 'BUFFERING_END':
      clearTimer();
      break;
    case 'RESET_RESOLVE':
      amberdataService.sendAmberdataStat({
        eventType: 'stop',
        eventPosition: currentTime,
        eventManual: 0,
      });
      break;
    case 'GO_TO_NEXT_TRACK':
      const manual = payload.meta?.auto ? 0 : 1;
      amberdataService.sendAmberdataStat({
        eventType: 'next',
        eventPosition: currentTime,
        eventManual: manual,
      });
      break;
    case 'GO_TO_PREV_TRACK':
      amberdataService.sendAmberdataStat({
        eventType: 'prev',
        eventPosition: currentTime,
        eventManual: 1,
      });
      break;
    case 'ERROR_SHOWN':
      amberdataService.sendAmberdataStat({
        eventType: 'crash',
        eventPosition: currentTime,
        eventManual: 0,
        eventValue: error?.title ? mapAmberDataError[error.title] : null,
      });
      break;
    case 'BEFORE_UNLOAD':
      amberdataService.sendAmberdataStat({
        eventType: 'close',
        eventPosition: currentTime,
        eventManual: 1,
      });
      break;
    case 'AD_BREAK_STARTED':
      amberdataService.sendAmberdataStat({
        eventType: 'adstart',
        eventPosition: currentTime,
        eventManual: 0,
        eventValue: adController.point?.point === 180 ? 'sponsorshiproll' : adController.point?.category,
      });
      break;
  }
};
