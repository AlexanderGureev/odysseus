import { EffectOpts } from 'interfaces';
import { FavouriteStoreItem } from 'services/FavouritesService/types';
import { STORAGE_SETTINGS } from 'services/LocalStorageService/types';
import { sendEvent } from 'store/actions';
import { getFavouritesMeta } from 'store/selectors';
import { Mode } from 'store/slices/favourites/types';
import { toRecord } from 'utils';
import { logger } from 'utils/logger';

export const initialSync = async ({ getState, dispatch, services }: EffectOpts) => {
  const {
    favourites: { mode },
    root: {
      config: { config, trackInfo },
    },
  } = getState();

  try {
    if (!trackInfo) throw new Error('trackinfo is undefined');

    const syncByMode: { [key in Mode]?: () => Promise<void> } = {
      AUTHORIZED_MODE: async () => {
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
        }
      },
      AUTHORIZED_MODE_WITHOUT_DB: async () => {
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
      },
    };

    const prevUserId = services.localStorageService.getItemByDomain(STORAGE_SETTINGS.USER_ID);
    if (config.user_id !== prevUserId) await services.favouritesService.clearFavourites();

    await syncByMode[mode]?.();

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
