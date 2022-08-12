import { EffectOpts } from 'interfaces';
import { FavouritesSource, FavouriteStoreItem } from 'services/FavouritesService/types';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

type Params = {
  source: FavouritesSource;
  isFavourites: boolean;
};

export const updateLocalFavourites = async (
  { source, isFavourites }: Params,
  { getState, dispatch, services }: EffectOpts
) => {
  const {
    root: {
      config: { trackInfo },
    },
  } = getState();

  try {
    if (!trackInfo) throw new Error('trackinfo is undefined');

    const data: FavouriteStoreItem = {
      id: trackInfo.project.id,
      isFavourites: isFavourites ? 1 : 0,
      isStoredInGondwana: 0,
      source,
      updatedAt: Date.now(),
    };

    await services.favouritesService.putFavourites([data]);
    dispatch(sendEvent({ type: 'UPDATE_LOCAL_FAVOURITES_RESOLVE' }));
  } catch (err) {
    logger.error('[update local favourites]', err?.message);
    dispatch(sendEvent({ type: 'ROLLBACK_FAVOURITES_STATE', payload: { isFavourites: !isFavourites } }));
  }
};
