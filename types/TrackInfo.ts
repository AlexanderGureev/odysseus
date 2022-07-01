export enum Category {
  SERIES = 'SERIES',
  TV_PROGRAMME = 'TV_PROGRAMME',
  SHOW = 'SHOW',
  MOVIE = 'MOVIE',
  CARTOON = 'CARTOON',
}

export type ProjectInfo = {
  id: number;
  hubId: number;
  title: string;
  projectCategory: Category;
  description: string;
  canonicalUrl: string;
  hasRightAvod: boolean;
  hasRightSvod: boolean;
  hasRightFree: boolean;
};

export enum VIEW_TYPE {
  NORMAL = 'NORMAL',
  ANNOUNCE = 'ANNOUNCE',
  PROMO = 'PROMO',
}

export type SeasonInfo = { id: number; hubId: number; title: string; description: string; canonicalUrl: string };

export type TrackInfo = {
  id: number;
  morpheusId: number;
  hubId: number;
  title: string;
  description: string;
  canonicalUrl: string;
  hasRightAvod: boolean;
  hasRightSvod: boolean;
  hasRightFree: boolean;
  category: Category;
  viewType: VIEW_TYPE;
};

export type TrackInfoData = {
  project: ProjectInfo;
  season: SeasonInfo;
  track: TrackInfo;
};
