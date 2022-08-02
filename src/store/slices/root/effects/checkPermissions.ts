import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store';
import { logger } from 'utils/logger';

export const checkPermissions = async ({ dispatch, services: { playerService } }: EffectOpts) => {
  try {
    const permissions = await playerService.checkPermissions();
    dispatch(
      sendEvent({
        type: 'CHECK_PERMISSIONS_RESOLVE',
        payload: {
          permissions,
        },
      })
    );
  } catch (err) {
    logger.error('[checkPermissions]', err);

    dispatch(
      sendEvent({
        type: 'CHECK_PERMISSIONS_RESOLVE',
        payload: {
          permissions: {
            autoplay: false,
            mute: false,
          },
        },
      })
    );
  }
};
