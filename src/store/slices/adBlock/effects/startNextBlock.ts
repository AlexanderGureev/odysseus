import { VIDEO_TYPE } from 'components/Player/types';
import { EffectOpts } from 'interfaces';
import { createFakeSource } from 'services/StreamService/utils';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const startNextBlock = async ({
  getState,
  dispatch,
  services: { adService, playerService, vigoService },
}: EffectOpts) => {
  const { point, index } = getState().adBlock;
  const currentBlock = adService.getBlock(point, index);
  let error = null;

  try {
    await currentBlock.preload();
    dispatch(
      sendEvent({
        type: 'AD_BREAK_STARTED',
      })
    );

    currentBlock
      .on('AdStarted', () => {
        console.log('[TEST] AdStarted');

        dispatch(
          sendEvent({
            type: 'PLAY_AD_BLOCK_RESOLVE',
          })
        );

        const { step } = getState().visibility;
        if (step === 'HIDDEN') {
          dispatch(
            sendEvent({
              type: 'DO_PAUSE_AD_BLOCK',
            })
          );
        }
      })
      .on('AdPlay', () => {
        dispatch(
          sendEvent({
            type: 'DO_PLAY_AD_BLOCK',
          })
        );
      })
      .on('AdPause', () => {
        dispatch(
          sendEvent({
            type: 'DO_PAUSE_AD_BLOCK',
          })
        );
      })
      .on('AdVolumeAvailabilityStateChange', (value) => {
        console.log('[TEST] AdVolumeAvailabilityStateChange', { value });
      })
      .on('AdPodImpression', () => {
        const isVolumeAvailable = currentBlock.getAdVolumeAvailability();

        // const { volume } = getState().volume;
        // currentBlock.setVolume(volume);

        console.log('[TEST] AdPodImpression', { isVolumeAvailable, volume: currentBlock.getVolume() });

        dispatch(
          sendEvent({
            type: 'AD_STATE_CHANGE',
            payload: {
              isVolumeAvailable,
            },
          })
        );
      })
      .on('AdVolumeChange', ({ volume }) => {
        console.log('[TEST] AdVolumeChange', volume);

        dispatch(
          sendEvent({
            type: 'AD_BLOCK_VOLUME_CHANGE',
            meta: { value: volume },
          })
        );
      })
      .on('AdRemainingTimeChange', (payload) => {
        dispatch(
          sendEvent({
            type: 'AD_BLOCK_TIME_UPDATE',
            payload,
          })
        );
      })
      .on('AdSkippableStateChange', (payload) => {
        dispatch(
          sendEvent({
            type: 'AD_STATE_CHANGE',
            payload,
          })
        );
      });

    vigoService.sendStat({ type: 'suspendStats' });

    await playerService.setSource(createFakeSource(), VIDEO_TYPE.FAKE_VIDEO);
    await currentBlock.play();
  } catch (err) {
    logger.error('[ad play pending]', { index }, err?.message);
    error = err?.message;
  } finally {
    dispatch(
      sendEvent({
        type: 'AD_BLOCK_END',
        payload: {
          links: currentBlock.getLinks(),
          isExclusive: index === 0 && currentBlock.isExclusive(),
          isPromo: currentBlock.isPromo,
        },
        meta: {
          error,
        },
      })
    );
  }
};
