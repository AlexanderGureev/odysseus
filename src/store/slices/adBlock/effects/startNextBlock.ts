import { EffectOpts } from 'interfaces';
import { VIDEO_TYPE } from 'services/PlayerService/types';
import { createFakeSource } from 'services/StreamService/utils';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';
import { sleep } from 'utils/retryUtils';

// в течение этого времени идет синхрозиация звука для рекламы, пользовательские действия игнорируются
// таймаут нужен, т.к мы не можем отличить пользовательское действие от автоматического со стороны креатива
const DEFAULT_SYNC_TIMEOUT = 2000;

export const startNextBlock = async ({ getState, dispatch, services: { adService, playerService } }: EffectOpts) => {
  const {
    adBlock: { point, index },
    adController: { isStarted },
  } = getState();

  const currentBlock = adService.getBlock(point, index);
  let error = null;
  let isSyncPhase = true;
  let isSynced = false;

  try {
    await currentBlock.preload();
    if (!isStarted) {
      dispatch(
        sendEvent({
          type: 'AD_BREAK_STARTED',
        })
      );
    }

    dispatch(
      sendEvent({
        type: 'SET_ADFOX_PARAMS',
        payload: {
          adFoxParams: currentBlock.getAdFoxParams(),
        },
      })
    );

    currentBlock
      .on('AdStarted', () => {
        sleep(DEFAULT_SYNC_TIMEOUT).then(() => {
          isSyncPhase = false;
        });

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
      .on('AdClickThru', () => {
        dispatch(
          sendEvent({
            type: 'AD_BLOCK_CLICK',
          })
        );
      })
      .on('AdPodVideoQuartile', (quartile: number) => {
        dispatch(
          sendEvent({
            type: 'AD_BLOCK_VIDEO_QUARTILE',
            payload: {
              value: quartile,
            },
          })
        );
      })
      .on('AdVolumeAvailabilityStateChange', (value) => {
        return;
      })
      .on('AdPodImpression', () => {
        const isVolumeAvailable = currentBlock.getAdVolumeAvailability();

        dispatch(
          sendEvent({
            type: 'AD_BLOCK_IMPRESSION',
          })
        );

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
        console.log('[TEST] AdVolumeChange', { isSyncPhase, isSynced, volume });

        // некоторая реклама при старте включает или выключает звук независимо от состояния звук в видеотеге
        // если в течение 2сек yasdk присылает ивент изменения звука, то мы считает, что это автоивент
        // и пытаемся принудительно синхронизировать звук видео и рекламы

        // 1) есть реклама которая после нашего синка опять выставляет звук в 0 (группа ПИК adriver)
        // 2) есть реклама на которой при выставлении звука на 0.1, yasdk ставит звук на 100% (мегафон, сбербанк реклама)

        // исправляет пункт 1), предотвращает вызов UPDATE_VOLUME_AD_BLOCK
        if (isSyncPhase && isSynced) return;

        if (isSyncPhase) {
          isSynced = true;
          dispatch(
            sendEvent({
              type: 'SYNC_VOLUME',
            })
          );
        } else {
          dispatch(
            sendEvent({
              type: 'UPDATE_VOLUME_AD_BLOCK',
              meta: { value: volume },
            })
          );
        }
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

    await playerService.setSource(createFakeSource(), { type: VIDEO_TYPE.FAKE_VIDEO });
    await currentBlock.play();
  } catch (err) {
    logger.error('[ad play pending]', { index, code: err?.code || err?.name, message: err?.message });
    error = err?.message;
    dispatch(
      sendEvent({
        type: 'AD_BLOCK_ERROR',
        meta: {
          name: err?.code || err?.name,
          message: err?.message,
        },
      })
    );
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
