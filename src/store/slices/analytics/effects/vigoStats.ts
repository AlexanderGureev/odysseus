/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PayloadAction } from '@reduxjs/toolkit';
import { EffectOpts } from 'interfaces';
import { PLAYER_ID } from 'services/PlayerService/types';
import { QUALITY_MARKS } from 'services/VigoService';
import { EventPayload } from 'store';

export const vigoStats = async (
  { payload }: PayloadAction<EventPayload>,
  { getState, services: { vigoService, playerService } }: EffectOpts
) => {
  const {
    quality,
    root: { manifestData, session, meta },
  } = getState();

  switch (payload.type) {
    case 'START_PLAYBACK':
      const videoNode = document.getElementById(PLAYER_ID) as HTMLVideoElement;

      vigoService.init({
        videoNode,
        sid: session.sid!,
        skinName: meta.skin!,
        qualityMark: quality.currentQualityMark,
        getBitrate: () => {
          const tech = playerService.getTech();
          return tech?.bandwidth || null;
        },
        getBytes: () => {
          const tech = playerService.getTech();
          return tech?.stats?.mediaBytesTransferred || null;
        },
      });

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
    case 'CHANGE_TRACK':
      vigoService.dispose();
      vigoService.sendStat({ type: 'suspendStats' });
      break;
  }
};
