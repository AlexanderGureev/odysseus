import { EffectOpts } from 'interfaces';
import { FavouriteStoreItem } from 'services/FavouritesService/types';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const updateFavourites = async ({ getState, dispatch, services }: EffectOpts) => {
  const {
    playback: { currentTime },
    favourites: { mode },
    favouritesController: { isFavourites },
    root: {
      config: { trackInfo },
      meta: { trackId },
      session: { videosession_id },
    },
  } = getState();

  try {
    if (!trackInfo) throw new Error('trackinfo is undefined');

    const data: FavouriteStoreItem = {
      id: trackInfo.project.id,
      isFavourites: isFavourites ? 1 : 0,
      isStoredInGondwana: 0,
      source: 'player',
      updatedAt: Date.now(),
    };

    await services.favouritesService.putFavourites([data]);
    services.postMessageService.emit('set_favorites', {
      payload: {
        isFavorites: isFavourites,
        projectId: trackInfo.project.id,
        redirect: false,
        time_cursor: currentTime || 0,
        track_id: trackId,
        videosession_id,
      },
    });

    dispatch(sendEvent({ type: mode === 'ANONYMOUS_MODE' ? 'UPDATE_FAVOURITES_RESOLVE' : 'START_SYNC_FAVOURITES' }));
  } catch (err) {
    logger.error('[update favourites failed]', { mode }, err?.message);
    dispatch(sendEvent({ type: 'ROLLBACK_FAVOURITES_STATE', payload: { isFavourites: !isFavourites } }));
  }
};
