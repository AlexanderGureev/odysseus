import { Nullable } from '.';

export type Meta = {
  has_next: boolean;
};

export type TrackMeta = {
  created_at: string;
  desc_large: Nullable<string>;
  desc_normal: Nullable<string>;
  desc_short: Nullable<string>;
  duration_seconds: number;
  images: Record<string, string>;
  pak_id: number;
  pg_rating: number;
  project_id: number;
  relation_type: Nullable<string>;
  season_id: number;
  seo_enabled: false;
  sort: number;
  sort_by_project: number;
  sort_by_season: number;
  tags: unknown[];
  title: Nullable<string>;
  title_ru: Nullable<string>;
  updated_at: string;
  version: number;
  viplanner_id: number;
  year: Nullable<number>;
};

export type ResponseMeta<T> = {
  attributes: T;
  type: string;
  id: number;
};

export type ResponseMany<T> = {
  data: ResponseMeta<T>[];
  meta: Meta;
};

export type ResponseOne<T> = {
  data: ResponseMeta<T>;
};
