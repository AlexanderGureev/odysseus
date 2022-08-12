import { SubscriptionStatus } from 'types/UserSubscription';

export type GetFavouritesByPageParams = {
  perPage?: number;
  page?: number;
  id?: string;
  externalId?: number;
  orderBy?: 'createdAt';
};

export type GetFavouritesParams = {
  //
};

export type GetFavouriteById = {
  id: number;
};

export type DeleteFavouriteById = {
  id: number;
  type: 'project';
  meta: FavouritesItemMeta;
};

export type FavouritesSource = 'player' | 'web' | 'gondwana';

export type FavouriteStoreItem = {
  id: number; // panthalassa project id
  isFavourites: 1 | 0;
  isStoredInGondwana: 1 | 0;
  source: FavouritesSource;
  updatedAt: number;
};

export type FavouriteItem = { id: number; externalId: number; type: string; createdAt: string };

export type NewFavourite = Omit<FavouriteItem, 'id' | 'createdAt'> & FavouritesItemMeta;

export type CreateFavourite = {
  data: NewFavourite[];
};

export type FavouritesMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export type FavouritesItemMeta = {
  device: Device;
  timezone: string;
  subscribe: SubscriptionStatus;
};

export enum Device {
  WEB_DESKTOP = 'webDesktop',
  WEB_MOBILE_IOS = 'webMobileIos',
  WEB_MOBILE_ANDROID = 'webMobileAndroid',
}

export type FavouritesResponse = {
  data: FavouriteItem[];
  meta: FavouritesMeta;
};
