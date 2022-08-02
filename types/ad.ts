export enum AdCategory {
  PRE_ROLL = 'pre_roll',
  CONTENT_ROLL = 'content_roll',
  MID_ROLL = 'mid_roll',
  PAUSE_ROLL = 'pause_roll',
  POST_ROLL = 'post_roll',
  PRE_PAUSE_ROLL = 'pre_pause_roll',
  POST_PAUSE_ROLL = 'post_pause_roll',
}

export type TRawPoint = {
  point: number;
};

export type TAdItem = {
  item: string;
  type?: AdLinkType;
};

export type TAdParams = {
  limiter: number;
  type: string;
};
export type TRawAdRollData = {
  items: TAdItem[];
  params: TAdParams;
};

export type TRawAdConfig = {
  [key in AdCategory]: TRawAdRollData;
};

export type TPlaceholder = { id: number; sponsorship: string };
export type TContentRollPoint = {
  point: number;
  placeholders?: TPlaceholder;
};
export type TContentUrlConfig = {
  item: string;
  type: string;
};
export type TContentRollsConfig = {
  points: TContentRollPoint[];
  url: TContentUrlConfig[];
};
export type TPreRollsConfig = {
  points: {
    point: number;
  };
};
export type TMiddleRollsConfig = {
  freq_points: number;
  freq_time: number;
  max_midrolls: number;
  points: TRawPoint[];
  skip_adv: number;
  start_time: number;
  url: TAdItem[];
};

export type TAdConfig = { links: TAdItem[]; limit: number };

export type TAdConfigByCategory = Partial<Record<AdCategory, TAdConfig>>;

export enum AdLinkType {
  COM = 'com',
  PROG = 'prog',
  PROMO = 'promo',
  NO_TYPE = 'no_type',
}

export type TAdPointConfig = {
  point: number;
  category: AdCategory;
  placeholders?: TPlaceholder;
};

export type TAdPointsConfig = TAdPointConfig[];
export type TParsedAdConfig = {
  adConfig: TAdConfigByCategory;
  adPoints: TAdPointsConfig;
};
