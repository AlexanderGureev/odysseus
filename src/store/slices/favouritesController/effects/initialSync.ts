import { EffectOpts } from 'interfaces';
import { FavouriteStoreItem } from 'services/FavouritesService/types';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { sendEvent } from 'store/actions';
import { getFavouritesMeta } from 'store/selectors';
import { Mode } from 'store/slices/favourites/types';
import { toRecord } from 'utils';
import { logger } from 'utils/logger';

const syncByMode = async (mode: Mode, { getState, services }: EffectOpts) => {
  switch (mode) {
    case 'AUTHORIZED_MODE':
      const [uncomittedLocalData, response] = await Promise.all([
        services.favouritesService.getStagedFavourites(),
        services.favouritesService.fetchFavourites(),
      ]);

      const remote = toRecord(response.data, 'externalId');
      const local = toRecord(uncomittedLocalData, 'id');

      const projectsToSend: FavouriteStoreItem[] = [];
      const projectsToDelete: FavouriteStoreItem[] = [];

      const newLocalData = response.data.reduce((acc: FavouriteStoreItem[], project) => {
        return !local[project.externalId]
          ? [
              ...acc,
              {
                id: project.externalId,
                isFavourites: 1,
                isStoredInGondwana: 1,
                source: 'gondwana',
                updatedAt: Date.now(),
              } as const,
            ]
          : acc;
      }, []);

      const updatedLocalData = uncomittedLocalData.reduce((acc: FavouriteStoreItem[], local) => {
        if (remote[local.id] && local.isFavourites) {
          return [...acc, { ...local, isStoredInGondwana: 1, updatedAt: Date.now() } as const];
        }

        if (remote[local.id] && !local.isFavourites) projectsToDelete.push(local);
        if (!remote[local.id] && local.isFavourites) projectsToSend.push(local);
        if (!remote[local.id] && !local.isFavourites) return acc;

        return [...acc, local];
      }, newLocalData);

      await services.favouritesService.clearFavourites();
      await services.favouritesService.putFavourites(updatedLocalData);

      const promises = [];
      const meta = getFavouritesMeta(getState());

      if (projectsToSend.length) {
        const data = projectsToSend.map(({ id: externalId }) => ({
          type: 'project',
          externalId,
          ...meta,
        }));

        promises.push(services.favouritesService.createFavourites({ data }));
      }

      if (projectsToDelete.length) {
        for (const { id } of projectsToDelete) {
          promises.push(
            services.favouritesService.deleteFavouriteById({
              id,
              meta,
              type: 'project',
            })
          );
        }
      }

      if (promises.length) {
        try {
          await Promise.all(promises);
          const data = [...projectsToSend, ...projectsToDelete].map(
            (p) =>
              ({
                ...p,
                isStoredInGondwana: 1,
                updatedAt: Date.now(),
              } as const)
          );

          await services.favouritesService.putFavourites(data);
        } catch (err) {
          logger.error('[send staged favourites failed]', err?.message);
        }
      }
      break;
    case 'AUTHORIZED_MODE_WITHOUT_DB': {
      const response = await services.favouritesService.fetchFavourites();
      const data = response.data.map(
        ({ externalId }) =>
          ({
            id: externalId,
            isFavourites: 1,
            isStoredInGondwana: 1,
            source: 'gondwana',
            updatedAt: Date.now(),
          } as const)
      );

      await services.favouritesService.putFavourites(data);
      break;
    }
  }
};

export const initialSync = async ({ getState, dispatch, services }: EffectOpts) => {
  const {
    favourites: { mode },
    root: {
      config: {
        config: { user_id },
        trackInfo,
      },
    },
  } = getState();

  try {
    if (!trackInfo) throw new Error('trackinfo is undefined');

    const prevUserId = services.localStorageService.getItemByDomain(STORAGE_SETTINGS.USER_ID);

    // смена аккаунта или разлогин
    if ((user_id && prevUserId && user_id !== prevUserId) || (prevUserId && !user_id)) {
      await services.favouritesService.clearFavourites();
    }

    await syncByMode(mode, { getState, dispatch, services });

    dispatch(
      sendEvent({
        type: 'INITIAL_SYNC_FAVOURITES_RESOLVE',
      })
    );
  } catch (err) {
    logger.error('[initial sync favourites failed]', { mode }, err?.message);

    dispatch(
      sendEvent({
        type: 'INITIAL_SYNC_FAVOURITES_REJECT',
      })
    );
  }
};
