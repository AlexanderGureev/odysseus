import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { EventPayload } from 'store';

export const adEvents = (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { postMessageService } }: EffectOpts
) => {
  const {
    playback: { currentTime },
    root: { adPoints },
    adBlock: { adPoint, index, limit },
  } = getState();

  switch (payload.type) {
    case 'INIT_AD_BREAK': {
      const { data } = payload.payload;
      postMessageService.emit('ad_manifest', {
        payload: {
          numBreaks: data.limit,
          numExpectedBreaks: data.limit,
          breaksTimeLimit: adPoints.map((p) => p.point),
        },
      });
      break;
    }
    case 'AD_BREAK_STARTED': {
      postMessageService.emit('ad_break_start', {
        payload: {
          category: adPoint.category,
          limit,
          point: adPoint.point,
        },
      });
      break;
    }
    case 'AD_BLOCK_IMPRESSION': {
      postMessageService.emit('adShown', {
        time: currentTime || 0,
      });

      postMessageService.emit('ad_start', {
        payload: {
          category: adPoint.category,
          position: index,
        },
      });
      break;
    }
    case 'AD_BLOCK_VIDEO_QUARTILE': {
      const { value } = payload.payload;
      postMessageService.emit('ad_quartile', {
        payload: {
          value,
        },
      });
      break;
    }
    case 'AD_BLOCK_CLICK': {
      postMessageService.emit('ad_click_thru', {
        payload: {
          category: adPoint.category,
          position: index,
        },
      });
      break;
    }
    case 'DO_SKIP_AD_BLOCK': {
      postMessageService.emit('ad_skip', {
        payload: {
          category: adPoint.category,
          position: index,
        },
      });
      break;
    }
    case 'AD_BLOCK_END': {
      postMessageService.emit('ad_end', {
        payload: {
          category: adPoint.category,
          position: index,
        },
      });
      break;
    }
    case 'AD_BLOCK_ERROR': {
      postMessageService.emit('ad_error', {
        payload: {
          category: adPoint.category,
          position: index,
        },
      });
      break;
    }
    case 'AD_BREAK_END': {
      postMessageService.emit('ad_break_end');
      break;
    }
  }
};
