import { EffectOpts } from 'interfaces';
import { FavouriteStoreItem } from 'services/FavouritesService/types';
import { sendEvent } from 'store/actions';
import { getFavouritesMeta } from 'store/selectors';
import { Nullable } from 'types';
import { logger } from 'utils/logger';

let timer: Nullable<NodeJS.Timeout> = null;
const TIMEOUT = 500;

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

export const syncFavourites = ({ getState, dispatch, services }: EffectOpts) => {
  clearTimer();

  const {
    favouritesController: { isFavourites },
    root: {
      config: { trackInfo },
    },
  } = getState();

  if (!trackInfo) return;

  timer = setTimeout(async () => {
    try {
      clearTimer();

      const meta = getFavouritesMeta(getState());

      const data = {
        id: trackInfo.project.id,
        isFavourites: isFavourites ? 1 : 0,
        isStoredInGondwana: 0,
        source: 'player',
      } as const;

      if (isFavourites) {
        await services.favouritesService.createFavourites({
          data: [
            {
              type: 'project',
              externalId: trackInfo.project.id,
              ...meta,
            },
          ],
        });
      } else {
        await services.favouritesService.deleteFavouriteById({
          id: trackInfo.project.id,
          type: 'project',
          meta,
        });
      }

      await services.favouritesService.putFavourites([{ ...data, isStoredInGondwana: 1, updatedAt: Date.now() }]);
    } catch (err) {
      logger.error('[sync favourites failed]', err?.message);
    }
  }, TIMEOUT);

  dispatch(
    sendEvent({
      type: 'SYNC_FAVOURITES_RESOLVE',
    })
  );
};
