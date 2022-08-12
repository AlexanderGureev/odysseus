import { IAuthService, IDBService, IPersistentStore } from 'interfaces';
import { isIndexedDBSupported } from 'services/IDBService/support';
import { CollectionName, Indexes } from 'services/IDBService/types';
import { MemoryStore } from 'services/MemoryStore';
import { PersistentStore } from 'services/PersistentStore';
import { request } from 'utils/request';

import {
  CreateFavourite,
  DeleteFavouriteById,
  FavouriteItem,
  FavouritesResponse,
  FavouriteStoreItem,
  GetFavouriteById,
  GetFavouritesByPageParams,
  GetFavouritesParams,
} from './types';

const BASE_GONDWANA_PATH = `${window.ENV.PUBLIC_BE_ENDPOINT}/gondwana/v1`;
const MAX_PER_PAGE = 500;

const FavouritesService = () => {
  const memoryStore = MemoryStore<FavouriteStoreItem>({ keyPath: 'id' });
  let persistentStore: IPersistentStore<FavouriteStoreItem> | null;
  let authService: IAuthService;

  const init = (db: IDBService, authSvc: IAuthService) => {
    persistentStore = isIndexedDBSupported()
      ? PersistentStore<FavouriteStoreItem>(CollectionName.FAVOURITES, db)
      : null;
    authService = authSvc;
  };

  const sync = () => {
    return;
  };

  const fetchFavouriteById = async ({ id, ...rest }: GetFavouriteById) => {
    const response = await fetchFavouritesByPage({ externalId: id, ...rest });
    const [data] = response.data;
    return data;
  };

  const deleteFavouriteById = async ({ id, type, meta }: DeleteFavouriteById) => {
    const response = await request.delete(`${BASE_GONDWANA_PATH}/favourites`, {
      params: {
        externalId: id,
        type,
        device: meta.device,
        subscribe: meta.subscribe,
        timezone: meta.timezone,
      },
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`delete favourite by id failed, status: ${response.status}, text: ${response.statusText}`);
    }
  };

  const createFavourites = async ({ data }: CreateFavourite): Promise<FavouriteItem[]> => {
    const response = await request.post(`${BASE_GONDWANA_PATH}/favourites`, {
      json: { favourites: data },
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`create favourites failed, status: ${response.status}, text: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  };

  const fetchFavourites = async (params: GetFavouritesParams = {}) => {
    let currentPage = 1;

    while (true) {
      const response = await fetchFavouritesByPage({
        page: currentPage,
        perPage: MAX_PER_PAGE,
        orderBy: 'createdAt',
        ...params,
      });

      if (response.meta.currentPage === response.meta.lastPage) return response;
      currentPage += 1;
    }
  };

  const fetchFavouritesByPage = async (params: GetFavouritesByPageParams) => {
    const response = await request.get(`${BASE_GONDWANA_PATH}/favourites`, {
      params,
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`fetch favourites failed, status: ${response.status}, text: ${response.statusText}`);
    }

    const data: FavouritesResponse = await response.json();
    return data;
  };

  const getStagedFavourites = async () => {
    if (persistentStore) {
      const data = await persistentStore.getBy(Indexes.BY_IS_STORED_IN_GONDWANA, 0);
      return data;
    }

    const staged = memoryStore.getAll().filter((item) => item.isStoredInGondwana === 0);
    return staged;
  };

  const getFavouritesByProjectId = async (projectId: number) => {
    if (persistentStore) {
      const [data] = await persistentStore.getBy(Indexes.BY_PROJECT_ID, projectId);
      return data;
    }

    return memoryStore.getByKey(projectId);
  };

  const deleteFavouritesByIds = async (projectIds: number[]) => {
    if (persistentStore) {
      // const [data] = await persistentStore.getBy(Indexes.BY_PROJECT_ID, projectId);
      // return data;
    }

    return memoryStore.deleteByKey(projectIds);
  };

  const putFavourites = async (data: FavouriteStoreItem[]) => {
    if (persistentStore) {
      await persistentStore.put(data);
    } else {
      memoryStore.put(data);
    }
  };

  const clearFavourites = async () => {
    if (persistentStore) {
      await persistentStore.clear();
    } else {
      memoryStore.clear();
    }
  };

  return {
    init,
    sync,
    createFavourites,
    fetchFavourites,
    fetchFavouriteById,
    deleteFavouriteById,

    getFavouritesByProjectId,
    getStagedFavourites,
    putFavourites,
    clearFavourites,
  };
};

const instance = FavouritesService();
export { instance as FavouritesService };
