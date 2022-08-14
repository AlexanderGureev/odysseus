import { EffectOpts } from 'interfaces';
import { FavouriteStoreItem } from 'services/FavouritesService/types';
import { sendEvent } from 'store/actions';
import { logger } from 'utils/logger';

export const updateFavourites = async (
  currentState: boolean,
  newState: boolean,
  { getState, dispatch, services }: EffectOpts
) => {
  const {
    playback: { currentTime },
    favourites: { mode },
    favouritesController: { isFavourites },
    root: {
      config: { trackInfo },
      meta: { trackId, isEmbedded },
      session: { videosession_id },
      features: { AUTH_URL },
    },
  } = getState();

  try {
    if (!trackInfo) throw new Error('trackinfo is undefined');

    const data: FavouriteStoreItem = {
      id: trackInfo.project.id,
      isFavourites: newState ? 1 : 0,
      isStoredInGondwana: 0,
      source: 'player',
      updatedAt: Date.now(),
    };

    await services.favouritesService.putFavourites([data]);

    if (mode === 'ANONYMOUS_MODE' && isEmbedded && AUTH_URL) {
      window.open(AUTH_URL, '_blank');
    }

    if (mode === 'ANONYMOUS_MODE') {
      services.postMessageService.emit('set_favorites', {
        payload: {
          isFavorites: isFavourites,
          projectId: trackInfo.project.id,
          redirect: true,
          time_cursor: currentTime || 0,
          track_id: trackId,
          videosession_id,
        },
      });

      dispatch(sendEvent({ type: 'UPDATE_FAVOURITES_RESOLVE', payload: { isFavourites: newState } }));
    } else {
      dispatch(
        sendEvent({
          type: 'START_SYNC_FAVOURITES',
          payload: {
            isFavourites: newState,
          },
          meta: {
            prevState: currentState,
          },
        })
      );
    }
  } catch (err) {
    logger.error('[update favourites failed]', { mode }, err?.message);
    dispatch(sendEvent({ type: 'UPDATE_FAVOURITES_REJECT' }));
  }
};
