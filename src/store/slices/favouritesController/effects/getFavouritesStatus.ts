import { EffectOpts } from 'interfaces';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const getFavouritesStatus = async ({ getState, dispatch, services }: EffectOpts) => {
  const {
    favourites: { mode },
    root: {
      config: { trackInfo },
    },
  } = getState();

  try {
    if (!trackInfo) throw new Error('trackinfo is undefined');

    const project = await services.favouritesService.getFavouritesByProjectId(trackInfo.project.id);

    dispatch(
      sendEvent({
        type: 'GET_FAVOURITES_STATUS_RESOLVE',
        payload: {
          isFavourites: Boolean(project?.isFavourites),
        },
      })
    );
  } catch (err) {
    logger.error('[get favourites status failed]', { mode }, err?.message);

    dispatch(
      sendEvent({
        type: 'GET_FAVOURITES_STATUS_REJECT',
      })
    );
  }
};
