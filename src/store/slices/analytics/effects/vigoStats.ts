import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { QUALITY_MARKS } from 'services/VigoService';
import { EventPayload } from 'store';

export const vigoStats = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { vigoService } }: EffectOpts
) => {
  const {
    quality,
    root: { manifestData },
  } = getState();

  switch (payload.type) {
    case 'START_PLAYBACK':
      if (manifestData?.responseUrl) {
        vigoService.sendStat({ type: 'updateHost', payload: manifestData.responseUrl });
      }
      vigoService.sendStat({ type: 'resumeStats' });
      break;
    case 'TIME_UPDATE':
      if (quality.previousBitrate !== quality.videoMeta.bitrate && quality.currentQualityMark === QUALITY_MARKS.AQ) {
        vigoService.sendStat({ type: 'bitrateChange', payload: quality.currentQualityMark });
      }
      break;
    case 'QUALITY_CHANGE_RESOLVE':
      vigoService.sendStat({ type: 'bitrateChange', payload: quality.currentQualityMark });
      break;
    case 'AD_BREAK_STARTED':
      vigoService.sendStat({ type: 'suspendStats' });
      break;
  }
};
